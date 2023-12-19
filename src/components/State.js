const html = String.raw

/**
 * NodeState visualization component
 *
 * @param { Object } property
 * @param {import("types").NodeState } property.node
 * @returns {string} html string
 */
export default ({ node }) => {
  const markedType = ["history", "final"].includes(node.type)
  return html`
    <div class="node" id="${node.id}">
      <div class="node-content" data-active="false" data-preview="false">
        <div class="node-header">
          ${markedType ? html`<div class="node-type" data-node-type=${node.type} />` : ""}
          <div class="node-title">${node.key}</div>
        </div>
        ${node.invoke.length
          ? html`<div class="node-fn" data-type="invoke">${node.invoke.map((item) => html`<div>${item}</div>`)}</div>`
          : ""}
        ${node.entry.length
          ? html`<div class="node-fn" data-type="entry">${node.entry.map((item) => html`<div>${item}</div>`)}</div>`
          : ""}
        ${node.exit.length
          ? html`<div class="node-fn" data-type="exit">${node.exit.map((item) => html`<div>${item}</div>`)}</div>`
          : ""}
      </div>
    </div>
  `
}
