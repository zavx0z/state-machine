import { fetchMachine } from "../utils/provider.js"
import { representation } from "../actions/repr.js"
import { createSimulator } from "./simulator.js"
import { machineToGraphRelation } from "../actions/relation.js"
import "https://cdn.jsdelivr.net/npm/elkjs@0.8.2/lib/elk-api.min.js"
import { getPath, pathToD } from "../actions/svgPath.js"

/**
 * @typedef {Object} Size
 * @property {number} width
 * @property {number} height
 *
 * @typedef {object} GraphSize
 * @property {Map<string, Size>} nodes
 * @property {Map<string, Size>} edges
 *
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 *
 * @typedef {Object} BoundingBox
 * @property {Size} size
 * @property {Position} [position={ x: 0, y: 0 }]

 * @typedef {Object} EdgeBoundingBox
 * @property {Size} size
 * @property {Position} [position={ x: 0, y: 0 }]
 * @property {import("elkjs").ElkEdgeSection[]} [sections]
 * 
 * @typedef {{ edges:Map<string, EdgeBoundingBox>, nodes: Map<string, BoundingBox>}} GraphBounding
 * 
 */
// @ts-ignore
const elk = new ELK({ workerUrl: "../utils/elk-worker.min.js" })

/** Data structure for graph visualization @type {import("../index.js").GraphInfo} */
const GraphInfo = { edges: new Map(), nodes: new Map() }

/** Relation structure Machine @type {import("../actions/relation.js").MachineRelation}*/
const MachineRelation = { edges: new Map(), nodes: new Map() }

/** Graph bounding box @type {GraphBounding} */
const GraphBounding = { edges: new Map(), nodes: new Map() }

/** Graph LCA relation @type {import("../actions/relation.js").GraphRelation} */
let GraphRelation

