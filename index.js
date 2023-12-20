import { toMachine, interpret } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
import State from "./src/components/State.js"
import Transition from "./src/components/Transition.js"

const template = document.createElement("template")
template.innerHTML = String.raw`
<link rel="stylesheet" href="./src/styles.css" type="text/css">
`
class StateMachine extends HTMLElement {
  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: "closed" })
    shadowRoot.appendChild(template.content.cloneNode(true))

    const worker = new Worker("./src/worker.js", { type: "module" })
    worker.onmessage = ({ data: { type, params } }) => {
      switch (type) {
        case "machine.init":
          /** @type {{edges: import("types").EdgesTransition; nodes: import("types").NodesState}}*/
          const { edges, nodes } = params
          let nodesElements = ""
          for (const [id, node] of nodes) {
            nodesElements += State({ node })
          }
          const containerNodes = document.createElement("div")
          containerNodes.innerHTML = nodesElements

          const observer = new MutationObserver(function (mutations) {
            if (shadowRoot.contains(containerNodes)) {
              const bb = [...containerNodes.children].map((node) => {
                const { width, height } = node.getBoundingClientRect()
                return { id: node.id, width, height }
              })
              console.log(bb)
              observer.disconnect()
            }
          })
          observer.observe(shadowRoot, { attributes: false, childList: true, characterData: false, subtree: true })
          // shadowRoot.append(containerNodes)

          const containerTransitions = document.createElement("div")
          for (const [id, edge] of edges) {
            const template = document.createElement("template")
            template.innerHTML = Transition({
              edgeID: id,
              cond: edge.transition.cond?.name,
              eventType: edge.transition.eventType,
            })
            template.onclick = () => worker.postMessage({ type: "EVENT", event: { type: edge.transition.eventType } })
            template.onmouseenter = () =>
              worker.postMessage({ type: "EVENT.PREVIEW", eventType: edge.transition.eventType })
            template.onmouseleave = () => worker.postMessage({ type: "PREVIEW.CLEAR" })
            containerTransitions.append(template.content)
          }
          shadowRoot.append(containerTransitions)

          break
        default:
          console.log("worker", type)
          break
      }
    }

    fetch(this.getAttribute("src"))
      .then((Response) => Response.text())
      .then((xml) => {
        const machine = toMachine(xml, {})
        worker.postMessage(JSON.stringify(machine.toJSON()))
        this.machine = interpret(machine)
        this.machine.onTransition((state, event) => this.listeners.forEach((callback) => callback(state, event)))
        this.machine.start()
      })
  }
  /** @type {import("types").SubscribeCallback[]} */
  listeners = []
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

  connectedCallback() {}

  render() {}
}
customElements.define("state-machine", StateMachine)
