<script lang="ts">
  export let node: NodeState
  const nodeType = node.type
  const nodeID = node.id
  const nodeKey = node.key
  const entryTypes = node.entry
  const exitTypes = node.exit
  const invokeIDs = node.invoke

  export let activeIds: string[] = []
  let active = activeIds.includes(nodeID)
  $: active = activeIds.includes(nodeID)

  export let previewIds: string[] = []
  let preview = previewIds.includes(nodeID)
  $: preview = previewIds.includes(nodeID)

  const init = (element: HTMLElement, node: NodeState) => {
    const { width, height } = element.getBoundingClientRect()
    node.meta.layout.width = width
    node.meta.layout.height = height
    return {
      update(node: NodeState) {
        element.style.left = `${node.meta.layout.x}px`
        element.style.top = `${node.meta.layout.y}px`
        element.style.width = `${node.meta.layout.width}px`
        element.style.height = `${node.meta.layout.height}px`
        element.style.opacity = "1"
      },
    }
  }
</script>

<div id={nodeID} class="opacity-1 absolute text-primary-50 transition-opacity" use:init={node}>
  <!-- title="#{node.id}" -->
  <div
    data-active={active}
    data-preview={preview}
    class="h-full w-full self-start overflow-hidden rounded-lg border-2 border-solid border-surface-700 transition-colors data-[active=true]:border-primary-500 data-[preview=true]:border-primary-500 data-[active=false]:opacity-60"
  >
    <div data-rect={`${nodeID}:content`} class="bg-surface-700 p-2 empty:hidden">
      <div class="bg-surface-700">
        {#if ["history", "final"].includes(nodeType)}
          <div
            data-node-type={nodeType}
            class="flex h-8 w-8 items-center justify-center rounded-md bg-tertiary-700 before:block before:font-bold data-[node-type=final]:before:content-['F'] data-[node-type=history]:before:content-['H']"
          />
        {/if}
        <div class="py-2 font-bold">{nodeKey}</div>
      </div>
      <div data-type="invoke" class="mb-2 before:text-xs before:font-bold before:uppercase before:opacity-50 before:content-[attr(data-type)'\a0/'] empty:hidden">
        {#each invokeIDs as invoke}
          <div>{invoke}</div>
        {/each}
      </div>
      <div data-type="entry" class="mb-2 before:text-xs before:font-bold before:uppercase before:opacity-50 before:content-[attr(data-type)'\a0/'] empty:hidden">
        {#each entryTypes as entry}
          <div>{entry}</div>
        {/each}
      </div>
      <div data-type="exit" class="mb-2 before:text-xs before:font-bold before:uppercase before:opacity-50 before:content-[attr(data-type)'\a0/'] empty:hidden">
        {#each exitTypes as exit}
          <div>{exit}</div>
        {/each}
      </div>
    </div>
  </div>
</div>
