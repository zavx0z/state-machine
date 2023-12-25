import { assign, interpret, createMachine, sendTo } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.7/+esm"
/**
 * @typedef {import("types").AnyState} AnyState
 * @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.7/+esm").AnyStateMachine} AnyStateMachine
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
 * @typedef { { type: "PREVIEW"; eventType: EventType } } PREVIEW
 * @typedef { { type: "STATE.UPDATE"; state: AnyState } } STATE_UPDATE
 * @typedef { { type: "MACHINE.UPDATE"; machine: AnyStateMachine } } MACHINE_UPDATE
 * @typedef { EVENT | PREVIEW | STATE_UPDATE | MACHINE_UPDATE } SimulatorEvents
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
          PREVIEW: {
            actions: assign({ previewEvent: (_, event) => event.eventType }),
          },
        },
      },
    },
  })
  return interpret(machine)
}
