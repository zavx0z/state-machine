/**
 * @typedef {Object} Node
 * @property {string[]} entry
 * @property {string[]} exit
 * @property {string[]} invoke
 * @property {string} key
 * @property {string} type
 * @property {string[]} [tags]
 * @property {import("src/core/worker").Size} size
 * @property {import("src/core/worker").Position} position
 * 
 * @typedef {Object} Edge
 * @property {string} source
 * @property {string} target
 * @property {string} label
 * @property {string} type
 * @property {string | undefined} cond
 * @property {import("elkjs").ElkEdgeSection[]} sections
 * @property {import("src/core/worker").Size} size
 * @property {import("src/core/worker").Position} position
 * 
 * @typedef { { nodes: Map<string, Node>, edges: Map<string, Edge> } } Graph
 */
