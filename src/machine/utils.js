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
