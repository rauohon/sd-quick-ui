/**
 * Generation Engine - App.vue 레벨에서 이미지 생성을 관리
 * 탭 전환 시에도 생성이 유지되도록 함
 */
import { ref, reactive, watch, onUnmounted } from 'vue'
import { useIndexedDB } from './useIndexedDB'
import { useBookmarks } from './useBookmarks'
import { useErrorHandler } from './useErrorHandler'
import { cloneADetailers } from '../utils/adetailer'
import { notifyCompletion } from '../utils/notification'
import { expandRandomCombination } from '../utils/promptCombination'
import { validateNumber, sleep } from '../utils/paramValidation'
import { get, post } from '../api/client'
import { useControlNet } from './useControlNet'
import {
  SEED_MAX,
  MAX_CONSECUTIVE_ERRORS,
  MAX_IDLE_COUNT,
  PROGRESS_POLL_INTERVAL,
  GENERATION_TIMEOUT,
  INFINITE_MODE_INITIAL_WAIT,
  MAX_IMAGES,
  PARAM_RANGES,
  IMAGE_TYPES
} from '../config/constants'

/**
 * 뷰별 생성 상태를 관리하는 엔진
 */
function createViewEngine(viewType, { saveImage, showToast, t, errorHandler }) {
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
  const onCompleteCallback = ref(null)
  const progressInterval = ref(null)
  const consecutiveErrors = ref(0)

  // 무한 생성 루프 실행 플래그
  let isInfiniteLoopRunning = false
  let idleCount = 0

  // 현재 생성 요청 파라미터 (탭 전환 후에도 유지)
  const currentParams = ref(null)
  const currentEnabledADetailers = ref([])
  const appliedBookmarkIdRef = ref(null)

  const { network, storage, generation } = errorHandler

  /**
   * 진행 상태 폴링 시작
   */
  function startProgressPolling() {
    if (progressInterval.value) return

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

          // Update progress state text
          let stateText = ''
          if (data.textinfo) {
            stateText = data.textinfo
          } else if (data.state) {
            const state = data.state
            const parts = []
            if (state.job_count > 1) {
              parts.push(t('generation.imageCount', { current: state.job_no, total: state.job_count }))
            }
            if (state.job) parts.push(state.job)
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

  /**
   * 진행 상태 폴링 중지
   */
  function stopProgressPolling() {
    if (progressInterval.value) {
      clearInterval(progressInterval.value)
      progressInterval.value = null
    }
    idleCount = 0
  }

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
   */
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

    const params = currentParams.value
    if (!params) {
      showToast(t('infiniteMode.noParams'), 'error')
      isInfiniteMode.value = false
      isInfiniteLoopRunning = false
      return
    }

    const baseSeed = params.seed
    const useVariation = baseSeed !== -1

    try {
      while (isInfiniteMode.value) {
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
    finalImageReceived.value = false
    hasShownProgressImage.value = false
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

    pendingUsedParams.value = usedParams
    lastUsedParams.value = {
      ...usedParams,
      prompt: rawPrompt,
      negative_prompt: rawNegativePrompt
    }

    try {
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

        // Parse info
        let actualSeed = usedParams.seed
        let allSeeds = []
        let allPrompts = []
        let allNegativePrompts = []
        try {
          const info = JSON.parse(data.info)
          if (info.seed !== undefined) actualSeed = info.seed
          if (info.all_seeds) allSeeds = info.all_seeds
          if (info.all_prompts) allPrompts = info.all_prompts
          if (info.all_negative_prompts) allNegativePrompts = info.all_negative_prompts
        } catch (e) { /* ignore */ }

        const newImages = []
        let totalDeletedCount = 0

        const expectedImageCount = validatedBatchSize * validatedBatchCount
        const actualImageCount = Math.min(expectedImageCount, data.images.length)

        for (let i = 0; i < actualImageCount; i++) {
          const imageSeed = allSeeds[i] !== undefined ? allSeeds[i] : actualSeed

          const paramsWithActualSeed = {
            ...usedParams,
            seed: imageSeed,
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
            viewType: viewType // 어느 뷰에서 생성했는지 기록
          }

          try {
            const result = await saveImage(newImage)
            newImage.id = result.id

            // Auto-link thumbnail if bookmark was applied
            if (i === 0 && appliedBookmarkIdRef.value) {
              try {
                const { setBookmarkThumbnail } = useBookmarks()
                setBookmarkThumbnail(appliedBookmarkIdRef.value, result.id)
              } catch (error) {
                storage(error, { context: 'autoLinkThumbnail', silent: true })
              }
            }

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

        // 생성 완료 알림
        if (!newImages[0].interrupted && notificationType) {
          notifyCompletion(notificationType, {
            volume: notificationVolume || 0.5,
            imageInfo: {
              size: `${newImages[0].params.width}x${newImages[0].params.height}`,
              count: data.images.length
            }
          })
        }

        // 파이프라인 콜백 호출
        if (!newImages[0].interrupted && onCompleteCallback.value) {
          onCompleteCallback.value(generatedImages.value[0].image)
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
      consecutiveErrors.value++

      let message = t('message.error.generationFailed')

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        message = t('message.error.connectionFailed')
      } else if (error.message.includes(t('message.error.apiErrorWithStatus', { status: '' }))) {
        const statusMatch = error.message.match(/\d+/)
        const status = statusMatch ? parseInt(statusMatch[0]) : null

        switch (status) {
          case 401: message = t('message.error.authRequired'); break
          case 403: message = t('message.error.accessDenied'); break
          case 500: message = t('message.error.serverInternalError'); break
          case 503: message = t('message.error.noResponse'); break
          default: message = t('message.error.serverError', { status })
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
  const onCompleteCallback = ref(null)
  const progressInterval = ref(null)
  const consecutiveErrors = ref(0)

  let isInfiniteLoopRunning = false
  let idleCount = 0

  const currentParams = ref(null)
  const currentEnabledADetailers = ref([])

  const { network, storage, generation } = errorHandler
  const { buildControlNetScript } = useControlNet()

  function startProgressPolling() {
    if (progressInterval.value) return

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
            if (state.job) parts.push(state.job)
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
    if (!isInfiniteMode.value) return
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

    const params = currentParams.value
    if (!params) {
      showToast(t('infiniteMode.noParams'), 'error')
      isInfiniteMode.value = false
      isInfiniteLoopRunning = false
      return
    }

    const baseSeed = params.seed
    const useVariation = baseSeed !== -1

    try {
      while (isInfiniteMode.value) {
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
    finalImageReceived.value = false
    hasShownProgressImage.value = false
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

    pendingUsedParams.value = usedParams
    lastUsedParams.value = {
      ...usedParams,
      prompt: rawPrompt,
      negative_prompt: rawNegativePrompt
    }

    try {
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

        let actualSeed = usedParams.seed
        let allSeeds = []
        let allPrompts = []
        let allNegativePrompts = []
        try {
          const info = JSON.parse(data.info)
          if (info.seed !== undefined) actualSeed = info.seed
          if (info.all_seeds) allSeeds = info.all_seeds
          if (info.all_prompts) allPrompts = info.all_prompts
          if (info.all_negative_prompts) allNegativePrompts = info.all_negative_prompts
        } catch (e) { /* ignore */ }

        const newImages = []
        let totalDeletedCount = 0

        const expectedImageCount = validatedBatchSize * validatedBatchCount
        const actualImageCount = Math.min(expectedImageCount, data.images.length)

        for (let i = 0; i < actualImageCount; i++) {
          const imageSeed = allSeeds[i] !== undefined ? allSeeds[i] : actualSeed

          const paramsWithActualSeed = {
            ...usedParams,
            seed: imageSeed,
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
            type: IMAGE_TYPES.IMG2IMG,
            viewType: viewType
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

        // 생성 완료 알림
        if (!newImages[0].interrupted && notificationType) {
          notifyCompletion(notificationType, {
            volume: notificationVolume || 0.5,
            imageInfo: {
              size: `${newImages[0].params.width}x${newImages[0].params.height}`,
              count: data.images.length
            }
          })
        }

        // 파이프라인 콜백 호출
        if (!newImages[0].interrupted && onCompleteCallback.value) {
          onCompleteCallback.value(generatedImages.value[0].image)
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
      consecutiveErrors.value++

      let message = t('message.error.generationFailed')

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        message = t('message.error.connectionFailed')
      } else if (error.message.includes(t('message.error.apiErrorWithStatus', { status: '' }))) {
        const statusMatch = error.message.match(/\d+/)
        const status = statusMatch ? parseInt(statusMatch[0]) : null

        switch (status) {
          case 401: message = t('message.error.authRequired'); break
          case 403: message = t('message.error.accessDenied'); break
          case 500: message = t('message.error.serverInternalError'); break
          case 503: message = t('message.error.noResponse'); break
          default: message = t('message.error.serverError', { status })
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
  const onCompleteCallback = ref(null)
  const progressInterval = ref(null)
  const consecutiveErrors = ref(0)

  // 탭 전환 시 유지할 상태
  const savedInitImage = ref('')
  const savedMask = ref('')
  const savedInitImageWidth = ref(0)
  const savedInitImageHeight = ref(0)

  let isInfiniteLoopRunning = false
  let idleCount = 0

  const currentParams = ref(null)
  const currentEnabledADetailers = ref([])

  const { network, storage, generation } = errorHandler
  const { buildControlNetScript } = useControlNet()

  function startProgressPolling() {
    if (progressInterval.value) return

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
            if (state.job) parts.push(state.job)
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
    if (!isInfiniteMode.value) return
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

    const params = currentParams.value
    if (!params) {
      showToast(t('infiniteMode.noParams'), 'error')
      isInfiniteMode.value = false
      isInfiniteLoopRunning = false
      return
    }

    const baseSeed = params.seed
    const useVariation = baseSeed !== -1

    try {
      while (isInfiniteMode.value) {
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
    finalImageReceived.value = false
    hasShownProgressImage.value = false
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

    pendingUsedParams.value = usedParams
    lastUsedParams.value = {
      ...usedParams,
      prompt: rawPrompt,
      negative_prompt: rawNegativePrompt
    }

    try {
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

        let actualSeed = usedParams.seed
        let allSeeds = []
        let allPrompts = []
        let allNegativePrompts = []
        try {
          const info = JSON.parse(data.info)
          if (info.seed !== undefined) actualSeed = info.seed
          if (info.all_seeds) allSeeds = info.all_seeds
          if (info.all_prompts) allPrompts = info.all_prompts
          if (info.all_negative_prompts) allNegativePrompts = info.all_negative_prompts
        } catch (e) { /* ignore */ }

        const newImages = []
        let totalDeletedCount = 0

        const expectedImageCount = validatedBatchSize * validatedBatchCount
        const actualImageCount = Math.min(expectedImageCount, data.images.length)

        for (let i = 0; i < actualImageCount; i++) {
          const imageSeed = allSeeds[i] !== undefined ? allSeeds[i] : actualSeed

          const paramsWithActualSeed = {
            ...usedParams,
            seed: imageSeed,
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
            type: IMAGE_TYPES.INPAINT,
            viewType: viewType
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

        // 생성 완료 알림
        if (!newImages[0].interrupted && notificationType) {
          notifyCompletion(notificationType, {
            volume: notificationVolume || 0.5,
            imageInfo: {
              size: `${newImages[0].params.width}x${newImages[0].params.height}`,
              count: data.images.length
            }
          })
        }

        // 파이프라인 콜백 호출
        if (!newImages[0].interrupted && onCompleteCallback.value) {
          onCompleteCallback.value(generatedImages.value[0].image)
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
      consecutiveErrors.value++

      let message = t('message.error.generationFailed')

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        message = t('message.error.connectionFailed')
      } else if (error.message.includes(t('message.error.apiErrorWithStatus', { status: '' }))) {
        const statusMatch = error.message.match(/\d+/)
        const status = statusMatch ? parseInt(statusMatch[0]) : null

        switch (status) {
          case 401: message = t('message.error.authRequired'); break
          case 403: message = t('message.error.accessDenied'); break
          case 500: message = t('message.error.serverInternalError'); break
          case 503: message = t('message.error.noResponse'); break
          default: message = t('message.error.serverError', { status })
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
