import type { ElkEdgeSection } from "https://cdn.jsdelivr.net/npm/elkjs@0.8.2/+esm"
import type {
  AnyState,
  StateNodeDefinition,
  AnyEventObject,
  EventObject,
  Interpreter,
} from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
export type MachineJSON = StateNodeDefinition<any, any, any> & { transition: string[] }
type GraphLayout = { width: number; height: number; x: number; y: number }
export type NodesState = Map<string, NodeState>
export type NodeState = {
  entry: string[]
  exit: string[]
  invoke: string[]
  history: string | boolean | undefined
  initial: string | number | symbol | undefined
  key: string
  type: string
  meta: {
    layout: GraphLayout
  }
  order: number
  parent: string | undefined
  tags: string[]
  children: string[]
}
export type EdgesTransition = Map<string, EdgeTransition>
export type EdgeTransition = {
  source: string
  target: string
  label: GraphLayout & { text: string }
  type: string
  cond: string | undefined
  sections: ElkEdgeSection[]
}
export type Graph = {
  nodes: NodesState
  edges: EdgesTransition
}
export type GraphBounded = {
  nodes: Map<string, { width: number; height: number }>
  edges: Map<string, { width: number; height: number }>
}

export type Point = { x: number; y: number }
export type SubscribeCallback = (state: AnyState, event: AnyEventObject) => void
export type RelativeNodeEdgeMap = [Map<string | undefined, string[]>, Map<string, string | undefined>]

export type InterpreterMachine<TContext, TEvent> = Interpreter<
  TContext,
  any,
  TEvent extends EventObject ? TEvent : EventObject,
  any
>
export type AnyStateNodeDefinition = StateNodeDefinition<any, any, any>
export {
  AnyStateMachine,
  AnyState,
  EventType,
  EventObject,
  Interpreter,
} from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
