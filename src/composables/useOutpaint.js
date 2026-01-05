import { ref, computed } from 'vue'
import { useDimensionValidation } from './useDimensionValidation'

/**
 * Outpaint 확장 관리 composable
 * 캔버스 확장 상태와 확장 이미지 생성 로직 관리
 *
 * @param {Object} imageRefs - { initImage, initImageWidth, initImageHeight }
 * @param {Object} callbacks - { showToast }
 * @param {Function} t - i18n 번역 함수
 * @returns {Object} Outpaint 관련 상태와 함수들
 */
export function useOutpaint(imageRefs, callbacks, t) {
  const { initImage, initImageWidth, initImageHeight } = imageRefs
  const { showToast } = callbacks
  const { correctTo8Multiple } = useDimensionValidation()

  // 확장 상태
  const expandTop = ref(0)
  const expandBottom = ref(0)
  const expandLeft = ref(0)
  const expandRight = ref(0)
  const isExpanded = ref(false)
  const expandFillMode = ref('fill') // 'fill' | 'noise'
  const expandFillColor = ref('#000000')

  // 상수
  const EXPAND_PRESETS = [64, 128, 256, 512]
  const EXPAND_FILL_COLORS = ['#000000', '#808080', '#ffffff']

  // Computed
  const totalExpansion = computed(() => ({
    width: expandLeft.value + expandRight.value,
    height: expandTop.value + expandBottom.value
  }))

  const expandedSize = computed(() => ({
    width: initImageWidth.value + totalExpansion.value.width,
    height: initImageHeight.value + totalExpansion.value.height
  }))

  const hasExpansion = computed(() =>
    expandTop.value > 0 || expandBottom.value > 0 ||
    expandLeft.value > 0 || expandRight.value > 0
  )

  // 프리셋 값을 모든 방향에 적용
  function applyPresetToAll(value) {
    expandTop.value = value
    expandBottom.value = value
    expandLeft.value = value
    expandRight.value = value
  }

  // 확장 적용
  function applyExpansion(autoCorrectEnabled = false) {
    if (!hasExpansion.value) {
      showToast(t('inpaint.noExpansion'), 'warning')
      return
    }

    const newWidth = expandedSize.value.width
    const newHeight = expandedSize.value.height

    const needsWidthCorrection = newWidth % 8 !== 0
    const needsHeightCorrection = newHeight % 8 !== 0
    const needsCorrection = needsWidthCorrection || needsHeightCorrection

    if (needsCorrection && autoCorrectEnabled) {
      if (needsWidthCorrection) {
        const correctedWidth = correctTo8Multiple(newWidth)
        const diff = correctedWidth - newWidth
        expandRight.value = Math.max(0, expandRight.value + diff)
      }

      if (needsHeightCorrection) {
        const correctedHeight = correctTo8Multiple(newHeight)
        const diff = correctedHeight - newHeight
        expandBottom.value = Math.max(0, expandBottom.value + diff)
      }

      isExpanded.value = true
      const finalWidth = initImageWidth.value + expandLeft.value + expandRight.value
      const finalHeight = initImageHeight.value + expandTop.value + expandBottom.value
      showToast(t('inpaint.expansionCorrected', { width: finalWidth, height: finalHeight }), 'info')
    } else if (needsCorrection) {
      isExpanded.value = true
      showToast(t('inpaint.expansionNot8Multiple', { size: `${newWidth}×${newHeight}` }), 'warning')
    } else {
      isExpanded.value = true
      showToast(t('inpaint.expansionApplied'), 'success')
    }
  }

  // 확장 리셋 (토스트 표시)
  function resetExpansion() {
    resetExpansionState()
    showToast(t('inpaint.expansionReset'), 'info')
  }

  // 확장 상태만 초기화 (내부용)
  function resetExpansionState() {
    expandTop.value = 0
    expandBottom.value = 0
    expandLeft.value = 0
    expandRight.value = 0
    isExpanded.value = false
  }

  // 확장된 이미지 생성 (API 전송용)
  function generateExpandedImage() {
    return new Promise((resolve, reject) => {
      if (!initImage.value || !isExpanded.value) {
        resolve(initImage.value)
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const newWidth = expandedSize.value.width
        const newHeight = expandedSize.value.height

        canvas.width = newWidth
        canvas.height = newHeight

        // 확장 영역 채우기
        if (expandFillMode.value === 'fill') {
          ctx.fillStyle = expandFillColor.value
          ctx.fillRect(0, 0, newWidth, newHeight)
        } else if (expandFillMode.value === 'noise') {
          const imageData = ctx.createImageData(newWidth, newHeight)
          const data = imageData.data
          for (let i = 0; i < data.length; i += 4) {
            const noise = Math.floor(Math.random() * 256)
            data[i] = noise
            data[i + 1] = noise
            data[i + 2] = noise
            data[i + 3] = 255
          }
          ctx.putImageData(imageData, 0, 0)
        }

        // 원본 이미지를 올바른 위치에 배치
        ctx.drawImage(img, expandLeft.value, expandTop.value)

        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => {
        reject(new Error('Failed to load image for expansion'))
      }
      img.src = initImage.value
    })
  }

  return {
    // 상태
    expandTop,
    expandBottom,
    expandLeft,
    expandRight,
    isExpanded,
    expandFillMode,
    expandFillColor,

    // 상수
    EXPAND_PRESETS,
    EXPAND_FILL_COLORS,

    // Computed
    totalExpansion,
    expandedSize,
    hasExpansion,

    // 함수
    applyPresetToAll,
    applyExpansion,
    resetExpansion,
    resetExpansionState,
    generateExpandedImage
  }
}
