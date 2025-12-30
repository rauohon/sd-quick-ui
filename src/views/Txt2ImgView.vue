<script setup>
import { ref, computed, onMounted, onUnmounted, watch, toRaw, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImageGeneration } from '../composables/useImageGeneration'
import { useSlotManagement } from '../composables/useSlotManagement'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useIndexedDB } from '../composables/useIndexedDB'
import { notifyCompletion } from '../utils/notification'
import {
  MAX_QUEUE_CONSECUTIVE_ERRORS,
  QUEUE_ITEM_TIMEOUT,
  QUEUE_SUCCESS_DELAY,
  QUEUE_FAILURE_DELAY,
  API_CHECK_THROTTLE,
  API_TIMEOUT,
  INITIAL_LOAD_COUNT,
  DEBOUNCE_TEXT_INPUT,
  DEBOUNCE_NUMBER_INPUT,
  NOTIFICATION_TYPES,
  DEFAULT_NOTIFICATION_VOLUME
} from '../config/constants'
import LoraSelector from '../components/LoraSelector.vue'
import PromptSelector from '../components/PromptSelector.vue'
import BookmarkManager from '../components/BookmarkManager.vue'
import PresetManager from '../components/PresetManager.vue'
import QueueManager from '../components/QueueManager.vue'
import PngInfoPreviewModal from '../components/PngInfoPreviewModal.vue'
import ADetailerPromptModal from '../components/ADetailerPromptModal.vue'
import ApiStatusIndicator from '../components/ApiStatusIndicator.vue'
import LastParamsSection from '../components/LastParamsSection.vue'
import HistoryImageItem from '../components/HistoryImageItem.vue'
import HistoryManagerModal from '../components/HistoryManagerModal.vue'
import PromptTextarea from '../components/PromptTextarea.vue'
import ImagePreviewPanel from '../components/ImagePreviewPanel.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import ParamsPanel from '../components/ParamsPanel.vue'
import AdvancedSettingsPanel from '../components/AdvancedSettingsPanel.vue'
import PromptPanel from '../components/PromptPanel.vue'
import { useQueue } from '../composables/useQueue'
import { usePngInfo } from '../composables/usePngInfo'
import { useAspectRatio } from '../composables/useAspectRatio'
import { useParamsApplication } from '../composables/useParamsApplication'
import { useHistory } from '../composables/useHistory'
import { useApiStatus } from '../composables/useApiStatus'
import { useModelLoader } from '../composables/useModelLoader'
import { useModals } from '../composables/useModals'
import { useQueueProcessor } from '../composables/useQueueProcessor'

// i18n
const { t } = useI18n()

// Props
const props = defineProps({
  showToast: {
    type: Function,
    required: true
  },
  openModal: {
    type: Function,
    required: true
  },
  showConfirm: {
    type: Function,
    required: true
  }
})

// Emits
const emit = defineEmits(['updateCurrentImage'])

// Constants (expose to template)
const NOTIFICATION_TYPES_CONST = NOTIFICATION_TYPES
const SEED_MAX = 4294967295
const SLOT_COUNT = 3
const ADETAILER_COUNT = 4
const ADETAILER_LABELS = ['1st', '2nd', '3rd', '4th']
const ADETAILER_MODELS = [
  'face_yolov8n.pt',
  'face_yolov8s.pt',
  'hand_yolov8n.pt',
  'person_yolov8n-seg.pt',
  'breasts_seg.pt',
  'mediapipe_face_full',
  'mediapipe_face_short',
  'mediapipe_face_mesh'
]

// Aspect Ratio presets (ratio-based, includes both orientations)
const ASPECT_RATIOS = [
  { label: '1:1', ratio: [1, 1] },
  { label: '3:2', ratio: [3, 2] },
  { label: '2:3', ratio: [2, 3] },
  { label: '4:3', ratio: [4, 3] },
  { label: '3:4', ratio: [3, 4] },
  { label: '16:9', ratio: [16, 9] },
  { label: '9:16', ratio: [9, 16] },
  { label: '21:9', ratio: [21, 9] },
  { label: '9:21', ratio: [9, 21] },
]

