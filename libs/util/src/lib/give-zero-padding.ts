/** Give zero padding according to the size given.
 * (eg: if size is 3, 1 -> 001, 12 -> 012, 123 -> 123)
 *
 * @param {number} num - Number to be padded.
 * @param {number} size - Size of the padding.
 * @returns {string} - Padded number.
 */
export const giveZeroPadding = (num: string, size: number): string => {
  return `${num}`.padStart(size, '0');
};
