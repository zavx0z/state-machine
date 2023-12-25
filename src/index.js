/** Data received from the simulator.
 * @typedef {Object} GraphData - GRAPH.RENDER
 * @property {Map<string, import("./templates/Node.js").data_Node>} nodes - Node data.
 * @property {Map<string, import("./templates/Edge.js").data_Edge>} edges - Edge data.
 * @property {string} machine - Machine name
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
          const /** @type {GraphData}*/ { edges, nodes, machine } = params
          this.#render(nodes, edges)
          const channel = new BroadcastChannel(machine)
          channel.onmessage = ({ data: { active } }) => {
            console.log(active)
          }
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
          break
        case "LINES.INIT":
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
          for (const [id, path] of params) svg.innerHTML += Line(id, path)
          this.#shadowRoot.append(svg)
          break
        case "STATE.ACTIVE":
          for (const element of this.#shadowRoot.querySelectorAll(".node")) {
            if (element instanceof HTMLElement && element.dataset.active == "true" && !params.includes(element.id))
              element.dataset.active = "false"
            else if (element instanceof HTMLElement && element.dataset.active == "false" && params.includes(element.id))
              element.dataset.active = "true"
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
  /**
   * Renders the graph nodes and edges into the component's shadow DOM.
   * Takes the node and edge data and generates template elements
   * for each one, handling event listeners and appending to shadowRoot.
   * @param {GraphData['nodes']}  nodes
   * @param {GraphData['edges']}  edges
   */
  #render(nodes, edges) {
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
        this.#simulator.postMessage({ type: "STATE.PREVIEW.SET", params: edge.type })
      )
      element.addEventListener("mouseleave", (event) => this.#simulator.postMessage({ type: "STATE.PREVIEW.CLEAR" }))
      container.content.append(template.content)
    }
    this.#shadowRoot.append(container.content)
  }
  render() {}
}
customElements.define("state-machine", StateMachine)