// Initialize Modals composable
const modalSystem = useModals()
const {
  showLoraSelector,
  showPromptSelector,
  showBookmarkManager,
  showPresetManager,
  showQueueManager,
  showADetailerPrompt,
  editingADetailerIndex,
  toggleModal,
  closeModal,
  openLoraSelector,
  closeLoraSelector,
  openPromptSelector,
  closePromptSelector,
  openBookmarkManager,
  closeBookmarkManager,
  openPresetManager,
  closePresetManager,
  openQueueManager,
  closeQueueManager,
  openADetailerPrompt,
  closeADetailerPrompt,
} = modalSystem


// History panel visibility state
const showHistoryPanel = ref(true) // Horizontal collapse (panel collapse)
const isHistoryContentCollapsed = ref(false) // Vertical collapse (content collapse)

// Image panel visibility state
const showImagePanel = ref(true)

// Advanced panel visibility state
const showAdvancedPanel = ref(true)

// Params panel visibility state
const showParamsPanel = ref(true)

// Use Queue
const queueSystem = useQueue()
const {
  queue: queueItems,
  isRunning: isQueueRunning,
  isPaused: isQueuePaused,
  currentIndex: queueCurrentIndex,
  updateQueueItem: updateQueue,
  saveQueue: saveQueueState,
} = queueSystem

// ADetailer 기본값 정의
const DEFAULT_ADETAILER = {
  enable: false,
  model: 'face_yolov8n.pt',
  prompt: '',
  negativePrompt: '',
  confidence: 0.3,
  dilateErode: 4,
  inpaintDenoising: 0.4,
  inpaintOnlyMasked: true,
  useSeparateSteps: false,
  steps: 28,
}

// ADetailer 프리셋 생성 헬퍼
const createADetailerPreset = (model = 'face_yolov8n.pt') => ({
  ...DEFAULT_ADETAILER,
  model
})

// Txt2Img state - Quick settings
const prompt = ref('')
const negativePrompt = ref('')
const steps = ref(20)
const cfgScale = ref(7)
const selectedModel = ref('')

// Txt2Img state - Advanced settings
const samplerName = ref('Euler a')
const scheduler = ref('Automatic')
const width = ref(512)
const height = ref(512)
const batchCount = ref(1)
const batchSize = ref(1)
const seed = ref(-1)
const seedVariationRange = ref(100)

// Hires fix settings (always enabled)
const enableHr = ref(true)
const hrUpscaler = ref('Latent')
const hrSteps = ref(10)
const denoisingStrength = ref(0.7)
const hrUpscale = ref(2)

// ADetailer settings (1st, 2nd, 3rd, 4th)
const adetailers = ref([
  createADetailerPreset('face_yolov8n.pt'),
  createADetailerPreset('hand_yolov8n.pt'),
  createADetailerPreset('person_yolov8n-seg.pt'),
  createADetailerPreset('face_yolov8n.pt'),
])

// Notification settings
const notificationType = ref(NOTIFICATION_TYPES.NONE)
const notificationVolume = ref(DEFAULT_NOTIFICATION_VOLUME)

// Default/initial settings
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
  notificationType: NOTIFICATION_TYPES.NONE,
  notificationVolume: DEFAULT_NOTIFICATION_VOLUME,
  adetailers: [
    createADetailerPreset('face_yolov8n.pt'),
    createADetailerPreset('hand_yolov8n.pt'),
    createADetailerPreset('person_yolov8n-seg.pt'),
    createADetailerPreset('face_yolov8n.pt'),
  ]
}

// Settings keys for mapping
const SETTINGS_REFS = {
  prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
  width, height, batchCount, batchSize, seed, seedVariationRange, selectedModel, hrUpscaler, hrSteps,
  denoisingStrength, hrUpscale, notificationType, notificationVolume
}

