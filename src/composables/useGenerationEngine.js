/**
 * Generation Engine - App.vue 레벨에서 이미지 생성을 관리
 * 탭 전환 시에도 생성이 유지되도록 함
 */
import { ref, reactive, watch, onUnmounted } from 'vue'
import { useIndexedDB } from './useIndexedDB'
import { useBookmarks } from './useBookmarks'
import { useErrorHandler } from './useErrorHandler'
import { useProgressPolling } from './useProgressPolling'
import { useGenerationResult } from './useGenerationResult'
import { cloneADetailers } from '../utils/adetailer'
import { expandRandomCombination } from '../utils/promptCombination'
import { validateNumber, sleep } from '../utils/paramValidation'
import { get, post } from '../api/client'
import { useControlNet } from './useControlNet'
import {
  SEED_MAX,
  GENERATION_TIMEOUT,
  INFINITE_MODE_INITIAL_WAIT,
  MAX_IMAGES,
  IMAGE_TYPES
} from '../config/constants'

/**
 * 뷰별 생성 상태를 관리하는 엔진
 */
function createViewEngine(viewType, { saveImage, showToast, t, errorHandler }) {
  const isGenerating = ref(false)
  const generatedImages = ref([])
  const isInfiniteMode = ref(false)
  const infiniteCount = ref(0)
  const wasInterrupted = ref(false)
  const generationStartTime = ref(null)
  const onCompleteCallback = ref(null)
  const consecutiveErrors = ref(0)

  // 무한 생성 루프 실행 플래그
  let isInfiniteLoopRunning = false
  // 무한 모드에서 최신 파라미터를 가져오는 콜백
  let infiniteParamsGetter = null

  // 현재 생성 요청 파라미터 (탭 전환 후에도 유지)
  const currentParams = ref(null)
  const currentEnabledADetailers = ref([])
  const appliedBookmarkIdRef = ref(null)

  const { network, storage, generation } = errorHandler

  // Progress polling (중앙화된 로직 사용)
  const {
    progress,
    progressState,
    currentImage,
    lastUsedParams,
    finalImageReceived,
    startProgressPolling,
    stopProgressPolling,
    setPendingUsedParams,
    setBatchInfo,
    setFinalImageReceived
  } = useProgressPolling({ t, onError: (error) => network(error, { context: 'progressPolling', silent: true }) })

  // Generation result processing (중앙화된 로직 사용)
  const {
    processGeneratedImages,
    updateStateAfterGeneration,
    sendCompletionNotification,
    callPipelineCallback,
    handleGenerationError,
    cleanupAfterGeneration
  } = useGenerationResult({ t, showToast, saveImage, onError: storage })

  /**
   * 생성 중단
   */
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

  /**
   * 현재 이미지 스킵
   */
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

  /**
   * 무한 모드만 해제
   */
  function stopInfiniteModeOnly() {
    if (!isInfiniteMode.value) return

    const currentCount = infiniteCount.value
    isInfiniteMode.value = false
    consecutiveErrors.value = 0
    showToast(t('infiniteMode.stoppedCurrent', { count: currentCount }), 'info')
  }

  /**
   * 무한 생성 모드 토글
   * @param {Function} getLatestParams - View에서 최신 파라미터를 가져오는 콜백
   */
  function toggleInfiniteMode(getLatestParams = null) {
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
      infiniteParamsGetter = getLatestParams

      showToast(t('infiniteMode.started'), 'success')
      startInfiniteGeneration()
    } else {
      consecutiveErrors.value = 0
      infiniteParamsGetter = null
      showToast(t('infiniteMode.stopped', { count: infiniteCount.value }), 'info')
    }
  }

  /**
   * 무한 생성 시작
   */
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

    // 초기 파라미터 확인 (콜백이 있으면 콜백 사용, 없으면 currentParams 사용)
    const initialParams = infiniteParamsGetter ? infiniteParamsGetter() : currentParams.value
    if (!initialParams) {
      showToast(t('infiniteMode.noParams'), 'error')
      isInfiniteMode.value = false
      isInfiniteLoopRunning = false
      return
    }

    const baseSeed = initialParams.seed
    const useVariation = baseSeed !== -1

    try {
      while (isInfiniteMode.value) {
        // 매 생성마다 최신 파라미터 가져오기 (콜백이 있으면 콜백 사용)
        const params = infiniteParamsGetter ? infiniteParamsGetter() : currentParams.value
        if (!params) break

        // 매번 새로운 seed 생성
        let newSeed = baseSeed
        if (useVariation) {
          const range = params.seedVariationRange || 100
          const variation = Math.floor(Math.random() * (range * 2 + 1)) - range
          newSeed = Math.max(0, Math.min(SEED_MAX, baseSeed + variation))
        } else {
          newSeed = -1
        }

        await generateImage({ ...params, seed: newSeed })

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

        if (!isInfiniteMode.value) break

        infiniteCount.value++

        const delayTime = Math.min(1000 + (consecutiveErrors.value * 2000), 10000)
        const delayIterations = Math.ceil(delayTime / 500)

        for (let i = 0; i < delayIterations && isInfiniteMode.value; i++) {
          await sleep(500)
        }
      }
    } finally {
      isInfiniteLoopRunning = false
    }
  }

  // ControlNet helper
  const { buildControlNetScript } = useControlNet()

  /**
   * 이미지 생성 - 핵심 함수
   * @param {Object} params - 생성 파라미터
   */
  async function generateImage(params) {
    // 파라미터 저장 (무한 모드용)
    currentParams.value = params

    const {
      prompt: rawPrompt,
      negativePrompt: rawNegativePrompt,
      steps, cfgScale, samplerName, scheduler,
      width, height, batchCount, batchSize, seed,
      enableHr, hrUpscaler, hrSteps, denoisingStrength, hrUpscale,
      adetailers, selectedModel, controlnetUnits,
      notificationType, notificationVolume,
      enabledADetailers, appliedBookmarkId,
      onParamsValidated
    } = params

    // Store for later use
    currentEnabledADetailers.value = enabledADetailers || []
    appliedBookmarkIdRef.value = appliedBookmarkId

    // Expand combination syntax
    const actualPrompt = expandRandomCombination(rawPrompt || '')
    const actualNegativePrompt = expandRandomCombination(rawNegativePrompt || '')

    if (!actualPrompt.trim()) {
      showToast(t('prompt.required'), 'error')
      return
    }

    // Validate numbers
    const validatedSteps = validateNumber(steps, 1, 150, 20)
    const validatedCfgScale = validateNumber(cfgScale, 1, 30, 7)
    const validatedWidth = validateNumber(width, 64, 2048, 512)
    const validatedHeight = validateNumber(height, 64, 2048, 512)
    const validatedBatchCount = validateNumber(batchCount, 1, 100, 1)
    const validatedBatchSize = validateNumber(batchSize, 1, 8, 1)
    const validatedHrSteps = validateNumber(hrSteps, 0, 150, 10)
    const validatedDenoisingStrength = validateNumber(denoisingStrength, 0, 1, 0.7)
    const validatedHrUpscale = validateNumber(hrUpscale, 1, 4, 2)

    // Notify caller of validated params (for UI update)
    onParamsValidated?.({
      steps: validatedSteps,
      cfgScale: validatedCfgScale,
      width: validatedWidth,
      height: validatedHeight,
      batchCount: validatedBatchCount,
      batchSize: validatedBatchSize,
      hrSteps: validatedHrSteps,
      denoisingStrength: validatedDenoisingStrength,
      hrUpscale: validatedHrUpscale
    })

    isGenerating.value = true
    generationStartTime.value = Date.now()
    progress.value = 0
    progressState.value = t('generation.preparing')
    setFinalImageReceived(false)
    wasInterrupted.value = false // 생성 시작 시 중단 플래그 초기화

    // Save parameters used for generation
    const usedParams = {
      prompt: actualPrompt,
      negative_prompt: actualNegativePrompt,
      steps: validatedSteps,
      sampler_name: samplerName,
      scheduler: scheduler,
      width: validatedWidth,
      height: validatedHeight,
      cfg_scale: validatedCfgScale,
      seed: seed,
      batch_size: validatedBatchSize,
      batch_count: validatedBatchCount,
      hr_upscaler: hrUpscaler,
      hr_steps: validatedHrSteps,
      denoising_strength: validatedDenoisingStrength,
      hr_scale: validatedHrUpscale,
      sd_model_name: selectedModel || '',
      adetailers: adetailers ? cloneADetailers(adetailers) : [],
    }

    // Store raw prompts for change detection (before dynamic syntax resolution)
    const usedParamsWithRaw = {
      ...usedParams,
      prompt: rawPrompt,
      negative_prompt: rawNegativePrompt
    }
    setPendingUsedParams(usedParamsWithRaw)
    lastUsedParams.value = usedParamsWithRaw

    try {
      setBatchInfo(validatedBatchCount)
      startProgressPolling()

      // Prepare API payload
      const payload = {
        prompt: actualPrompt,
        negative_prompt: actualNegativePrompt,
        steps: validatedSteps,
        sampler_name: samplerName,
        scheduler: scheduler,
        width: validatedWidth,
        height: validatedHeight,
        cfg_scale: validatedCfgScale,
        seed: seed,
        batch_size: validatedBatchSize,
        n_iter: validatedBatchCount,
        enable_hr: enableHr || false,
        hr_upscaler: hrUpscaler,
        hr_second_pass_steps: validatedHrSteps,
        denoising_strength: validatedDenoisingStrength,
        hr_scale: validatedHrUpscale,
        save_images: true,
        override_settings: {
          samples_save: true,
          save_images_before_highres_fix: false,
          save_images_before_face_restoration: false,
        },
        override_settings_restore_afterwards: false,
      }

      payload.alwayson_scripts = {}

      // Add ADetailer if any enabled
      const enabledADs = currentEnabledADetailers.value
      if (enabledADs && enabledADs.length > 0 && adetailers) {
        const adetailerArgs = adetailers.map(ad => ({
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
          "ad_steps": ad.useSeparateSteps ? ad.steps : validatedSteps,
        }))

        payload.alwayson_scripts["ADetailer"] = { "args": adetailerArgs }
      }

      // Add ControlNet if any units enabled
      if (controlnetUnits) {
        const controlnetScript = buildControlNetScript(controlnetUnits)
        if (controlnetScript) {
          payload.alwayson_scripts = {
            ...payload.alwayson_scripts,
            ...controlnetScript
          }
        }
      }

      if (Object.keys(payload.alwayson_scripts).length === 0) {
        delete payload.alwayson_scripts
      }

      const response = await post('/sdapi/v1/txt2img', payload)

      if (!response.ok) {
        throw new Error(t('message.error.apiErrorWithStatus', { status: response.status }))
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        const generationDuration = generationStartTime.value
          ? Date.now() - generationStartTime.value
          : null

        // Process generated images using centralized logic
        const { newImages, totalDeletedCount } = await processGeneratedImages({
          data,
          usedParams,
          expectedImageCount: validatedBatchSize * validatedBatchCount,
          generationDuration,
          wasInterrupted: wasInterrupted.value,
          viewType,
          onBookmarkLink: appliedBookmarkIdRef.value ? (imageId) => {
            const { setBookmarkThumbnail } = useBookmarks()
            setBookmarkThumbnail(appliedBookmarkIdRef.value, imageId)
          } : null
        })

        // Update state
        wasInterrupted.value = false
        updateStateAfterGeneration({
          newImages,
          totalDeletedCount,
          generatedImages,
          currentImage,
          lastUsedParams,
          setFinalImageReceived
        })
        consecutiveErrors.value = 0

        // Notifications and callbacks
        sendCompletionNotification({
          newImages,
          imageCount: data.images.length,
          notificationType,
          notificationVolume
        })
        callPipelineCallback(newImages, generatedImages, onCompleteCallback)
      }
    } catch (error) {
      handleGenerationError({
        error,
        consecutiveErrors,
        isInfiniteMode,
        infiniteLoopControl: { get isRunning() { return isInfiniteLoopRunning }, set isRunning(v) { isInfiniteLoopRunning = v } }
      })
    } finally {
      cleanupAfterGeneration({
        isGenerating,
        stopProgressPolling,
        progress,
        progressState
      })
    }
  }

  /**
   * 진행 중인 생성 작업 체크
   */
  async function checkOngoingGeneration() {
    try {
      const response = await get('/sdapi/v1/progress')
      if (response.ok) {
        const data = await response.json()
        const progressPercentage = data.progress * 100
        const hasActiveJob = data.state?.job_count > 0 || progressPercentage > 0

        if (hasActiveJob) {
          isGenerating.value = true
          progress.value = progressPercentage
          progressState.value = t('generation.resuming')
          startProgressPolling()
          showToast(t('generation.ongoingDetected'), 'info')
        }
      }
    } catch (error) {
      network(error, { context: 'checkOngoingGeneration', silent: true })
    }
  }

  /**
   * 파이프라인용 완료 콜백 설정
   */
  function setOnComplete(callback) {
    onCompleteCallback.value = callback
  }

  /**
   * 정리
   */
  function cleanup() {
    stopProgressPolling()
  }

  return {
    // State
    isGenerating,
    progress,
    progressState,
    currentImage,
    lastUsedParams,
    generatedImages,
    isInfiniteMode,
    infiniteCount,
    // Methods
    generateImage,
    interruptGeneration,
    skipCurrentImage,
    stopInfiniteModeOnly,
    toggleInfiniteMode,
    startProgressPolling,
    stopProgressPolling,
    checkOngoingGeneration,
    setOnComplete,
    cleanup,
  }
}

