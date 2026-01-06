/**
 * usePipeline - Pipeline execution engine for multi-step image generation
 *
 * Manages automatic sequential execution of generation steps:
 * txt2img -> img2img -> inpaint (or any combination)
 *
 * Singleton pattern - shared across all components
 */

import { ref, computed } from 'vue'

// Singleton state
const steps = ref([])
const currentStepIndex = ref(-1)
const isRunning = ref(false)
const isPaused = ref(false)

// Callbacks registered by views
const viewCallbacks = ref({
  txt2img: null,
  img2img: null,
  inpaint: null
})

// View ready state (set after initialization complete)
const viewReady = ref({
  txt2img: false,
  img2img: false,
  inpaint: false
})

// Tab switch callback (set by App.vue)
let switchTabCallback = null

// Toast callback (set by App.vue)
let showToastCallback = null

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

  // Register view callback for generation trigger
  function registerView(viewType, callbacks) {
    viewCallbacks.value[viewType] = callbacks
  }

  // Unregister view callback
  function unregisterView(viewType) {
    viewCallbacks.value[viewType] = null
    viewReady.value[viewType] = false
  }

  // Mark view as ready (call after initialization complete)
  function setViewReady(viewType, ready = true) {
    viewReady.value[viewType] = ready
  }

  // Set tab switch callback (called from App.vue)
  function setSwitchTabCallback(callback) {
    switchTabCallback = callback
  }

  // Set toast callback (called from App.vue)
  function setShowToastCallback(callback) {
    showToastCallback = callback
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

  // Start pipeline execution
  async function startPipeline() {
    if (steps.value.length === 0) {
      console.warn('Pipeline: No steps to execute')
      return false
    }

    if (isRunning.value) {
      console.warn('Pipeline: Already running')
      return false
    }

    // Reset all steps to pending
    steps.value.forEach(step => {
      step.status = 'pending'
      step.outputImage = null
    })

    isRunning.value = true
    isPaused.value = false
    currentStepIndex.value = 0

    // Execute first step
    await executeCurrentStep()
    return true
  }

  // Execute current step
  async function executeCurrentStep() {
    const step = currentStep.value
    if (!step) {
      console.warn('Pipeline: No current step')
      stopPipeline()
      return
    }

    // Switch to the appropriate tab first
    if (switchTabCallback) {
      switchTabCallback(step.type)
    }

    // Wait for the view to be mounted, registered, AND ready (max 5 seconds)
    let viewCallback = null
    let isReady = false
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      viewCallback = viewCallbacks.value[step.type]
      isReady = viewReady.value[step.type]
      if (viewCallback && viewCallback.generate && isReady) {
        break
      }
    }

    if (!viewCallback || !viewCallback.generate || !isReady) {
      console.error(`Pipeline: View ${step.type} not ready after waiting (callback: ${!!viewCallback}, ready: ${isReady})`)
      step.status = 'failed'
      stopPipeline()
      return
    }

    // Set input image if available (for img2img/inpaint)
    if (step.inputImage && viewCallback.setInputImage) {
      viewCallback.setInputImage(step.inputImage)
      // Wait for image to load
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Apply step override settings if available
    if (step.settings && viewCallback.applyOverrides) {
      viewCallback.applyOverrides(step.settings)
      // Wait for settings to apply
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Mark step as running
    step.status = 'running'

    // Trigger generation
    try {
      viewCallback.generate()
    } catch (error) {
      console.error('Pipeline: Generation failed', error)
      step.status = 'failed'
      stopPipeline()
    }
  }

  // Called when a generation completes (from view)
  function onStepComplete(viewType, outputImage) {
    if (!isRunning.value || isPaused.value) return

    const step = currentStep.value
    if (!step || step.type !== viewType) return

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
        if (showToastCallback) {
          showToastCallback(`이미지 전달: ${step.type} → ${nextStep.type}`, 'success')
        }
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

    // View registration
    registerView,
    unregisterView,
    setViewReady,
    setSwitchTabCallback,
    setShowToastCallback,

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

    // Quick helpers
    createTxt2ImgToImg2Img,
    createTxt2ImgToInpaint,
    createFullPipeline
  }
}
