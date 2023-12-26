import { mapActions } from "./action.js"
import { createCond } from "./cond.js"
import { getStringAttribute, getAttribute } from "./utils.js"
/** Constructs a transition object with executable actions based on provided XML elements.
 * @param {import("./types.js").XMLElement[]} elements - An array of XMLElements representing the executable content.
 * @returns {Object} A transition object with an actions property containing mapped actions.
 */
function executableContent(elements) {
  const transition = { actions: mapActions(elements) }
  return transition
}
/** Parses the target attribute and returns an array of target IDs prefixed with '#'.
 * If the target attribute is not provided, it returns undefined.
 * @param {string|number} [targetAttr] - The target attribute which can be a string or number.
 * @returns {string[]|undefined} An array of target IDs or undefined if the targetAttr is not provided.
 */
function getTargets(targetAttr) {
  // If targetAttr is provided, split it into an array by spaces and prefix each with '#'
  // Otherwise, return undefined
  return targetAttr ? `${targetAttr}`.split(/\s+/).map((target) => `#${target}`) : undefined
}

export function createTransition(transitionElements, invokeElements) {
  return transitionElements.map((value) => {
    
    const scxmlEvent = getStringAttribute(value, "event")
    let event
    if (scxmlEvent && scxmlEvent.startsWith("done.") && invokeElements.length) {
      const source = scxmlEvent.split(".")[1]
      const invoke = invokeElements.filter((i) => i.attributes.id === source || i.attributes.src === source)
      event = invoke.length ? `done.invoke.${source}` : scxmlEvent
    } else if (scxmlEvent && scxmlEvent.startsWith("error.") && invokeElements.length) {
      const source = scxmlEvent.split(".")[1]
      const invoke = invokeElements.filter((i) => i.attributes.id === source || i.attributes.src === source)
      event = invoke.length ? `error.platform.${source}` : scxmlEvent
    } else event = scxmlEvent

    const targets = getAttribute(value, "target")
    const internal = getAttribute(value, "type") === "internal"
    return {
      event,
      target: getTargets(targets),
      ...(value.elements ? executableContent(value.elements) : undefined),
      ...(value.attributes && value.attributes.cond ? { cond: createCond(`${value.attributes.cond}`) } : undefined),
      internal,
    }
  })
}
