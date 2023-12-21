/**
 * @typedef {import("elkjs").ElkNode} ElkNode
 */

  /** Elk-объект узла https://eclipse.dev/elk/documentation/tooldevelopers/graphdatastructure/jsonformat.html
   * @param {string} nodeID
   * @param {RelativeNodeEdgeMap} rMap
   * @returns {ElkNode}
   */
  function getElkChild(nodeID, rMap) {
    const node = nodes.get(nodeID)!
    const layout = node.meta.layout // Достаем информацию о разметке текущего узла
    const rEdges = rMap[0].get(nodeID) || [] // Получаем исходящие грани текущего узла из карты относительных граней
    return {
      id: nodeID,
      width: layout.width,
      height: layout.height,
      children: node.children.map((childID) => getElkChild(childID, rMap)),
      edges: rEdges.map((edgeID) => getElkEdge(edges.get(edgeID)!)),
      layoutOptions: {
        "elk.padding": `[top=${(layout.height || 0) + 30}, left=30, right=30, bottom=30]`, // Добавляем отступы вокруг узла
        hierarchyHandling: "INCLUDE_CHILDREN", // Включаем дочерние узлы в иерархию
      },
      absolutePosition: { x: 0, y: 0 },
    }
  }
  /** Elk-объект грани
   * @param {GraphEdge} edge
   * @returns {import("elkjs").ElkExtendedEdge}
   */
  const getElkEdge = (edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
    labels: [
      {
        id: edge.id + "--label",
        width: edge.label.width,
        height: edge.label.height,
        text: edge.label.text || "always",
        layoutOptions: {
          "edgeLabels.inline": "true", // встроенная метка
          "edgeLabels.placement": "CENTER", // расположение по центру
        },
      },
    ],
  })