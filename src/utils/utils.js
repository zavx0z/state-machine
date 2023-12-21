/** Выравнивание массива.
 * @template T
 * @param {Array<T | T[]>} array - Массив с элементами или с вложенными массивами.
 * @returns {T[]} - Одноуровневый массив.
 */
export const flatten = (array) => Array.prototype.concat.apply([], array)

/**
 * Generates a UUID v4 string.
 */
export function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    //@ts-ignore
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
}