/**
 * img2img 전용 엔진 생성
 */
function createImg2ImgEngine({ saveImage, showToast, t, errorHandler }) {
  const viewType = 'img2img'

  const isGenerating = ref(false)
  const generatedImages = ref([])
  const isInfiniteMode = ref(false)
  const infiniteCount = ref(0)
  const wasInterrupted = ref(false)
  const generationStartTime = ref(null)
  const onCompleteCallback = ref(null)
  const consecutiveErrors = ref(0)

  let isInfiniteLoopRunning = false
  let infiniteParamsGetter = null

  const currentParams = ref(null)
  const currentEnabledADetailers = ref([])

  const { network, storage, generation } = errorHandler
  const { buildControlNetScript } = useControlNet()

  // Progress polling (중앙화된 로직 사용)
  const {
    progress,
    progressState,
    currentImage,
    lastUsedParams,
    startProgressPolling,
    stopProgressPolling,
    setPendingUsedParams,
    setBatchInfo,
    setFinalImageReceived
  } = useProgressPolling({ t, onError: (error) => network(error, { context: 'progressPolling', silent: true }) })

  // Generation result processing (중앙화된 로직 사용)
  const {
    processGeneratedImages,
    updateStateAfterGeneration,
    sendCompletionNotification,
    callPipelineCallback,
    handleGenerationError,
    cleanupAfterGeneration
  } = useGenerationResult({ t, showToast, saveImage, onError: storage })

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
    if (!isInfiniteMode.value) return
    const currentCount = infiniteCount.value
    isInfiniteMode.value = false
    consecutiveErrors.value = 0
    showToast(t('infiniteMode.stoppedCurrent', { count: currentCount }), 'info')
  }

  function toggleInfiniteMode(getLatestParams = null) {
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
      infiniteParamsGetter = getLatestParams

      showToast(t('infiniteMode.started'), 'success')
      startInfiniteGeneration()
    } else {
      consecutiveErrors.value = 0
      infiniteParamsGetter = null
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

    // 초기 파라미터 확인 (콜백이 있으면 콜백 사용, 없으면 currentParams 사용)
    const initialParams = infiniteParamsGetter ? infiniteParamsGetter() : currentParams.value
    if (!initialParams) {
      showToast(t('infiniteMode.noParams'), 'error')
      isInfiniteMode.value = false
      isInfiniteLoopRunning = false
      return
    }

    const baseSeed = initialParams.seed
    const useVariation = baseSeed !== -1

    try {
      while (isInfiniteMode.value) {
        // 매 생성마다 최신 파라미터 가져오기 (콜백이 있으면 콜백 사용)
        const params = infiniteParamsGetter ? infiniteParamsGetter() : currentParams.value
        if (!params) break

        let newSeed = baseSeed
        if (useVariation) {
          const range = params.seedVariationRange || 100
          const variation = Math.floor(Math.random() * (range * 2 + 1)) - range
          newSeed = Math.max(0, Math.min(SEED_MAX, baseSeed + variation))
        } else {
          newSeed = -1
        }

        await generateImage({ ...params, seed: newSeed })

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

        if (!isInfiniteMode.value) break

        infiniteCount.value++

        const delayTime = Math.min(1000 + (consecutiveErrors.value * 2000), 10000)
        const delayIterations = Math.ceil(delayTime / 500)

        for (let i = 0; i < delayIterations && isInfiniteMode.value; i++) {
          await sleep(500)
        }
      }
    } finally {
      isInfiniteLoopRunning = false
    }
  }

  /**
   * img2img 이미지 생성
   */
  async function generateImage(params) {
    currentParams.value = params

    const {
      prompt: rawPrompt,
      negativePrompt: rawNegativePrompt,
      steps, cfgScale, samplerName, scheduler,
      width, height, batchCount, batchSize, seed,
      adetailers, selectedModel, controlnetUnits,
      notificationType, notificationVolume,
      enabledADetailers,
      // img2img 전용
      initImage, denoisingStrength,
      enableUpscale, upscaler, upscaleScale,
      onParamsValidated
    } = params

    // 입력 이미지 체크
    if (!initImage) {
      showToast(t('img2img.noImageSelected'), 'error')
      return
    }

    currentEnabledADetailers.value = enabledADetailers || []

    const actualPrompt = expandRandomCombination(rawPrompt || '')
    const actualNegativePrompt = expandRandomCombination(rawNegativePrompt || '')

    // Validate numbers
    const validatedSteps = validateNumber(steps, 1, 150, 20)
    const validatedCfgScale = validateNumber(cfgScale, 1, 30, 7)
    const validatedWidth = validateNumber(width, 64, 2048, 512)
    const validatedHeight = validateNumber(height, 64, 2048, 512)
    const validatedBatchCount = validateNumber(batchCount, 1, 100, 1)
    const validatedBatchSize = validateNumber(batchSize, 1, 8, 1)
    const validatedDenoisingStrength = validateNumber(denoisingStrength, 0, 1, 0.75)

    // Notify caller of validated params (for UI update)
    onParamsValidated?.({
      steps: validatedSteps,
      cfgScale: validatedCfgScale,
      width: validatedWidth,
      height: validatedHeight,
      batchCount: validatedBatchCount,
      batchSize: validatedBatchSize,
      denoisingStrength: validatedDenoisingStrength
    })

    isGenerating.value = true
    generationStartTime.value = Date.now()
    progress.value = 0
    progressState.value = t('generation.preparing')
    setFinalImageReceived(false)
    wasInterrupted.value = false

    const usedParams = {
      prompt: actualPrompt,
      negative_prompt: actualNegativePrompt,
      steps: validatedSteps,
      sampler_name: samplerName,
      scheduler: scheduler,
      width: validatedWidth,
      height: validatedHeight,
      cfg_scale: validatedCfgScale,
      seed: seed,
      batch_size: validatedBatchSize,
      batch_count: validatedBatchCount,
      denoising_strength: validatedDenoisingStrength,
      sd_model_name: selectedModel || '',
      adetailers: adetailers ? cloneADetailers(adetailers) : [],
      type: IMAGE_TYPES.IMG2IMG
    }

    // Store raw prompts for change detection (before dynamic syntax resolution)
    const usedParamsWithRaw = {
      ...usedParams,
      prompt: rawPrompt,
      negative_prompt: rawNegativePrompt
    }
    setPendingUsedParams(usedParamsWithRaw)
    lastUsedParams.value = usedParamsWithRaw

    try {
      setBatchInfo(validatedBatchCount)
      startProgressPolling()

      // base64 이미지 추출
      const base64Image = initImage.includes(',')
        ? initImage.split(',')[1]
        : initImage

      const payload = {
        init_images: [base64Image],
        prompt: actualPrompt,
        negative_prompt: actualNegativePrompt,
        steps: validatedSteps,
        sampler_name: samplerName,
        scheduler: scheduler,
        width: validatedWidth,
        height: validatedHeight,
        cfg_scale: validatedCfgScale,
        seed: seed,
        batch_size: validatedBatchSize,
        n_iter: validatedBatchCount,
        denoising_strength: validatedDenoisingStrength,
        save_images: true,
        override_settings: {
          samples_save: true,
        },
        override_settings_restore_afterwards: false,
      }

      payload.alwayson_scripts = {}

      // ADetailer 추가
      const enabledADs = currentEnabledADetailers.value
      if (enabledADs && enabledADs.length > 0 && adetailers) {
        const adetailerArgs = adetailers.map(ad => ({
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
          "ad_steps": ad.useSeparateSteps ? ad.steps : validatedSteps,
        }))

        payload.alwayson_scripts["ADetailer"] = { "args": adetailerArgs }
      }

      // ControlNet 추가
      if (controlnetUnits) {
        const controlnetScript = buildControlNetScript(controlnetUnits)
        if (controlnetScript) {
          payload.alwayson_scripts = {
            ...payload.alwayson_scripts,
            ...controlnetScript
          }
        }
      }

      if (Object.keys(payload.alwayson_scripts).length === 0) {
        delete payload.alwayson_scripts
      }

      const response = await post('/sdapi/v1/img2img', payload)

      if (!response.ok) {
        throw new Error(t('message.error.apiErrorWithStatus', { status: response.status }))
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        const generationDuration = generationStartTime.value
          ? Date.now() - generationStartTime.value
          : null

        // Process generated images using centralized logic
        const { newImages, totalDeletedCount } = await processGeneratedImages({
          data,
          usedParams,
          expectedImageCount: validatedBatchSize * validatedBatchCount,
          generationDuration,
          wasInterrupted: wasInterrupted.value,
          imageType: IMAGE_TYPES.IMG2IMG,
          viewType
        })

        // Update state
        wasInterrupted.value = false
        updateStateAfterGeneration({
          newImages,
          totalDeletedCount,
          generatedImages,
          currentImage,
          lastUsedParams,
          setFinalImageReceived
        })
        consecutiveErrors.value = 0

        // 업스케일 처리
        if (enableUpscale && newImages.length > 0) {
          progressState.value = t('img2img.upscaling')

          try {
            for (let i = 0; i < newImages.length; i++) {
              const imageBase64 = newImages[i].image.replace('data:image/png;base64,', '')

              const upscalePayload = {
                image: imageBase64,
                upscaler_1: upscaler || 'R-ESRGAN 4x+',
                upscaling_resize: upscaleScale || 2
              }

              const upscaleResponse = await post('/sdapi/v1/extra-single-image', upscalePayload)

              if (upscaleResponse.ok) {
                const upscaleData = await upscaleResponse.json()
                if (upscaleData.image) {
                  const scale = upscaleScale || 2
                  newImages[i].image = `data:image/png;base64,${upscaleData.image}`
                  newImages[i].params.upscaled = true
                  newImages[i].params.upscaler = upscaler
                  newImages[i].params.upscaleScale = scale
                  newImages[i].params.width = Math.round(newImages[i].params.width * scale)
                  newImages[i].params.height = Math.round(newImages[i].params.height * scale)

                  try {
                    await saveImage(newImages[i])
                  } catch (err) {
                    console.error('Failed to update upscaled image:', err)
                  }
                }
              }
            }

            const combined = [...newImages, ...generatedImages.value.filter(img => !newImages.find(n => n.id === img.id))]
            generatedImages.value = combined.slice(0, MAX_IMAGES)
            currentImage.value = newImages[0].image

            showToast(t('img2img.upscaleComplete'), 'success')
          } catch (upscaleError) {
            console.error('Upscale failed:', upscaleError)
            showToast(t('img2img.upscaleFailed'), 'warning')
          }
        }

        // Notifications and callbacks
        sendCompletionNotification({
          newImages,
          imageCount: data.images.length,
          notificationType,
          notificationVolume
        })
        callPipelineCallback(newImages, generatedImages, onCompleteCallback)
      }
    } catch (error) {
      handleGenerationError({
        error,
        consecutiveErrors,
        isInfiniteMode,
        infiniteLoopControl: { get isRunning() { return isInfiniteLoopRunning }, set isRunning(v) { isInfiniteLoopRunning = v } }
      })
    } finally {
      cleanupAfterGeneration({
        isGenerating,
        stopProgressPolling,
        progress,
        progressState
      })
    }
  }

  function setOnComplete(callback) {
    onCompleteCallback.value = callback
  }

  function cleanup() {
    stopProgressPolling()
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
    cleanup,
  }
}

