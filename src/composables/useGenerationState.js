import { ref, computed } from 'vue'
import { createADetailerPreset } from '../config/constants'
import { useNotificationSettings } from './useNotificationSettings'

/**
 * 이미지 생성 파라미터 상태 관리 composable
 * 모든 생성 관련 refs와 기본값을 중앙 관리
 *
 * @returns {Object} 생성 파라미터 관련 상태와 함수들
 */
export function useGenerationState() {
  // ===== Quick settings =====
  const prompt = ref('')
  const negativePrompt = ref('')
  const steps = ref(20)
  const cfgScale = ref(7)
  const selectedModel = ref('')

  // ===== Advanced settings =====
  const samplerName = ref('Euler a')
  const scheduler = ref('Automatic')
  const width = ref(512)
  const height = ref(512)
  const batchCount = ref(1)
  const batchSize = ref(1)
  const seed = ref(-1)
  const seedVariationRange = ref(100)

  // ===== Hires fix settings =====
  const enableHr = ref(true)
  const hrUpscaler = ref('Latent')
  const hrSteps = ref(10)
  const denoisingStrength = ref(0.7)
  const hrUpscale = ref(2)

  // ===== ADetailer settings =====
  const adetailers = ref([
    createADetailerPreset('face_yolov8n.pt'),
    createADetailerPreset('hand_yolov8n.pt'),
    createADetailerPreset('person_yolov8n-seg.pt'),
    createADetailerPreset('face_yolov8n.pt'),
  ])

  // ===== Notification settings (global singleton) =====
  const { notificationType, notificationVolume } = useNotificationSettings()

  // ===== Default settings object =====
  const defaultSettings = {
    prompt: '',
    negativePrompt: '',
    steps: 20,
    cfgScale: 7,
    samplerName: 'Euler a',
    scheduler: 'Automatic',
    width: 512,
    height: 512,
    batchCount: 1,
    batchSize: 1,
    seed: -1,
    seedVariationRange: 100,
    selectedModel: '',
    hrUpscaler: 'Latent',
    hrSteps: 10,
    denoisingStrength: 0.7,
    hrUpscale: 2,
    adetailers: [
      createADetailerPreset('face_yolov8n.pt'),
      createADetailerPreset('hand_yolov8n.pt'),
      createADetailerPreset('person_yolov8n-seg.pt'),
      createADetailerPreset('face_yolov8n.pt'),
    ]
  }

  // ===== Settings refs mapping (for slot management) =====
  // Note: notificationType, notificationVolume are global settings (not per-slot)
  const SETTINGS_REFS = {
    prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
    width, height, batchCount, batchSize, seed, seedVariationRange,
    selectedModel, hrUpscaler, hrSteps, denoisingStrength, hrUpscale
  }

  // ===== Computed values =====
  const enabledADetailers = computed(() =>
    adetailers.value.filter(ad => ad.enable)
  )

  const hasEnabledADetailers = computed(() => enabledADetailers.value.length > 0)

  const currentParams = computed(() => ({
    prompt: prompt.value,
    negative_prompt: negativePrompt.value,
    steps: steps.value,
    cfg_scale: cfgScale.value,
    sampler_name: samplerName.value,
    scheduler: scheduler.value,
    width: width.value,
    height: height.value,
    batch_size: batchSize.value,
    batch_count: batchCount.value,
    seed: seed.value,
    enable_hr: enableHr.value,
    hr_upscaler: hrUpscaler.value,
    hr_steps: hrSteps.value,
    denoising_strength: denoisingStrength.value,
    hr_scale: hrUpscale.value,
    adetailers: adetailers.value,
  }))

  // ===== Helper functions =====
  function randomizeSeed() {
    seed.value = -1
  }

  return {
    // Quick settings
    prompt,
    negativePrompt,
    steps,
    cfgScale,
    selectedModel,

    // Advanced settings
    samplerName,
    scheduler,
    width,
    height,
    batchCount,
    batchSize,
    seed,
    seedVariationRange,

    // Hires fix settings
    enableHr,
    hrUpscaler,
    hrSteps,
    denoisingStrength,
    hrUpscale,

    // ADetailer settings
    adetailers,

    // Notification settings
    notificationType,
    notificationVolume,

    // Objects
    defaultSettings,
    SETTINGS_REFS,

    // Computed
    enabledADetailers,
    hasEnabledADetailers,
    currentParams,

    // Functions
    randomizeSeed
  }
}
