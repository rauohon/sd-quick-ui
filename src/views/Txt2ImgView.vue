<script setup>
import { ref, computed, onMounted, onUnmounted, watch, toRaw, nextTick } from 'vue'
import { useImageGeneration } from '../composables/useImageGeneration'
import { useSlotManagement } from '../composables/useSlotManagement'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useIndexedDB } from '../composables/useIndexedDB'
import { cloneADetailers } from '../utils/adetailer'
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
import PromptTextarea from '../components/PromptTextarea.vue'
import ImagePreviewPanel from '../components/ImagePreviewPanel.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import ParamsPanel from '../components/ParamsPanel.vue'
import AdvancedSettingsPanel from '../components/AdvancedSettingsPanel.vue'
import PromptPanel from '../components/PromptPanel.vue'
import { useQueue } from '../composables/useQueue'

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

// API Base URL
const API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:7860' : ''

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

// Selected aspect ratio index for select box
const selectedAspectRatioIndex = ref('')

// Track which dimension was last edited by user to prevent feedback loops
const lastEditedDimension = ref(null)
const isAdjustingDimensions = ref(false)

// LoRA Selector state
const showLoraSelector = ref(false)

// Prompt Selector state
const showPromptSelector = ref(false)

// Bookmark Manager state
const showBookmarkManager = ref(false)

// Favorite filter state
const showFavoriteOnly = ref(false)

// Selection mode for batch download
const isSelectionMode = ref(false)
const selectedImages = ref(new Set())

// History panel visibility state
const showHistoryPanel = ref(true)

// Image panel visibility state
const showImagePanel = ref(true)

// Advanced panel visibility state
const showAdvancedPanel = ref(true)

// Params panel visibility state
const showParamsPanel = ref(true)

// Preset Manager state
const showPresetManager = ref(false)

// Queue Manager state
const showQueueManager = ref(false)

// PNG Info loading state
const isLoadingPngInfo = ref(false)
const showPngInfoPreview = ref(false)
const previewedPngInfo = ref(null)

// API connection state
const apiConnected = ref(false)
const apiChecking = ref(true)

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

// ADetailer prompt editing state
const showADetailerPrompt = ref(false)
const editingADetailerIndex = ref(-1)

// Txt2Img state - Quick settings
const prompt = ref('')
const negativePrompt = ref('')
const steps = ref(20)
const cfgScale = ref(7)
const selectedModel = ref('')
const availableModels = ref([])
const availableSamplers = ref([])
const availableSchedulers = ref([])
const availableUpscalers = ref([])

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

// Computed values
const enabledADetailers = computed(() =>
  adetailers.value.filter(ad => ad.enable)
)

const hasEnabledADetailers = computed(() => enabledADetailers.value.length > 0)

// Filtered images (즐겨찾기 필터 적용)
const filteredImages = computed(() => {
  if (showFavoriteOnly.value) {
    return generatedImages.value.filter(img => img.favorite)
  }
  return generatedImages.value
})

// 프롬프트가 마지막 생성과 다른지 체크
const promptChanged = computed(() => {
  if (!lastUsedParams.value) return false
  return prompt.value !== lastUsedParams.value.prompt
})

const negativePromptChanged = computed(() => {
  if (!lastUsedParams.value) return false
  return negativePrompt.value !== lastUsedParams.value.negative_prompt
})

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
  props.showToast
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
} = imageGeneration

