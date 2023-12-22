/** Data received from the simulator.
 * @typedef {Object} GraphInfo - GRAPH.RENDER
 * @property {Map<string, import("./templates/Node.js").NodeInfo>} nodes - Node data.
 * @property {Map<string, import("./templates/Edge.js").EdgeInfo>} edges - Edge data.
 */
import Node from "./templates/Node.js"
import Edge from "./templates/Edge.js"
import Line from "./templates/Line.js"
const template = document.createElement("template")
template.innerHTML = /*html*/ `
<link rel="stylesheet" href="./src/styles.css" type="text/css">
`
class StateMachine extends HTMLElement {
  #shadowRoot = this.attachShadow({ mode: "closed" })
  #simulator = new Worker("./src/core/worker.js", { type: "module" })
  constructor() {
    super()
    this.#shadowRoot.appendChild(template.content)
    this.#simulator.postMessage({ type: "DOM.IDLE", params: this.getAttribute("src") })
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
            element.addEventListener("mouseleave", (event) =>
              this.#simulator.postMessage({ type: "SIMULATOR.PREVIEW.CLEAR" })
            )
            container.content.append(template.content)
          }
          this.#shadowRoot.append(container.content)
          break
        case "DOM.LAYOUT":
          const /** @type {import("./core/worker.js").GraphBounding} */ GraphBounding = params
          for (const [id, node] of GraphBounding.nodes) {
            const element = this.#shadowRoot.getElementById(id)
            element.style.left = `${node.position.x}px`
            element.style.top = `${node.position.y}px`
            element.style.width = `${node.size.width}px`
            element.style.height = `${node.size.height}px`
            element.style.visibility = "visible"
          }
          for (const [id, edge] of GraphBounding.edges) {
            const element = this.#shadowRoot.getElementById(id)
            element.style.left = `${edge.position.x}px`
            element.style.top = `${edge.position.y}px`
            element.style.visibility = "visible"
          }
          for (const [id, edge] of GraphBounding.edges) {
            // Line({id, sourceRect: GraphBounding.nodes.get())})
          }
          break
        default:
          console.log("[shadow]", type, params)
          break
      }
    }
  }
  connectedCallback() {
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
  render() {}
}
customElements.define("state-machine", StateMachine)
