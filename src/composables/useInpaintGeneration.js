/**
 * Inpaint 이미지 생성 및 진행 상태 관리 composable
 * useImg2imgGeneration.js를 기반으로 inpaint 전용으로 수정
 */
import { ref, watch, onUnmounted } from 'vue'
import { useIndexedDB } from './useIndexedDB'
import { useErrorHandler } from './useErrorHandler'
import { useControlNet } from './useControlNet'
import { cloneADetailers } from '../utils/adetailer'
import { notifyCompletion } from '../utils/notification'
import { expandRandomCombination } from '../utils/promptCombination'
import { validateNumber, sleep } from '../utils/paramValidation'
import { get, post } from '../api/client'
import {
  SEED_MAX,
  MAX_CONSECUTIVE_ERRORS,
  MAX_IDLE_COUNT,
  PROGRESS_POLL_INTERVAL,
  GENERATION_TIMEOUT,
  INFINITE_MODE_INITIAL_WAIT,
  MAX_IMAGES,
  IMAGE_TYPES
} from '../config/constants'

export function useInpaintGeneration(params, enabledADetailers, showToast, t) {
  const isGenerating = ref(false)
  const progress = ref(0)
  const progressState = ref('')
  const currentImage = ref('')
  const lastUsedParams = ref(null)
  const generatedImages = ref([])
  const isInfiniteMode = ref(false)
  const infiniteCount = ref(0)
  const wasInterrupted = ref(false)
  const finalImageReceived = ref(false)
  const generationStartTime = ref(null)
  const pendingUsedParams = ref(null)
  const hasShownProgressImage = ref(false)
  const onCompleteCallback = ref(null) // 생성 완료 콜백 (파이프라인용)

  const progressInterval = ref(null)

  const { saveImage } = useIndexedDB()
  const { network, storage, generation } = useErrorHandler({ showToast, t })
  const { buildControlNetScript } = useControlNet()

  const consecutiveErrors = ref(0)
  let isInfiniteLoopRunning = false
  let idleCount = 0

  /**
   * 진행 상태 폴링 시작
   */
  function startProgressPolling() {
    if (progressInterval.value) {
      return
    }

    stopProgressPolling()
    idleCount = 0

    progressInterval.value = setInterval(async () => {
      try {
        const response = await get('/sdapi/v1/progress')
        if (response.ok) {
          const data = await response.json()
          const progressPercentage = data.progress * 100
          const hasActiveJob = data.state?.job_count > 0 || progressPercentage > 0

          if (!hasActiveJob && progressPercentage === 0) {
            idleCount++
            if (idleCount >= MAX_IDLE_COUNT) {
              stopProgressPolling()
              return
            }
          } else {
            idleCount = 0
          }

          progress.value = progressPercentage

          let stateText = ''
          if (data.textinfo) {
            stateText = data.textinfo
          } else if (data.state) {
            const state = data.state
            const parts = []

            if (state.job_count > 1) {
              parts.push(t('generation.imageCount', { current: state.job_no, total: state.job_count }))
            }

            if (state.job) {
              parts.push(state.job)
            }

            if (state.sampling_step !== undefined && state.sampling_steps > 0) {
              parts.push(t('generation.step', { current: state.sampling_step, total: state.sampling_steps }))
            }

            if (data.eta_relative > 0) {
              const eta = Math.ceil(data.eta_relative)
              parts.push(t('time.secondsRemaining', { eta }))
            }

            stateText = parts.join(' • ') || t('generation.processing')
          } else {
            stateText = t('generation.processing')
          }

          progressState.value = stateText

          if (data.current_image && !finalImageReceived.value) {
            currentImage.value = `data:image/png;base64,${data.current_image}`

            if (!hasShownProgressImage.value && pendingUsedParams.value) {
              lastUsedParams.value = pendingUsedParams.value
              hasShownProgressImage.value = true
            }
          }
        }
      } catch (error) {
        network(error, { context: 'progressPolling', silent: true })
      }
    }, PROGRESS_POLL_INTERVAL)
  }

  function stopProgressPolling() {
    if (progressInterval.value) {
      clearInterval(progressInterval.value)
      progressInterval.value = null
    }
    idleCount = 0
  }

  async function interruptGeneration() {
    const wasInfiniteMode = isInfiniteMode.value

    try {
      wasInterrupted.value = true

      if (isInfiniteMode.value) {
        isInfiniteMode.value = false
        consecutiveErrors.value = 0
      }

      if (isInfiniteLoopRunning) {
        isInfiniteLoopRunning = false
      }

      const response = await post('/sdapi/v1/interrupt')
      await response.text()

      stopProgressPolling()
      progress.value = 0
      progressState.value = ''

      setTimeout(() => {
        if (isGenerating.value) {
          isGenerating.value = false
        }
      }, 1000)

      if (wasInfiniteMode) {
        showToast(t('infiniteMode.interrupted', { count: infiniteCount.value }), 'info')
      } else {
        showToast(t('generation.interrupted'), 'info')
      }
    } catch (error) {
      console.error(t('generation.interruptFailed'), error)

      if (isInfiniteMode.value) {
        isInfiniteMode.value = false
        consecutiveErrors.value = 0
      }

      if (isInfiniteLoopRunning) {
        isInfiniteLoopRunning = false
      }

      stopProgressPolling()
      progress.value = 0
      progressState.value = ''

      setTimeout(() => {
        if (isGenerating.value) {
          isGenerating.value = false
        }
      }, 1000)

      showToast(t('generation.interruptComplete', { error: error.message }), 'warning')
    }
  }

  async function skipCurrentImage() {
    wasInterrupted.value = true

    try {
      await post('/sdapi/v1/skip')
      showToast(t('generation.skipCurrent'), 'info')
    } catch (error) {
      generation(error, {
        context: 'skipCurrentImage',
        i18nKey: 'generation.skipFailed'
      })
    }
  }

  function stopInfiniteModeOnly() {
    if (!isInfiniteMode.value) {
      return
    }

    const currentCount = infiniteCount.value
    isInfiniteMode.value = false
    consecutiveErrors.value = 0

    showToast(t('infiniteMode.stoppedCurrent', { count: currentCount }), 'info')
  }

  function toggleInfiniteMode() {
    isInfiniteMode.value = !isInfiniteMode.value

    if (isInfiniteMode.value) {
      if (isInfiniteLoopRunning) {
        isInfiniteMode.value = false
        showToast(t('infiniteMode.alreadyRunning'), 'warning')
        return
      }

      if (isGenerating.value) {
        showToast(t('infiniteMode.waitingCurrent'), 'info')
      }

      infiniteCount.value = 0
      consecutiveErrors.value = 0
      isInfiniteLoopRunning = true

      showToast(t('infiniteMode.started'), 'success')
      startInfiniteGeneration()
    } else {
      consecutiveErrors.value = 0
      showToast(t('infiniteMode.stopped', { count: infiniteCount.value }), 'info')
    }
  }

  async function startInfiniteGeneration() {
    if (!isInfiniteMode.value) {
      isInfiniteLoopRunning = false
      return
    }

    if (!isInfiniteLoopRunning) {
      isInfiniteLoopRunning = true
    }

    if (isGenerating.value) {
      let waitTime = 0
      while (isGenerating.value && isInfiniteMode.value && waitTime < INFINITE_MODE_INITIAL_WAIT) {
        await sleep(500)
        waitTime += 500
      }

      if (waitTime >= INFINITE_MODE_INITIAL_WAIT) {
        showToast(t('infiniteMode.waitTimeout'), 'error')
        isInfiniteMode.value = false
        isInfiniteLoopRunning = false
        return
      }
    }

    if (!isInfiniteMode.value) {
      isInfiniteLoopRunning = false
      return
    }

    const baseSeed = params.seed.value
    const useVariation = baseSeed !== -1

    try {
      while (isInfiniteMode.value) {
        if (useVariation) {
          const range = params.seedVariationRange.value
          const variation = Math.floor(Math.random() * (range * 2 + 1)) - range
          params.seed.value = Math.max(0, Math.min(SEED_MAX, baseSeed + variation))
        } else {
          params.seed.value = -1
        }

        await generateImage()

        let waitTime = 0
        while (isGenerating.value && isInfiniteMode.value && waitTime < GENERATION_TIMEOUT) {
          await sleep(500)
          waitTime += 500
        }

        if (waitTime >= GENERATION_TIMEOUT) {
          console.error('Generation timeout (10 min)')
          showToast(t('infiniteMode.generationTimeout'), 'error')
          isInfiniteMode.value = false
          break
        }

        if (!isInfiniteMode.value) {
          break
        }

        infiniteCount.value++

        const delayTime = Math.min(1000 + (consecutiveErrors.value * 2000), 10000)
        const delayIterations = Math.ceil(delayTime / 500)

        for (let i = 0; i < delayIterations && isInfiniteMode.value; i++) {
          await sleep(500)
        }
      }
    } finally {
      params.seed.value = baseSeed
      isInfiniteLoopRunning = false
    }
  }

  /**
   * Inpaint 이미지 생성
   * @param {Object} overrides - 오버라이드 파라미터
   * @param {string} overrides.prompt - 프롬프트 오버라이드
   * @param {string} overrides.negativePrompt - 네거티브 프롬프트 오버라이드
   * @param {string} overrides.initImage - 입력 이미지 오버라이드 (Outpaint용)
   * @param {string} overrides.mask - 마스크 오버라이드 (Outpaint용)
   * @param {number} overrides.width - 너비 오버라이드 (Outpaint용)
   * @param {number} overrides.height - 높이 오버라이드 (Outpaint용)
   */
  async function generateImage(overrides = {}) {
    const {
      prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
      width, height, batchCount, batchSize, seed,
      adetailers, selectedModel,
      // Inpaint 전용 파라미터
      initImage, mask, denoisingStrength,
      maskBlur, inpaintingFill, inpaintFullRes, inpaintFullResPadding,
      // ControlNet
      controlnetUnits
    } = params

    // 이미지/마스크 오버라이드 (Outpaint 모드용)
    const actualInitImage = overrides.initImage || initImage.value
    const actualMask = overrides.mask || mask.value
    const actualWidth = overrides.width || width.value
    const actualHeight = overrides.height || height.value

    // 입력 이미지 체크
    if (!actualInitImage) {
      showToast(t('inpaint.noImageSelected'), 'error')
      return
    }

    // 마스크 체크
    if (!actualMask) {
      showToast(t('inpaint.noMaskDrawn'), 'error')
      return
    }

    const rawPrompt = overrides.prompt !== undefined ? overrides.prompt : prompt.value
    const rawNegativePrompt = overrides.negativePrompt !== undefined ? overrides.negativePrompt : negativePrompt.value

    const actualPrompt = expandRandomCombination(rawPrompt)
    const actualNegativePrompt = expandRandomCombination(rawNegativePrompt)

    const corrections = []

    // 오버라이드된 크기 검증 (원본 ref 수정하지 않음)
    const validatedWidth = validateNumber(actualWidth, 64, 2048, 512)
    const validatedHeight = validateNumber(actualHeight, 64, 2048, 512)

    const originalSteps = steps.value
    steps.value = validateNumber(steps.value, 1, 150, 20)
    if (steps.value !== originalSteps) corrections.push(`Steps: ${originalSteps} → ${steps.value}`)

    const originalCfgScale = cfgScale.value
    cfgScale.value = validateNumber(cfgScale.value, 1, 30, 7)
    if (cfgScale.value !== originalCfgScale) corrections.push(`CFG Scale: ${originalCfgScale} → ${cfgScale.value}`)

    denoisingStrength.value = validateNumber(denoisingStrength.value, 0, 1, 0.75)
    maskBlur.value = validateNumber(maskBlur.value, 0, 64, 4)
    batchCount.value = validateNumber(batchCount.value, 1, 100, 1)
    batchSize.value = validateNumber(batchSize.value, 1, 8, 1)

    adetailers.value.forEach(ad => {
      ad.confidence = validateNumber(ad.confidence, 0, 1, 0.3)
      ad.dilateErode = validateNumber(ad.dilateErode, -128, 128, 4)
      ad.inpaintDenoising = validateNumber(ad.inpaintDenoising, 0, 1, 0.4)
      ad.steps = validateNumber(ad.steps, 1, 150, 28)
    })

    if (corrections.length > 0) {
      showToast(t('generation.parametersCorrected', { corrections: corrections.join(', ') }), 'warning')
    }

    isGenerating.value = true
    generationStartTime.value = Date.now()
    progress.value = 0
    progressState.value = t('generation.preparing')
    finalImageReceived.value = false
    hasShownProgressImage.value = false

    const usedParams = {
      prompt: actualPrompt,
      negative_prompt: actualNegativePrompt,
      steps: steps.value,
      sampler_name: samplerName.value,
      scheduler: scheduler.value,
      width: validatedWidth,
      height: validatedHeight,
      cfg_scale: cfgScale.value,
      seed: seed.value,
      batch_size: batchSize.value,
      batch_count: batchCount.value,
      denoising_strength: denoisingStrength.value,
      mask_blur: maskBlur.value,
      inpainting_fill: inpaintingFill.value,
      inpaint_full_res: inpaintFullRes.value,
      inpaint_full_res_padding: inpaintFullResPadding.value,
      sd_model_name: selectedModel?.value || '',
      adetailers: cloneADetailers(adetailers.value),
      type: IMAGE_TYPES.INPAINT
    }

    pendingUsedParams.value = usedParams

    lastUsedParams.value = {
      ...usedParams,
      prompt: rawPrompt,
      negative_prompt: rawNegativePrompt
    }

    try {
      startProgressPolling()

      // base64 이미지 추출 (data:image/xxx;base64, 부분 제거)
      const base64Image = actualInitImage.includes(',')
        ? actualInitImage.split(',')[1]
        : actualInitImage

      const base64Mask = actualMask.includes(',')
        ? actualMask.split(',')[1]
        : actualMask

      const payload = {
        init_images: [base64Image],
        mask: base64Mask, // Inpaint 핵심 파라미터
        prompt: actualPrompt,
        negative_prompt: actualNegativePrompt,
        steps: steps.value,
        sampler_name: samplerName.value,
        scheduler: scheduler.value,
        width: validatedWidth,
        height: validatedHeight,
        cfg_scale: cfgScale.value,
        seed: seed.value,
        batch_size: batchSize.value,
        n_iter: batchCount.value,
        denoising_strength: denoisingStrength.value,
        // Inpaint 전용 파라미터
        mask_blur: maskBlur.value,
        inpainting_fill: inpaintingFill.value,
        inpaint_full_res: inpaintFullRes.value,
        inpaint_full_res_padding: inpaintFullResPadding.value,
        save_images: true,
        override_settings: {
          samples_save: true,
        },
        override_settings_restore_afterwards: false,
      }

      // ADetailer 추가
      if (enabledADetailers.value.length > 0) {
        const adetailerArgs = adetailers.value.map(ad => ({
          "ad_model": ad.enable ? ad.model : "None",
          "ad_prompt": ad.enable ? (ad.prompt || "") : "",
          "ad_negative_prompt": ad.enable ? (ad.negativePrompt || "") : "",
          "ad_confidence": ad.confidence,
          "ad_mask_min_ratio": 0.0,
          "ad_mask_max_ratio": 1.0,
          "ad_dilate_erode": ad.dilateErode,
          "ad_inpaint_only_masked": ad.inpaintOnlyMasked,
          "ad_denoising_strength": ad.inpaintDenoising,
          "ad_use_inpaint_width_height": false,
          "ad_use_steps": ad.useSeparateSteps,
          "ad_steps": ad.useSeparateSteps ? ad.steps : steps.value,
        }))

        payload.alwayson_scripts = {
          "ADetailer": {
            "args": adetailerArgs
          }
        }
      }

      // ControlNet 추가
      if (controlnetUnits?.value) {
        const controlnetScript = buildControlNetScript(controlnetUnits.value)
        if (controlnetScript) {
          payload.alwayson_scripts = {
            ...payload.alwayson_scripts,
            ...controlnetScript
          }
        }
      }

      // img2img 엔드포인트 호출 (inpaint도 동일 엔드포인트 사용)
      const response = await post('/sdapi/v1/img2img', payload)

      if (!response.ok) {
        throw new Error(t('message.error.apiErrorWithStatus', { status: response.status }))
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        const generationDuration = generationStartTime.value
          ? Date.now() - generationStartTime.value
          : null

        let actualSeed = usedParams.seed
        let allSeeds = []
        let allPrompts = []
        let allNegativePrompts = []
        try {
          const info = JSON.parse(data.info)
          if (info.seed !== undefined) {
            actualSeed = info.seed
          }
          if (info.all_seeds && Array.isArray(info.all_seeds)) {
            allSeeds = info.all_seeds
          }
          if (info.all_prompts && Array.isArray(info.all_prompts)) {
            allPrompts = info.all_prompts
          }
          if (info.all_negative_prompts && Array.isArray(info.all_negative_prompts)) {
            allNegativePrompts = info.all_negative_prompts
          }
        } catch (e) {
          // Failed to parse info
        }

        const newImages = []
        let totalDeletedCount = 0

        // Only process actual generated images (exclude ControlNet detected_maps)
        // ControlNet appends preprocessor outputs at the end of images array
        const expectedImageCount = batchSize.value * batchCount.value
        const actualImageCount = Math.min(expectedImageCount, data.images.length)

        for (let i = 0; i < actualImageCount; i++) {
          const imageSeed = allSeeds[i] !== undefined ? allSeeds[i] : actualSeed

          const paramsWithActualSeed = {
            ...usedParams,
            seed: imageSeed, // Override -1 with actual seed
            actual_seed: imageSeed,
            prompt: allPrompts[i] || usedParams.prompt,
            negative_prompt: allNegativePrompts[i] || usedParams.negative_prompt
          }

          const newImage = {
            image: `data:image/png;base64,${data.images[i]}`,
            info: data.info,
            params: paramsWithActualSeed,
            timestamp: new Date().toISOString(),
            duration: generationDuration,
            favorite: false,
            interrupted: wasInterrupted.value,
            type: IMAGE_TYPES.INPAINT
          }

          try {
            const result = await saveImage(newImage)
            newImage.id = result.id

            if (result.deletedCount > 0) {
              totalDeletedCount += result.deletedCount
            }
          } catch (error) {
            storage(error, { context: 'saveImage', silent: true })
          }

          newImages.push(newImage)
        }

        if (totalDeletedCount > 0) {
          showToast(t('generation.autoDeleted', { count: totalDeletedCount }), 'info')
        }

        wasInterrupted.value = false

        const combined = [...newImages, ...generatedImages.value]
        generatedImages.value = combined.slice(0, MAX_IMAGES)

        finalImageReceived.value = true
        currentImage.value = generatedImages.value[0].image
        lastUsedParams.value = newImages[0].params

        consecutiveErrors.value = 0

        if (!newImages[0].interrupted && params.notificationType?.value) {
          notifyCompletion(params.notificationType.value, {
            volume: params.notificationVolume?.value || 0.5,
            imageInfo: {
              size: `${newImages[0].params.width}x${newImages[0].params.height}`,
              count: data.images.length
            }
          })
        }

        // 파이프라인 콜백 호출 (중단되지 않은 경우만)
        if (!newImages[0].interrupted && onCompleteCallback.value) {
          onCompleteCallback.value(generatedImages.value[0].image)
        }
      }
    } catch (error) {
      console.error(t('message.error.generationFailed'), error)

      consecutiveErrors.value++

      let message = t('message.error.generationFailed')

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        message = t('message.error.connectionFailed')
      } else if (error.message.includes(t('message.error.apiErrorWithStatus', { status: '' }))) {
        const statusMatch = error.message.match(/\d+/)
        const status = statusMatch ? parseInt(statusMatch[0]) : null

        switch (status) {
          case 401:
            message = t('message.error.authRequired')
            break
          case 403:
            message = t('message.error.accessDenied')
            break
          case 500:
            message = t('message.error.serverInternalError')
            break
          case 503:
            message = t('message.error.noResponse')
            break
          default:
            message = t('message.error.serverError', { status })
        }
      } else {
        message = t('message.error.generationFailedMessage', { error: error.message })
      }

      if (isInfiniteMode.value && consecutiveErrors.value >= MAX_CONSECUTIVE_ERRORS) {
        isInfiniteMode.value = false
        isInfiniteLoopRunning = false
        showToast(t('infiniteMode.autoStopped', { count: MAX_CONSECUTIVE_ERRORS }), 'error')
      } else {
        showToast(message, 'error')
      }
    } finally {
      isGenerating.value = false
      stopProgressPolling()
      progress.value = 0
      progressState.value = ''
    }
  }

  const handleBeforeUnload = (e) => {
    if (isGenerating.value) {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
  }

  watch(isGenerating, (generating) => {
    if (generating) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  })

  onUnmounted(() => {
    stopProgressPolling()
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  // 파이프라인용 완료 콜백 설정
  function setOnComplete(callback) {
    onCompleteCallback.value = callback
  }

  return {
    isGenerating,
    progress,
    progressState,
    currentImage,
    lastUsedParams,
    generatedImages,
    isInfiniteMode,
    infiniteCount,
    generateImage,
    interruptGeneration,
    skipCurrentImage,
    stopInfiniteModeOnly,
    toggleInfiniteMode,
    startProgressPolling,
    stopProgressPolling,
    setOnComplete,
  }
}
