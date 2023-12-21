/**
 * @typedef {Object} StateRelation - Object representing a state relation
 * @property {string} id - State node ID
 * @property {string} parent - Parent state node ID
 * @property {string[]} children - Child state node IDs
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
 * @returns {GraphRelation}
 */
export function machineToGraphRelation(MachineRelation) {
  const { edges, nodes } = MachineRelation
  const nodeRelations = new Map()
  const edgeRelations = new Map()

  /** Finds the lowest common ancestor node between two node id.
   * @param {string} sourceID - id node source
   * @param {string} targetID - id node target
   */
  const getLCA = (sourceID, targetID) => {
    const parent = nodes.get(sourceID).parent
    // 1. Само-переход. Если узлы совпадают, возвращаем их родителя
    if (sourceID === targetID) return parent
    // 2. Общий предок
    const set = new Set() // Сбор всех предков узла источника
    let node
    node = parent
    while (node) {
      set.add(node)
      node = nodes.get(node).parent
    }
    node = targetID // Поиск ближайшего общего предка
    while (node) {
      if (set.has(node)) return node // Если предок второго узла найден в множестве, возвращаем его
      node = nodes.get(node).parent // Переходим к следующему предку узла назначения
    }
    // 3. Корневая нода
    return sourceID
  }

  for (let [edgeID, edge] of edges) {
    const lca = getLCA(edge.source, edge.target) // Находим ближайшего общего предка узлов источника перехода
    if (!nodeRelations.has(lca)) nodeRelations.set(lca, []) // Если общего предка нет в карте, добавляем в виде ключа ноду и в виде значения пустой массив
    nodeRelations.get(lca).push(edgeID) // Добавляем переход в список ноды предка
    edgeRelations.set(edgeID, lca) // Записываем связь между идентификатором перехода и предка
  }
  return { edges: edgeRelations, nodes: nodeRelations }
}
