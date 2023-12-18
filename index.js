import { toMachine, interpret } from "https://cdn.jsdelivr.net/npm/@metafor/machine@latest/+esm"

const template = document.createElement("template")
template.innerHTML = ``
class StateMachine extends HTMLElement {
  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: "closed" })
    shadowRoot.appendChild(template.content.cloneNode(true))

    fetch(this.getAttribute("src"))
      .then((Response) => Response.text())
      .then((xml) => {
        this.machine = interpret(toMachine(xml, {}))
        this.machine.onTransition((state, event) => this.listeners.forEach((callback) => callback(state, event)))
        this.machine.start()
      })
  }
  /** @type {import("types").SubscribeCallback[]} */
  listeners = [(state, event) => console.log(state, event)]
  /** Подписка на события машины
   * @param {import("types").SubscribeCallback} callback
   * @returns unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback)
    return () => this.listeners.splice(this.listeners.indexOf(callback), 1)
  }
  send({ type, params }) {
    this.machine.send({ type, params })
  }
  render() {}
}
customElements.define("state-machine", StateMachine)