// Add sample image for testing
async function addSampleImage() {
  // Create a simple colored canvas as sample image
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Random gradient
  const gradient = ctx.createLinearGradient(0, 0, 512, 512)
  gradient.addColorStop(0, `hsl(${Math.random() * 360}, 70%, 60%)`)
  gradient.addColorStop(1, `hsl(${Math.random() * 360}, 70%, 40%)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)

  // Add text
  ctx.fillStyle = 'white'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Sample Image', 256, 256)
  ctx.font = '16px Arial'
  ctx.fillText(new Date().toLocaleTimeString(), 256, 300)

  const imageData = canvas.toDataURL('image/png')

  const sampleParams = {
    prompt: 'Sample prompt for testing',
    negative_prompt: 'sample negative',
    steps: Math.floor(Math.random() * 50) + 20,
    sampler_name: 'Euler a',
    scheduler: 'Automatic',
    width: 512,
    height: 512,
    cfg_scale: Math.floor(Math.random() * 10) + 5,
    seed: Math.floor(Math.random() * 1000000),
    batch_size: 1,
    batch_count: 1,
    hr_upscaler: 'Latent',
    hr_steps: 10,
    denoising_strength: 0.7,
    hr_scale: 2,
    adetailers: cloneADetailers(adetailers.value),
  }

  const newImage = {
    image: imageData,
    info: 'Sample image info',
    params: sampleParams,
    timestamp: new Date().toISOString(),
    favorite: false,
    interrupted: false
  }

  // Save to IndexedDB first to get ID
  try {
    const imageId = await indexedDB.saveImage(newImage)
    newImage.id = imageId
    console.log(`샘플 이미지 저장 완료 (ID: ${imageId})`)
  } catch (error) {
    console.error('샘플 이미지 IndexedDB 저장 실패:', error)
  }

  generatedImages.value.unshift(newImage)
  currentImage.value = imageData
  lastUsedParams.value = sampleParams
}

// Clear history
async function clearHistory() {
  const favoriteCount = generatedImages.value.filter(img => img.favorite).length

  let confirmMessage = '히스토리를 삭제하시겠습니까?'
  if (favoriteCount > 0) {
    confirmMessage = `히스토리를 삭제하시겠습니까?\n\n즐겨찾기 ${favoriteCount}개는 유지됩니다.`
  }

  const confirmed = await props.showConfirm({
    title: '히스토리 삭제',
    message: confirmMessage,
    confirmText: '삭제',
    cancelText: '취소'
  })

  if (!confirmed) {
    return
  }

  try {
    // Clear IndexedDB (즐겨찾기 제외)
    const deletedCount = await indexedDB.clearNonFavoriteImages()

    // Clear memory (즐겨찾기 제외)
    const favoriteImages = generatedImages.value.filter(img => img.favorite)
    generatedImages.value = favoriteImages

    // 즐겨찾기가 없으면 현재 이미지도 클리어
    if (favoriteImages.length === 0) {
      currentImage.value = ''
      lastUsedParams.value = null
    }

    if (favoriteCount > 0) {
      props.showToast?.(`✅ ${deletedCount}개 삭제 완료 (즐겨찾기 ${favoriteCount}개 보호됨)`, 'success')
    } else {
      props.showToast?.('✅ 히스토리가 삭제되었습니다', 'success')
    }
  } catch (error) {
    console.error('히스토리 삭제 실패:', error)
    props.showToast?.('❌ 히스토리 삭제 실패', 'error')
  }
}

// Modal management
const modals = {
  lora: showLoraSelector,
  prompt: showPromptSelector,
  bookmark: showBookmarkManager,
  preset: showPresetManager,
  queue: showQueueManager
}

function toggleModal(modalName) {
  const targetModal = modals[modalName]
  if (!targetModal) return

  const isClosing = targetModal.value

  // Close all modals
  Object.values(modals).forEach(modal => modal.value = false)

  // Toggle target modal (if it was closed, open it)
  if (!isClosing) {
    targetModal.value = true
  }
}

function closeModal(modalName) {
  const targetModal = modals[modalName]
  if (targetModal) {
    targetModal.value = false
  }
}

// LoRA handlers
function openLoraSelector() {
  toggleModal('lora')
}

function closeLoraSelector() {
  closeModal('lora')
}

function handleSelectLora(loraTag) {
  // Add LoRA tag to prompt
  // Check if prompt already has content
  if (prompt.value && !prompt.value.endsWith(' ')) {
    prompt.value += ' '
  }
  prompt.value += loraTag

  props.showToast?.(`Added ${loraTag}`, 'success')
}

// Prompt Selector handlers
function openPromptSelector() {
  toggleModal('prompt')
}

function closePromptSelector() {
  closeModal('prompt')
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
function openBookmarkManager() {
  toggleModal('bookmark')
}

function closeBookmarkManager() {
  closeModal('bookmark')
}

function handleApplyBookmark(data) {
  prompt.value = data.prompt
  negativePrompt.value = data.negativePrompt
}

// Preset Manager handlers
function openPresetManager() {
  toggleModal('preset')
}

function closePresetManager() {
  closeModal('preset')
}

// Apply parameters (supports both preset and API response formats)
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
    negativePrompt.value = params.negative_prompt || ''
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
    props.showToast?.(successMessage, 'success')
  }
}

function handleApplyPreset(params) {
  applyParams(params, {
    includePrompts: false,
    showSuccessToast: false
  })
}

// Load params from history
function loadParamsFromHistory(item) {
  applyParams(item.params, {
    includePrompts: true,
    showSuccessToast: true,
    successMessage: 'Settings loaded from history'
  })
}

// Toggle image favorite
async function toggleImageFavorite(item, index) {
  try {
    // Toggle in memory first for instant feedback
    item.favorite = !item.favorite
    const isFavorite = item.favorite

    // Update IndexedDB
    if (item.id) {
      await indexedDB.toggleFavorite(item.id)
      props.showToast?.(
        isFavorite ? '⭐ 즐겨찾기에 추가되었습니다' : '☆ 즐겨찾기가 해제되었습니다',
        'success'
      )
    } else {
      console.warn('이미지 ID가 없어 IndexedDB 업데이트를 건너뜁니다')
    }
  } catch (error) {
    console.error('즐겨찾기 토글 실패:', error)
    // Revert on error
    item.favorite = !item.favorite
    props.showToast?.('즐겨찾기 업데이트 실패', 'error')
  }
}

// Delete single image
async function deleteImage(item, index) {
  const confirmed = await props.showConfirm({
    title: '이미지 삭제',
    message: '이 이미지를 삭제하시겠습니까?',
    confirmText: '삭제',
    cancelText: '취소'
  })

  if (!confirmed) {
    return
  }

  try {
    // Delete from IndexedDB
    if (item.id) {
      await indexedDB.deleteImage(item.id)
    }

    // Remove from memory
    generatedImages.value.splice(index, 1)

    props.showToast?.('🗑️ 이미지가 삭제되었습니다', 'success')
  } catch (error) {
    console.error('이미지 삭제 실패:', error)
    props.showToast?.('이미지 삭제 실패', 'error')
  }
}

// Batch download functions
function toggleSelectionMode() {
  isSelectionMode.value = !isSelectionMode.value
  if (!isSelectionMode.value) {
    selectedImages.value.clear()
  }
}

function toggleImageSelection(imageId) {
  if (selectedImages.value.has(imageId)) {
    selectedImages.value.delete(imageId)
  } else {
    selectedImages.value.add(imageId)
  }
}

function selectAllImages() {
  generatedImages.value.forEach(img => {
    if (img.id) {
      selectedImages.value.add(img.id)
    }
  })
}

function deselectAllImages() {
  selectedImages.value.clear()
}

async function downloadSelectedImages() {
  if (selectedImages.value.size === 0) {
    props.showToast?.('선택된 이미지가 없습니다', 'warning')
    return
  }

  try {
    const zip = new JSZip()
    const folder = zip.folder('images')

    // Add selected images to ZIP
    for (const imageId of selectedImages.value) {
      const image = generatedImages.value.find(img => img.id === imageId)
      if (!image) continue

      // Fetch image data
      const response = await fetch(image.url)
      const blob = await response.blob()

      // Generate filename from timestamp or use index
      const timestamp = image.timestamp || Date.now()
      const filename = `image_${timestamp}.png`

      folder.file(filename, blob)
    }

    // Generate ZIP file
    const content = await zip.generateAsync({ type: 'blob' })

    // Download ZIP
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = `images_${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    props.showToast?.(`${selectedImages.value.size}개 이미지 다운로드 완료`, 'success')

    // Exit selection mode and clear selections
    isSelectionMode.value = false
    selectedImages.value.clear()
  } catch (error) {
    console.error('일괄 다운로드 실패:', error)
    props.showToast?.('일괄 다운로드 실패', 'error')
  }
}

// PNG Info drag-drop handler
async function handleLoadPngInfo(file, errorMessage) {
  if (errorMessage) {
    props.showToast?.(errorMessage, 'error')
    return
  }
  if (file) {
    await loadPngInfo(file)
  }
}

async function loadPngInfo(file) {
  isLoadingPngInfo.value = true

  try {
    // Convert file to base64
    const reader = new FileReader()
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const base64Data = await base64Promise
    const base64Image = base64Data.split(',')[1]

    // Call WebUI API to read PNG info
    const response = await fetch(`${API_BASE_URL}/sdapi/v1/png-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: `data:image/png;base64,${base64Image}` })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.info) {
      // Parse info string and show preview
      const parsedInfo = parsePngInfo(data.info)
      previewedPngInfo.value = parsedInfo
      showPngInfoPreview.value = true
      props.showToast?.('PNG metadata loaded. Review and apply.', 'success')
    } else {
      props.showToast?.('No metadata found in image', 'warning')
    }
  } catch (error) {
    console.error('Failed to load PNG info:', error)
    props.showToast?.('Failed to read image metadata', 'error')
  } finally {
    isLoadingPngInfo.value = false
  }
}

// Parse PNG info string and return structured data (doesn't apply to settings yet)
function parsePngInfo(infoString) {
  const lines = infoString.split('\n')

  let promptLines = []
  let negativeLines = []
  let paramsLine = ''
  let mode = 'prompt' // 'prompt', 'negative', 'params'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('Negative prompt:')) {
      // Switch to negative mode and capture the rest of this line
      mode = 'negative'
      const negativeText = line.replace('Negative prompt:', '').trim()
      if (negativeText) {
        negativeLines.push(negativeText)
      }
    } else if (line.includes('Steps:')) {
      // This is the parameters line
      mode = 'params'
      paramsLine = line
    } else {
      // Add to current mode
      const trimmedLine = line.trim()
      if (trimmedLine) {
        if (mode === 'prompt') {
          promptLines.push(trimmedLine)
        } else if (mode === 'negative') {
          negativeLines.push(trimmedLine)
        }
      }
    }
  }

  // Prepare result object
  const result = {
    prompt: promptLines.join(' ').trim(),
    negativePrompt: negativeLines.join(' ').trim(),
    steps: 20,
    cfgScale: 7,
    samplerName: 'Euler a',
    scheduler: 'Automatic',
    width: 512,
    height: 512,
    seed: -1,
    hrUpscale: 2,
    hrUpscaler: 'Latent',
    hrSteps: 10,
    denoisingStrength: 0.7,
  }

  // Parse parameters
  if (paramsLine) {
    const params = paramsLine.split(',').map(p => p.trim())

    params.forEach(param => {
      const [key, value] = param.split(':').map(s => s.trim())

      switch (key) {
        case 'Steps':
          result.steps = parseInt(value) || 20
          break
        case 'Sampler':
          result.samplerName = value || 'Euler a'
          break
        case 'Schedule type':
        case 'Scheduler':
          result.scheduler = value || 'Automatic'
          break
        case 'CFG scale':
          result.cfgScale = parseFloat(value) || 7
          break
        case 'Size':
          const [w, h] = value.split('x').map(s => parseInt(s.trim()))
          result.width = w || 512
          result.height = h || 512
          break
        case 'Seed':
          result.seed = parseInt(value) || -1
          break
        case 'Hires upscale':
          result.hrUpscale = parseFloat(value) || 2
          break
        case 'Hires upscaler':
          result.hrUpscaler = value || 'Latent'
          break
        case 'Hires steps':
          result.hrSteps = parseInt(value) || 10
          break
        case 'Denoising strength':
          result.denoisingStrength = parseFloat(value) || 0.7
          break
      }
    })
  }

  return result
}

// Apply PNG info to current settings
function applyPngInfo() {
  if (!previewedPngInfo.value) return

  applyParams(previewedPngInfo.value, {
    includePrompts: true,
    showSuccessToast: true,
    successMessage: 'PNG metadata applied to settings'
  })

  previewedPngInfo.value = null
}

// Cancel PNG info preview
function cancelPngInfo() {
  previewedPngInfo.value = null
}

// Generate random seed
function randomizeSeed() {
  seed.value = Math.floor(Math.random() * SEED_MAX)
}

// Test notification
async function testNotification() {
  if (notificationType.value === NOTIFICATION_TYPES.NONE) {
    props.showToast('알림 타입을 먼저 선택해주세요', 'warning')
    return
  }

  try {
    await notifyCompletion(notificationType.value, {
      volume: notificationVolume.value,
      imageInfo: {
        size: '512x512'
      }
    })
    props.showToast('테스트 알림 전송 완료', 'success')
  } catch (error) {
    console.error('알림 테스트 실패:', error)
    props.showToast('알림 테스트 실패', 'error')
  }
}

// Apply aspect ratio preset - just set the index, watchers will handle calculation
function applyAspectRatio(index) {
  if (!index) return // If "Custom" selected, do nothing

  const ratioPreset = ASPECT_RATIOS[index]
  const [w, h] = ratioPreset.ratio

  // Use current width as base and calculate height based on ratio
  const currentWidth = width.value
  let calcHeight = Math.round((currentWidth * h) / w)

  // Round to nearest 64 (SD requirement)
  calcHeight = Math.round(calcHeight / 64) * 64

  isAdjustingDimensions.value = true
  lastEditedDimension.value = null // Reset tracking when applying preset
  height.value = calcHeight
  isAdjustingDimensions.value = false
}

// Swap width and height
function swapDimensions() {
  isAdjustingDimensions.value = true
  lastEditedDimension.value = null // Reset tracking when swapping

  const temp = width.value
  width.value = height.value
  height.value = temp

  // Try to find matching swapped ratio
  if (selectedAspectRatioIndex.value) {
    const currentRatio = ASPECT_RATIOS[selectedAspectRatioIndex.value]
    const [w, h] = currentRatio.ratio

    // Look for the swapped ratio
    const swappedIndex = ASPECT_RATIOS.findIndex(preset => {
      const [pw, ph] = preset.ratio
      return pw === h && ph === w
    })

    selectedAspectRatioIndex.value = swappedIndex >= 0 ? swappedIndex.toString() : ''
  }

  // Use nextTick to ensure flag is released after all watchers have been processed
  nextTick(() => {
    isAdjustingDimensions.value = false
  })
}

// Open ADetailer prompt editor
function openADetailerPrompt(index) {
  editingADetailerIndex.value = index
  showADetailerPrompt.value = true
}

// Close ADetailer prompt editor
function closeADetailerPrompt() {
  editingADetailerIndex.value = -1
}

// Queue Manager handlers
function openQueueManager() {
  toggleModal('queue')
}

function closeQueueManager() {
  closeModal('queue')
}

// Queue error tracking
let queueConsecutiveErrors = 0
let queueSuccessCount = 0
let queueFailedCount = 0

async function startQueue() {
  if (isQueueRunning.value || isGenerating.value) return

  isQueueRunning.value = true
  isQueuePaused.value = false

  // 통계 초기화
  queueConsecutiveErrors = 0
  queueSuccessCount = 0
  queueFailedCount = 0

  await processQueue()
}

function pauseQueue() {
  isQueuePaused.value = true
  props.showToast?.('현재 생성 완료 후 일시정지됩니다', 'info')
}

function stopQueue() {
  isQueueRunning.value = false
  isQueuePaused.value = false
  queueCurrentIndex.value = -1

  // 통계 표시
  const totalProcessed = queueSuccessCount + queueFailedCount
  if (totalProcessed > 0) {
    const statsMsg = `큐 중단 (처리: ${totalProcessed}개, 성공: ${queueSuccessCount}개, 실패: ${queueFailedCount}개)`
    props.showToast?.(statsMsg, 'info')
  } else {
    props.showToast?.('큐 실행이 중단되었습니다', 'info')
  }
}

// Find next pending queue item
function findNextPendingQueueItem() {
  for (let i = 0; i < queueItems.value.length; i++) {
    if (queueItems.value[i].status === 'pending') {
      return i
    }
  }
  return -1
}

// Apply queue item parameters to form
function applyQueueItemParams(item) {
  prompt.value = item.prompt
  negativePrompt.value = item.negativePrompt
  batchCount.value = item.batchCount

  applyParams(item.params, {
    includePrompts: false,
    showSuccessToast: false
  })
}

// Generate single queue item
// Returns true if successful, false if failed
async function generateQueueItem(item, index) {
  updateQueue(item.id, { status: 'generating' })

  try {
    applyQueueItemParams(item)
    await generateImage()

    // Wait for generation to complete (최대 10분 timeout)
    let waitTime = 0
    while (isGenerating.value && waitTime < QUEUE_ITEM_TIMEOUT) {
      await new Promise(resolve => setTimeout(resolve, 500))
      waitTime += 500
    }

    if (waitTime >= QUEUE_ITEM_TIMEOUT) {
      throw new Error('큐 항목 생성 시간 초과 (10분)')
    }

    updateQueue(item.id, {
      status: 'completed',
      result: {
        images: generatedImages.value.slice(0, item.batchCount),
        timestamp: new Date().toLocaleString('ko-KR'),
      }
    })

    // 성공 처리
    queueSuccessCount++
    queueConsecutiveErrors = 0 // 연속 실패 카운터 리셋
    props.showToast?.(`큐 항목 #${index + 1} 생성 완료`, 'success')
    return true
  } catch (error) {
    console.error('Queue item generation failed:', error)
    updateQueue(item.id, {
      status: 'failed',
      error: error.message || 'Generation failed'
    })

    // 실패 처리
    queueFailedCount++
    queueConsecutiveErrors++

    const errorMsg = `큐 항목 #${index + 1} 생성 실패: ${error.message || 'Unknown error'}`
    console.warn(errorMsg)
    props.showToast?.(errorMsg, 'error')

    return false
  }
}

// Process queue recursively
async function processQueue() {
  // CRITICAL: 재진입 방지 (race condition 방지)
  // 큐가 실행 중이 아니면 중단 (다른 processQueue 호출이 이미 처리 중)
  if (!isQueueRunning.value) {
    console.log('Queue stopped, exiting processQueue')
    return
  }

  // 연속 실패 체크 - 너무 많은 연속 실패 시 자동 중단
  if (queueConsecutiveErrors >= MAX_QUEUE_CONSECUTIVE_ERRORS) {
    isQueueRunning.value = false
    isQueuePaused.value = false
    queueCurrentIndex.value = -1

    const statsMsg = `큐가 자동 중단되었습니다 (연속 ${MAX_QUEUE_CONSECUTIVE_ERRORS}회 실패). 성공: ${queueSuccessCount}개, 실패: ${queueFailedCount}개`
    console.error(statsMsg)
    props.showToast?.(statsMsg, 'error')
    saveQueueState()
    return
  }

  const nextIndex = findNextPendingQueueItem()

  // No more pending items
  if (nextIndex === -1) {
    isQueueRunning.value = false
    isQueuePaused.value = false
    queueCurrentIndex.value = -1

    // 통계 표시
    const totalProcessed = queueSuccessCount + queueFailedCount
    let statsMsg = `모든 큐 항목 처리 완료! (총 ${totalProcessed}개`
    if (queueSuccessCount > 0 && queueFailedCount > 0) {
      statsMsg += ` - 성공: ${queueSuccessCount}개, 실패: ${queueFailedCount}개)`
    } else if (queueFailedCount > 0) {
      statsMsg += ` - 모두 실패)`
    } else {
      statsMsg += ` - 모두 성공)`
    }

    console.log(statsMsg)
    props.showToast?.(statsMsg, queueFailedCount > 0 ? 'warning' : 'success')
    saveQueueState()
    return
  }

  // Check if paused
  if (isQueuePaused.value) {
    isQueueRunning.value = false

    const statsMsg = `큐 일시정지 (성공: ${queueSuccessCount}개, 실패: ${queueFailedCount}개)`
    console.log(statsMsg)
    props.showToast?.(statsMsg, 'info')
    saveQueueState()
    return
  }

  // CRITICAL: 재진입 방지 - 다시 한번 체크 (race condition 방지)
  if (!isQueueRunning.value) {
    console.log('Queue was stopped during processing, exiting')
    return
  }

  // Process current item
  const item = queueItems.value[nextIndex]
  queueCurrentIndex.value = nextIndex
  const success = await generateQueueItem(item, nextIndex)
  saveQueueState()

  // 실패 후 짧은 대기 (서버 부하 방지 및 에러 복구 시간 제공)
  const delayTime = success ? QUEUE_SUCCESS_DELAY : QUEUE_FAILURE_DELAY

  // Process next item if still running (재귀 전에 다시 체크)
  if (isQueueRunning.value && !isQueuePaused.value) {
    await new Promise(resolve => setTimeout(resolve, delayTime))
    // 재귀 호출 전 마지막 체크 (race condition 방지)
    if (isQueueRunning.value && !isQueuePaused.value) {
      await processQueue()
    } else {
      isQueueRunning.value = false
      queueCurrentIndex.value = -1
    }
  } else {
    isQueueRunning.value = false
    queueCurrentIndex.value = -1
  }
}

// Check API connection and ongoing generation
// Throttle API status checks to prevent excessive requests
let lastApiCheckTime = 0

async function checkApiStatus() {
  const now = Date.now()

  // Throttle: ignore if called within threshold
  if (now - lastApiCheckTime < API_CHECK_THROTTLE) {
    console.log('API check throttled (too frequent)')
    return
  }

  lastApiCheckTime = now
  apiChecking.value = true

  try {
    // Single API call to check connectivity and progress
    const response = await fetch(`${API_BASE_URL}/sdapi/v1/progress`, {
      method: 'GET',
      signal: AbortSignal.timeout(API_TIMEOUT)
    })

    if (!response.ok) {
      throw new Error('API connection failed')
    }

    const progressData = await response.json()
    apiConnected.value = true

    // If progress > 0 and < 1, there's an ongoing generation
    if (progressData.progress > 0 && progressData.progress < 1) {
      const percentage = Math.round(progressData.progress * 100)
      const eta = progressData.eta_relative ? `(남은 시간: ${Math.round(progressData.eta_relative)}초)` : ''

      // Sync frontend state with backend generation
      if (!isGenerating.value) {
        isGenerating.value = true
        progress.value = percentage
        startProgressPolling()
        props.showToast?.(`🔄 백엔드 생성 작업에 연결: ${percentage}% ${eta}`, 'info')
      }
    } else if (progressData.progress === 0 && progressData.state?.job_count > 0) {
      props.showToast?.(`대기 중인 작업: ${progressData.state.job_count}개`, 'info')
    } else {
      props.showToast?.('✅ API 연결 성공', 'success')
    }
  } catch (error) {
    console.error('API connection check failed:', error)
    apiConnected.value = false

    if (error.name === 'TimeoutError') {
      props.showToast?.('❌ API 응답 시간 초과. WebUI가 응답하지 않습니다.', 'error')
    } else {
      props.showToast?.('❌ API 연결 실패. WebUI가 실행 중인지 확인하세요.', 'error')
    }
  } finally {
    apiChecking.value = false
  }
}

// Load available models and options from API
async function loadModels(forceRefresh = false) {
  const endpoints = [
    { url: '/sdapi/v1/sd-models', target: availableModels, name: 'Models', cacheKey: 'txt2img_cached_models' },
    { url: '/sdapi/v1/samplers', target: availableSamplers, name: 'Samplers', cacheKey: 'txt2img_cached_samplers' },
    { url: '/sdapi/v1/schedulers', target: availableSchedulers, name: 'Schedulers', cacheKey: 'txt2img_cached_schedulers' },
    { url: '/sdapi/v1/upscalers', target: availableUpscalers, name: 'Upscalers', cacheKey: 'txt2img_cached_upscalers' }
  ]

  // Load each endpoint with caching
  for (const { url, target, name, cacheKey } of endpoints) {
    try {
      // Try to load from cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = window.localStorage.getItem(cacheKey)
        if (cached) {
          try {
            target.value = JSON.parse(cached)
            console.log(`${name} loaded from cache`)
            continue // Skip API call
          } catch (e) {
            console.warn(`Failed to parse cached ${name}, fetching from API`)
          }
        }
      }

      // Fetch from API if no cache or force refresh
      const response = await fetch(`${API_BASE_URL}${url}`)
      if (response.ok) {
        const data = await response.json()
        target.value = data
        // Save to cache
        window.localStorage.setItem(cacheKey, JSON.stringify(data))
        console.log(`${name} loaded from API and cached`)
      } else {
        console.error(`Failed to load ${name}: HTTP ${response.status}`)
        props.showToast?.(`${name} 로드 실패 (${response.status})`, 'warning')
      }
    } catch (error) {
      console.error(`Failed to load ${name}:`, error)
      props.showToast?.(`${name} 로드 실패`, 'error')
    }
  }

  // Get current model (only for display, won't override slot settings)
  try {
    const optionsResponse = await fetch(`${API_BASE_URL}/sdapi/v1/options`)
    if (optionsResponse.ok) {
      const options = await optionsResponse.json()
      // Only set if not already set by slot loading
      if (!selectedModel.value) {
        selectedModel.value = options.sd_model_checkpoint || ''
      }
    } else {
      console.error(`Failed to load current model: HTTP ${optionsResponse.status}`)
    }
  } catch (error) {
    console.error('Failed to load current model:', error)
  }
}

// Change checkpoint model
async function changeModel(modelTitle) {
  if (!modelTitle) return

  try {
    const response = await fetch(`${API_BASE_URL}/sdapi/v1/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sd_model_checkpoint: modelTitle
      })
    })

    if (!response.ok) {
      console.error(`Failed to change model: HTTP ${response.status}`)
      props.showToast?.(`모델 변경 실패 (${response.status})`, 'error')
    }
  } catch (error) {
    console.error('Failed to change model:', error)
    props.showToast?.('모델 변경 실패', 'error')
  }
}

// Load history on mount
async function loadData() {
  // One-time migration from localStorage to IndexedDB
  const migrated = window.localStorage.getItem('sd-migrated-to-indexeddb')
  if (!migrated) {
    console.log('localStorage → IndexedDB 마이그레이션 시작...')

    try {
      // Migrate history
      const oldHistory = localStorage.loadFromLocalStorage()
      if (oldHistory.length > 0) {
        console.log(`${oldHistory.length}개 이미지 마이그레이션 중...`)
        for (const image of oldHistory) {
          try {
            await indexedDB.saveImage(image)
          } catch (e) {
            console.warn('이미지 마이그레이션 실패 (스킵):', e)
          }
        }
        console.log('이미지 마이그레이션 완료')
      }

      // Migrate slots
      const oldSlots = localStorage.loadSlots()
      if (oldSlots.some(slot => slot !== null)) {
        await indexedDB.saveSlots(oldSlots)
        console.log('슬롯 마이그레이션 완료')
      }

      // Mark as migrated
      window.localStorage.setItem('sd-migrated-to-indexeddb', 'true')

      // Clear old localStorage data
      window.localStorage.removeItem('sd-history')
      console.log('localStorage 정리 완료')

      props.showToast?.('✅ 데이터가 IndexedDB로 마이그레이션되었습니다', 'success')
    } catch (error) {
      console.error('마이그레이션 실패:', error)
      props.showToast?.('⚠️ 데이터 마이그레이션 실패 (계속 진행)', 'warning')
    }
  }

  // Load history from IndexedDB
  try {
    const history = await indexedDB.getRecentImages(INITIAL_LOAD_COUNT) // 최근 N장 로드 (메모리 최적화)
    if (history.length > 0) {
      generatedImages.value = history
      currentImage.value = history[0].image
      lastUsedParams.value = history[0].params
      console.log(`IndexedDB에서 ${history.length}개 이미지 로드 완료`)
    }
  } catch (error) {
    console.error('IndexedDB 로드 실패:', error)
  }

  // Load slots from IndexedDB
  try {
    const loadedSlots = await indexedDB.loadSlots()
    slots.value = loadedSlots
  } catch (error) {
    console.error('슬롯 로드 실패:', error)
    // Fallback to localStorage
    const loadedSlots = localStorage.loadSlots()
    slots.value = loadedSlots
  }

  // Load active slot
  const savedActiveSlot = window.localStorage.getItem('sd-active-slot')
  if (savedActiveSlot !== null) {
    const slotIndex = parseInt(savedActiveSlot)
    if (slotIndex >= 0 && slotIndex < SLOT_COUNT) {
      activeSlot.value = slotIndex
      const slotData = slots.value[slotIndex]
      if (slotData) {
        slotManagement.applySettings(slotData)
      }
    }
  }

  // Check for pending prompt load from PNG Info
  const pendingLoad = sessionStorage.getItem('pending-prompt-load')
  if (pendingLoad) {
    try {
      const params = JSON.parse(pendingLoad)
      prompt.value = params.prompt || ''
      negativePrompt.value = params.negative_prompt || ''
      steps.value = params.steps || 20
      width.value = params.width || 512
      height.value = params.height || 512
      cfgScale.value = params.cfg_scale || 7
      seed.value = params.seed || -1
      sessionStorage.removeItem('pending-prompt-load')
    } catch (error) {
      console.error('Failed to load pending prompt:', error)
    }
  }
}

// Auto-adjust height when width changes (if ratio is selected)
watch(width, (newWidth) => {
  // Skip if we're programmatically adjusting, or if height was the last edited field
  if (isAdjustingDimensions.value) return
  if (lastEditedDimension.value === 'height') {
    lastEditedDimension.value = null // Reset after skipping once
    return
  }
  if (!selectedAspectRatioIndex.value) return

  const ratioPreset = ASPECT_RATIOS[selectedAspectRatioIndex.value]
  if (!ratioPreset) return

  // Mark that width was edited, so we adjust height
  lastEditedDimension.value = 'width'

  const [w, h] = ratioPreset.ratio
  let calcHeight = Math.round((newWidth * h) / w)
  calcHeight = Math.round(calcHeight / 64) * 64

  isAdjustingDimensions.value = true
  height.value = calcHeight
  isAdjustingDimensions.value = false
}, { flush: 'post' }) // Execute after all synchronous updates

// Auto-adjust width when height changes (if ratio is selected)
watch(height, (newHeight) => {
  // Skip if we're programmatically adjusting, or if width was the last edited field
  if (isAdjustingDimensions.value) return
  if (lastEditedDimension.value === 'width') {
    lastEditedDimension.value = null // Reset after skipping once
    return
  }
  if (!selectedAspectRatioIndex.value) return

  const ratioPreset = ASPECT_RATIOS[selectedAspectRatioIndex.value]
  if (!ratioPreset) return

  // Mark that height was edited, so we adjust width
  lastEditedDimension.value = 'height'

  const [w, h] = ratioPreset.ratio
  let calcWidth = Math.round((newHeight * w) / h)
  calcWidth = Math.round(calcWidth / 64) * 64

  isAdjustingDimensions.value = true
  width.value = calcWidth
  isAdjustingDimensions.value = false
}, { flush: 'post' }) // Execute after all synchronous updates

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
          label="프롬프트"
          placeholder="beautiful landscape, detailed, masterpiece, best quality..."
          :is-generating="isGenerating"
          :is-changed="promptChanged"
          :is-negative="false"
        />

        <PromptTextarea
          v-model="negativePrompt"
          label="네거티브 프롬프트"
          placeholder="ugly, blurry, low quality..."
          :is-generating="isGenerating"
          :is-changed="negativePromptChanged"
          :is-negative="true"
        />
      </PromptPanel>

    </div>

    <!-- 4단: 이미지 프리뷰 + 히스토리 OR Easy Prompt Selector OR Bookmark Manager OR Preset Manager OR Queue Manager OR LoRA Selector -->
    <div v-if="!showPromptSelector && !showBookmarkManager && !showPresetManager && !showQueueManager && !showLoraSelector" class="image-area">
      <ImagePreviewPanel
        :current-image="currentImage"
        :is-loading="isLoadingPngInfo"
        :is-expanded="showImagePanel"
        @toggle-panel="showImagePanel = !showImagePanel"
        @show-preview="openModal('viewer')"
        @load-png-info="handleLoadPngInfo"
      />

      <HistoryPanel
        :is-expanded="showHistoryPanel"
        :show-favorite-only="showFavoriteOnly"
        :is-selection-mode="isSelectionMode"
        :selected-count="selectedImages.size"
        :image-count="generatedImages.length"
        :is-empty="filteredImages.length === 0"
        :has-favorites="generatedImages.some(img => img.favorite)"
        :has-images="generatedImages.length > 0"
        @toggle-panel="showHistoryPanel = !showHistoryPanel"
        @toggle-favorite-filter="showFavoriteOnly = !showFavoriteOnly"
        @toggle-selection-mode="toggleSelectionMode"
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
          @view-image="(imageUrl) => openModal('comparison', imageUrl)"
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
