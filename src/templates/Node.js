const html = String.raw
/** NodeInfo visualization data
 * @typedef {Object} NodeInfo
 * @property {string} key - node key
 * @property {string} type - node type
 * @property {string[]} entry - node entry actions
 * @property {string[]} exit - node exit actions
 * @property {string[]} invoke - node invoke services
 * @property {string[]} [tags] - node tags
 */

/**
 * State visualization component
 * @param { NodeInfo & {id:string} } property
 * @returns {string} html string
 */
export default ({ id, entry, exit, invoke, key, type }) => {
  const markedType = ["history", "final"].includes(type)
  return html`
    <div class="node" id="${id}">
      <div class="node-container">
        <div class="node-content" data-active="false" data-preview="false">
          <div>
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
    </div>
  `
}
