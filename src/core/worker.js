import { createMachine } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
import { representation } from "../actions/repr.js"
import { createSimulator } from "./simulator.js"
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
 * @property {Size} [size={ width: 0, height: 0 }]
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
onmessage = ({ data: { type, params } }) => {
  switch (type) {
    case "DOM.IDLE":
      postMessage({ type: "WORKER.LOADED" })
      const /**@type {import("../actions/repr.js").Machine} */ machineObj = JSON.parse(params)
      machineObj["predictableActionArguments"] = true // TODO: predictableActionArguments set default true

      representation(machineObj, GraphInfo, GraphRelation)
      postMessage({ type: "DOM.RENDER", params: GraphInfo })

      const machine = createMachine(machineObj)
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
      // console.log(params)

      // for (let [id, size] of nodes) {
      //   graph.nodes.get(id).size = size
      // }
      // for (let [id, size] of edges) {
      //   graph.edges.get(id).size = size
      // }
      // console.log(graph)
      break
    default:
      console.log("[worker]", type, params)
      break
  }
}
