import { toMachine } from "../scxml/scxml.js"
/**
 * Fetches a machine definition from a URL, converts it to a machine instance,
 * sets the predictableActionArguments option, and returns the machine instance.
 *
 * @param {string} url - The URL to fetch the machine definition from.
 * @returns {Promise<{machine: import("https://cdn.jsdelivr.net/npm/@metafor/machine@0.0.9/+esm").AnyStateMachine, channel: BroadcastChannel}>} A promise that resolves to the created machine instance.
 */
export async function fetchMachine(url) {
  const response = await fetch(url)
  const text = await response.text()
  const channel = new BroadcastChannel(url)
  const machine = toMachine(text, { channel })
  machine["predictableActionArguments"] = true // TODO: predictableActionArguments set default true
  return { machine, channel }
}
