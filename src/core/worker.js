import { fetchMachine } from "../utils/provider.js"
import { representation } from "../actions/repr.js"
import { createSimulator } from "./simulator.js"
import { relation } from "../actions/relation.js"
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
 *
 * @typedef {BoundingBox & import("../templates/Node.js").NodeInfo} Node
 * @typedef {BoundingBox & import("../templates/Edge.js").EdgeInfo} Edge
 *
 * @typedef {Object} Graph
 * @property {Map<string, Node>} nodes
 * @property {Map<string, Edge>} edges
 */
let /**@type {Graph} */ graph
const /**@type {import("../index.js").GraphInfo}*/ GraphInfo = { edges: new Map(), nodes: new Map() }
const /**@type {import("../actions/relation.js").GraphRelation}*/ GraphRelation = { edges: new Map(), nodes: new Map() }
const /**@type { {nodes: Map<String, BoundingBox>, edges: Map<String,BoundingBox>} }*/ GraphBounding = {
    edges: new Map(),
    nodes: new Map(),
  }

onmessage = async ({ data: { type, params } }) => {
  switch (type) {
    case "DOM.IDLE":
      const machine = await fetchMachine(params)
      //@ts-ignore TODO: fix type
      const /**@type {import("../actions/repr.js").Machine}*/ machineObj = machine.toJSON()
      representation(machineObj, GraphInfo, GraphRelation)
      postMessage({ type: "DOM.RENDER", params: GraphInfo })
      relation(GraphRelation)
      console.log(GraphRelation)
      const simulator = createSimulator({
        machine: machine,
        state: machine.getInitialState(null),
      }).start()
      simulator.onTransition((state, transition) => {
        console.log(state, transition)
      })
      // simulator.send({ type: "PREVIEW.CLEAR" })
      break
    case "DOM.BOUNDED":
      console.log("[worker]", type, params)
      const /** @type {import("types").GraphSize}}*/ { edges, nodes } = params
      for (let [id, size] of nodes) GraphBounding.nodes.set(id, { size })
      for (let [id, size] of edges) GraphBounding.edges.set(id, { size })
      break
    default:
      console.log("[worker]", type, params)
      break
  }
}
