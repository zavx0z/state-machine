import { createMachine } from "https://cdn.jsdelivr.net/npm/@metafor/machine@latest/+esm"
import { convertToGraph } from "./utils/directedGraph.js"
import { createSimulator } from "./simulator.js"

onmessage = ({ data }) => {
  postMessage({ type: "WORKER.LOADING" })
  const /**@type {import("types").MachineJSON} */ machineObj = JSON.parse(data)
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
  postMessage({ edges, nodes })
}
