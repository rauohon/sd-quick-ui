import { ref } from 'vue'

const STORAGE_KEY = 'sd-auto-correct-dimensions'

// Singleton state
const autoCorrectEnabled = ref(false)
let initialized = false

/**
 * Dimension validation composable
 * Handles 8-multiple validation and auto-correction preference
 */
export function useDimensionValidation() {
  // Initialize from localStorage (once)
  if (!initialized) {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') {
      autoCorrectEnabled.value = true
    } else if (saved === 'false') {
      autoCorrectEnabled.value = false
    }
    initialized = true
  }

  /**
   * Round value to nearest multiple of 8
   * @param {number} value - Value to correct
   * @returns {number} Corrected value
   */
  function correctTo8Multiple(value) {
    return Math.round(value / 8) * 8
  }

  /**
   * Check if value needs correction (not multiple of 8)
   * @param {number} value - Value to check
   * @returns {boolean} True if correction needed
   */
  function needsCorrection(value) {
    return value % 8 !== 0
  }

  /**
   * Save auto-correct preference to localStorage
   * @param {boolean} enabled - Whether auto-correct is enabled
   */
  function saveAutoCorrectSetting(enabled) {
    autoCorrectEnabled.value = enabled
    localStorage.setItem(STORAGE_KEY, String(enabled))
  }

  /**
   * Get current auto-correct preference (null if not set)
   * @returns {'true' | 'false' | null}
   */
  function getStoredPreference() {
    return localStorage.getItem(STORAGE_KEY)
  }

  /**
   * Validate dimension and return corrected value based on preference
   * @param {number} value - Value to validate
   * @param {Object} options - Options
   * @param {Function} options.showConfirm - Confirm dialog function
   * @param {Function} options.showToast - Toast function
   * @param {Function} options.t - i18n translation function
   * @param {string} options.type - 'width' or 'height' for message key
   * @returns {Promise<{value: number, corrected: boolean}>}
   */
  async function validateDimension(value, { showConfirm, showToast, t, type }) {
    const numValue = Number(value)

    if (!needsCorrection(numValue)) {
      return { value: numValue, corrected: false }
    }

    const correctedValue = correctTo8Multiple(numValue)
    const preference = getStoredPreference()

    // No preference set - ask user
    if (preference === null && showConfirm) {
      const messageKey = `dimensionValidation.${type}Message`
      const result = await showConfirm({
        title: t('dimensionValidation.title'),
        message: t(messageKey, { original: numValue, corrected: correctedValue }),
        confirmText: t('dimensionValidation.applyCorrection'),
        cancelText: t('dimensionValidation.keepOriginal'),
        showDontAskAgain: true,
        dontAskAgainText: t('common.dontAskAgain')
      })

      if (result.dontAskAgain) {
        saveAutoCorrectSetting(result.confirmed)
        showToast?.(t('dimensionValidation.settingsHint'), 'info')
      }

      return {
        value: result.confirmed ? correctedValue : numValue,
        corrected: result.confirmed
      }
    }

    // Use stored preference
    if (autoCorrectEnabled.value) {
      return { value: correctedValue, corrected: true }
    }

    return { value: numValue, corrected: false }
  }

  return {
    // State
    autoCorrectEnabled,

    // Utilities
    correctTo8Multiple,
    needsCorrection,

    // Preference management
    saveAutoCorrectSetting,
    getStoredPreference,

    // Main validation function
    validateDimension
  }
}
