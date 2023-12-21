/** Data received from the simulator.
 * @typedef {Object} GraphInfo - GRAPH.RENDER
 * @property {Map<string, import("./templates/Node.js").NodeInfo>} nodes - Node data.
 * @property {Map<string, import("./templates/Edge.js").EdgeInfo>} edges - Edge data.
 */
import { toMachine } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.6/+esm"
import Node from "./templates/Node.js"
import Edge from "./templates/Edge.js"
const template = document.createElement("template")
template.innerHTML = String.raw`
<link rel="stylesheet" href="./src/styles.css" type="text/css">
`
class StateMachine extends HTMLElement {
  #shadowRoot = this.attachShadow({ mode: "closed" })
  #simulator = new Worker("./src/core/worker.js", { type: "module" })
  constructor() {
    console.log("constructor")
    super()
    this.#shadowRoot.appendChild(template.content)
    fetch(this.getAttribute("src"))
      .then((Response) => Response.text())
      .then((xml) => {
        const machine = toMachine(xml, {})
        this.#simulator.postMessage({ type: "DOM.IDLE", params: JSON.stringify(machine.toJSON()) })
      })
    this.#simulator.onmessage = ({ data: { type, params } }) => {
      switch (type) {
        case "DOM.RENDER":
          const /** @type {GraphInfo}*/ { edges, nodes } = params
          const container = document.createElement("template")
          for (const [id, node] of nodes) {
            const template = document.createElement("template")
            template.innerHTML = Node({ ...node, id })
            container.content.append(template.content)
          }
          for (const [id, edge] of edges) {
            const template = document.createElement("template")
            template.innerHTML = Edge({ ...edge, id })
            const element = template.content.firstElementChild
            element.addEventListener("click", () =>
              this.#simulator.postMessage({ type: "MACHINE.EVENT", event: { type: edge.type } })
            )
            element.addEventListener("mouseenter", () =>
              this.#simulator.postMessage({ type: "SIMULATOR.PREVIEW", eventType: edge.type })
            )
            element.addEventListener("mouseleave", () =>
              this.#simulator.postMessage({ type: "SIMULATOR.PREVIEW.CLEAR" })
            )
            container.content.append(template.content)
          }
          this.#shadowRoot.append(container.content)
          break
        default:
          console.log("[shadow]", type, params)
          break
      }
    }
    console.log("constructor2")
  }
  connectedCallback() {
    console.log("connected")
    // Get size information for each node and edge element and send it to the this.#worker thread
    const observer = new MutationObserver(() => {
      const /** @type {import("types").GraphSize}}*/ graphSize = { nodes: new Map(), edges: new Map() }
      for (let element of this.#shadowRoot.children) {
        switch (element.className) {
          case "node":
          case "edge":
            const { width, height } = element.getBoundingClientRect()
            graphSize[`${element.className}s`].set(element.id, { width, height })
            break
          default:
            break
        }
      }
      observer.disconnect()
      this.#simulator.postMessage({ type: "DOM.BOUNDED", params: graphSize })
    })
    observer.observe(this.#shadowRoot, { childList: true })
  }
  disconnectedCallback() {
    this.#simulator.terminate()
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
  render() {}
}
customElements.define("state-machine", StateMachine)
