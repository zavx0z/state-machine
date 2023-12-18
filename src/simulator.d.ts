/// <reference path="../types.ts" />

type Events =
  | { type: "EVENT"; event: EventObject }
  | { type: "EVENT.PREVIEW"; eventType: EventType }
  | { type: "STATE.UPDATE"; state: AnyState }
  | { type: "MACHINE.UPDATE"; machine: AnyStateMachine }
  | { type: "PREVIEW.CLEAR" }
type SimulatorActorType = Actor<ActorLogic<any, SimulatorEvents, any, any>>

type InputType = {
  machine: AnyStateMachine
  state: AnyState
  previewEvent?: string
}
