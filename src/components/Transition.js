/**Transition visualization component
 * @param {Object} property - Property object
 * @param {string} property.edgeID - Edge ID
 * @param {string | undefined} property.cond - Сondition
 * @param {string} property.eventType - Event type
 * @returns {string} */
export default ({ cond, edgeID, eventType }) => /*html*/ `
<div class="transition" id="${edgeID}" data-active="false" data-preview="false">
  <div class="transition-label" data-cond="${Boolean(cond)}">
    ${(() => {
      if (eventType.startsWith("done.state.")) {
        return /*html*/ `
          <div>
            <em>onDone</em>
          </div> `
      } else if (eventType.startsWith("done.invoke.")) {
        const match = eventType.match(/^done\.invoke\.(.+)$/)
        if (match && /:invocation\[/.test(match[1])) {
          const matchInvoc = match[1].match(/:invocation\[(\d+)\]$/)
          if (matchInvoc)
            return /*html*/ `
              <div class="transition-label-invoke transition-label-invoke-done">
                <em>done: </em>
                <div>anonymous [${matchInvoc[1]}]</div>
              </div> `
        }
      } else if (eventType.startsWith("error.platform.")) {
        const match = eventType.match(/^error\.platform\.(.+)$/)
        if (match)
          return /*html*/ `
            <div class="transition-label-invoke transition-label-invoke-error">
              <em>error: </em>
              <div>${match[1]}</div>
            </div> `
      } else if (eventType.startsWith("machine.after.")) {
        const match = eventType.match(/^machine\.after\.(.+)$/)
        if (match)
          return /*html*/ `
            <div>
              <em>after: </em>
              <div>${match[1]}ms</div>
            </div> `
      } else if (eventType === "") {
        return /*html*/ `
          <div>
            <em>always</em>
          </div> `
      }
      return /*html*/ `<div>${eventType}</div>`
    })()}
  </div>
  ${cond ? /*html*/ `<div class="transition-cond">${cond}</div>` : ""}
</div> `