let rootID
onmessage = async ({ data: { type, params } }) => {
  switch (type) {
    case "DOM.IDLE":
      const machine = await fetchMachine(params)
      rootID = machine.id
      //@ts-ignore TODO: fix type
      const /**@type {import("../actions/repr.js").Machine}*/ machineObj = machine.toJSON()
      representation(machineObj, GraphInfo, MachineRelation)
      postMessage({ type: "DOM.RENDER", params: GraphInfo })
      GraphRelation = machineToGraphRelation(MachineRelation)
      const simulator = createSimulator({
        machine: machine,
        state: machine.getInitialState(null),
      }).start()
      simulator.onTransition((state, transition) => {
        console.log("[simulator]", transition.type, state.value)
      })
      // simulator.send({ type: "PREVIEW.CLEAR" })
      break
    case "DOM.BOUNDED":
      // ======================= SET DOM BOUNDING SIZE ======================
      const /** @type {import("types").GraphSize}}*/ { edges, nodes } = params
      for (let [id, size] of nodes) GraphBounding.nodes.set(id, { size })
      for (let [id, size] of edges) GraphBounding.edges.set(id, { size })
      // ======================= ELK ALGORITHM ======================
      /**
       * @param {string} nodeID
       * @returns {import("elkjs").ElkNode}
       */
      function getElkChild(nodeID) {
        const size = GraphBounding.nodes.get(nodeID).size
        const relationMachine = MachineRelation.nodes.get(nodeID)
        const relationNode = GraphRelation.nodes.get(nodeID) || []
        return {
          id: nodeID,
          width: size.width,
          height: size.height,
          children: relationMachine.children.map((childID) => getElkChild(childID)),
          edges: relationNode.map(getElkEdge),
          layoutOptions: {
            "elk.padding": `[top=${(size.height || 0) + 30}, left=30, right=30, bottom=30]`, // Добавляем отступы вокруг узла
            hierarchyHandling: "INCLUDE_CHILDREN", // Включаем дочерние узлы в иерархию
          },
        }
      }
      /**
       * @param {string} edgeID
       * @returns {import("elkjs").ElkExtendedEdge}
       */
      const getElkEdge = (edgeID) => {
        const size = GraphBounding.edges.get(edgeID).size
        const relationTransition = MachineRelation.edges.get(edgeID)
        const edgeInfo = GraphInfo.edges.get(edgeID)
        return {
          id: edgeID,
          sources: [relationTransition.source],
          targets: [relationTransition.target],
          labels: [
            {
              id: edgeID + "--label",
              width: size.width,
              height: size.height,
              text: edgeInfo.label || "always",
              layoutOptions: {
                "edgeLabels.inline": "true", // встроенная метка
                "edgeLabels.placement": "CENTER", // расположение по центру
              },
            },
          ],
        }
      }
      // ==================== LAYOUT EDGES/NODES ======================
      const rootEdges = GraphRelation.nodes.has(undefined) ? GraphRelation.nodes.get(undefined) : []
      const layoutElkNode = await elk.layout({
        id: "root",
        edges: rootEdges.map(getElkEdge), // Само-переходы машины
        children: [getElkChild(rootID)],
        layoutOptions: {
          "elk.hierarchyHandling": "INCLUDE_CHILDREN",
          "elk.algorithm": "layered",
          "elk.layered.crossingMinimization.semiInteractive": "true",
        },
      })
      const /**@type {Map<string, import("src/actions/layout.js").ELKNode>} */ stateNodeToElkNodeMap = new Map()

      /** @param {import("elkjs").ElkExtendedEdge} elkEdge */
      const setEdgeLayout = (elkEdge) => {
        const lca = GraphRelation.edges.get(elkEdge.id)
        const elkLca = stateNodeToElkNodeMap.get(lca)
        const edge = GraphBounding.edges.get(elkEdge.id)
        if (elkEdge.sections) {
          /**@type {import("elkjs").ElkEdgeSection[]} */
          const translatedSections = elkLca
            ? elkEdge.sections.map((section) => ({
                ...section,
                startPoint: {
                  x: section.startPoint.x + elkLca.absolutePosition.x,
                  y: section.startPoint.y + elkLca.absolutePosition.y,
                },
                endPoint: {
                  x: section.endPoint.x + elkLca.absolutePosition.x,
                  y: section.endPoint.y + elkLca.absolutePosition.y,
                },
                bendPoints: section.bendPoints?.map((bendPoint) => {
                  return {
                    x: bendPoint.x + elkLca.absolutePosition.x,
                    y: bendPoint.y + elkLca.absolutePosition.y,
                  }
                }),
              }))
            : elkEdge.sections
          if (translatedSections) edge.sections = translatedSections
        }
        edge.position = {
          x: (elkEdge.labels?.[0].x || 0) + (elkLca?.absolutePosition.x || 0),
          y: (elkEdge.labels?.[0].y || 0) + (elkLca?.absolutePosition.y || 0),
        }
      }
      /**
       * @param {import("src/actions/layout.js").ELKNode} elkNode
       * @param {import("src/actions/layout.js").ELKNode | undefined} parent
       */
      const setLayout = (elkNode, parent) => {
        stateNodeToElkNodeMap.set(elkNode.id, elkNode)
        elkNode.absolutePosition = {
          x: (parent?.absolutePosition.x ?? 0) + elkNode.x,
          y: (parent?.absolutePosition.y ?? 0) + elkNode.y,
        }
        const node = GraphBounding.nodes.get(elkNode.id)
        node.size = {
          width: elkNode.width,
          height: elkNode.height,
        }
        node.position = {
          x: (parent?.absolutePosition.x ?? 0) + elkNode.x,
          y: (parent?.absolutePosition.y ?? 0) + elkNode.y,
        }
        elkNode.edges.forEach(setEdgeLayout)
        //@ts-ignore
        elkNode.children?.forEach((cn) => setLayout(cn, elkNode))
      }
      layoutElkNode.edges.forEach(setEdgeLayout)
      setLayout(layoutElkNode.children[0], undefined)
      postMessage({ type: "DOM.LAYOUT", params: GraphBounding })
      // ======================= LINES =================================
      const lines = new Map()

      for (const [id, edge] of MachineRelation.edges) {
        const sourceBound = GraphBounding.nodes.get(edge.source)
        const edgeBound = GraphBounding.edges.get(id)
        const targetBound = GraphBounding.nodes.get(edge.target)
        const sections = edgeBound.sections || []
        const sourceRect = {
          ...sourceBound.position,
          ...sourceBound.size,
          top: sourceBound.position.y,
          bottom: sourceBound.position.y + sourceBound.size.height,
          left: sourceBound.position.x,
          right: sourceBound.position.x + sourceBound.size.width,
          toJSON: () => {},
        }
        const edgeRect = {
          ...edgeBound.position,
          ...edgeBound.size,
          top: edgeBound.position.y,
          bottom: edgeBound.position.y + edgeBound.size.height,
          left: edgeBound.position.x,
          right: edgeBound.position.x + edgeBound.size.width,
          toJSON: () => {},
        }
        const targetRect = {
          ...targetBound.position,
          ...targetBound.size,
          top: targetBound.position.y,
          bottom: targetBound.position.y + targetBound.size.height,
          left: targetBound.position.x,
          right: targetBound.position.x + targetBound.size.width,
          toJSON: () => {},
        }
        if (sourceRect && edgeRect && targetRect) {
          /** @type {import("src/actions/svgPath.js").SvgPath | undefined} */
          let path
          if (sections.length) {
            const section = sections[0]
            path = [["M", section.startPoint], ...(section.bendPoints?.map((point) => ["L", point]) || [])]
            const preLastPoint = path[path.length - 1][1]
            const xSign = Math.sign(section.endPoint.x - preLastPoint.x)
            const ySign = Math.sign(section.endPoint.y - preLastPoint.y)
            const endPoint = { x: section.endPoint.x - 5 * xSign, y: section.endPoint.y - 5 * ySign }
            path.push(["L", endPoint])
          } else path = getPath(sourceRect, edgeRect, targetRect)
          if (path) {
            lines.set(id, pathToD(path))
          }
        }
      }
      postMessage({ type: "LINES.INIT", params: lines })
      break
    default:
      console.log("[worker]", type, params)
      break
  }
}
