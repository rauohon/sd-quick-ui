import { ref } from 'vue'

/**
 * 북마크/프리셋 매니저 핸들러 composable
 * 북마크/프리셋 모달 상태와 적용 함수들을 관리
 *
 * @param {Object} promptRefs - { prompt, negativePrompt } refs
 * @param {Object} paramRefs - 파라미터 refs 객체
 * @returns {Object} 북마크/프리셋 관련 상태와 함수들
 */
export function useBookmarkPresetHandlers(promptRefs, paramRefs) {
  const { prompt, negativePrompt } = promptRefs
  const {
    steps, cfgScale, samplerName, scheduler, width, height, seed,
    batchCount, batchSize, denoisingStrength, adetailers,
    // 선택적 파라미터 (Img2Img 전용)
    enableUpscale, upscaler, upscaleScale,
    // 선택적 파라미터 (Inpaint 전용)
    maskBlur
  } = paramRefs

  // 모달 상태
  const showBookmarkManager = ref(false)
  const showPresetManager = ref(false)

  /**
   * 북마크 매니저 열기
   */
  function openBookmarkManager() {
    showPresetManager.value = false
    showBookmarkManager.value = !showBookmarkManager.value
  }

  /**
   * 북마크 매니저 닫기
   */
  function closeBookmarkManager() {
    showBookmarkManager.value = false
  }

  /**
   * 프리셋 매니저 열기
   */
  function openPresetManager() {
    showBookmarkManager.value = false
    showPresetManager.value = !showPresetManager.value
  }

  /**
   * 프리셋 매니저 닫기
   */
  function closePresetManager() {
    showPresetManager.value = false
  }

  /**
   * 북마크 적용
   * @param {Object} bookmark - { prompt, negativePrompt, mode }
   */
  function applyBookmark({ prompt: newPrompt, negativePrompt: newNegativePrompt, mode }) {
    if (mode === 'replace') {
      prompt.value = newPrompt
      negativePrompt.value = newNegativePrompt
    } else if (mode === 'prepend') {
      prompt.value = newPrompt + (prompt.value ? ', ' + prompt.value : '')
      negativePrompt.value = newNegativePrompt + (negativePrompt.value ? ', ' + negativePrompt.value : '')
    } else if (mode === 'append') {
      prompt.value = prompt.value + (prompt.value ? ', ' : '') + newPrompt
      negativePrompt.value = negativePrompt.value + (negativePrompt.value ? ', ' : '') + newNegativePrompt
    }
  }

  /**
   * 프리셋 적용
   * @param {Object} params - 프리셋 파라미터 객체
   */
  function applyPreset(params) {
    // 기본 파라미터
    if (steps && params.steps !== undefined) steps.value = params.steps
    if (cfgScale && params.cfgScale !== undefined) cfgScale.value = params.cfgScale
    if (cfgScale && params.cfg_scale !== undefined) cfgScale.value = params.cfg_scale
    if (samplerName && params.samplerName !== undefined) samplerName.value = params.samplerName
    if (samplerName && params.sampler_name !== undefined) samplerName.value = params.sampler_name
    if (scheduler && params.scheduler !== undefined) scheduler.value = params.scheduler
    if (width && params.width !== undefined) width.value = params.width
    if (height && params.height !== undefined) height.value = params.height
    if (seed && params.seed !== undefined) seed.value = params.seed

    // 배치 설정
    if (batchCount && params.batchCount !== undefined) batchCount.value = params.batchCount
    if (batchCount && params.batch_count !== undefined) batchCount.value = params.batch_count
    if (batchSize && params.batchSize !== undefined) batchSize.value = params.batchSize
    if (batchSize && params.batch_size !== undefined) batchSize.value = params.batch_size

    // Denoising (img2img, inpaint)
    if (denoisingStrength && params.denoisingStrength !== undefined) {
      denoisingStrength.value = params.denoisingStrength
    }
    if (denoisingStrength && params.denoising_strength !== undefined) {
      denoisingStrength.value = params.denoising_strength
    }

    // 업스케일 (img2img 전용)
    if (enableUpscale && params.enableUpscale !== undefined) {
      enableUpscale.value = params.enableUpscale
    }
    if (upscaler && params.upscaler !== undefined) upscaler.value = params.upscaler
    if (upscaleScale && params.upscaleScale !== undefined) {
      upscaleScale.value = params.upscaleScale
    }

    // 마스크 블러 (inpaint 전용)
    if (maskBlur && params.maskBlur !== undefined) maskBlur.value = params.maskBlur

    // ADetailer
    if (adetailers && params.adetailers) {
      adetailers.value = JSON.parse(JSON.stringify(params.adetailers))
    }
  }

  return {
    // 모달 상태
    showBookmarkManager,
    showPresetManager,

    // 모달 함수
    openBookmarkManager,
    closeBookmarkManager,
    openPresetManager,
    closePresetManager,

    // 적용 함수
    applyBookmark,
    applyPreset
  }
}
