import { assign, interpret, createMachine, sendTo } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
/**
 * @typedef {import("types").AnyState} AnyState
 * @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm").AnyStateMachine} AnyStateMachine
 * @typedef {import("types").EventType} EventType
 * @typedef {import("types").EventObject} EventObject
 * @typedef {import("types").Interpreter} Interpreter
/** Context
 * @typedef {Object} InputType
 * @property {AnyStateMachine} InputType.machine - Машина конечного автомата (AnyStateMachine)
 * @property {AnyState} InputType.state - Состояние машины (AnyState)
 * @property {string} [InputType.previewEvent] - Имя события для предварительного просмотра
/** Events 
 * @typedef { { type: "EVENT"; event: EventObject } } EVENT
 * @typedef { { type: "EVENT.PREVIEW"; eventType: EventType } } EVENT_PREVIEW
 * @typedef { { type: "STATE.UPDATE"; state: AnyState } } STATE_UPDATE
 * @typedef { { type: "MACHINE.UPDATE"; machine: AnyStateMachine } } MACHINE_UPDATE
 * @typedef { { type: "PREVIEW.CLEAR" } } PREVIEW_CLEAR
 * @typedef { EVENT | EVENT_PREVIEW | STATE_UPDATE | MACHINE_UPDATE | PREVIEW_CLEAR } SimulatorEvents
/** Schema 
 * @typedef {Object} schema
 * @property {SimulatorEvents} [schema.events]
 * @property {InputType} [schema.context]

 * @typedef {import("types").InterpreterMachine<InputType, SimulatorEvents>} Simulator
*/

/**
 * @param {InputType} input
 * @returns {Simulator}
 */
export function createSimulator(input) {
  const machine = createMachine({
    predictableActionArguments: true,
    id: "simulator",
    /** @type {schema} */
    schema: {},
    initial: "active",
    context: () => ({
      machine: input.machine,
      state: input.state,
      previewEvent: input.previewEvent,
    }),
    on: {
      "STATE.UPDATE": {
        actions: assign({ state: (_, event) => event.state }),
      },
      EVENT: {
        actions: sendTo("machine", (_, event) => {
          const eventToSend = { ...event.event }
          return eventToSend
        }),
      },
    },
    states: {
      active: {
        invoke: {
          id: "machine",
          src: (ctx) => (sendBack, onReceive) => {
            console.log("starting again")
            const actor = interpret(ctx.machine)
              .onTransition((state) => sendBack({ type: "STATE.UPDATE", state }))
              .start()
            onReceive((event) => {
              actor.send(event)
            })
            return () => {
              actor.stop()
            }
          },
        },
        on: {
          "MACHINE.UPDATE": {
            target: "active",
            internal: false,
            actions: assign({ machine: (_, event) => event.machine }),
          },
          "EVENT.PREVIEW": {
            actions: assign({ previewEvent: (_, event) => event.eventType }),
          },
          "PREVIEW.CLEAR": {
            actions: assign({ previewEvent: undefined }),
          },
        },
      },
    },
  })
  return interpret(machine)
}
