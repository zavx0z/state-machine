import { assign, interpret, createMachine, sendTo } from "https://cdn.jsdelivr.net/npm/@metafor/machine@latest/+esm"


/**Создание симулятора машины
 * @param {Object} input - Инициализация контекста
 * @param {import("types").AnyStateMachine} input.machine - Машина конечного автомата (AnyStateMachine)
 * @param {import("types").AnyState} input.state - Состояние машины (AnyState)
 * @param {string} [input.previewEvent] - Имя события для предварительного просмотра
 */
export function createSimulator(input) {
  /** @type {} */
  const machine = createMachine({
    predictableActionArguments: true,
    id: "simService",
    // schema: {} as {
    //   events: Events
    //   context: InputType
    // },
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
