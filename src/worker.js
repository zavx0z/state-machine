import { createMachine } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
import { convertToGraph } from "./utils/directedGraph.js"
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
 * @typedef {BoundingBox & import("./components/Node.js").NodeInfo} Node
 * @typedef {BoundingBox & import("./components/Edge.js").EdgeInfo} Edge
 *
 * @typedef {object} Graph
 * @property {Map<string, Node>} nodes
 * @property {Map<string, Edge>} edges
 */
let /**@type {Graph} */ graph

onmessage = ({ data: { type, params } }) => {
  switch (type) {
    case "GRAPH.IDLE":
      postMessage({ type: "WORKER.LOADED" })
      const /**@type {import("types").MachineJSON} */ machineObj = JSON.parse(params)
      machineObj["predictableActionArguments"] = true // TODO: predictableActionArguments set default true
      const { relation, info } = convertToGraph(machineObj)
      graph = info
      postMessage({ type: "GRAPH.RENDER", params: info })

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
    case "GRAPH.BOUNDED":
      console.log("[worker]", type, params)
      const /** @type {import("types").GraphSize}}*/ { edges, nodes } = params
      console.log(nodes)

      for (let [id, size] of nodes) {
        graph.nodes.get(id).size = size
      }
      for (let [id, size] of edges) {
        graph.edges.get(id).size = size
      }
      console.log(graph)
      break
    default:
      console.log("[worker]", type, params)
      break
  }
}