// Initialize composables (after all refs are declared)
// 1. Aspect Ratio composable
const aspectRatio = useAspectRatio(width, height, ASPECT_RATIOS)
const {
  selectedAspectRatioIndex,
  lastEditedDimension,
  isAdjustingDimensions,
  applyAspectRatio,
  swapDimensions
} = aspectRatio

// 2. Params Application composable
const paramsRefs = {
  prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
  width, height, seed, seedVariationRange, batchCount, batchSize,
  hrUpscaler, hrSteps, denoisingStrength, hrUpscale, adetailers
}
const paramsApplication = useParamsApplication(paramsRefs, props.showToast)
const { applyParams, handleApplyPreset, loadParamsFromHistory } = paramsApplication


// Computed values
const enabledADetailers = computed(() =>
  adetailers.value.filter(ad => ad.enable)
)

const hasEnabledADetailers = computed(() => enabledADetailers.value.length > 0)

// 프롬프트가 마지막 생성과 다른지 체크
const promptChanged = computed(() => {
  if (!lastUsedParams.value) return false
  return prompt.value !== lastUsedParams.value.prompt
})

const negativePromptChanged = computed(() => {
  if (!lastUsedParams.value) return false
  return negativePrompt.value !== lastUsedParams.value.negative_prompt
})

// Current generation parameters
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

// Use composables
const localStorage = useLocalStorage()
const indexedDB = useIndexedDB()

const slotManagement = useSlotManagement(defaultSettings, SETTINGS_REFS, adetailers, props.showToast)
const {
  slots,
  activeSlot,
  saveCurrentSlot,
  selectSlot,
  startDebouncedSlotSave,
} = slotManagement

const imageGeneration = useImageGeneration(
  {
    prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
    width, height, batchCount, batchSize, seed, seedVariationRange,
    enableHr, hrUpscaler, hrSteps, denoisingStrength, hrUpscale,
    adetailers, notificationType, notificationVolume, selectedModel
  },
  enabledADetailers,
  props.showToast,
  t
)

const {
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
} = imageGeneration

// Queue Processor composable (must be after useQueue, useImageGeneration, useParamsApplication)
const queueProcessor = useQueueProcessor(queueSystem, imageGeneration, paramsApplication, props.showToast)
const {
  queueConsecutiveErrors,
  queueSuccessCount,
  queueFailedCount,
  startQueue,
  pauseQueue,
  stopQueue,
  processQueue,
  findNextPendingQueueItem,
  applyQueueItemParams,
  generateQueueItem
} = queueProcessor

// 3. History composable (must be after useImageGeneration)
const historyRefs = {
  generatedImages, currentImage, lastUsedParams, adetailers,
  slots, activeSlot, prompt, negativePrompt, steps, width, height, cfgScale, seed
}
const historyComposables = { indexedDB, localStorage, slotManagement }
const historyCallbacks = { showToast: props.showToast, showConfirm: props.showConfirm }
const historyConstants = { INITIAL_LOAD_COUNT, SLOT_COUNT }
const history = useHistory(historyRefs, historyComposables, historyCallbacks, historyConstants, t)
const {
  showFavoriteOnly,
  isSelectionMode,
  selectedImages,
  showHistoryDetail,
  selectedHistoryItem,
  filteredImages,
  toggleImageFavorite,
  deleteImage,
  clearHistory,
  openHistoryDetail,
  openHistoryManager,
  closeHistoryDetail,
  handleHistoryDelete,
  handleHistoryDownload,
  handleHistoryDownloadMultiple,
  handleHistoryDeleteMultiple,
  toggleSelectionMode,
  toggleImageSelection,
  selectAllImages,
  deselectAllImages,
  downloadSelectedImages,
  toggleFavoriteFilter,
  addSampleImage,
  loadData
} = history

// LoRA handlers
function handleSelectLora(loraTag) {
  // Add LoRA tag to prompt
  // Check if prompt already has content
  if (prompt.value && !prompt.value.endsWith(' ')) {
    prompt.value += ' '
  }
  prompt.value += loraTag

  props.showToast?.(`Added ${loraTag}`, 'success')
}

