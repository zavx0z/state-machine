import { fetchMachine } from "../utils/provider.js"
import { representation } from "../actions/repr.js"
import { createSimulator } from "./simulator.js"
import { machineToGraphRelation } from "../actions/relation.js"
import "https://cdn.jsdelivr.net/npm/elkjs@0.8.2/lib/elk-api.min.js"

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
 * @property {Position} [position={ x: 0, y: 0 }]
 * @property {Size} size
 */
// @ts-ignore
const elk  = new ELK({ workerUrl: "/src/utils/elk-worker.min.js" })

/** Data structure for graph visualization @type {import("../index.js").GraphInfo} */
const GraphInfo = { edges: new Map(), nodes: new Map() }

/** Relation structure Machine @type {import("../actions/relation.js").MachineRelation}*/
const MachineRelation = { edges: new Map(), nodes: new Map() }

/** Graph bounding box @type { { edges:Map<string, BoundingBox>, nodes: Map<string,BoundingBox>} } */
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
      console.log("[worker]", type, params)

      const /** @type {import("types").GraphSize}}*/ { edges, nodes } = params
      for (let [id, size] of nodes) GraphBounding.nodes.set(id, { size })
      for (let [id, size] of edges) GraphBounding.edges.set(id, { size })
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
      const rootEdges = GraphRelation.nodes.get(rootID)
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
      console.log("[worker]", layoutElkNode)

      break
    default:
      console.log("[worker]", type, params)
      break
  }
}
