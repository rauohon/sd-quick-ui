/**
 * Global Error Handler Composable
 * Centralizes error handling with consistent logging and toast notifications
 */

// Error categories for different handling strategies
export const ErrorCategory = {
  NETWORK: 'network',      // API/fetch errors
  STORAGE: 'storage',      // IndexedDB/localStorage errors
  VALIDATION: 'validation', // Input validation errors
  GENERATION: 'generation', // Image generation errors
  FILE: 'file',            // File operation errors
  GENERAL: 'general'       // Other errors
}

// Default error messages by category (fallback when i18n key is missing)
const defaultMessages = {
  [ErrorCategory.NETWORK]: 'Network error occurred',
  [ErrorCategory.STORAGE]: 'Storage operation failed',
  [ErrorCategory.VALIDATION]: 'Validation error',
  [ErrorCategory.GENERATION]: 'Image generation failed',
  [ErrorCategory.FILE]: 'File operation failed',
  [ErrorCategory.GENERAL]: 'An error occurred'
}

/**
 * Create error handler with toast and i18n support
 * @param {Object} options
 * @param {Function} options.showToast - Toast notification function
 * @param {Function} options.t - i18n translation function
 * @returns {Object} Error handler methods
 */
export function useErrorHandler(options = {}) {
  const { showToast, t } = options

  /**
   * Handle error with logging and optional toast notification
   * @param {Error|string} error - The error object or message
   * @param {Object} config - Error handling configuration
   * @param {string} config.category - Error category (from ErrorCategory)
   * @param {string} config.context - Context description for logging
   * @param {string} config.i18nKey - i18n key for toast message
   * @param {Object} config.i18nParams - Parameters for i18n message
   * @param {string} config.fallbackMessage - Fallback message if i18n fails
   * @param {boolean} config.silent - If true, don't show toast (default: false)
   * @param {string} config.toastType - Toast type: 'error' | 'warning' (default: 'error')
   */
  function handleError(error, config = {}) {
    const {
      category = ErrorCategory.GENERAL,
      context = '',
      i18nKey = '',
      i18nParams = {},
      fallbackMessage = '',
      silent = false,
      toastType = 'error'
    } = config

    // Extract error message
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Log to console with context
    const logPrefix = context ? `[${context}]` : `[${category}]`
    console.error(`${logPrefix} ${errorMessage}`, error instanceof Error ? error : '')

    // Show toast notification unless silent
    if (!silent && showToast) {
      let message = fallbackMessage || defaultMessages[category] || defaultMessages[ErrorCategory.GENERAL]

      // Try to get i18n message
      if (i18nKey && t) {
        try {
          message = t(i18nKey, i18nParams)
        } catch {
          // Use fallback message if i18n fails
        }
      }

      showToast(message, toastType)
    }

    return {
      error,
      message: errorMessage,
      category,
      context
    }
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {Object} config - Error handling configuration
   * @returns {Function} Wrapped function
   */
  function withErrorHandling(fn, config = {}) {
    return async (...args) => {
      try {
        return await fn(...args)
      } catch (error) {
        handleError(error, config)
        return null
      }
    }
  }

  /**
   * Create category-specific error handlers
   */
  const handlers = {
    // Network/API errors
    network: (error, config = {}) => handleError(error, {
      category: ErrorCategory.NETWORK,
      fallbackMessage: 'API 연결 실패',
      ...config
    }),

    // Storage errors (IndexedDB, localStorage)
    storage: (error, config = {}) => handleError(error, {
      category: ErrorCategory.STORAGE,
      fallbackMessage: '저장 작업 실패',
      ...config
    }),

    // Validation errors
    validation: (error, config = {}) => handleError(error, {
      category: ErrorCategory.VALIDATION,
      toastType: 'warning',
      ...config
    }),

    // Image generation errors
    generation: (error, config = {}) => handleError(error, {
      category: ErrorCategory.GENERATION,
      fallbackMessage: '이미지 생성 실패',
      ...config
    }),

    // File operation errors
    file: (error, config = {}) => handleError(error, {
      category: ErrorCategory.FILE,
      fallbackMessage: '파일 작업 실패',
      ...config
    }),

    // General errors
    general: (error, config = {}) => handleError(error, {
      category: ErrorCategory.GENERAL,
      ...config
    })
  }

  return {
    handleError,
    withErrorHandling,
    ...handlers,
    ErrorCategory
  }
}

/**
 * Simple error handler without dependencies (for use in composables)
 * Only logs to console, no toast
 */
export function logError(error, context = '') {
  const message = error instanceof Error ? error.message : String(error)
  const prefix = context ? `[${context}]` : '[Error]'
  console.error(`${prefix} ${message}`, error instanceof Error ? error : '')
}
