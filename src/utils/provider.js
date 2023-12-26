import { toMachine } from "../scxml/scxml.js"

/**
 * Fetches a machine definition from a URL, converts it to a machine instance,
 * sets the predictableActionArguments option, and returns the machine instance.
 *
 * @param {string} url - The URL to fetch the machine definition from.
 * @returns {Promise<import("../core/simulator.js").AnyStateMachine>} A promise that resolves to the created machine instance.
 */
export async function fetchMachine(url) {
  const response = await fetch(url)
  const text = await response.text()
  const machine = toMachine(text, {})
  machine["predictableActionArguments"] = true // TODO: predictableActionArguments set default true
  return machine
}
