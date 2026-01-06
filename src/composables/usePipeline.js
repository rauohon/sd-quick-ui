/**
 * usePipeline - Pipeline execution engine for multi-step image generation
 *
 * Manages automatic sequential execution of generation steps:
 * txt2img -> img2img -> inpaint (or any combination)
 *
 * Now uses generationEngine directly - no tab switching required!
 *
 * Singleton pattern - shared across all components
 */

import { ref, computed } from 'vue'

// Singleton state
const steps = ref([])
const currentStepIndex = ref(-1)
const isRunning = ref(false)
const isPaused = ref(false)

// Generation engine reference (set from WorkflowView)
let generationEngine = null

// Toast callback (set by App.vue)
let showToastCallback = null

// Default parameters for generation (can be set from WorkflowView)
const defaultParams = ref({
  prompt: '',
  negativePrompt: '',
  steps: 20,
  cfgScale: 7,
  samplerName: 'Euler a',
  scheduler: 'automatic',
  width: 512,
  height: 512,
  batchCount: 1,
  batchSize: 1,
  seed: -1,
  denoisingStrength: 0.75,
  maskBlur: 4,
  inpaintingFill: 1,
  inpaintFullRes: 0,
  inpaintFullResPadding: 32
})

// Current step's engine state (for UI binding)
const currentEngineState = ref({
  isGenerating: false,
  progress: 0,
  progressState: '',
  currentImage: ''
})

/**
 * Pipeline step structure:
 * {
 *   id: string,
 *   type: 'txt2img' | 'img2img' | 'inpaint',
 *   status: 'pending' | 'running' | 'completed' | 'failed',
 *   inputImage: string | null,  // base64 image (for img2img/inpaint)
 *   outputImage: string | null, // result image after completion
 *   settings: object | null     // optional: override settings for this step
 * }
 */

// Generate unique step ID
let stepIdCounter = 0
function generateStepId() {
  return `step_${Date.now()}_${++stepIdCounter}`
}

// Progress polling interval for current engine
let progressPollInterval = null

function startProgressPolling() {
  if (progressPollInterval) return

  progressPollInterval = setInterval(() => {
    const step = steps.value[currentStepIndex.value]
    if (!step || !generationEngine) return

    const engine = generationEngine.getEngine(step.type)
    if (!engine) return

    currentEngineState.value = {
      isGenerating: engine.isGenerating?.value || false,
      progress: engine.progress?.value || 0,
      progressState: engine.progressState?.value || '',
      currentImage: engine.currentImage?.value || ''
    }
  }, 100)
}

function stopProgressPolling() {
  if (progressPollInterval) {
    clearInterval(progressPollInterval)
    progressPollInterval = null
  }
  currentEngineState.value = {
    isGenerating: false,
    progress: 0,
    progressState: '',
    currentImage: ''
  }
}

