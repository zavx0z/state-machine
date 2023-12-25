import { flatten } from "../utils/utils.js"
/** @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.7/+esm").StateNodeDefinition<any, any, any> & { transition: string[]}} Machine */

/** Converts a state machine to a graph representation.
 * @param {Machine} Machine - The state machine.
 * @param {import("../index.js").Data} MetaData - Data state/transition/actions/services of the machine.
 * @param {import("./relation_Machine_Graph.js").MachineRelation} MachineRelation - The relation transition and nodes of the machine.
 */
export function representation(Machine, MetaData, MachineRelation) {
  /** Generates a directed graph representation of a state machine or state node.
   * @param {Machine | import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.7/+esm").AnyStateNodeDefinition} stateNode - The state machine or state node.
   * @param {string | undefined}  parentUUID - node UUID of the parent node.
   */
  function repr(stateNode, parentUUID) {
    const stateID = stateNode.id
    // const nodeUUID = uuidv4()
    flatten(
      stateNode.transitions.map((transition, transitionIndex) => {
        //@ts-ignore TODO: AnyStateNodeDefinition to AnyStateJSON
        const /**@type {string[]} */ targets = transition.target
            ? Object.values(transition.target).map((i) => i.id)
            : [stateID]
        // const /**@type {string[]} */ targets = transition.target || [stateID]
        targets.map((target, targetIndex) => {
          // console.log(transition) // TODO: actions
          const transitionID = `${stateID}:${transitionIndex}:${targetIndex}`
          // const transitionUUID = uuidv4()
          MetaData.events.set(transitionID, {
            type: transition.eventType,
            cond: transition.cond?.type ? "scxml" : transition.cond?.name, // TODO: condition
            label: transition.eventType, //TODO: label
          })
          MachineRelation.edges.set(transitionID, {
            id: transitionID,
            source: stateID,
            target: String(target).replace(/^#/, ""),
          })
        })
      })
    )
    MetaData.states.set(stateID, {
      type: stateNode.type,
      key: stateNode.key,
      entry: stateNode.entry.map((entry) => entry.type),
      exit: stateNode.exit.map((exit) => exit.type),
      invoke: stateNode.invoke.map((invoke) => (typeof invoke.src === "object" ? invoke.src.type : invoke.src)),
      tags: stateNode.tags,
    })
    MachineRelation.nodes.set(stateID, {
      id: stateID,
      children: Object.values(stateNode.states)
        .toSorted((a, b) => b.order - a.order)
        .map((state) => state.id),
      parent: parentUUID,
    })
    Object.values(stateNode.states).map((state) => repr(state, stateID))
  }
  repr(Machine, undefined)
}
