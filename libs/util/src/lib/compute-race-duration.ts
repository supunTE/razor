import { AVERAGE_WPM } from '@razor/constants';

/** Compute the time it would take for an average person to type given race text.
 *
 * @param {string} text - Race text.
 * @returns {number} - Maximum allowed duration in seconds.
 */
export const computeRaceDuration = (text: string): number => {
  /** Average word count
   *
   * Assuming that the average word has 5 letters.
   */
  const wordCount = text.length / 5;

  const averageTime = Math.ceil((wordCount / AVERAGE_WPM) * 60);

  const maxmiumAllowedTime = Math.ceil(averageTime * 1.5);

  return maxmiumAllowedTime;
};
