import { createMachine } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
import { convertToGraph } from "./utils/directedGraph.js"
import { createSimulator } from "./simulator.js"

onmessage = ({ data: { type, params } }) => {
  switch (type) {
    case "init":
      postMessage({ type: "WORKER.LOADING" })
      const /**@type {import("types").MachineJSON} */ machineObj = JSON.parse(params)
      machineObj["predictableActionArguments"] = true // TODO: predictableActionArguments set default true
      const machine = createMachine(machineObj)

      const simulator = createSimulator({
        machine: machine,
        state: machine.getInitialState(null),
      }).start()

      simulator.onTransition((state, transition) => {
        console.log(state, transition)
      })
      simulator.send({ type: "PREVIEW.CLEAR" })

      const { edges, nodes } = convertToGraph(machineObj)
      postMessage({ type: "machine.init", params: { edges, nodes } })
      break
    default:
      console.log(type)
      break
  }
}
