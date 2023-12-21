import { flatten, uuidv4 } from "../utils/utils.js"
/**
 * @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm").StateNodeDefinition<any, any, any> & { transition: string[]}} MachineJSON
 */

/** Converts a state machine or state node to a graph representation.
 * @param {MachineJSON} machine - The state machine to convert.
 * @returns {{relation:import("types").Graph, info: import("../../index.js").GraphInfo}} - Ноды и грани
 */
export function convertToGraph(machine) {
  const /**@type {import("../../index.js").GraphInfo} */ info = {
      edges: new Map(),
      nodes: new Map(),
    }
  const /**@type {import("types").Edges} */ edges = new Map()
  const /**@type {import("types").Nodes} */ nodes = new Map()

  let nodeCounter = 0
  let edgeCounter = 0
  /** Generates a directed graph representation of a state machine or state node.
   * @typedef {MachineJSON | import("types").AnyStateNodeDefinition} StateNode
   * @param {StateNode} stateNode - The state machine or state node.
   * @param {string | undefined}  parentID - StateNode parent id
   */
  function parse(stateNode, parentID) {
    const nodePath = stateNode.id
    nodeCounter++
    flatten(
      stateNode.transitions.map((transition, transitionIndex) =>
        (transition.target || [nodePath]).map((target, idx) => {
          edgeCounter++
          const id = uuidv4()
          // console.log(transition) // TODO: actions
          info.edges.set(id, {
            type: transition.eventType,
            cond: transition.cond?.type ? "scxml" : transition.cond?.name, // TODO: condition
            label: transition.eventType, //TODO: label
          })
          edges.set(id, {
            path: `${nodePath}:${transitionIndex}:${idx}`,
            type: transition.eventType,
            cond: transition.cond?.type ? "scxml" : transition.cond?.name, // TODO: condition
            source: nodePath,
            target: String(target).replace(/^#/, ""),
            sections: [],
            label: transition.eventType,
            size: { width: 0, height: 0 },
            position: { x: 0, y: 0 },
          })
        })
      )
    )
    const id = uuidv4()
    info.nodes.set(id, {
      type: stateNode.type,
      key: stateNode.key,
      entry: stateNode.entry.map((entry) => entry.type),
      exit: stateNode.exit.map((exit) => exit.type),
      invoke: stateNode.invoke.map((invoke) => (typeof invoke.src === "object" ? invoke.src.type : invoke.src)),
    })
    nodes.set(id, {
      path: nodePath,
      order: stateNode.order,
      tags: stateNode.tags,
      history: stateNode.history,
      initial: stateNode.initial,
      key: stateNode.key,
      type: stateNode.type,
      children: Object.values(stateNode.states)
        .toSorted((a, b) => b.order - a.order)
        .map((state) => state.id),
      entry: stateNode.entry.map((entry) => entry.type),
      exit: stateNode.exit.map((exit) => exit.type),
      invoke: stateNode.invoke.map((invoke) => (typeof invoke.src === "object" ? invoke.src.type : invoke.src)),
      parent: parentID,
      size: { width: 0, height: 0 },
      position: { x: 0, y: 0 },
    })
    Object.values(stateNode.states).map((state) => parse(state, nodePath))
  }
  parse(machine, undefined)
  return { relation: { edges, nodes }, info }
}