/**
 * inpaint 전용 엔진 생성
 */
function createInpaintEngine({ saveImage, showToast, t, errorHandler }) {
  const viewType = 'inpaint'

  const isGenerating = ref(false)
  const generatedImages = ref([])
  const isInfiniteMode = ref(false)
  const infiniteCount = ref(0)
  const wasInterrupted = ref(false)
  const generationStartTime = ref(null)
  const onCompleteCallback = ref(null)
  const consecutiveErrors = ref(0)

  // 탭 전환 시 유지할 상태
  const savedInitImage = ref('')
  const savedMask = ref('')
  const savedInitImageWidth = ref(0)
  const savedInitImageHeight = ref(0)

  let isInfiniteLoopRunning = false
  let infiniteParamsGetter = null

  const currentParams = ref(null)
  const currentEnabledADetailers = ref([])

  const { network, storage, generation } = errorHandler
  const { buildControlNetScript } = useControlNet()

  // Progress polling (중앙화된 로직 사용)
  const {
    progress,
    progressState,
    currentImage,
    lastUsedParams,
    startProgressPolling,
    stopProgressPolling,
    setPendingUsedParams,
    setBatchInfo,
    setFinalImageReceived
  } = useProgressPolling({ t, onError: (error) => network(error, { context: 'progressPolling', silent: true }) })

  // Generation result processing (중앙화된 로직 사용)
  const {
    processGeneratedImages,
    updateStateAfterGeneration,
    sendCompletionNotification,
    callPipelineCallback,
    handleGenerationError,
    cleanupAfterGeneration
  } = useGenerationResult({ t, showToast, saveImage, onError: storage })

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
    if (!isInfiniteMode.value) return
    const currentCount = infiniteCount.value
    isInfiniteMode.value = false
    consecutiveErrors.value = 0
    showToast(t('infiniteMode.stoppedCurrent', { count: currentCount }), 'info')
  }

  function toggleInfiniteMode(getLatestParams = null) {
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
      infiniteParamsGetter = getLatestParams

      showToast(t('infiniteMode.started'), 'success')
      startInfiniteGeneration()
    } else {
      consecutiveErrors.value = 0
      infiniteParamsGetter = null
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

    // 초기 파라미터 확인 (콜백이 있으면 콜백 사용, 없으면 currentParams 사용)
    const initialParams = infiniteParamsGetter ? infiniteParamsGetter() : currentParams.value
    if (!initialParams) {
      showToast(t('infiniteMode.noParams'), 'error')
      isInfiniteMode.value = false
      isInfiniteLoopRunning = false
      return
    }

    const baseSeed = initialParams.seed
    const useVariation = baseSeed !== -1

    try {
      while (isInfiniteMode.value) {
        // 매 생성마다 최신 파라미터 가져오기 (콜백이 있으면 콜백 사용)
        const params = infiniteParamsGetter ? infiniteParamsGetter() : currentParams.value
        if (!params) break

        let newSeed = baseSeed
        if (useVariation) {
          const range = params.seedVariationRange || 100
          const variation = Math.floor(Math.random() * (range * 2 + 1)) - range
          newSeed = Math.max(0, Math.min(SEED_MAX, baseSeed + variation))
        } else {
          newSeed = -1
        }

        await generateImage({ ...params, seed: newSeed })

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

        if (!isInfiniteMode.value) break

        infiniteCount.value++

        const delayTime = Math.min(1000 + (consecutiveErrors.value * 2000), 10000)
        const delayIterations = Math.ceil(delayTime / 500)

        for (let i = 0; i < delayIterations && isInfiniteMode.value; i++) {
          await sleep(500)
        }
      }
    } finally {
      isInfiniteLoopRunning = false
    }
  }

  /**
   * inpaint 이미지 생성
   */
  async function generateImage(params) {
    currentParams.value = params

    const {
      prompt: rawPrompt,
      negativePrompt: rawNegativePrompt,
      steps, cfgScale, samplerName, scheduler,
      width, height, batchCount, batchSize, seed,
      adetailers, selectedModel, controlnetUnits,
      notificationType, notificationVolume,
      enabledADetailers,
      // inpaint 전용
      initImage, mask, denoisingStrength,
      maskBlur, inpaintingFill, inpaintFullRes, inpaintFullResPadding,
      onParamsValidated
    } = params

    // 입력 이미지 체크
    if (!initImage) {
      showToast(t('inpaint.noImageSelected'), 'error')
      return
    }

    // 마스크 체크
    if (!mask) {
      showToast(t('inpaint.noMaskDrawn'), 'error')
      return
    }

    currentEnabledADetailers.value = enabledADetailers || []

    const actualPrompt = expandRandomCombination(rawPrompt || '')
    const actualNegativePrompt = expandRandomCombination(rawNegativePrompt || '')

    // Validate numbers
    const validatedSteps = validateNumber(steps, 1, 150, 20)
    const validatedCfgScale = validateNumber(cfgScale, 1, 30, 7)
    const validatedWidth = validateNumber(width, 64, 2048, 512)
    const validatedHeight = validateNumber(height, 64, 2048, 512)
    const validatedBatchCount = validateNumber(batchCount, 1, 100, 1)
    const validatedBatchSize = validateNumber(batchSize, 1, 8, 1)
    const validatedDenoisingStrength = validateNumber(denoisingStrength, 0, 1, 0.75)
    const validatedMaskBlur = validateNumber(maskBlur, 0, 64, 4)

    // Notify caller of validated params (for UI update)
    onParamsValidated?.({
      steps: validatedSteps,
      cfgScale: validatedCfgScale,
      width: validatedWidth,
      height: validatedHeight,
      batchCount: validatedBatchCount,
      batchSize: validatedBatchSize,
      denoisingStrength: validatedDenoisingStrength,
      maskBlur: validatedMaskBlur
    })

    isGenerating.value = true
    generationStartTime.value = Date.now()
    progress.value = 0
    progressState.value = t('generation.preparing')
    setFinalImageReceived(false)
    wasInterrupted.value = false

    const usedParams = {
      prompt: actualPrompt,
      negative_prompt: actualNegativePrompt,
      steps: validatedSteps,
      sampler_name: samplerName,
      scheduler: scheduler,
      width: validatedWidth,
      height: validatedHeight,
      cfg_scale: validatedCfgScale,
      seed: seed,
      batch_size: validatedBatchSize,
      batch_count: validatedBatchCount,
      denoising_strength: validatedDenoisingStrength,
      mask_blur: validatedMaskBlur,
      inpainting_fill: inpaintingFill,
      inpaint_full_res: inpaintFullRes,
      inpaint_full_res_padding: inpaintFullResPadding,
      sd_model_name: selectedModel || '',
      adetailers: adetailers ? cloneADetailers(adetailers) : [],
      type: IMAGE_TYPES.INPAINT
    }

    // Store raw prompts for change detection (before dynamic syntax resolution)
    const usedParamsWithRaw = {
      ...usedParams,
      prompt: rawPrompt,
      negative_prompt: rawNegativePrompt
    }
    setPendingUsedParams(usedParamsWithRaw)
    lastUsedParams.value = usedParamsWithRaw

    try {
      setBatchInfo(validatedBatchCount)
      startProgressPolling()

      // base64 이미지 추출
      const base64Image = initImage.includes(',')
        ? initImage.split(',')[1]
        : initImage

      const base64Mask = mask.includes(',')
        ? mask.split(',')[1]
        : mask

      const payload = {
        init_images: [base64Image],
        mask: base64Mask,
        prompt: actualPrompt,
        negative_prompt: actualNegativePrompt,
        steps: validatedSteps,
        sampler_name: samplerName,
        scheduler: scheduler,
        width: validatedWidth,
        height: validatedHeight,
        cfg_scale: validatedCfgScale,
        seed: seed,
        batch_size: validatedBatchSize,
        n_iter: validatedBatchCount,
        denoising_strength: validatedDenoisingStrength,
        mask_blur: validatedMaskBlur,
        inpainting_fill: inpaintingFill,
        inpaint_full_res: inpaintFullRes,
        inpaint_full_res_padding: inpaintFullResPadding,
        save_images: true,
        override_settings: {
          samples_save: true,
        },
        override_settings_restore_afterwards: false,
      }

      payload.alwayson_scripts = {}

      // ADetailer 추가
      const enabledADs = currentEnabledADetailers.value
      if (enabledADs && enabledADs.length > 0 && adetailers) {
        const adetailerArgs = adetailers.map(ad => ({
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
          "ad_steps": ad.useSeparateSteps ? ad.steps : validatedSteps,
        }))

        payload.alwayson_scripts["ADetailer"] = { "args": adetailerArgs }
      }

      // ControlNet 추가
      if (controlnetUnits) {
        const controlnetScript = buildControlNetScript(controlnetUnits)
        if (controlnetScript) {
          payload.alwayson_scripts = {
            ...payload.alwayson_scripts,
            ...controlnetScript
          }
        }
      }

      if (Object.keys(payload.alwayson_scripts).length === 0) {
        delete payload.alwayson_scripts
      }

      const response = await post('/sdapi/v1/img2img', payload)

      if (!response.ok) {
        throw new Error(t('message.error.apiErrorWithStatus', { status: response.status }))
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        const generationDuration = generationStartTime.value
          ? Date.now() - generationStartTime.value
          : null

        // Process generated images using centralized logic
        const { newImages, totalDeletedCount } = await processGeneratedImages({
          data,
          usedParams,
          expectedImageCount: validatedBatchSize * validatedBatchCount,
          generationDuration,
          wasInterrupted: wasInterrupted.value,
          imageType: IMAGE_TYPES.INPAINT,
          viewType
        })

        // Update state
        wasInterrupted.value = false
        updateStateAfterGeneration({
          newImages,
          totalDeletedCount,
          generatedImages,
          currentImage,
          lastUsedParams,
          setFinalImageReceived
        })
        consecutiveErrors.value = 0

        // Notifications and callbacks
        sendCompletionNotification({
          newImages,
          imageCount: data.images.length,
          notificationType,
          notificationVolume
        })
        callPipelineCallback(newImages, generatedImages, onCompleteCallback)
      }
    } catch (error) {
      handleGenerationError({
        error,
        consecutiveErrors,
        isInfiniteMode,
        infiniteLoopControl: { get isRunning() { return isInfiniteLoopRunning }, set isRunning(v) { isInfiniteLoopRunning = v } }
      })
    } finally {
      cleanupAfterGeneration({
        isGenerating,
        stopProgressPolling,
        progress,
        progressState
      })
    }
  }

  function setOnComplete(callback) {
    onCompleteCallback.value = callback
  }

  function cleanup() {
    stopProgressPolling()
  }

  // 탭 전환 시 상태 저장
  function saveViewState(state) {
    if (state.initImage !== undefined) savedInitImage.value = state.initImage
    if (state.mask !== undefined) savedMask.value = state.mask
    if (state.initImageWidth !== undefined) savedInitImageWidth.value = state.initImageWidth
    if (state.initImageHeight !== undefined) savedInitImageHeight.value = state.initImageHeight
  }

  // 탭 복귀 시 상태 복원
  function restoreViewState() {
    return {
      initImage: savedInitImage.value,
      mask: savedMask.value,
      initImageWidth: savedInitImageWidth.value,
      initImageHeight: savedInitImageHeight.value
    }
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
    cleanup,
    // Inpaint 전용: 탭 전환 시 상태 유지
    saveViewState,
    restoreViewState,
  }
}

