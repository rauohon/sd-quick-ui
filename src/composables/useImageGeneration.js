/**
 * 이미지 생성 및 진행 상태 관리 composable
 */
import { ref, watch, onUnmounted } from 'vue'
import { useIndexedDB } from './useIndexedDB'
import { useBookmarks } from './useBookmarks'
import { useErrorHandler, ErrorCategory } from './useErrorHandler'
import { cloneADetailers } from '../utils/adetailer'
import { notifyCompletion } from '../utils/notification'
import { expandRandomCombination } from '../utils/promptCombination'
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
  PARAM_RANGES
} from '../config/constants'

// Number validation helper
function validateNumber(value, min, max, defaultValue, step = null) {
  let num = Number(value)

  // NaN 체크
  if (isNaN(num)) {
    return defaultValue
  }

  // 범위 체크
  if (num < min) num = min
  if (num > max) num = max

  // Step 체크 (width, height 등)
  if (step && num % step !== 0) {
    num = Math.round(num / step) * step
  }

  return num
}

// Sleep utility function (reusable Promise for delays)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export function useImageGeneration(params, enabledADetailers, showToast, t, appliedBookmarkId = null) {
  const isGenerating = ref(false)
  const progress = ref(0)
  const progressState = ref('')
  const currentImage = ref('')
  const lastUsedParams = ref(null)
  const generatedImages = ref([])
  const isInfiniteMode = ref(false)
  const infiniteCount = ref(0)
  const wasInterrupted = ref(false) // 스킵/중단 플래그
  const finalImageReceived = ref(false) // 최종 이미지 수신 플래그
  const generationStartTime = ref(null) // 생성 시작 시간 (소요시간 계산용)
  const pendingUsedParams = ref(null) // progress 이미지 첫 등장 시 lastUsedParams로 설정될 파라미터
  const hasShownProgressImage = ref(false) // progress 이미지가 표시되었는지 플래그

  const progressInterval = ref(null)

  // IndexedDB 초기화
  const { saveImage } = useIndexedDB()

  // Error handler 초기화
  const { network, storage, generation } = useErrorHandler({ showToast, t })

  // 연속 에러 카운터
  const consecutiveErrors = ref(0)

  // 무한 생성 루프 실행 플래그 (중복 실행 방지)
  let isInfiniteLoopRunning = false

  /**
   * 페이지 로드 시 백엔드에 진행 중인 작업이 있는지 체크
   * 있으면 자동으로 polling 시작
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
          showToast?.(t('generation.ongoingDetected'), 'info')
        }
      }
    } catch (error) {
      // API가 없을 수 있음 - silent 처리
      network(error, { context: 'checkOngoingGeneration', silent: true })
    }
  }

  /**
   * 진행 상태 폴링 시작
   */
  let idleCount = 0

  function startProgressPolling() {
    // CRITICAL: 중복 실행 방지 (race condition 방지)
    // 이미 폴링이 실행 중이면 중단
    if (progressInterval.value) {
      return
    }

    // 기존 인터벌이 있으면 먼저 정리 (안전장치)
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

          // 최종 이미지를 이미 받았으면 중간 이미지로 덮어쓰지 않음
          if (data.current_image && !finalImageReceived.value) {
            currentImage.value = `data:image/png;base64,${data.current_image}`

            // 첫 progress 이미지가 나타나면 lastUsedParams 설정 (조합 결과 표시)
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
      // 중단 플래그 설정
      wasInterrupted.value = true

      // 무한 모드 먼저 중단 (루프에서 빠져나오도록)
      if (isInfiniteMode.value) {
        isInfiniteMode.value = false
        consecutiveErrors.value = 0 // 에러 카운터 리셋
      }

      // 혹시 모를 상황 대비 - 루프 플래그도 강제 리셋
      if (isInfiniteLoopRunning) {
        isInfiniteLoopRunning = false
      }

      const response = await post('/sdapi/v1/interrupt')

      if (!response.ok) {
        // API가 실패해도 계속 진행 (프론트엔드 상태는 정리)
      }

      await response.text()

      // 프론트엔드 상태 강제 정리
      stopProgressPolling()
      progress.value = 0
      progressState.value = ''

      // 잠시 후 isGenerating 상태 리셋 (백엔드가 실제로 중단될 시간 제공)
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

      // 에러가 발생해도 프론트엔드 상태는 정리
      if (isInfiniteMode.value) {
        isInfiniteMode.value = false
        consecutiveErrors.value = 0 // 에러 카운터 리셋
      }

      // 혹시 모를 상황 대비 - 루프 플래그도 강제 리셋
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
   * 현재 이미지 스킵 (배치 생성 중)
   */
  async function skipCurrentImage() {
    // 스킵 플래그 설정
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
   * 무한 모드만 해제 (현재 생성 중인 이미지는 완성)
   */
  function stopInfiniteModeOnly() {
    if (!isInfiniteMode.value) {
      return
    }

    const currentCount = infiniteCount.value

    // 무한 모드 플래그만 해제
    isInfiniteMode.value = false
    consecutiveErrors.value = 0

    // 루프 플래그는 그대로 두어 현재 생성이 완료되면 자연스럽게 종료되도록 함
    // isInfiniteLoopRunning은 startInfiniteGeneration의 while 루프에서 체크됨

    showToast(t('infiniteMode.stoppedCurrent', { count: currentCount }), 'info')
  }

  /**
   * 무한 생성 모드 토글
   */
  function toggleInfiniteMode() {
    isInfiniteMode.value = !isInfiniteMode.value

    if (isInfiniteMode.value) {
      // 이미 무한 루프가 실행 중이면 중복 실행 방지 (race condition 방지)
      if (isInfiniteLoopRunning) {
        isInfiniteMode.value = false // 플래그도 원복
        showToast(t('infiniteMode.alreadyRunning'), 'warning')
        return
      }

      // 현재 생성 중이면 경고
      if (isGenerating.value) {
        showToast(t('infiniteMode.waitingCurrent'), 'info')
      }

      infiniteCount.value = 0
      consecutiveErrors.value = 0 // 에러 카운터 리셋

      // CRITICAL: 플래그를 미리 설정해서 중복 호출 방지 (race condition 방지)
      isInfiniteLoopRunning = true

      showToast(t('infiniteMode.started'), 'success')
      // 무한 생성 시작
      startInfiniteGeneration()
    } else {
      consecutiveErrors.value = 0 // 에러 카운터 리셋
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

    // 플래그는 이미 toggleInfiniteMode에서 설정되었음 (race condition 방지)
    // 여기서는 다시 체크만 함
    if (!isInfiniteLoopRunning) {
      isInfiniteLoopRunning = true // 안전장치
    }

    // 현재 생성 중이면 먼저 완료될 때까지 대기
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

    // 무한 모드가 대기 중 꺼졌으면 종료
    if (!isInfiniteMode.value) {
      isInfiniteLoopRunning = false
      return
    }

    // seed 설정: 기준 seed가 있으면 그 근처에서 랜덤, 없으면(-1) 완전 랜덤
    const baseSeed = params.seed.value
    const useVariation = baseSeed !== -1

    try {
      while (isInfiniteMode.value) {
        // 매번 새로운 seed 생성
        if (useVariation) {
          // 기준 seed ± seedVariationRange 범위에서 랜덤
          const range = params.seedVariationRange.value
          const variation = Math.floor(Math.random() * (range * 2 + 1)) - range
          params.seed.value = Math.max(0, Math.min(SEED_MAX, baseSeed + variation))
        } else {
          // 완전 랜덤
          params.seed.value = -1
        }

        await generateImage()

        // 생성이 완료될 때까지 대기 (무한 모드가 꺼지면 즉시 중단)
        // Timeout 추가: 최대 10분 대기
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

        // 무한 모드가 꺼졌으면 중단
        if (!isInfiniteMode.value) {
          break
        }

        infiniteCount.value++

        // 에러 발생 시 대기 시간 증가 (최대 10초)
        const delayTime = Math.min(1000 + (consecutiveErrors.value * 2000), 10000)
        const delayIterations = Math.ceil(delayTime / 500)

        // 딜레이 후 다음 생성 (무한 모드가 꺼지면 즉시 중단)
        for (let i = 0; i < delayIterations && isInfiniteMode.value; i++) {
          await sleep(500)
        }
      }
    } finally {
      // 무한 모드 종료 시 seed 복원
      params.seed.value = baseSeed
      isInfiniteLoopRunning = false
    }
  }

  /**
   * 이미지 생성
   * @param {Object} overrides - Optional overrides for prompt/negativePrompt (used by queue processor)
   * @param {string} overrides.prompt - Override prompt (optional)
   * @param {string} overrides.negativePrompt - Override negative prompt (optional)
   */
  // ControlNet helper
  const { buildControlNetScript } = useControlNet()

  async function generateImage(overrides = {}) {
    const {
      prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
      width, height, batchCount, batchSize, seed,
      enableHr, hrUpscaler, hrSteps, denoisingStrength, hrUpscale,
      adetailers, selectedModel, controlnetUnits
    } = params

    // Use override prompts if provided (for queue processing), otherwise use refs
    const rawPrompt = overrides.prompt !== undefined ? overrides.prompt : prompt.value
    const rawNegativePrompt = overrides.negativePrompt !== undefined ? overrides.negativePrompt : negativePrompt.value

    // Expand combination syntax {option1|option2|...} by randomly selecting one option
    // This allows showing the combination result immediately when generation starts
    const actualPrompt = expandRandomCombination(rawPrompt)
    const actualNegativePrompt = expandRandomCombination(rawNegativePrompt)

    if (!actualPrompt.trim()) {
      showToast(t('prompt.required'), 'error')
      return
    }

    // 숫자 입력 검증 및 자동 보정 (보정된 항목 추적)
    const corrections = []

    // Width와 Height는 사용자가 입력한 값 그대로 사용 (8의 배수 검증은 입력 시점에 처리)
    width.value = validateNumber(width.value, 64, 2048, 512)
    height.value = validateNumber(height.value, 64, 2048, 512)

    const originalSteps = steps.value
    steps.value = validateNumber(steps.value, 1, 150, 20)
    if (steps.value !== originalSteps) corrections.push(`Steps: ${originalSteps} → ${steps.value}`)

    const originalCfgScale = cfgScale.value
    cfgScale.value = validateNumber(cfgScale.value, 1, 30, 7)
    if (cfgScale.value !== originalCfgScale) corrections.push(`CFG Scale: ${originalCfgScale} → ${cfgScale.value}`)

    hrSteps.value = validateNumber(hrSteps.value, 0, 150, 10)
    denoisingStrength.value = validateNumber(denoisingStrength.value, 0, 1, 0.7)
    hrUpscale.value = validateNumber(hrUpscale.value, 1, 4, 2)
    batchCount.value = validateNumber(batchCount.value, 1, 100, 1)
    batchSize.value = validateNumber(batchSize.value, 1, 8, 1)

    // ADetailer 검증
    adetailers.value.forEach(ad => {
      ad.confidence = validateNumber(ad.confidence, 0, 1, 0.3)
      ad.dilateErode = validateNumber(ad.dilateErode, -128, 128, 4)
      ad.inpaintDenoising = validateNumber(ad.inpaintDenoising, 0, 1, 0.4)
      ad.steps = validateNumber(ad.steps, 1, 150, 28)
    })

    // 파라미터 보정 알림 (주요 파라미터만)
    if (corrections.length > 0) {
      showToast(t('generation.parametersCorrected', { corrections: corrections.join(', ') }), 'warning')
    }

    isGenerating.value = true
    generationStartTime.value = Date.now() // 소요시간 측정 시작
    progress.value = 0
    progressState.value = t('generation.preparing')
    // currentImage는 초기화하지 않음 - progress에서 current_image가 올 때까지 직전 이미지 유지
    finalImageReceived.value = false // 플래그 리셋
    hasShownProgressImage.value = false // progress 이미지 플래그 리셋

    // Save parameters used for generation (with expanded prompts)
    const usedParams = {
      prompt: actualPrompt,
      negative_prompt: actualNegativePrompt,
      steps: steps.value,
      sampler_name: samplerName.value,
      scheduler: scheduler.value,
      width: width.value,
      height: height.value,
      cfg_scale: cfgScale.value,
      seed: seed.value,
      batch_size: batchSize.value,
      batch_count: batchCount.value,
      hr_upscaler: hrUpscaler.value,
      hr_steps: hrSteps.value,
      denoising_strength: denoisingStrength.value,
      hr_scale: hrUpscale.value,
      sd_model_name: selectedModel?.value || '',
      adetailers: cloneADetailers(adetailers.value),
    }

    // Store expanded params for later (will be set when progress image first appears)
    pendingUsedParams.value = usedParams

    // Update lastUsedParams with raw prompts to clear "changed" indicator
    // The expanded prompt will be set when progress image appears
    lastUsedParams.value = {
      ...usedParams,
      prompt: rawPrompt,
      negative_prompt: rawNegativePrompt
    }

    try {
      // Start progress polling
      startProgressPolling()

      // Prepare API payload
      const payload = {
        prompt: actualPrompt,
        negative_prompt: actualNegativePrompt,
        steps: steps.value,
        sampler_name: samplerName.value,
        scheduler: scheduler.value,
        width: width.value,
        height: height.value,
        cfg_scale: cfgScale.value,
        seed: seed.value,
        batch_size: batchSize.value,
        n_iter: batchCount.value,
        enable_hr: enableHr.value,
        hr_upscaler: hrUpscaler.value,
        hr_second_pass_steps: hrSteps.value,
        denoising_strength: denoisingStrength.value,
        hr_scale: hrUpscale.value,
        save_images: true,
        override_settings: {
          samples_save: true,
          save_images_before_highres_fix: false,
          save_images_before_face_restoration: false,
        },
        override_settings_restore_afterwards: false,
      }

      // Initialize alwayson_scripts
      payload.alwayson_scripts = {}

      // Add ADetailer if any enabled
      if (enabledADetailers.value.length > 0) {
        // ADetailer expects ALL model slots (4 total)
        // Send all 4, but only enabled ones have actual model, others are "None"
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

        payload.alwayson_scripts["ADetailer"] = {
          "args": adetailerArgs
        }
      }

      // Add ControlNet if any units enabled
      if (controlnetUnits?.value) {
        const controlnetScript = buildControlNetScript(controlnetUnits.value)
        if (controlnetScript) {
          payload.alwayson_scripts = {
            ...payload.alwayson_scripts,
            ...controlnetScript
          }
        }
      }

      // Remove empty alwayson_scripts
      if (Object.keys(payload.alwayson_scripts).length === 0) {
        delete payload.alwayson_scripts
      }

      const response = await post('/sdapi/v1/txt2img', payload)

      if (!response.ok) {
        throw new Error(t('message.error.apiErrorWithStatus', { status: response.status }))
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        // 소요시간 계산
        const generationDuration = generationStartTime.value
          ? Date.now() - generationStartTime.value
          : null

        // Parse info to get actual values used (seeds, prompts for batch)
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

        // Process all images from batch
        const newImages = []
        let totalDeletedCount = 0

        for (let i = 0; i < data.images.length; i++) {
          const imageSeed = allSeeds[i] !== undefined ? allSeeds[i] : actualSeed

          // Add actual values to params for this image
          const paramsWithActualSeed = {
            ...usedParams,
            actual_seed: imageSeed,
            prompt: allPrompts[i] || usedParams.prompt,
            negative_prompt: allNegativePrompts[i] || usedParams.negative_prompt
          }

          const newImage = {
            image: `data:image/png;base64,${data.images[i]}`,
            info: data.info,
            params: paramsWithActualSeed,
            timestamp: new Date().toISOString(),
            duration: generationDuration, // 소요시간 (밀리초)
            favorite: false,
            interrupted: wasInterrupted.value
          }

          // Save to IndexedDB
          try {
            const result = await saveImage(newImage)
            newImage.id = result.id

            // Auto-link thumbnail if bookmark was applied (only for first image)
            if (i === 0 && appliedBookmarkId && appliedBookmarkId.value) {
              try {
                const { setBookmarkThumbnail } = useBookmarks()
                setBookmarkThumbnail(appliedBookmarkId.value, result.id)
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

        // 200장 초과로 삭제된 이미지가 있으면 알림
        if (totalDeletedCount > 0) {
          showToast(t('generation.autoDeleted', { count: totalDeletedCount }), 'info')
        }

        // 중단 플래그 리셋
        wasInterrupted.value = false

        // Add all images to memory (newest first)
        // Use new array assignment to ensure reactivity
        const combined = [...newImages, ...generatedImages.value]
        generatedImages.value = combined.slice(0, MAX_IMAGES)

        // 최종 이미지 설정 (첫 번째 이미지를 미리보기로)
        finalImageReceived.value = true
        currentImage.value = generatedImages.value[0].image
        lastUsedParams.value = newImages[0].params

        // 성공 시 에러 카운터 리셋
        consecutiveErrors.value = 0

        // 생성 완료 알림 (중단되지 않은 경우만)
        if (!newImages[0].interrupted && params.notificationType?.value) {
          notifyCompletion(params.notificationType.value, {
            volume: params.notificationVolume?.value || 0.5,
            imageInfo: {
              size: `${newImages[0].params.width}x${newImages[0].params.height}`,
              count: data.images.length
            }
          })
        }
      }
    } catch (error) {
      console.error(t('message.error.generationFailed'), error)

      // 에러 카운터 증가
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

      // 무한 모드일 때 연속 에러 체크
      if (isInfiniteMode.value && consecutiveErrors.value >= MAX_CONSECUTIVE_ERRORS) {
        isInfiniteMode.value = false
        isInfiniteLoopRunning = false // 루프 플래그도 리셋
        showToast(t('infiniteMode.autoStopped', { count: MAX_CONSECUTIVE_ERRORS }), 'error')
        console.warn(`Infinite mode auto-stopped after ${consecutiveErrors.value} consecutive errors`)
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

  // Prevent page reload during image generation
  const handleBeforeUnload = (e) => {
    if (isGenerating.value) {
      e.preventDefault()
      e.returnValue = '' // Chrome requires returnValue to be set
      return '' // For older browsers
    }
  }

  // Watch isGenerating to add/remove beforeunload listener
  watch(isGenerating, (generating) => {
    if (generating) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  })

  // Cleanup on component unmount to prevent memory leak
  onUnmounted(() => {
    stopProgressPolling()
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

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
    checkOngoingGeneration,
  }
}