// Common function to append text to prompt or negative prompt
function appendTextToPrompt(targetRef, text) {
  // Add comma separator if needed
  if (targetRef.value && !targetRef.value.endsWith(' ') && !targetRef.value.endsWith(',')) {
    targetRef.value += ', '
  }
  targetRef.value += text
}

function handleAddPrompt(promptText) {
  appendTextToPrompt(prompt, promptText)
}

function handleAddNegative(promptText) {
  appendTextToPrompt(negativePrompt, promptText)
}

// Bookmark Manager handlers
function handleApplyBookmark(data) {
  prompt.value = data.prompt
  negativePrompt.value = data.negativePrompt
}

// Seed handlers
function randomizeSeed() {
  seed.value = -1
}

// Notification handlers
function testNotification() {
  props.showToast?.('테스트 알림입니다', notificationType.value)
}

// Initialize API Status composable
const apiStatus = useApiStatus(props.showToast)
const {
  apiConnected,
  apiChecking,
  checkApiStatus
} = apiStatus

// Initialize PNG Info composable
const pngInfo = usePngInfo(props.showToast, applyParams)
const {
  isLoadingPngInfo,
  showPngInfoPreview,
  previewedPngInfo,
  handleLoadPngInfo,
  loadPngInfo,
  parsePngInfo,
  applyPngInfo,
  cancelPngInfo
} = pngInfo

// Initialize Model Loader composable
const modelLoader = useModelLoader(selectedModel, props.showToast)
const {
  availableModels,
  availableSamplers,
  availableSchedulers,
  availableUpscalers,
  loadModels,
  changeModel
} = modelLoader


// Auto-save current slot when settings change (with debounce)
// Watch text fields (prompt, etc.) with 1000ms debounce
watch(
  [prompt, negativePrompt, samplerName, scheduler, hrUpscaler],
  () => {
    startDebouncedSlotSave(DEBOUNCE_TEXT_INPUT) // Text inputs
  }
)

// Watch number fields with shorter 500ms debounce (faster feedback)
watch(
  [steps, cfgScale, width, height, batchCount, batchSize, seed, hrSteps, denoisingStrength, hrUpscale, notificationVolume],
  () => {
    startDebouncedSlotSave(DEBOUNCE_NUMBER_INPUT) // Number inputs
  }
)

// Watch notification type separately (text-like select field)
watch(
  notificationType,
  () => {
    startDebouncedSlotSave(DEBOUNCE_TEXT_INPUT)
  }
)

// Watch adetailers - use computed string to avoid expensive deep watch
// Only watches key fields that affect generation
watch(
  () => adetailers.value.map(ad =>
    `${ad.enable}-${ad.model}-${ad.prompt}-${ad.confidence}-${ad.inpaintDenoising}`
  ).join('|'),
  () => {
    startDebouncedSlotSave(DEBOUNCE_TEXT_INPUT) // Text inputs
  }
)

// Save slots to IndexedDB when they change
watch(
  slots,
  async (newSlots) => {
    try {
      // Convert Vue reactive proxy to plain object for IndexedDB
      const plainSlots = JSON.parse(JSON.stringify(toRaw(newSlots)))
      await indexedDB.saveSlots(plainSlots)
    } catch (error) {
      console.error('슬롯 IndexedDB 저장 실패:', error)
    }
  },
  { deep: true }
)

// Watch progress to detect completion of backend-synced generation
let completionTimeout = null
watch(progress, (newProgress, oldProgress) => {
  // Clear any existing timeout
  if (completionTimeout) {
    clearTimeout(completionTimeout)
    completionTimeout = null
  }

  // If progress reaches 100% or drops back to 0 after being active
  if (isGenerating.value && (newProgress === 100 || (oldProgress > 0 && newProgress === 0))) {
    // Wait a bit to ensure backend is done
    completionTimeout = setTimeout(() => {
      if (isGenerating.value && progress.value === 0) {
        isGenerating.value = false
        stopProgressPolling()
        props.showToast?.('✅ 백엔드 생성 완료', 'success')
      }
    }, 1000)
  }
})

