/**
 * @typedef {Object} StateRelation - Object representing a state relation
 * @property {string} id - State node ID
 * @property {string} parent - Parent state node ID
 * @property {string[]} children - Child state node IDs
 * @property {string[]} transitions - Transitions IDs
 * @typedef {Object} TransitionRelation - Object representing a transition relation
 * @property {string} id - Transition edge ID
 * @property {string} source - Source state node ID
 * @property {string} target - Target state node ID
 * @typedef { {edges: Map<string, TransitionRelation>, nodes: Map<string, StateRelation>} } MachineRelation - Object representing machine relations
 *
 * @typedef {Map<string | undefined, string[]>} NodeRelation - lca node relation edges
 * @typedef {Map<string | undefined, string>} EdgeRelation  - edge relation lca node
 * @typedef { {edges: EdgeRelation, nodes:  NodeRelation} } GraphRelation - lca edges relations
 */

/**
 * @param {MachineRelation} MachineRelation
 * @param {GraphRelation} GraphRelation
 * @returns {GraphRelation}
 */
export default function relation_Machine_Graph(MachineRelation, GraphRelation) {
  const nodeRelations = new Map()
  const edgeRelations = new Map()

  /** Finds the lowest common ancestor node between two node id.
   * @param {string} sourceID - id node source
   * @param {string} targetID - id node target
   */
  const getLCA = (sourceID, targetID) => {
    const parent = MachineRelation.nodes.get(sourceID).parent
    // 1. Само-переход. Если узлы совпадают, возвращаем их родителя
    if (sourceID === targetID) return parent
    // 2. Общий предок
    const set = new Set() // Сбор всех предков узла источника
    let node
    node = parent
    while (node) {
      set.add(node)
      node = MachineRelation.nodes.get(node).parent
    }
    node = targetID // Поиск ближайшего общего предка
    while (node) {
      if (set.has(node)) return node // Если предок второго узла найден в множестве, возвращаем его
      node = MachineRelation.nodes.get(node).parent // Переходим к следующему предку узла назначения
    }
    // 3. Корневая нода
    return sourceID
  }

  for (let [edgeID, edge] of MachineRelation.edges) {
    const lca = getLCA(edge.source, edge.target) // Находим ближайшего общего предка узлов источника перехода
    if (!GraphRelation.nodes.has(lca)) GraphRelation.nodes.set(lca, []) // Если общего предка нет в карте, добавляем в виде ключа ноду и в виде значения пустой массив
    GraphRelation.nodes.get(lca).push(edgeID) // Добавляем переход в список ноды предка
    GraphRelation.edges.set(edgeID, lca) // Записываем связь между идентификатором перехода и предка
  }
  return { edges: edgeRelations, nodes: nodeRelations }
}
