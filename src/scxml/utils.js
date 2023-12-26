/**
 * Maps each value of the object to a new value using a transformation function.
 * @param {Record<string, unknown>} collection - The object to iterate over.
 * @param {function(unknown, string, Record<string, unknown>, number): unknown} iteratee - The function invoked per iteration.
 * @returns {Record<string, unknown>} The new mapped object.
 */
export function mapValues(collection, iteratee) {
  /**@type {Record<string, unknown>} */
  const result = {}
  const collectionKeys = Object.keys(collection)
  for (let i = 0; i < collectionKeys.length; i++) {
    const key = collectionKeys[i]
    result[key] = iteratee(collection[key], key, collection, i)
  }
  return result
}
/** Retrieves the value of the specified attribute from the given XML element.
 * @param {import("./types").XMLElement} element - The XML element from which to retrieve the attribute.
 * @param {string} attribute - The name of the attribute to retrieve.
 * @returns {(string | number | undefined)} - The value of the attribute, or undefined if not found.
 */
export function getAttribute(element, attribute) {
  return element.attributes ? element.attributes[attribute] : undefined
}
/** Retrieves the string value of the specified attribute from the given element.
 * @param {object} element - The element to get the attribute value from.
 * @param {string} attribute - The name of the attribute to retrieve.
 * @returns {string} The string value of the attribute, or an empty string if not found.
 */
export function getStringAttribute(element, attribute) {
  return element.attributes ? `${element.attributes[attribute]}` : ""
}
/** Evaluates a string of executable content within the context of a state machine's current context and event.
 * @param {object} context - The current state context of the state machine.
 * @param {import("./types").EventObject} _ev - The event object that triggered the transition.
 * @param {import("./types").SCXMLEventMeta} meta - Metadata associated with the event.
 * @param {string} body - The string of executable content to be evaluated.
 * @returns {*} The result of the evaluated script.
 */
export const evaluateExecutableContent = (context, _ev, meta, body) => {
  const datamodel = context
    ? Object.keys(context)
        .map((key) => `const ${key} = context['${key}']`)
        .join("\n")
    : ""
  const scope = ['const _sessionid = "NOT_IMPLEMENTED"', datamodel].filter(Boolean).join("\n")
  const args = ["context", "_event"]
  const fnBody = `
    ${scope}
    ${body}
  `
  const fn = new Function(...args, fnBody)
  return fn(context, meta._event)
}
