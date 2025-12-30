/**
 * 파라미터 적용 composable
 * Preset, History, PNG Info에서 파라미터를 현재 설정에 적용하는 기능 제공
 *
 * @param {Object} refs - 모든 설정 refs를 포함하는 객체
 * @param {Function} showToast - 토스트 메시지 표시 함수
 * @returns {Object} 파라미터 적용 관련 함수들
 */
export function useParamsApplication(refs, showToast) {
  const {
    prompt,
    negativePrompt,
    steps,
    cfgScale,
    samplerName,
    scheduler,
    width,
    height,
    seed,
    seedVariationRange,
    batchCount,
    batchSize,
    hrUpscaler,
    hrSteps,
    denoisingStrength,
    hrUpscale,
    adetailers
  } = refs

  /**
   * 파라미터를 현재 설정에 적용
   * @param {Object} params - 적용할 파라미터 객체
   * @param {Object} options - 옵션 (includePrompts, showSuccessToast, successMessage)
   */
  function applyParams(params, options = {}) {
    if (!params) return

    const {
      includePrompts = false,
      showSuccessToast = false,
      successMessage = 'Settings applied'
    } = options

    // Apply prompts (only for history format)
    if (includePrompts) {
      prompt.value = params.prompt || ''
      negativePrompt.value = params.negativePrompt || params.negative_prompt || ''
    }

    // Apply basic params (handle both formats: camelCase and snake_case)
    steps.value = params.steps || 20
    cfgScale.value = params.cfgScale || params.cfg_scale || 7
    samplerName.value = params.samplerName || params.sampler_name || 'Euler a'
    scheduler.value = params.scheduler || 'Automatic'
    width.value = params.width || 512
    height.value = params.height || 512
    seed.value = params.seed || -1
    seedVariationRange.value = params.seedVariationRange ?? 100
    batchCount.value = params.batchCount || params.batch_count || 1
    batchSize.value = params.batchSize || params.batch_size || 1

    // Apply hires fix params
    hrUpscaler.value = params.hrUpscaler || params.hr_upscaler || 'Latent'
    hrSteps.value = params.hrSteps || params.hr_steps || 10
    denoisingStrength.value = params.denoisingStrength || params.denoising_strength || 0.7
    hrUpscale.value = params.hrUpscale || params.hr_scale || 2

    // Apply ADetailer params if available
    if (params.adetailers && Array.isArray(params.adetailers)) {
      adetailers.value = JSON.parse(JSON.stringify(params.adetailers))
    }

    if (showSuccessToast) {
      showToast?.(successMessage, 'success')
    }
  }

  /**
   * 프리셋 적용 핸들러
   * @param {Object} params - 프리셋 파라미터
   */
  function handleApplyPreset(params) {
    applyParams(params, {
      includePrompts: false,
      showSuccessToast: false
    })
  }

  /**
   * 히스토리에서 파라미터 로드
   * @param {Object} item - 히스토리 항목
   */
  function loadParamsFromHistory(item) {
    applyParams(item.params, {
      includePrompts: true,
      showSuccessToast: true,
      successMessage: 'Settings loaded from history'
    })
  }

  return {
    applyParams,
    handleApplyPreset,
    loadParamsFromHistory
  }
}