// Emit currentImage updates to parent (for modal)
watch(currentImage, (newValue) => {
  emit('updateCurrentImage', newValue)
})

// Watch selectedModel changes and update WebUI checkpoint
const isInitialLoad = ref(true)
watch(selectedModel, async (newModel, oldModel) => {
  // Skip on initial load or if model hasn't actually changed
  if (isInitialLoad.value || !newModel || newModel === oldModel) {
    return
  }

  // Change model in WebUI
  await changeModel(newModel)
})

// Watch panel visibility states and save to localStorage
watch(showHistoryPanel, (newValue) => {
  window.localStorage.setItem('txt2img_showHistoryPanel', String(newValue))
})

watch(isHistoryContentCollapsed, (newValue) => {
  window.localStorage.setItem('txt2img_isHistoryContentCollapsed', String(newValue))
})

watch(showImagePanel, (newValue) => {
  window.localStorage.setItem('txt2img_showImagePanel', String(newValue))
})

watch(showAdvancedPanel, (newValue) => {
  window.localStorage.setItem('txt2img_showAdvancedPanel', String(newValue))
})

watch(showParamsPanel, (newValue) => {
  window.localStorage.setItem('txt2img_showParamsPanel', String(newValue))
})

// Lifecycle
onMounted(async () => {
  // Load panel visibility states from localStorage
  const savedHistoryPanel = window.localStorage.getItem('txt2img_showHistoryPanel')
  if (savedHistoryPanel !== null) {
    showHistoryPanel.value = savedHistoryPanel === 'true'
  }

  const savedHistoryContentCollapsed = window.localStorage.getItem('txt2img_isHistoryContentCollapsed')
  if (savedHistoryContentCollapsed !== null) {
    isHistoryContentCollapsed.value = savedHistoryContentCollapsed === 'true'
  }

  const savedImagePanel = window.localStorage.getItem('txt2img_showImagePanel')
  if (savedImagePanel !== null) {
    showImagePanel.value = savedImagePanel === 'true'
  }

  const savedAdvancedPanel = window.localStorage.getItem('txt2img_showAdvancedPanel')
  if (savedAdvancedPanel !== null) {
    showAdvancedPanel.value = savedAdvancedPanel === 'true'
  }

  const savedParamsPanel = window.localStorage.getItem('txt2img_showParamsPanel')
  if (savedParamsPanel !== null) {
    showParamsPanel.value = savedParamsPanel === 'true'
  }

  // Check API connection first
  await checkApiStatus()

  // Check if there's an ongoing generation on backend
  if (apiConnected.value) {
    await checkOngoingGeneration()
  }

  // Load slot settings first (priority)
  loadData()

  // Then load available options from API (won't override slot settings)
  if (apiConnected.value) {
    await loadModels()
  }

  // Mark initial load as complete
  setTimeout(() => {
    isInitialLoad.value = false
  }, 1000)
})

onUnmounted(() => {
  stopProgressPolling()
  stopQueue() // Clean up queue processor interval
  slotManagement.cancelDebouncedSlotSave()

  // Clean up completion timeout to prevent memory leak
  if (completionTimeout) {
    clearTimeout(completionTimeout)
    completionTimeout = null
  }
})
</script>

