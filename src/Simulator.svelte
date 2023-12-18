<script lang="ts">
  import type { Point } from "$lib/types"
  import { interpret, assign, createMachine } from "@metafor/machine"
  
  const canvasActor = interpret(
    createMachine({
      predictableActionArguments: true,
      id: "canvasMachine",
      context: {
        zoom: 1,
        pan: { dx: 0, dy: 0 },
        initialPosition: { x: 0, y: 0 },
      },
      schema: {} as {
        context: {
          zoom: number
          pan: { dx: number; dy: number }
          initialPosition: Point
        }
        events: { type: "ZOOM.OUT" } | { type: "ZOOM.IN" } | { type: "POSITION.SET"; position: Point } | { type: "PAN"; dx: number; dy: number }
      },
      on: {
        "ZOOM.OUT": {
          actions: assign({ zoom: (context) => context.zoom - 0.1 }),
          cond: (context) => context.zoom > 0.5,
        },
        "ZOOM.IN": {
          actions: assign({ zoom: (context) => context.zoom + 0.1 }),
          cond: (context) => context.zoom < 1,
        },
        PAN: {
          actions: assign({ pan: (context, event) => ({ dx: context.pan.dx - event.dx, dy: context.pan.dy - event.dy }) }),
        },
        "POSITION.SET": {
          actions: assign({ initialPosition: (_, event) => event.position }),
        },
      },
    }),
  ).start()
</script>

<div class="h-screen" on:wheel={(e) => canvasActor.send({ type: "PAN", dx: e.deltaX, dy: e.deltaY })}>
  <div class="flex gap-2">
    <button class="min-w-[50px] rounded-sm bg-primary-500 px-2 text-surface-900" on:click={() => canvasActor.send({ type: "ZOOM.OUT" })}>-</button>
    <button class="min-w-[50px] rounded-sm bg-primary-500 px-2 text-surface-900" on:click={() => canvasActor.send({ type: "ZOOM.IN" })}>+</button>
  </div>
  <div style="transform: scale({$canvasActor.context.zoom}) translate({$canvasActor.context.pan.dx}px, {$canvasActor.context.pan.dy}px)" class="h-full transition-transform duration-200 ease-in-out">
    <slot />
  </div>
</div>
