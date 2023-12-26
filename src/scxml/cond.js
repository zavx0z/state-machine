import { evaluateExecutableContent } from "./utils.js";

/** Creates a condition function that evaluates a given condition expression within the context of a state machine's current context and event.
 * @param {string} cond - The condition expression to be evaluated.
 * @returns {Function} A function that takes the context, event, and metadata and returns the result of the condition evaluation.
 */
export const createCond = (cond) => (context, _event, meta) => evaluateExecutableContent(context, _event, meta, `return ${cond}`)