import { ref, watch, nextTick } from 'vue'

/**
 * Aspect Ratio 관리 composable
 * 종횡비 프리셋 적용 및 자동 조정 기능 제공
 *
 * @param {Ref<number>} width - 너비 ref
 * @param {Ref<number>} height - 높이 ref
 * @param {Array} ASPECT_RATIOS - 종횡비 프리셋 배열
 * @returns {Object} Aspect ratio 관련 상태와 함수들
 */
export function useAspectRatio(width, height, ASPECT_RATIOS) {
  // State
  const selectedAspectRatioIndex = ref('')
  const lastEditedDimension = ref(null)
  const isAdjustingDimensions = ref(false)

  /**
   * 종횡비 프리셋 적용
   * @param {string|number} index - 종횡비 프리셋 인덱스
   */
  function applyAspectRatio(index) {
    if (!index) return // If "Custom" selected, do nothing

    const ratioPreset = ASPECT_RATIOS[index]
    const [w, h] = ratioPreset.ratio

    // Use current width as base and calculate height based on ratio
    const currentWidth = width.value
    let calcHeight = Math.round((currentWidth * h) / w)

    // Round to nearest 64 (SD requirement)
    calcHeight = Math.round(calcHeight / 64) * 64

    isAdjustingDimensions.value = true
    lastEditedDimension.value = null // Reset tracking when applying preset
    height.value = calcHeight
    isAdjustingDimensions.value = false
  }

  /**
   * 너비와 높이 교환 (회전)
   */
  function swapDimensions() {
    isAdjustingDimensions.value = true
    lastEditedDimension.value = null // Reset tracking when swapping

    const temp = width.value
    width.value = height.value
    height.value = temp

    // Try to find matching swapped ratio
    if (selectedAspectRatioIndex.value) {
      const currentRatio = ASPECT_RATIOS[selectedAspectRatioIndex.value]
      const [w, h] = currentRatio.ratio

      // Look for the swapped ratio
      const swappedIndex = ASPECT_RATIOS.findIndex(preset => {
        const [pw, ph] = preset.ratio
        return pw === h && ph === w
      })

      selectedAspectRatioIndex.value = swappedIndex >= 0 ? swappedIndex.toString() : ''
    }

    // Use nextTick to ensure flag is released after all watchers have been processed
    nextTick(() => {
      isAdjustingDimensions.value = false
    })
  }

  // Auto-adjust height when width changes (if ratio is selected)
  watch(width, (newWidth) => {
    // Skip if we're programmatically adjusting, or if height was the last edited field
    if (isAdjustingDimensions.value) return
    if (lastEditedDimension.value === 'height') {
      lastEditedDimension.value = null // Reset after skipping once
      return
    }
    if (!selectedAspectRatioIndex.value) return

    const ratioPreset = ASPECT_RATIOS[selectedAspectRatioIndex.value]
    if (!ratioPreset) return

    // Mark that width was edited, so we adjust height
    lastEditedDimension.value = 'width'

    const [w, h] = ratioPreset.ratio
    let calcHeight = Math.round((newWidth * h) / w)
    calcHeight = Math.round(calcHeight / 8) * 8

    isAdjustingDimensions.value = true
    height.value = calcHeight
    isAdjustingDimensions.value = false
  }, { flush: 'post' }) // Execute after all synchronous updates

  // Auto-adjust width when height changes (if ratio is selected)
  watch(height, (newHeight) => {
    // Skip if we're programmatically adjusting, or if width was the last edited field
    if (isAdjustingDimensions.value) return
    if (lastEditedDimension.value === 'width') {
      lastEditedDimension.value = null // Reset after skipping once
      return
    }
    if (!selectedAspectRatioIndex.value) return

    const ratioPreset = ASPECT_RATIOS[selectedAspectRatioIndex.value]
    if (!ratioPreset) return

    // Mark that height was edited, so we adjust width
    lastEditedDimension.value = 'height'

    const [w, h] = ratioPreset.ratio
    let calcWidth = Math.round((newHeight * w) / h)
    calcWidth = Math.round(calcWidth / 8) * 8

    isAdjustingDimensions.value = true
    width.value = calcWidth
    isAdjustingDimensions.value = false
  }, { flush: 'post' }) // Execute after all synchronous updates

  return {
    // State
    selectedAspectRatioIndex,
    lastEditedDimension,
    isAdjustingDimensions,

    // Functions
    applyAspectRatio,
    swapDimensions
  }
}
