<script lang="ts">
  import type { LPathParam, SvgPath } from "./utils/edgeSVG"
  import { getPath, getRect, pathToD } from "./utils/edgeSVG"
  import type { GraphEdge, NodeState, Point } from "$lib/types"
  import type { ElkEdgeSection } from "elkjs"

  export let edge: GraphEdge

  const edgeID:string = edge.id
  const sourceID: string = edge.source
  const targetID: string = edge.target

  let label: DOMRect = edge.label as unknown as DOMRect
  $: label = edge.label as unknown as DOMRect

  let sections: ElkEdgeSection[] = edge.sections
  $: sections = edge.sections

  export let nodes: { [key: string]: NodeState }
  export let activeIds: string[] = []

  const svgPath = (element: SVGPathElement, sections: ElkEdgeSection[]) => {
    return {
      update(sections: ElkEdgeSection[]) {
        const sourceRect = nodes[sourceID].meta.layout as DOMRect
        const edgeRect = label as unknown as DOMRect
        const targetRect = nodes[targetID].meta.layout as DOMRect
        if (sourceRect && edgeRect && targetRect) {
          let path: SvgPath | undefined
          if (sections?.length) {
            const section = sections[0]
            path = [["M", section.startPoint], ...(section.bendPoints?.map((point: Point) => ["L", point] as LPathParam) || [])]
            const preLastPoint = path[path.length - 1][1]!
            const xSign = Math.sign(section.endPoint.x - preLastPoint.x)
            const ySign = Math.sign(section.endPoint.y - preLastPoint.y)
            const endPoint = { x: section.endPoint.x - 5 * xSign, y: section.endPoint.y - 5 * ySign }
            path.push(["L", endPoint])
          } else path = getPath(getRect(sourceRect), getRect(edgeRect), getRect(targetRect))
          if (path) {
            element.setAttribute("d", pathToD(path))
            element.setAttribute("opacity", "1")
          }
        }
      },
    }
  }
</script>

<g data-active={activeIds.includes(sourceID)} stroke={"#fff"} class="fill-tertiary-900 stroke-tertiary-900 data-[active=true]:fill-primary-500 data-[active=true]:stroke-primary-500">
  <defs>
    <marker id={edgeID} viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="0" refY="5" markerUnits="strokeWidth" orient="auto">
      <path d="M0,0 L0,10 L10,5 z" />
    </marker>
  </defs>
  <path use:svgPath={sections} stroke-width={2} fill="none" marker-end="url(#{edgeID})" opacity="0" class="transition-colors"></path>
</g>
