import { createMachine } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
import { convertToGraph } from "./utils/directedGraph.js"
import { createSimulator } from "./simulator.js"

/**
 * Message handler for the web worker.
 * Initializes the state machine, simulator,
 * and graph data based on the received message.
 * Sends messages back to the main thread with
 * status updates and initialized data.
 */
onmessage = ({ data: { type, params } }) => {
  switch (type) {
    case "GRAPH.IDLE":
      postMessage({ type: "WORKER.LOADED" })
      const /**@type {import("types").MachineJSON} */ machineObj = JSON.parse(params)
      machineObj["predictableActionArguments"] = true // TODO: predictableActionArguments set default true

      const { edges, nodes } = convertToGraph(machineObj)
      postMessage({ type: "GRAPH.BOUNDING", params: { edges, nodes } })

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
      break
    default:
      console.log("[worker]", type, params)
      break
  }
}
