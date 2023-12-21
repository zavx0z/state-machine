/** Array flattening.
 * @template T - The type of the array elements.
 * @param {Array<T | T[]>} array - The array to flatten.
 * @returns {T[]} - The flattened array.
 */
export const flatten = (array) => Array.prototype.concat.apply([], array)

/** Generates a UUID v4 string. 
 * @returns {string} - The UUID v4 string.
*/
export const uuidv4 = () =>
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (parseInt(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (parseInt(c) / 4)))).toString(16)
  )
