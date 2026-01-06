/**
 * useParamValidation - Debounced parameter validation with toast notification
 *
 * Validates numeric parameters after 300ms debounce and shows correction toast
 */

import { watch } from 'vue'
import { validateNumber } from '../utils/paramValidation'
import { PARAM_RANGES } from '../config/constants'

/**
 * Create debounced validation watchers for generation parameters
 * @param {Object} options - Configuration
 * @param {Object} options.refs - Object containing reactive refs to watch
 * @param {Function} options.showToast - Toast notification function
 * @param {Function} options.t - i18n translation function
 * @param {number} options.debounce - Debounce time in ms (default: 300)
 */
export function useParamValidation({ refs, showToast, t, debounce = 300 }) {
  // Parameter definitions with their display names and ranges
  const paramConfigs = {
    steps: { label: 'Steps', min: 1, max: 150, default: 20 },
    cfgScale: { label: 'CFG Scale', min: 1, max: 30, default: 7 },
    width: { label: 'Width', min: 64, max: 2048, default: 512, step: 8 },
    height: { label: 'Height', min: 64, max: 2048, default: 512, step: 8 },
    batchCount: { label: 'Batch Count', min: 1, max: 100, default: 1 },
    batchSize: { label: 'Batch Size', min: 1, max: 8, default: 1 },
    hrSteps: { label: 'Hires Steps', min: 0, max: 150, default: 10 },
    denoisingStrength: { label: 'Denoising', min: 0, max: 1, default: 0.7 },
    hrUpscale: { label: 'Upscale', min: 1, max: 4, default: 2 },
    maskBlur: { label: 'Mask Blur', min: 0, max: 64, default: 4 }
  }

  // Debounce timers
  const timers = {}

  // Create watcher for each provided ref
  Object.entries(refs).forEach(([paramName, paramRef]) => {
    const config = paramConfigs[paramName]
    if (!config || !paramRef) return

    watch(paramRef, (newValue) => {
      // Clear existing timer
      if (timers[paramName]) {
        clearTimeout(timers[paramName])
      }

      // Set new debounced validation
      timers[paramName] = setTimeout(() => {
        const num = Number(newValue)
        if (isNaN(num)) return

        // Check if value is out of range
        if (num < config.min || num > config.max) {
          const validated = validateNumber(newValue, config.min, config.max, config.default, config.step)

          // Update the ref
          paramRef.value = validated

          // Show toast
          showToast?.(
            t('validation.paramCorrected', {
              param: config.label,
              from: num,
              to: validated,
              min: config.min,
              max: config.max
            }),
            'warning'
          )
        }
      }, debounce)
    })
  })

  // Cleanup function
  function cleanup() {
    Object.values(timers).forEach(timer => clearTimeout(timer))
  }

  return { cleanup }
}
