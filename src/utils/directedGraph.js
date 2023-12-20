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
 * @returns {{edges: import("types").EdgesTransition; nodes: import("types").NodesState}} - Ноды и грани
 */
export function convertToGraph(machine) {
  const /**@type {import("types").EdgesTransition} */ edges = new Map()
  const /**@type {import("types").NodesState} */ nodes = new Map()

  /** Generates a directed graph representation of a state machine or state node.
   * @typedef {MachineJSON | import("types").AnyStateNodeDefinition} StateNode
   * @param {StateNode} stateNode - The state machine or state node.
   * @param {string | undefined}  parentID - StateNode parent id
   */
  function toDirectedGraph(stateNode, parentID) {
    const nodeID = stateNode.id
    flatten(
      stateNode.transitions.map((transition, transitionIndex) =>
        (transition.target || [nodeID]).map((target, idx) => {
          const edgeID = `${nodeID}:${transitionIndex}:${idx}`
          // console.log(transition) // TODO: actions
          edges.set(edgeID, {
            id: edgeID,
            type: transition.eventType,
            cond: transition.cond?.type ? "scxml" : transition.cond?.name, // TODO: condition
            source: nodeID,
            target: String(target).replace(/^#/, ""),
            sections: [],
            label: {
              text: transition.eventType,
              x: 0,
              y: 0,
              width: 0,
              height: 0,
            },
          })
        })
      )
    )
    nodes.set(nodeID, {
      id: nodeID,
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
      meta: {
        layout: {
          width: 0,
          height: 0,
          x: 0,
          y: 0,
        },
      },
    })
    Object.values(stateNode.states).map((state) => toDirectedGraph(state, nodeID))
  }
  toDirectedGraph(machine, undefined)
  return { edges, nodes }
}
