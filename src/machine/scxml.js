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
import { mapValues } from "./utils.js"
/** Retrieves the value of the specified attribute from the given XML element.
 * @param {XMLElement} element - The XML element from which to retrieve the attribute.
 * @param {string} attribute - The name of the attribute to retrieve.
 * @returns {(string | number | undefined)} - The value of the attribute, or undefined if not found.
 */
function getAttribute(element, attribute) {
  return element.attributes ? element.attributes[attribute] : undefined
}
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
/** Constructs a transition object with executable actions based on provided XML elements.
 * @param {XMLElement[]} elements - An array of XMLElements representing the executable content.
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
/**
 * Converts a delay value in the form of a string or number to milliseconds.
 * If the delay is a string, it can be in the format of milliseconds (e.g., "100ms")
 * or seconds (e.g., "1.5s"). If the delay is a number, it is assumed to be in milliseconds.
 * If the delay is undefined or an invalid string format, the function returns undefined.
 * @param {string|number} [delay] - The delay value to convert to milliseconds.
 * @returns {number|undefined} The delay in milliseconds or undefined if the input is invalid.
 * @throws {Error} Throws an error if the delay string is in an invalid format.
 */
function delayToMs(delay) {
  if (!delay) return undefined
  if (typeof delay === "number") return delay
  const millisecondsMatch = delay.match(/(\d+)ms/)
  if (millisecondsMatch) return parseInt(millisecondsMatch[1], 10)
  const secondsMatch = delay.match(/(\d*)(\.?)(\d+)s/)
  if (secondsMatch) {
    const hasDecimal = !!secondsMatch[2]
    if (!hasDecimal) return parseInt(secondsMatch[3], 10) * 1000
    const secondsPart = !!secondsMatch[1] ? parseInt(secondsMatch[1], 10) * 1000 : 0
    const millisecondsPart = parseInt(secondsMatch[3].padEnd(3, "0"), 10)
    if (millisecondsPart >= 1000) throw new Error(`Can't parse "${delay}" delay.`)
    return secondsPart + millisecondsPart
  }
  throw new Error(`Can't parse "${delay}" delay.`)
}
/** Evaluates a string of executable content within the context of a state machine's current context and event.
 * @param {object} context - The current state context of the state machine.
 * @param {EventObject} _ev - The event object that triggered the transition.
 * @param {SCXMLEventMeta} meta - Metadata associated with the event.
 * @param {string} body - The string of executable content to be evaluated.
 * @returns {*} The result of the evaluated script.
 */
const evaluateExecutableContent = (context, _ev, meta, body) => {
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
/** Creates a condition function that evaluates a given condition expression within the context of a state machine's current context and event.
 * @param {string} cond - The condition expression to be evaluated.
 * @returns {Function} A function that takes the context, event, and metadata and returns the result of the condition evaluation.
 */
const createCond = (cond) => (context, _event, meta) =>
  evaluateExecutableContent(context, _event, meta, `return ${cond}`)
/** Maps an XML element to an action object.
 * @param {XMLElement} element - The XML element to map.
 * @returns {ActionObject} The action object that corresponds to the XML element.
 */
function mapAction(element) {
  switch (element.name) {
    case "raise": {
      return actions.raise(element.attributes.event)
    }
    case "assign": {
      return actions.assign((context, e, meta) => {
        const fnBody = `
            return {'${element.attributes.location}': ${element.attributes.expr}}
          `
        return evaluateExecutableContent(context, e, meta, fnBody)
      })
    }
    case "send": {
      const { event, eventexpr, target } = element.attributes
      let convertedEvent
      let convertedDelay
      const params =
        element.elements &&
        element.elements.reduce((acc, child) => {
          if (child.name === "content") {
            throw new Error("Conversion of <content/> inside <send/> not implemented.")
          }
          return `${acc}${child.attributes.name}:${child.attributes.expr},\n`
        }, "")

      if (event && !params) {
        convertedEvent = event
      } else {
        convertedEvent = (context, _ev, meta) => {
          const fnBody = `
              return { type: ${event ? `"${event}"` : eventexpr}, ${params ? params : ""} }
            `
          return evaluateExecutableContent(context, _ev, meta, fnBody)
        }
      }
      if ("delay" in element.attributes) {
        convertedDelay = delayToMs(element.attributes.delay)
      } else if (element.attributes.delayexpr) {
        convertedDelay = (context, _ev, meta) => {
          const fnBody = `
              return (${delayToMs})(${element.attributes.delayexpr})
            `
          return evaluateExecutableContent(context, _ev, meta, fnBody)
        }
      }
      return actions.sendTo(`${target}`, convertedEvent, { delay: convertedDelay })
    }
    case "log": {
      const label = element.attributes.label
      return actions.log(
        (context, e, meta) => {
          const fnBody = `
              return ${element.attributes.expr}
            `
          return evaluateExecutableContent(context, e, meta, fnBody)
        },
        label !== undefined ? String(label) : undefined
      )
    }
    case "if": {
      // /**@type {ChooseCondition[]} */
      const conds = []
      let current = {
        cond: createCond(`${element.attributes.cond}`),
        actions: [],
      }
      for (const el of element.elements) {
        if (el.type === "comment") continue
        switch (el.name) {
          case "elseif":
            conds.push(current)
            current = {
              cond: createCond(`${el.attributes.cond}`),
              actions: [],
            }
            break
          case "else":
            conds.push(current)
            //@ts-ignore
            current = { actions: [] }
            break
          default:
            current.actions.push(mapAction(el))
            break
        }
      }
      conds.push(current)
      //@ts-ignore
      return actions.choose(conds)
    }
    case "script": {
      const { src } = element.attributes
      if (src) return actions.toActionObject(`${src}`)
      else throw new Error(`Action script element is not implemented attribute src.`)
    }
    default:
      throw new Error(`Conversion of "${element.name}" elements is not implemented yet.`)
  }
}
/** Maps an array of XMLElements to an array of ActionObjects.
 * @param {XMLElement[]} elements - The array of XMLElements to map.
 * @returns {ActionObject[]} - The array of mapped ActionObjects.
 */
function mapActions(elements) {
  const mapped = []
  for (const element of elements) {
    if (element.type === "comment") continue
    mapped.push(mapAction(element))
  }
  return mapped
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
    const on = transitionElements.map((value) => {
      const event = getAttribute(value, "event") || ""
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
    const onEntry = onEntryElement ? mapActions(onEntryElement.elements) : undefined
    const onExit = onExitElement ? mapActions(onExitElement.elements) : undefined
    const invoke = invokeElements.map((element) => {
      if (!["scxml", "http://www.w3.org/TR/scxml/"].includes(`${element.attributes.type}`)) {
        return { src: element.attributes.src }
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
