/**
 * @typedef {Object} NodeRelation - relation position state
 * @property {string} id - state ID to verify a change in the relationship in the structure of the graph
 * @property {string} parent - node UUID of parent node
 * @property {string[]} children - state IDs of children states (ordered)
 * 
 * @typedef {Object} EdgeRelation
 * @property {string} id - `${stateID}:${transitionIndex}:${targetIndex}` to verify a change in the relationship in the structure of the graph
 * @property {string} source - node UUID of source node
 * @property {string} target - state ID of target node
 * 
 * @typedef { {edges: Map<string, EdgeRelation>, nodes: Map<string, NodeRelation>} } GraphRelation
 */