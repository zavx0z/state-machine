/**
 * @typedef {import("types").MachineJSON} MachineJSON
 */

/** Выравнивание массива.
 * @template T
 * @param {Array<T | T[]>} array - Массив с элементами или с вложенными массивами.
 * @returns {T[]} - Одноуровневый массив.
 */
const flatten = (array) => Array.prototype.concat.apply([], array)

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
  function toDirectedGraph(stateNode, parentID) {
    const nodePath = stateNode.id
    nodeCounter++
    flatten(
      stateNode.transitions.map((transition, transitionIndex) =>
        (transition.target || [nodePath]).map((target, idx) => {
          edgeCounter++
          const id = "edge-" + String(edgeCounter).padStart(4, "0")
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
    const id = "node-" + String(nodeCounter).padStart(4, "0")
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
    Object.values(stateNode.states).map((state) => toDirectedGraph(state, nodePath))
  }
  toDirectedGraph(machine, undefined)
  return { relation: { edges, nodes }, info }
}
