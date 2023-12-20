/**Transition visualization component
 * @param {Object} property - Property object
 * @param {string} property.id - Edge ID
 * @param {string | undefined} property.cond - Сondition
 * @param {string} property.type - Event type
 * @returns {string} */
export default ({ cond, id, type }) => /*html*/ `
<div class="edge" id="${id}" data-active="false" data-preview="false">
  <div class="edge-label" data-cond="${Boolean(cond)}">
    ${(() => {
      if (type.startsWith("done.state.")) {
        return /*html*/ `
          <div>
            <em>onDone</em>
          </div> `
      } else if (type.startsWith("done.invoke.")) {
        const match = type.match(/^done\.invoke\.(.+)$/)
        if (match && /:invocation\[/.test(match[1])) {
          const matchInvoc = match[1].match(/:invocation\[(\d+)\]$/)
          if (matchInvoc)
            return /*html*/ `
              <div class="edge-label-invoke edge-label-invoke-done">
                <em>done: </em>
                <div>anonymous [${matchInvoc[1]}]</div>
              </div> `
        }
      } else if (type.startsWith("error.platform.")) {
        const match = type.match(/^error\.platform\.(.+)$/)
        if (match)
          return /*html*/ `
            <div class="edge-label-invoke edge-label-invoke-error">
              <em>error: </em>
              <div>${match[1]}</div>
            </div> `
      } else if (type.startsWith("machine.after.")) {
        const match = type.match(/^machine\.after\.(.+)$/)
        if (match)
          return /*html*/ `
            <div>
              <em>after: </em>
              <div>${match[1]}ms</div>
            </div> `
      } else if (type === "") {
        return /*html*/ `
          <div>
            <em>always</em>
          </div> `
      }
      return /*html*/ `<div>${type}</div>`
    })()}
  </div>
  ${cond ? /*html*/ `<div class="edge-cond">${cond}</div>` : ""}
</div> `
