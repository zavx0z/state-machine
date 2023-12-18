import { createMachine, interpret } from "https://cdn.jsdelivr.net/npm/@metafor/machine@latest/+esm"
import { convertToGraph } from "./utils/directedGraph"

onmessage = ({ data }) => {
  const /**@type {import("types").MachineJSON} */ machineObj = JSON.parse(data.machine)
  machineObj["predictableActionArguments"] = true // TODO: predictableActionArguments set default true
  const machine = createMachine(machineObj)
  // console.log(machine)
  const actor = interpret(machine).start()
  actor.onTransition((state, transition) => {
    // console.log(state, transition)
  })
  actor.send({ type: "go.two" })

  const channel = new BroadcastChannel(machineObj.id)
  const { edges, nodes } = convertToGraph(machineObj)
  channel.postMessage({ edges, nodes })
}

// const simulator = createSimulator({
//   machine: TestMachine,
//   state: TestMachine.getInitialState(null as any),
// }).start()