<template>
  <div class="tab-content">
    <div class="container">
      <!-- 1단: 고급 설정 -->
      <AdvancedSettingsPanel
        :is-expanded="showAdvancedPanel"
        :is-generating="isGenerating"
        :api-connected="apiConnected"
        :api-checking="apiChecking"
        :selected-model="selectedModel"
        :available-models="availableModels"
        :sampler-name="samplerName"
        :available-samplers="availableSamplers"
        :scheduler="scheduler"
        :available-schedulers="availableSchedulers"
        :selected-aspect-ratio-index="selectedAspectRatioIndex"
        :aspect-ratios="ASPECT_RATIOS"
        :width="width"
        :height="height"
        :batch-count="batchCount"
        :batch-size="batchSize"
        :seed="seed"
        :seed-variation-range="seedVariationRange"
        :notification-type="notificationType"
        :notification-types="NOTIFICATION_TYPES_CONST"
        :notification-volume="notificationVolume"
        :last-params="lastUsedParams"
        :has-enabled-adetailers="hasEnabledADetailers"
        :enabled-adetailers="enabledADetailers"
        :adetailer-labels="ADETAILER_LABELS"
        @toggle-panel="showAdvancedPanel = !showAdvancedPanel"
        @check-api="checkApiStatus"
        @update:selectedModel="selectedModel = $event"
        @update:samplerName="samplerName = $event"
        @update:scheduler="scheduler = $event"
        @apply-aspect-ratio="applyAspectRatio"
        @swap-dimensions="swapDimensions"
        @update:width="width = $event"
        @update:height="height = $event"
        @update:batchCount="batchCount = $event"
        @update:batchSize="batchSize = $event"
        @update:seed="seed = $event"
        @randomize-seed="randomizeSeed"
        @update:seedVariationRange="seedVariationRange = $event"
        @update:notificationType="notificationType = $event"
        @test-notification="testNotification"
        @update:notificationVolume="notificationVolume = $event"
      />

      <!-- 2단: 파라미터 설정 -->
      <ParamsPanel
        :is-expanded="showParamsPanel"
        :is-generating="isGenerating"
        :steps="steps"
        :cfg-scale="cfgScale"
        :hr-upscaler="hrUpscaler"
        :hr-steps="hrSteps"
        :denoising-strength="denoisingStrength"
        :hr-upscale="hrUpscale"
        :available-upscalers="availableUpscalers"
        :adetailers="adetailers"
        :adetailer-labels="ADETAILER_LABELS"
        :adetailer-models="ADETAILER_MODELS"
        :slots="slots"
        :active-slot="activeSlot"
        :slot-count="SLOT_COUNT"
        @toggle-panel="showParamsPanel = !showParamsPanel"
        @update:steps="steps = $event"
        @update:cfgScale="cfgScale = $event"
        @update:hrUpscaler="hrUpscaler = $event"
        @update:hrSteps="hrSteps = $event"
        @update:denoisingStrength="denoisingStrength = $event"
        @update:hrUpscale="hrUpscale = $event"
        @update:adetailer-enable="(index, value) => adetailers[index].enable = value"
        @update:adetailer-model="(index, value) => adetailers[index].model = value"
        @update:adetailer-confidence="(index, value) => adetailers[index].confidence = value"
        @update:adetailer-dilateErode="(index, value) => adetailers[index].dilateErode = value"
        @update:adetailer-inpaintDenoising="(index, value) => adetailers[index].inpaintDenoising = value"
        @update:adetailer-inpaintOnlyMasked="(index, value) => adetailers[index].inpaintOnlyMasked = value"
        @update:adetailer-useSeparateSteps="(index, value) => adetailers[index].useSeparateSteps = value"
        @update:adetailer-steps="(index, value) => adetailers[index].steps = value"
        @open-adetailer-prompt="openADetailerPrompt"
        @select-slot="selectSlot"
      />

      <!-- 3단: 프롬프트 -->
      <PromptPanel
        :is-generating="isGenerating"
        :api-connected="apiConnected"
        :is-infinite-mode="isInfiniteMode"
        :progress="progress"
        :progress-state="progressState"
        :infinite-count="infiniteCount"
        :batch-size="batchSize"
        :show-bookmark-manager="showBookmarkManager"
        :show-preset-manager="showPresetManager"
        :show-queue-manager="showQueueManager"
        :show-lora-selector="showLoraSelector"
        :show-prompt-selector="showPromptSelector"
        @toggle-infinite="toggleInfiniteMode"
        @generate="generateImage"
        @interrupt="interruptGeneration"
        @stop-infinite="stopInfiniteModeOnly"
        @skip="skipCurrentImage"
        @open-bookmark="openBookmarkManager"
        @open-preset="openPresetManager"
        @open-queue="openQueueManager"
        @open-lora="openLoraSelector"
        @open-prompts="openPromptSelector"
      >
        <PromptTextarea
          v-model="prompt"
          :label="$t('prompt.positive')"
          placeholder="beautiful landscape, detailed, masterpiece, best quality..."
          :is-generating="isGenerating"
          :is-changed="promptChanged"
          :is-negative="false"
        />

        <PromptTextarea
          v-model="negativePrompt"
          :label="$t('prompt.negative')"
          placeholder="ugly, blurry, low quality..."
          :is-generating="isGenerating"
          :is-changed="negativePromptChanged"
          :is-negative="true"
        />
      </PromptPanel>

    </div>

    <!-- 4단: 이미지 프리뷰 + 히스토리 OR Easy Prompt Selector OR Bookmark Manager OR Preset Manager OR Queue Manager OR LoRA Selector -->
    <div v-if="!showPromptSelector && !showBookmarkManager && !showPresetManager && !showQueueManager && !showLoraSelector" :class="['image-area', { 'history-collapsed': !showHistoryPanel }]">
      <ImagePreviewPanel
        :current-image="currentImage"
        :is-loading="isLoadingPngInfo"
        :is-expanded="showImagePanel"
        @toggle-panel="showImagePanel = !showImagePanel"
        @show-preview="props.openModal('viewer')"
        @load-png-info="handleLoadPngInfo"
      />

      <HistoryPanel
        :is-expanded="showHistoryPanel"
        :is-content-collapsed="isHistoryContentCollapsed"
        :show-favorite-only="showFavoriteOnly"
        :is-selection-mode="isSelectionMode"
        :selected-count="selectedImages.size"
        :image-count="generatedImages.length"
        :is-empty="filteredImages.length === 0"
        :has-favorites="generatedImages.some(img => img.favorite)"
        :has-images="generatedImages.length > 0"
        @toggle-panel="showHistoryPanel = !showHistoryPanel"
        @toggle-content="isHistoryContentCollapsed = !isHistoryContentCollapsed"
        @toggle-favorite-filter="toggleFavoriteFilter"
        @toggle-selection-mode="openHistoryManager"
        @select-all="selectAllImages"
        @deselect-all="deselectAllImages"
        @download-selected="downloadSelectedImages"
        @clear-history="clearHistory"
        @add-sample="addSampleImage"
      >
        <HistoryImageItem
          v-for="(item, index) in filteredImages"
          :key="item.id || item.timestamp"
          :item="item"
          :index="index"
          :is-selection-mode="isSelectionMode"
          :is-selected="selectedImages.has(item.id)"
          @toggle-favorite="toggleImageFavorite"
          @delete="deleteImage"
          @load-params="loadParamsFromHistory"
          @toggle-selection="toggleImageSelection"
          @view-image="openHistoryDetail(item)"
        />
      </HistoryPanel>
    </div>

    <!-- Easy Prompt Selector (replaces image area) -->
    <PromptSelector
      v-if="showPromptSelector"
      class="image-area"
      :showToast="showToast"
      @addPrompt="handleAddPrompt"
      @addNegative="handleAddNegative"
      @close="closePromptSelector"
    />

    <!-- Bookmark Manager (replaces image area) -->
    <BookmarkManager
      v-if="showBookmarkManager"
      class="image-area"
      :showToast="showToast"
      :showConfirm="showConfirm"
      @applyBookmark="handleApplyBookmark"
      @close="closeBookmarkManager"
    />

    <!-- Preset Manager (replaces image area) -->
    <PresetManager
      v-if="showPresetManager"
      class="image-area"
      :showToast="showToast"
      :currentParams="currentParams"
      @applyPreset="handleApplyPreset"
      @close="closePresetManager"
    />

    <!-- Queue Manager (replaces image area) -->
    <QueueManager
      v-if="showQueueManager"
      class="image-area"
      :showToast="showToast"
      :currentPrompt="prompt"
      :currentNegativePrompt="negativePrompt"
      :currentParams="currentParams"
      :isGenerating="isGenerating"
      @close="closeQueueManager"
      @startQueue="startQueue"
      @pauseQueue="pauseQueue"
      @stopQueue="stopQueue"
    />

    <!-- LoRA Selector (replaces image area) -->
    <LoraSelector
      v-if="showLoraSelector"
      class="image-area"
      :showToast="showToast"
      @close="closeLoraSelector"
      @selectLora="handleSelectLora"
    />

    <!-- PNG Info Preview Modal -->
    <PngInfoPreviewModal
      v-model="showPngInfoPreview"
      :png-info="previewedPngInfo"
      @apply="applyPngInfo"
      @cancel="cancelPngInfo"
    />

    <!-- History Manager Modal -->
    <HistoryManagerModal
      v-if="showHistoryDetail"
      :items="generatedImages"
      :initial-item="selectedHistoryItem"
      @close="closeHistoryDetail"
      @toggle-favorite="toggleImageFavorite"
      @delete="handleHistoryDelete"
      @load-params="loadParamsFromHistory"
      @download="handleHistoryDownload"
      @download-multiple="handleHistoryDownloadMultiple"
      @delete-multiple="handleHistoryDeleteMultiple"
    />

    <!-- ADetailer Prompt Editor Modal -->
    <ADetailerPromptModal
      v-model="showADetailerPrompt"
      :adetailer-index="editingADetailerIndex"
      :adetailer="editingADetailerIndex >= 0 ? adetailers[editingADetailerIndex] : null"
      :label="editingADetailerIndex >= 0 ? ADETAILER_LABELS[editingADetailerIndex] : ''"
      @update:prompt="adetailers[editingADetailerIndex].prompt = $event"
      @update:negativePrompt="adetailers[editingADetailerIndex].negativePrompt = $event"
    />
  </div>
