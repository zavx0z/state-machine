import { toMachine, interpret } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
import Node from "./src/components/Node.js"
import Edge from "./src/components/Edge.js"

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

          const container = document.createElement("template")
          for (const [id, node] of nodes) {
            const template = document.createElement("template")
            template.innerHTML = Node({ ...node, id })
            container.content.append(template.content)
          }
          for (const [id, edge] of edges) {
            const template = document.createElement("template")
            template.innerHTML = Edge({ id, ...edge })
            const element = template.content.firstElementChild
            element.addEventListener("click", () => worker.postMessage({ type: "EVENT", event: { type: edge.type } }))
            element.addEventListener("mouseenter", () =>
              worker.postMessage({ type: "EVENT.PREVIEW", eventType: edge.type })
            )
            element.addEventListener("mouseleave", () => worker.postMessage({ type: "PREVIEW.CLEAR" }))
            container.content.append(template.content)
          }

          const observer = new MutationObserver(() => {
            const nodes = shadowRoot.querySelectorAll(".node")
            const boundingBoxes = {
              node: new Map(),
              edge: new Map(),
            }
            for (let n of shadowRoot.children) {
              console.log(n.className)
            }
            const bb = [...nodes].map((node) => {
              const { width, height } = node.getBoundingClientRect()
              return { id: node.id, width, height }
            })
            console.log(bb)
            observer.disconnect()
          })
          observer.observe(shadowRoot, { attributes: false, childList: true, characterData: false, subtree: true })
          shadowRoot.append(container.content)
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
        worker.postMessage({ type: "init", params: JSON.stringify(machine.toJSON()) })
        this.machine = interpret(machine)
        this.machine.onTransition((state, event) => this.listeners.forEach((callback) => callback(state, event)))
        this.machine.start()
      })
  }
  connectedCallback() {}

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
  render() {}
}
customElements.define("state-machine", StateMachine)
