/**
 * @typedef {import("https://cdn.jsdelivr.net/npm/xml-js@1.6.11/+esm").Element} XMLElement
 * @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.9/+esm").EventObject} EventObject
 * @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.9/+esm").ActionObject} ActionObject
 * @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.9/+esm").SCXMLEventMeta} SCXMLEventMeta
 * @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.9/+esm").ChooseCondition} ChooseCondition
 * @typedef {import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.9/+esm").AnyStateMachine} AnyStateMachine

 * @typedef {Object} ScxmlToMachineOptions
 * @property {string} [ delimiter]
 */
import { xml2js } from "https://cdn.jsdelivr.net/npm/xml-js@1.6.11/+esm"
import { createMachine, actions } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.9/+esm"
import { mapValues, getStringAttribute, getAttribute, evaluateExecutableContent } from "./utils.js"
import { createTransition } from "./transition.js"
import { mapActions } from "./action.js"
/** Converts an array of items into a record object using the specified identifier.
 * @template T
 * @param {T[]} items - The array of items to be indexed.
 * @param {(string | ((item: T) => string))} identifier - The identifier key or a function that returns a string key for an item.
 * @returns {Record<string, T>} - The indexed record object.
 */
function indexedRecord(items, identifier) {
  /** @type {Record<string, T>} */
  const record = {}
  const identifierFn = typeof identifier === "string" ? (item) => item[identifier] : identifier
  items.forEach((item) => {
    const key = identifierFn(item)
    record[key] = item
  })
  return record
}
/** Converts an SCXML node to a machine configuration object.
 * @param {XMLElement} nodeJson - The SCXML node to convert.
 * @param {string} id - The ID of the node.
 * @param {ScxmlToMachineOptions} options - The options for the conversion.
 * @returns {Object} The machine configuration object.
 */
function toConfig(nodeJson, id, options) {
  const parallel = nodeJson.name === "parallel"
  let initial = parallel ? undefined : nodeJson.attributes.initial
  const { elements } = nodeJson
  switch (nodeJson.name) {
    case "history": {
      if (!elements) {
        return {
          id,
          history: nodeJson.attributes.type || "shallow",
        }
      }
      const [transitionElement] = elements.filter((element) => element.name === "transition")
      const target = getAttribute(transitionElement, "target")
      const history = getAttribute(nodeJson, "type") || "shallow"
      return {
        id,
        history,
        target: target ? `#${target}` : undefined,
      }
    }
    case "final": {
      return {
        ...nodeJson.attributes,
        type: "final",
      }
    }
    default:
      break
  }
  if (nodeJson.elements) {
    const stateElements = nodeJson.elements.filter(
      (element) =>
        element.name === "state" ||
        element.name === "parallel" ||
        element.name === "final" ||
        element.name === "history"
    )
    const transitionElements = nodeJson.elements.filter((element) => element.name === "transition")
    const invokeElements = nodeJson.elements.filter((element) => element.name === "invoke")
    const onEntryElement = nodeJson.elements.find((element) => element.name === "onentry")
    const onExitElement = nodeJson.elements.find((element) => element.name === "onexit")
    /**@type {Record<string, any>} */
    const states = indexedRecord(stateElements, (item) => `${item.attributes.id}`)
    const initialElement = !initial ? nodeJson.elements.find((element) => element.name === "initial") : undefined
    if (initialElement && initialElement.elements.length)
      initial = initialElement.elements.find((element) => element.name === "transition").attributes.target
    else if (!initialElement && stateElements.length) initial = stateElements[0].attributes.id
    const on = createTransition(transitionElements, invokeElements)
    const onEntry = onEntryElement ? mapActions(onEntryElement.elements) : undefined
    const onExit = onExitElement ? mapActions(onExitElement.elements) : undefined
    const invoke = invokeElements.map((element) => {
      if (!["scxml", "http://www.w3.org/TR/scxml/"].includes(`${element.attributes.type}`)) {
        const { src, id } = element.attributes
        return {
          id: id ? id : src,
          src,
        }
        // throw new Error("Currently only converting invoke elements of type SCXML is supported.")
      }
      const content = element.elements.find((el) => el.name === "content")
      return scxmlToMachine(content, options)
    })
    return {
      id,
      ...(initial ? { initial } : undefined),
      ...(parallel ? { type: "parallel" } : undefined),
      ...(stateElements.length
        ? { states: mapValues(states, (state, key) => toConfig(state, key, options)) }
        : undefined),
      ...(transitionElements.length ? { on } : undefined),
      ...(onEntry ? { onEntry } : undefined),
      ...(onExit ? { onExit } : undefined),
      ...(invoke.length ? { invoke } : undefined),
    }
  }
  return { id }
}
/** Converts an SCXML JSON representation to a state machine configuration.
 * @param {XMLElement} scxmlJson - The SCXML JSON representation.
 * @param {ScxmlToMachineOptions} options - Options for the conversion.
 * @returns {AnyStateMachine} The state machine instance.
 */
function scxmlToMachine(scxmlJson, options) {
  const machineElement = scxmlJson.elements.find((element) => element.name === "scxml")
  const dataModelEl = machineElement.elements.filter((element) => element.name === "datamodel")[0]
  const extState = dataModelEl
    ? dataModelEl.elements
        .filter((element) => element.name === "data")
        .reduce((acc, element) => {
          if (element.attributes.src) {
            throw new Error("Conversion of `src` attribute on datamodel's <data> elements is not supported.")
          }
          acc[element.attributes.id] = element.attributes.expr ? eval(`(${element.attributes.expr})`) : undefined
          return acc
        }, {})
    : undefined
  const nameMachine = String(machineElement.attributes.name || "[machine]")
  return createMachine({
    ...toConfig(machineElement, nameMachine, options),
    context: extState,
    delimiter: options.delimiter,
    predictableActionArguments: true,
  })
}
/** Converts an SCXML XML string to a state machine configuration.
 * @param {string} xml - The SCXML XML string.
 * @param {ScxmlToMachineOptions} options - Options for the conversion.
 * @returns {AnyStateMachine} The state machine instance.
 */
export function toMachine(xml, options) {
  const /**@type {*} XMLElement*/ json = xml2js(xml)
  return scxmlToMachine(json, options)
}
