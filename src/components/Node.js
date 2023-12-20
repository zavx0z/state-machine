const html = String.raw
/**
 * NodeState visualization component
 * @param { Object } property
 * @param {string} property.id
 * @param {string} property.key
 * @param {string} property.type
 * @param {string[]} property.entry
 * @param {string[]} property.exit
 * @param {string[]} property.invoke
 * @returns {string} html string
 */
export default ({ id, entry, exit, invoke, key, type }) => {
  const markedType = ["history", "final"].includes(type)
  return html`
    <div class="node" id="${id}">
      <div class="node-content" data-active="false" data-preview="false">
        <div class="node-header">
          ${markedType ? html`<div class="node-type" data-node-type=${type} />` : ""}
          <div class="node-title">${key}</div>
        </div>
        ${invoke.length
          ? html`<div class="node-actions" data-type="invoke">${invoke.map((item) => html`<div>${item}</div>`)}</div>`
          : ""}
        ${entry.length
          ? html`<div class="node-actions" data-type="entry">${entry.map((item) => html`<div>${item}</div>`)}</div>`
          : ""}
        ${exit.length
          ? html`<div class="node-actions" data-type="exit">${exit.map((item) => html`<div>${item}</div>`)}</div>`
          : ""}
      </div>
    </div>
  `
}
