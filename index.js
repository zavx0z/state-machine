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
        case "GRAPH.BOUNDING":
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
            element.addEventListener("click", () =>
              worker.postMessage({ type: "MACHINE.EVENT", event: { type: edge.type } })
            )
            element.addEventListener("mouseenter", () =>
              worker.postMessage({ type: "GRAPH.PREVIEW", eventType: edge.type })
            )
            element.addEventListener("mouseleave", () => worker.postMessage({ type: "PREVIEW.CLEAR" }))
            container.content.append(template.content)
          }
          // Get bounding box information for each node and edge element and send it to the worker thread
          const observer = new MutationObserver(() => {
            const boundingBoxes = { node: new Map(), edge: new Map() }
            for (let element of shadowRoot.children) {
              switch (element.className) {
                case "node":
                case "edge":
                  const { width, height } = element.getBoundingClientRect()
                  boundingBoxes[element.className].set(element.id, { width, height })
                  break
                default:
                  break
              }
            }
            observer.disconnect()
            worker.postMessage({ type: "GRAPH.BOUNDED", params: boundingBoxes })
          })
          observer.observe(shadowRoot, { attributes: false, childList: true, characterData: false, subtree: false })
          shadowRoot.append(container.content)
          break
        default:
          console.log("[shadow]", type, params)
          break
      }
    }

    fetch(this.getAttribute("src"))
      .then((Response) => Response.text())
      .then((xml) => {
        const machine = toMachine(xml, {})
        worker.postMessage({ type: "GRAPH.IDLE", params: JSON.stringify(machine.toJSON()) })
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
