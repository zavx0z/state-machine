import type { ElkEdgeSection } from "https://cdn.jsdelivr.net/npm/elkjs@0.8.2/+esm"
import type {
  AnyState,
  StateNodeDefinition,
  AnyEventObject,
  EventObject,
  Interpreter,
} from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.7/+esm"

type Size = { width: number; height: number }
export type Point = { x: number; y: number }

export type Node = {
  entry: string[]
  exit: string[]
  invoke: string[]
  history: string | boolean | undefined
  initial: string | number | symbol | undefined
  key: string
  type: string
  order: number
  parent: string | undefined
  tags: string[]
  children: string[]
  size: Size
  position: Point
}
export type Edge = {
  source: string
  target: string
  label: string
  type: string
  cond: string | undefined
  sections: ElkEdgeSection[]
  size: Size
  position: Point
}
export type Nodes = Map<string, Node>
export type Edges = Map<string, Edge>
export type Graph = { nodes: Nodes; edges: Edges }
export type GraphSize = { nodes: Map<string, Size>; edges: Map<string, Size> }

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
} from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.7/+esm"