export function usePipeline() {

  // Computed properties
  const currentStep = computed(() => {
    if (currentStepIndex.value < 0 || currentStepIndex.value >= steps.value.length) {
      return null
    }
    return steps.value[currentStepIndex.value]
  })

  const hasSteps = computed(() => steps.value.length > 0)

  const completedSteps = computed(() =>
    steps.value.filter(s => s.status === 'completed').length
  )

  const progress = computed(() => {
    if (steps.value.length === 0) return 0
    return Math.round((completedSteps.value / steps.value.length) * 100)
  })

  // Set generation engine (called from WorkflowView)
  function setGenerationEngine(engine) {
    generationEngine = engine
  }

  // Set toast callback (called from App.vue)
  function setShowToastCallback(callback) {
    showToastCallback = callback
  }

  // Set default parameters
  function setDefaultParams(params) {
    defaultParams.value = { ...defaultParams.value, ...params }
  }

  // Get default parameters
  function getDefaultParams() {
    return defaultParams.value
  }

  // Add a step to the pipeline
  function addStep(type, options = {}) {
    const step = {
      id: generateStepId(),
      type,
      status: 'pending',
      inputImage: options.inputImage || null,
      outputImage: null,
      settings: options.settings || null
    }
    steps.value.push(step)
    return step.id
  }

  // Remove a step by ID
  function removeStep(stepId) {
    const index = steps.value.findIndex(s => s.id === stepId)
    if (index !== -1) {
      steps.value.splice(index, 1)
    }
  }

  // Clear all steps
  function clearSteps() {
    steps.value = []
    currentStepIndex.value = -1
    isRunning.value = false
    isPaused.value = false
    stopProgressPolling()
  }

  // Move step up/down
  function moveStep(stepId, direction) {
    const index = steps.value.findIndex(s => s.id === stepId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= steps.value.length) return

    const temp = steps.value[index]
    steps.value[index] = steps.value[newIndex]
    steps.value[newIndex] = temp
  }

  // Update step settings (for overrides)
  function updateStepSettings(stepId, settings) {
    const step = steps.value.find(s => s.id === stepId)
    if (step) {
      step.settings = settings
    }
  }

  // Get step by ID
  function getStep(stepId) {
    return steps.value.find(s => s.id === stepId)
  }

  // Build parameters for a step
  function buildStepParams(step) {
    const defaults = defaultParams.value
    const overrides = step.settings || {}

    // Base parameters
    const params = {
      prompt: overrides.prompt || defaults.prompt,
      negativePrompt: overrides.negativePrompt || defaults.negativePrompt,
      steps: overrides.steps || defaults.steps,
      cfgScale: overrides.cfgScale || defaults.cfgScale,
      samplerName: defaults.samplerName,
      scheduler: defaults.scheduler,
      width: defaults.width,
      height: defaults.height,
      batchCount: defaults.batchCount,
      batchSize: defaults.batchSize,
      seed: defaults.seed,
      adetailers: [],
      enabledADetailers: [],
      selectedModel: defaults.selectedModel || '',
      notificationType: defaults.notificationType,
      notificationVolume: defaults.notificationVolume
    }

    // img2img / inpaint specific
    if (step.type === 'img2img' || step.type === 'inpaint') {
      params.initImage = step.inputImage
      params.denoisingStrength = overrides.denoisingStrength || defaults.denoisingStrength
    }

    // inpaint specific
    if (step.type === 'inpaint') {
      params.maskBlur = overrides.maskBlur || defaults.maskBlur
      params.inpaintingFill = defaults.inpaintingFill
      params.inpaintFullRes = overrides.inpaintFullRes !== undefined
        ? overrides.inpaintFullRes
        : defaults.inpaintFullRes
      params.inpaintFullResPadding = defaults.inpaintFullResPadding
      // For inpaint without mask, use full image mask (all white)
      params.mask = step.mask || null
    }

    // Debug logging
    console.log(`[Pipeline] Step ${step.type} params:`, {
      prompt: params.prompt?.substring(0, 50) + (params.prompt?.length > 50 ? '...' : ''),
      negativePrompt: params.negativePrompt?.substring(0, 30) + (params.negativePrompt?.length > 30 ? '...' : ''),
      steps: params.steps,
      cfgScale: params.cfgScale,
      denoisingStrength: params.denoisingStrength,
      hasOverrides: Object.keys(overrides).length > 0,
      overrideKeys: Object.keys(overrides)
    })

    return params
  }

  // Start pipeline execution
  async function startPipeline() {
    if (steps.value.length === 0) {
      console.warn('Pipeline: No steps to execute')
      showToastCallback?.('파이프라인에 스텝이 없습니다', 'warning')
      return false
    }

    if (isRunning.value) {
      console.warn('Pipeline: Already running')
      return false
    }

    if (!generationEngine) {
      console.error('Pipeline: Generation engine not set')
      showToastCallback?.('생성 엔진이 설정되지 않았습니다', 'error')
      return false
    }

    // Validate that each step has a prompt (either default or override)
    const hasDefaultPrompt = defaultParams.value.prompt?.trim()
    console.log('[Pipeline] Starting pipeline validation:', {
      hasDefaultPrompt: !!hasDefaultPrompt,
      defaultPrompt: defaultParams.value.prompt?.substring(0, 30) || '(empty)',
      stepsCount: steps.value.length,
      stepsWithOverrides: steps.value.filter(s => s.settings).map(s => ({
        type: s.type,
        overrideKeys: Object.keys(s.settings || {})
      }))
    })

    for (const step of steps.value) {
      const hasOverridePrompt = step.settings?.prompt?.trim()
      if (!hasDefaultPrompt && !hasOverridePrompt) {
        showToastCallback?.(`${step.type} 스텝에 프롬프트가 필요합니다 (기본 또는 오버라이드)`, 'warning')
        return false
      }
    }

    // Reset all steps to pending
    steps.value.forEach(step => {
      step.status = 'pending'
      step.outputImage = null
    })

    isRunning.value = true
    isPaused.value = false
    currentStepIndex.value = 0

    // Start progress polling
    startProgressPolling()

    // Execute first step
    await executeCurrentStep()
    return true
  }

  // Execute current step using generationEngine directly
  async function executeCurrentStep() {
    const step = currentStep.value
    if (!step) {
      console.warn('Pipeline: No current step')
      stopPipeline()
      return
    }

    if (!generationEngine) {
      console.error('Pipeline: Generation engine not available')
      step.status = 'failed'
      stopPipeline()
      return
    }

    // Get the engine for this step type
    const engine = generationEngine.getEngine(step.type)
    if (!engine) {
      console.error(`Pipeline: Engine for ${step.type} not available`)
      step.status = 'failed'
      stopPipeline()
      return
    }

    // Check if img2img/inpaint has input image
    if ((step.type === 'img2img' || step.type === 'inpaint') && !step.inputImage) {
      console.error(`Pipeline: ${step.type} requires input image`)
      step.status = 'failed'
      showToastCallback?.(`${step.type}에 입력 이미지가 필요합니다`, 'error')
      stopPipeline()
      return
    }

    // Mark step as running
    step.status = 'running'

    // Build parameters for this step
    const params = buildStepParams(step)

    // Set completion callback
    engine.setOnComplete((outputImage) => {
      onStepComplete(step.type, outputImage)
    })

    // Trigger generation
    try {
      showToastCallback?.(`${step.type} 생성 시작`, 'info')
      await engine.generateImage(params)
    } catch (error) {
      console.error('Pipeline: Generation failed', error)
      step.status = 'failed'
      showToastCallback?.(`생성 실패: ${error.message}`, 'error')
      stopPipeline()
    }
  }

  // Called when a generation completes
  function onStepComplete(viewType, outputImage) {
    if (!isRunning.value || isPaused.value) return

    const step = currentStep.value
    if (!step || step.type !== viewType) return

    // Debug logging
    console.log(`[Pipeline] Step ${step.type} completed:`, {
      stepIndex: currentStepIndex.value + 1,
      totalSteps: steps.value.length,
      hasOutputImage: !!outputImage,
      usedOverrides: step.settings ? Object.keys(step.settings) : []
    })

    // Save output image
    step.outputImage = outputImage
    step.status = 'completed'

    // Check if there are more steps
    if (currentStepIndex.value < steps.value.length - 1) {
      // Pass output to next step as input
      const nextStep = steps.value[currentStepIndex.value + 1]
      if (nextStep.type !== 'txt2img') {
        nextStep.inputImage = outputImage

        // Show toast for image transfer
        showToastCallback?.(`이미지 전달: ${step.type} → ${nextStep.type}`, 'success')
      }

      // Move to next step
      currentStepIndex.value++

      // Small delay before next step
      setTimeout(() => {
        if (isRunning.value && !isPaused.value) {
          executeCurrentStep()
        }
      }, 500)
    } else {
      // Pipeline complete
      showToastCallback?.('파이프라인 완료!', 'success')
      stopPipeline()
    }
  }

  // Pause pipeline
  function pausePipeline() {
    if (isRunning.value) {
      isPaused.value = true
    }
  }

  // Resume pipeline
  function resumePipeline() {
    if (isRunning.value && isPaused.value) {
      isPaused.value = false
      executeCurrentStep()
    }
  }

  // Stop pipeline
  function stopPipeline() {
    isRunning.value = false
    isPaused.value = false
    currentStepIndex.value = -1
    stopProgressPolling()
  }

  // Interrupt current generation
  async function interruptPipeline() {
    const step = currentStep.value
    if (!step || !generationEngine) return

    const engine = generationEngine.getEngine(step.type)
    if (engine?.interruptGeneration) {
      await engine.interruptGeneration()
    }

    step.status = 'failed'
    stopPipeline()
  }

  // Quick pipeline creation helpers
  function createTxt2ImgToImg2Img() {
    clearSteps()
    addStep('txt2img')
    addStep('img2img')
  }

  function createTxt2ImgToInpaint() {
    clearSteps()
    addStep('txt2img')
    addStep('inpaint')
  }

  function createFullPipeline() {
    clearSteps()
    addStep('txt2img')
    addStep('img2img')
    addStep('inpaint')
  }

  return {
    // State
    steps,
    currentStepIndex,
    currentStep,
    isRunning,
    isPaused,
    hasSteps,
    completedSteps,
    progress,
    defaultParams,
    currentEngineState,

    // Engine setup
    setGenerationEngine,
    setShowToastCallback,
    setDefaultParams,
    getDefaultParams,

    // Step management
    addStep,
    removeStep,
    clearSteps,
    moveStep,
    updateStepSettings,
    getStep,

    // Pipeline execution
    startPipeline,
    onStepComplete,
    pausePipeline,
    resumePipeline,
    stopPipeline,
    interruptPipeline,

    // Quick helpers
    createTxt2ImgToImg2Img,
    createTxt2ImgToInpaint,
    createFullPipeline
  }
}
