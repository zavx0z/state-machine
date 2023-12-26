import { createCond } from "./cond.js"
import { evaluateExecutableContent } from "./utils.js"
import { actions } from "https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.9/+esm"

/** Maps an array of XMLElements to an array of ActionObjects.
 * @param {import("./types").XMLElement[]} elements - The array of XMLElements to map.
 * @returns {import("./types").ActionObject[]} - The array of mapped ActionObjects.
 */
export function mapActions(elements) {
  const mapped = []
  for (const element of elements) {
    if (element.type === "comment") continue
    mapped.push(mapAction(element))
  }
  return mapped
}
/** Maps an XML element to an action object.
 * @param {import("./types").XMLElement} element - The XML element to map.
 * @returns {import("./types").ActionObject} The action object that corresponds to the XML element.
 */
export function mapAction(element) {
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
/**
 * Converts a delay value in the form of a string or number to milliseconds.
 * If the delay is a string, it can be in the format of milliseconds (e.g., "100ms")
 * or seconds (e.g., "1.5s"). If the delay is a number, it is assumed to be in milliseconds.
 * If the delay is undefined or an invalid string format, the function returns undefined.
 * @param {string|number} [delay] - The delay value to convert to milliseconds.
 * @returns {number|undefined} The delay in milliseconds or undefined if the input is invalid.
 * @throws {Error} Throws an error if the delay string is in an invalid format.
 */
export function delayToMs(delay) {
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
