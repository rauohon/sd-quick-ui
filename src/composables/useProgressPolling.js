/**
 * Progress polling composable
 * Centralized progress polling logic for all generation types
 */

import { ref } from 'vue'
import { get } from '../api/client'
import { PROGRESS_POLL_INTERVAL, MAX_IDLE_COUNT } from '../config/constants'

/**
 * Create progress polling functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.t - i18n translation function
 * @param {Function} options.onError - Error handler callback (optional)
 * @returns {Object} Progress polling state and methods
 */
export function useProgressPolling({ t, onError }) {
  const progress = ref(0)
  const progressState = ref('')
  const currentImage = ref('')
  const progressInterval = ref(null)
  const finalImageReceived = ref(false)
  const pendingUsedParams = ref(null)
  const hasShownProgressImage = ref(false)
  const lastUsedParams = ref(null)

  let idleCount = 0

  /**
   * Start polling for generation progress
   */
  function startProgressPolling() {
    // CRITICAL: Prevent duplicate polling (race condition prevention)
    if (progressInterval.value) {
      return
    }

    // Clear any existing interval (safety measure)
    stopProgressPolling()
    idleCount = 0

    progressInterval.value = setInterval(async () => {
      try {
        const response = await get('/sdapi/v1/progress')
        if (response.ok) {
          const data = await response.json()
          const progressPercentage = data.progress * 100
          const hasActiveJob = data.state?.job_count > 0 || progressPercentage > 0

          // Check if idle (no progress and no jobs)
          if (!hasActiveJob && progressPercentage === 0) {
            idleCount++

            // Stop polling after idle for too long
            if (idleCount >= MAX_IDLE_COUNT) {
              stopProgressPolling()
              return
            }
          } else {
            // Reset idle counter if there's activity
            idleCount = 0
          }

          progress.value = progressPercentage

          // Update progress state text
          let stateText = ''

          // Use textinfo if available (most detailed)
          if (data.textinfo) {
            stateText = data.textinfo
          }
          // Use state information
          else if (data.state) {
            const state = data.state
            const parts = []

            // Job number (for batch)
            if (state.job_count > 1) {
              parts.push(t('generation.imageCount', { current: state.job_no, total: state.job_count }))
            }

            // Job description
            if (state.job) {
              parts.push(state.job)
            }

            // Sampling progress
            if (state.sampling_step !== undefined && state.sampling_steps > 0) {
              parts.push(t('generation.step', { current: state.sampling_step, total: state.sampling_steps }))
            }

            // ETA
            if (data.eta_relative > 0) {
              const eta = Math.ceil(data.eta_relative)
              parts.push(t('time.secondsRemaining', { eta }))
            }

            stateText = parts.join(' • ') || t('generation.processing')
          } else {
            stateText = t('generation.processing')
          }

          progressState.value = stateText

          // Don't overwrite with intermediate image if final image was already received
          if (data.current_image && !finalImageReceived.value) {
            currentImage.value = `data:image/png;base64,${data.current_image}`

            // Set lastUsedParams when first progress image appears (to show combination result)
            if (!hasShownProgressImage.value && pendingUsedParams.value) {
              lastUsedParams.value = pendingUsedParams.value
              hasShownProgressImage.value = true
            }
          }
        }
      } catch (error) {
        onError?.(error, { context: 'progressPolling', silent: true })
      }
    }, PROGRESS_POLL_INTERVAL)
  }

  /**
   * Stop polling for generation progress
   */
  function stopProgressPolling() {
    if (progressInterval.value) {
      clearInterval(progressInterval.value)
      progressInterval.value = null
    }
    idleCount = 0
  }

  /**
   * Reset all progress state
   */
  function resetProgress() {
    progress.value = 0
    progressState.value = ''
    currentImage.value = ''
    finalImageReceived.value = false
    hasShownProgressImage.value = false
    pendingUsedParams.value = null
  }

  /**
   * Set pending used params (for showing when progress image appears)
   */
  function setPendingUsedParams(params) {
    pendingUsedParams.value = params
    hasShownProgressImage.value = false
  }

  /**
   * Mark that final image has been received
   */
  function setFinalImageReceived(received = true) {
    finalImageReceived.value = received
  }

  /**
   * Check if polling is currently active
   */
  function isPolling() {
    return progressInterval.value !== null
  }

  return {
    // State
    progress,
    progressState,
    currentImage,
    lastUsedParams,
    finalImageReceived,

    // Methods
    startProgressPolling,
    stopProgressPolling,
    resetProgress,
    setPendingUsedParams,
    setFinalImageReceived,
    isPolling
  }
}
