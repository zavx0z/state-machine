/**
 * @typedef {Object} Data
 * @property {Map<string, import("./templates/Node.js").data_Node>} states
 * @property {Map<string, import("./templates/Edge.js").data_Edge>} events
 */
import Node from "./templates/Node.js"
import Edge from "./templates/Edge.js"
import Line from "./templates/Line.js"

const template = document.createElement("template")
template.innerHTML = /*html*/ `
<link rel="stylesheet" href="./src/styles.css" type="text/css">
`
class StateMachine extends HTMLElement {
  #host = this.attachShadow({ mode: "closed" })
  #worker = new Worker("./src/core/worker.js", { type: "module" })
  constructor() {
    super()
    this.#host.appendChild(template.content)
    this.#worker.postMessage({ type: "CREATE", params: this.getAttribute("src") })
    this.#worker.onmessage = ({ data: { type, params } }) => {
      switch (type) {
        case "CREATE":
          const /** @type {Data}*/ { events: edges, states: nodes } = params
          this.#render(nodes, edges)
          break
        case "DOM.LAYOUT":
          const /** @type {import("./core/worker.js").GraphBounding} */ GraphBounding = params
          for (const [id, node] of GraphBounding.nodes) {
            const element = this.#host.getElementById(id)
            element.style.left = `${node.position.x}px`
            element.style.top = `${node.position.y}px`
            element.style.width = `${node.size.width}px`
            element.style.height = `${node.size.height}px`
            element.style.visibility = "visible"
          }
          for (const [id, edge] of GraphBounding.edges) {
            const element = this.#host.getElementById(id)
            element.style.left = `${edge.position.x}px`
            element.style.top = `${edge.position.y}px`
            element.style.visibility = "visible"
          }
          break
        case "CONNECT":
          for (const [id, path] of params) this.#host.querySelector(`svg [id='${id}']>path`).setAttribute("d", path)
          break
        case "EVENT":
          for (const element of this.#host.querySelectorAll(".node")) {
            if (element instanceof HTMLElement) {
              if (element.dataset.active == "true" && !params.nodes.includes(element.id))
                element.dataset.active = "false"
              else if (element.dataset.active == "false" && params.nodes.includes(element.id))
                element.dataset.active = "true"
            }
          }
          for (const element of this.#host.querySelectorAll(".edge")) {
            if (element instanceof HTMLElement) {
              if (element.dataset.active == "true" && !params.edges.includes(element.id))
                element.dataset.active = "false"
              else if (element.dataset.active == "false" && params.edges.includes(element.id))
                element.dataset.active = "true"
            }
          }
          for (const element of this.#host.querySelectorAll(".line")) {
            if (element instanceof SVGElement) {
              if (element.dataset.active == "true" && !params.edges.includes(element.id))
                element.dataset.active = "false"
              else if (element.dataset.active == "false" && params.edges.includes(element.id))
                element.dataset.active = "true"
            }
          }
          break
        case "PREVIEW":
          for (const state of params.nodes) this.#host.getElementById(state).dataset.preview = "true"
          for (const edge of params.edges) this.#host.getElementById(edge).dataset.preview = "true"
          for (const edge of params.edges) {
            const element = this.#host.querySelector(`svg [id='${edge}']`)
            if (element instanceof SVGElement) element.dataset.preview = "true"
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
      for (let element of this.#host.children) {
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
      this.#worker.postMessage({ type: "DOM.BOUNDED", params: graphSize })
    })
    observer.observe(this.#host, { childList: true })
  }
  disconnectedCallback() {
    this.#worker.terminate()
  }
  /**
   * Renders the graph nodes and edges into the component's shadow DOM.
   * Takes the node and edge data and generates template elements
   * for each one, handling event listeners and appending to shadowRoot.
   * @param {Data['states']}  nodes
   * @param {Data['events']}  edges
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
      element.addEventListener("click", () => {
        this.#host.querySelectorAll('[data-preview="true"]').forEach((element) => {
          if (element instanceof HTMLElement || element instanceof SVGElement) element.dataset.preview = "false"
        })
        this.#worker.postMessage({ type: "EVENT", params: { type: edge.type } })
      })
      element.addEventListener("mouseenter", () => this.#worker.postMessage({ type: "PREVIEW", params: edge.type }))
      element.addEventListener("mouseleave", (event) => {
        this.#host.querySelectorAll('[data-preview="true"]').forEach((element) => {
          if (element instanceof HTMLElement || element instanceof SVGElement) element.dataset.preview = "false"
        })
      })
      container.content.append(template.content)
    }
    this.#host.append(container.content)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    for (const [id, _] of edges) svg.innerHTML += Line(id, "")
    this.#host.append(svg)
  }
  render() {}
}
customElements.define("state-machine", StateMachine)