/**
 * 메인 Generation Engine Composable
 * App.vue에서 한 번만 초기화됨
 */
export function useGenerationEngine(showToast, t) {
  const { saveImage } = useIndexedDB()
  const errorHandler = useErrorHandler({ showToast, t })

  // 각 뷰별 엔진 생성
  const engines = {
    txt2img: createViewEngine('txt2img', { saveImage, showToast, t, errorHandler }),
    img2img: createImg2ImgEngine({ saveImage, showToast, t, errorHandler }),
    inpaint: createInpaintEngine({ saveImage, showToast, t, errorHandler }),
  }

  // beforeunload 핸들러
  const handleBeforeUnload = (e) => {
    const anyGenerating = Object.values(engines).some(engine => engine?.isGenerating?.value)
    if (anyGenerating) {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
  }

  // 생성 중인지 전체 체크
  function isAnyGenerating() {
    return Object.values(engines).some(engine => engine?.isGenerating?.value)
  }

  // 특정 뷰가 생성 중인지 체크
  function isViewGenerating(viewType) {
    return engines[viewType]?.isGenerating?.value || false
  }

  // 엔진 가져오기
  function getEngine(viewType) {
    return engines[viewType]
  }

  // 전체 정리
  function cleanup() {
    Object.values(engines).forEach(engine => engine?.cleanup?.())
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }

  // beforeunload 리스너 등록
  window.addEventListener('beforeunload', handleBeforeUnload)

  return {
    engines,
    getEngine,
    isAnyGenerating,
    isViewGenerating,
    cleanup,
  }
}
