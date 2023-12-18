<script lang="ts">
  import type { GraphEdge } from "$lib/types"
  import type { AnyActorRef } from "@metafor/machine"

  export let edge: GraphEdge
  const sourceID: string = edge.source
  const guard = edge.transition.cond?.name
  const eventType = edge.transition.eventType

  export let activeIds: string[] = []
  let active = activeIds.includes(sourceID)
  $: active = activeIds.includes(sourceID)

  export let actor: AnyActorRef

  const setSize = (element: HTMLElement, edge: GraphEdge) => {
    const { width, height } = element.getBoundingClientRect()
    edge.label.width = width
    edge.label.height = height
    return {
      update(edge: GraphEdge) {
        element.style.opacity = "1"
        element.style.left = `${edge.label.x}px`
        element.style.top = `${edge.label.y}px`
      },
    }
  }
  const formatInvocationId = (id: string): string => {
    if (/:invocation\[/.test(id)) {
      const match = id.match(/:invocation\[(\d+)\]$/)
      if (!match) return id
      const [, index] = match
      return `anonymous [${index}]`
    }
    return id
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  use:setSize={edge}
  data-active={active}
  class="fixed z-40 flex cursor-pointer items-center rounded-2xl border-2 border-solid border-tertiary-900 bg-surface-800 text-xs font-bold text-primary-100 opacity-0 transition-colors data-[active=true]:border-primary-500 data-[active=true]:text-surface-500"
  on:mouseenter={() => actor.send({ type: "EVENT.PREVIEW", eventType })}
  on:mouseleave={() => actor.send({ type: "PREVIEW.CLEAR" })}
  on:click={() => actor.send({ type: "EVENT", event: { type: eventType } })}
>
  <div data-active={active} class:rounded-l-2xl={guard} class:rounded-2xl={!guard} class="bg-tertiary-900 px-2 py-1 data-[active=true]:bg-primary-500">
    {#if eventType.startsWith("done.state.")}
      <div data-viz-keyword="done">
        <em>onDone</em>
      </div>
    {:else if eventType.startsWith("done.invoke.")}
      {@const match = eventType.match(/^done\.invoke\.(.+)$/)}
      <div class="flex items-center justify-start gap-1 overflow-hidden whitespace-nowrap before:block before:h-2 before:w-2 before:rounded-md before:bg-success-500">
        <em>done:</em>{" "}
        <div>
          {match ? formatInvocationId(match[1]) : "??"}
        </div>
      </div>
    {:else if eventType.startsWith("error.platform.")}
      {@const match = eventType.match(/^error\.platform\.(.+)$/)}
      <div class="flex items-center justify-start gap-1 overflow-hidden whitespace-nowrap before:block before:h-2 before:w-2 before:rounded-md before:bg-error-500">
        <em>error:</em>{" "}
        <div>{match ? match[1] : "??"}</div>
      </div>
    {:else if eventType.startsWith("xstate.after")}
      {@const match = eventType.match(/^xstate\.after\((.*)\)#.*$/)}
      {#if !match}
        <div>{eventType}</div>
      {:else}
        {@const delay = match[1]}
        <div data-viz-keyword="after">
          <em>after</em>{" "}
          <div>{typeof delay === "number" || !isNaN(+delay) ? `${delay}ms` : delay}</div>
        </div>
      {/if}
    {:else if eventType === ""}
      <div data-viz-keyword="always">
        <em>always</em>
      </div>
    {:else}
      <div data-viz="eventType">
        <div>{eventType}</div>
      </div>
    {/if}
  </div>
  {#if guard}
    <div class="px-2 text-primary-100 before:content-['['] after:content-[']']">
      {guard}
    </div>
  {/if}
</div>
