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

/**
 * Updates nodeRelations and edgeRelations maps based on GraphRelation input.
 *
 * GraphRelation contains nodes and edges relations from the graph. This function
 * extracts those into separate maps for easier access later.
 * @param {GraphRelation} GraphRelation 
 */
export function relation(GraphRelation) {
  const { edges, nodes } = GraphRelation
  const nodeRelations = new Map()
  const edgeRelations = new Map()

  /** Finds the lowest common ancestor node between two node UUIDs.
   * @param {string} sourceUUID - The UUID of the source node
   * @param {string} targetUUID - The UUID of the target node
   */
   const getLCA = (sourceUUID, targetUUID) => {
    const parent = nodes.get(sourceUUID).parent
    // 1. Само-переход. Если узлы совпадают, возвращаем их родителя
    if (sourceUUID === targetUUID) return parent
    // 2. Общий предок
    const set = new Set() // Сбор всех предков узла источника
    let node
    node = parent
    while (node) {
      set.add(node)
      node = nodes.get(node).parent
    }
    node = targetUUID // Поиск ближайшего общего предка
    while (node) {
      if (set.has(node)) return node // Если предок второго узла найден в множестве, возвращаем его
      node = nodes.get(node).parent // Переходим к следующему предку узла назначения
    }
    // 3. Корневая нода
    return sourceUUID
  }
  
  // Проходимся по всем дугам и записываем их в карты
  for (let [edgeID, edge] of edges) {
    const lca = getLCA(edge.source, edge.target) // Находим ближайшего общего предка узлов источника перехода
    if (!nodeRelations.has(lca)) nodeRelations.set(lca, []) // Если общего предка нет в карте, добавляем в виде ключа ноду и в виде значения пустой массив
    nodeRelations.get(lca).push(edgeID) // Добавляем переход в список ноды предка
    edgeRelations.set(edgeID, lca) // Записываем связь между идентификатором перехода и предка
  }
  console.log(nodeRelations, edgeRelations)
}