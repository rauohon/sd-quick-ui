/**
 * Parameter validation utilities
 * Centralized validation helpers for generation parameters
 */

import { PARAM_RANGES } from '../config/constants'

/**
 * Validate and clamp a number within a specified range
 * @param {any} value - The value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default value if validation fails
 * @param {number|null} step - Optional step value for rounding
 * @returns {number} Validated and clamped number
 */
export function validateNumber(value, min, max, defaultValue, step = null) {
  let num = Number(value)

  // NaN check
  if (isNaN(num)) {
    return defaultValue
  }

  // Range check
  if (num < min) num = min
  if (num > max) num = max

  // Step check (for width, height, etc.)
  if (step && num % step !== 0) {
    num = Math.round(num / step) * step
  }

  return num
}

/**
 * Validate a parameter using predefined ranges from constants
 * @param {string} paramName - Name of the parameter (must exist in PARAM_RANGES)
 * @param {any} value - The value to validate
 * @returns {number} Validated value
 */
export function validateParam(paramName, value) {
  const range = PARAM_RANGES[paramName]
  if (!range) {
    console.warn(`Unknown parameter: ${paramName}`)
    return value
  }
  return validateNumber(value, range.min, range.max, range.default, range.step)
}

/**
 * Sleep utility function (reusable Promise for delays)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
