import { toMachine, interpret } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.4/+esm"

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
  listeners = []
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners.pop(callback)
      console.log(this.listeners)
    }
  }
  send({ type, params }) {
    this.machine.send({ type, params })
  }
  render() {}
}
customElements.define("state-machine", StateMachine)
