/**EdgeInfo
 * @typedef {Object} data_Edge
 * @property {string} type - edge type
 * @property {string} [label] - edge label
 * @property {string} [cond] - edge condition
 */

/**Transition visualization component
 * @param { data_Edge & {id:string} } props - Property object
 * @returns {string} */
export default ({ id, type, label, cond }) => /*html*/ `
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
        if (match) {
          if (/:invocation\[/.test(match[1])) {
            const matchInvoc = match[1].match(/:invocation\[(\d+)\]$/)
            if (matchInvoc)
              return /*html*/ `
                <div class="edge-label-invoke edge-label-invoke-done">
                  <em>done: </em>
                  <div>anonymous [${matchInvoc[1]}]</div>
                </div> `
          } else {
            return /*html*/ `
              <div class="edge-label-invoke edge-label-invoke-done">
                <em>done: </em>
                <div>${match[1]}</div>
              </div> `
          }
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
