<script lang="ts">
  import type { ElkEdgeSection, ElkExtendedEdge, ElkNode } from "elkjs"
  import type { AnyStateNode, AnyInterpreter } from "@metafor/machine"
  import type { StateElkNode, StateElkEdge, RelativeNodeEdgeMap, GraphEdge } from "./types"
  import ELK from "elkjs"
  import { onMount, tick } from "svelte"

  import State from "./State.svelte"
  import Edge from "./Edge.svelte"
  import Transition from "./Transition.svelte"

  export let actor: AnyInterpreter

  export let edges: EdgesTransition
  export let nodes: NodesState

  const elk = new ELK()
  /** Elk-объект узла https://eclipse.dev/elk/documentation/tooldevelopers/graphdatastructure/jsonformat.html
   * @param {string} nodeID
   * @param {RelativeNodeEdgeMap} rMap
   * @returns {StateElkNode}
   */
  function getElkChild(nodeID: string, rMap: RelativeNodeEdgeMap): StateElkNode {
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
   */
  const getElkEdge = (edge: GraphEdge): ElkExtendedEdge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
    sections: [], // Пока не задаем секции дуги (могут быть добавлены позже)
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

  function getRelativeNodeEdgeMap(): RelativeNodeEdgeMap {
    // Создаем две пустые карты: карту узлов и карту дуг
    const map: RelativeNodeEdgeMap[0] = new Map()
    const edgeMap: RelativeNodeEdgeMap[1] = new Map()

    /**Поиск наименьшего общего предка*/
    const getLCA = (sourceID: string, targetID: string): string | undefined => {
      const parent = nodes.get(sourceID)!.parent
      // 1. Само-переход. Если узлы совпадают, возвращаем их родителя
      if (sourceID === targetID) return parent
      // 2. Общий предок
      const set = new Set() // Сбор всех предков узла источника
      let node
      node = parent
      while (node) {
        set.add(node)
        node = nodes.get(node)!.parent
      }
      node = targetID // Поиск ближайшего общего предка
      while (node) {
        if (set.has(node)) return node // Если предок второго узла найден в множестве, возвращаем его
        node = nodes.get(node)!.parent // Переходим к следующему предку узла назначения
      }
      // 3. Корневая нода
      return sourceID
    }
    // Проходимся по всем дугам и записываем их в карты
    for (let [edgeID, edge] of edges) {
      const lca = getLCA(edge.source, edge.target) // Находим ближайшего общего предка узлов источника перехода
      if (!map.has(lca)) map.set(lca, []) // Если общего предка нет в карте, добавляем в виде ключа ноду и в виде значения пустой массив
      map.get(lca)!.push(edgeID) // Добавляем переход в список ноды предка
      edgeMap.set(edgeID, lca) // Записываем связь между идентификатором перехода и предка
    }
    return [map, edgeMap]
  }

  async function getElkGraph(rootID: string): Promise<void> {
    const rMap = getRelativeNodeEdgeMap()
    const rootEdges = rMap[0].get(undefined) || []
    const layoutElkNode = await elk.layout({
      id: "root",
      edges: rootEdges.map((edgeID) => getElkEdge(edges.get(edgeID)!)), // Само-переходы машины
      children: [getElkChild(rootID, rMap)],
      layoutOptions: {
        "elk.hierarchyHandling": "INCLUDE_CHILDREN",
        "elk.algorithm": "layered",
        "elk.layered.crossingMinimization.semiInteractive": "true",
      },
    })
    const stateNodeToElkNodeMap = new Map<string, StateElkNode>()

    const setEdgeLayout = (elkEdge: StateElkEdge) => {
      const lca = rMap[1].get(elkEdge.id)
      // if (!lca) return
      const elkLca = stateNodeToElkNodeMap.get(lca)!
      const edge = edges.get(elkEdge.id)!
      if (elkEdge.sections) {
        const translatedSections: ElkEdgeSection[] = elkLca
          ? elkEdge.sections.map((section) => ({
              ...section,
              startPoint: {
                x: section.startPoint.x + elkLca.absolutePosition.x,
                y: section.startPoint.y + elkLca.absolutePosition.y,
              },
              endPoint: {
                x: section.endPoint.x + elkLca.absolutePosition.x,
                y: section.endPoint.y + elkLca.absolutePosition.y,
              },
              bendPoints: section.bendPoints?.map((bendPoint) => {
                return {
                  x: bendPoint.x + elkLca.absolutePosition.x,
                  y: bendPoint.y + elkLca.absolutePosition.y,
                }
              }),
            }))
          : elkEdge.sections
        if (translatedSections) edge.sections = translatedSections
      }
      edge.label.x = (elkEdge.labels?.[0].x || 0) + (elkLca?.absolutePosition.x || 0)
      edge.label.y = (elkEdge.labels?.[0].y || 0) + (elkLca?.absolutePosition.y || 0)
    }

    const setLayout = (elkNode: StateElkNode, parent: StateElkNode | undefined) => {
      stateNodeToElkNodeMap.set(elkNode.id, elkNode)
      elkNode.absolutePosition = {
        x: (parent?.absolutePosition.x ?? 0) + elkNode.x!,
        y: (parent?.absolutePosition.y ?? 0) + elkNode.y!,
      }
      const node = nodes.get(elkNode.id)!
      node.meta.layout = {
        width: elkNode.width!,
        height: elkNode.height!,
        x: (parent?.absolutePosition.x ?? 0) + elkNode.x!,
        y: (parent?.absolutePosition.y ?? 0) + elkNode.y!,
      }
      const element = document.getElementById(elkNode.id)!
      element.style.left = `${node.meta.layout.x}px`
      element.style.top = `${node.meta.layout.y}px`
      element.style.width = `${node.meta.layout.width}px`
      element.style.height = `${node.meta.layout.height}px`
      element.style.opacity = "1"

      elkNode.edges.forEach(setEdgeLayout)
      elkNode.children?.forEach((cn) => setLayout(cn as StateElkNode, elkNode))
    }
    layoutElkNode.edges.forEach(setEdgeLayout)
    setLayout(layoutElkNode.children![0] as StateElkNode, undefined)
  }
  onMount(async () => {
    await tick()
    for (let [key, value] of nodes.entries()) {
      if (!value.parent) await getElkGraph(key)
    }
  })
  let previewIds: string[] = []
  let activeIds = actor.getSnapshot().context.state.configuration.map((i: AnyStateNode) => i.id)
  onMount(() => {
    const { unsubscribe } = actor.subscribe((state) => {
      if (state.changed) {
        previewIds = state.context.previewEvent ? state.context.machine.transition(state.context.state, { type: state.context.previewEvent }).configuration.map((i: AnyStateNode) => i.id) : []
        activeIds = state.context.state.configuration.map((i: AnyStateNode) => i.id)
      }
    })
    return () => {
      unsubscribe()
    }
  })
</script>

{#each nodes.entries() as [id, node] (id)}
  <State {node} {previewIds} {activeIds} />
{/each}
{#each edges.entries() as [id, edge] (id)}
  <Transition {edge} {activeIds} {actor} />
{/each}
<svg class="pointer-events-none fixed left-0 top-0 h-screen w-screen overflow-visible">
  {#each edges.entries() as [id, edge] (id)}
    <Edge {edge} {nodes} {activeIds} />
  {/each}
</svg>