</template>

<style scoped>
/* Preview image - 비율 유지하며 최대 크기 */
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-image:hover {
  transform: scale(1.02);
}

.preview-main {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* History panel toggle button */
.toggle-panel-btn {
  padding: 4px 10px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
  color: #666;
}

.toggle-panel-btn:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

/* Container grid layout */
.container {
  display: grid;
  grid-template-columns: 280px 300px 420px;
  gap: 12px;
  transition: grid-template-columns 0.3s ease;
}

/* Advanced panel collapsed only */
.container:has(.advanced-panel.collapsed):not(:has(.params-panel.collapsed)) {
  grid-template-columns: 40px 300px 660px;
}

/* Params panel collapsed only */
.container:has(.params-panel.collapsed):not(:has(.advanced-panel.collapsed)) {
  grid-template-columns: 280px 40px 680px;
}

/* Both panels collapsed */
.container:has(.advanced-panel.collapsed):has(.params-panel.collapsed) {
  grid-template-columns: 40px 40px 920px;
}


/* Batch download styles */
.selection-count {
  margin-left: 8px;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 600;
}

.batch-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  color: #374151;
}

.batch-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.batch-btn:active {
  background: #d1d5db;
}

.batch-btn.cancel {
  color: #dc2626;
}

.batch-btn.cancel:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.batch-download-btn {
  padding: 6px 12px;
  background: #4f46e5;
  border: 1px solid #4338ca;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: white;
  transition: all 0.2s;
}

.batch-download-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.batch-download-btn:active:not(:disabled) {
  transform: translateY(0);
}

.batch-download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-checkbox {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 28px;
  height: 28px;
  background: white;
  border: 2px solid #4f46e5;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;
}

.selection-checkbox:hover {
  background: #eef2ff;
  border-color: #4338ca;
  transform: scale(1.1);
}

.selection-checkbox input[type="checkbox"] {
  display: none;
}

.selection-checkbox .checkmark {
  font-size: 18px;
  font-weight: bold;
  color: #4f46e5;
}

</style>
