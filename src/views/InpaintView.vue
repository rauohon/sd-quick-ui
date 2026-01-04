<script setup>
import { ref, computed, onMounted, watch, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInpaintGeneration } from '../composables/useInpaintGeneration'
import { useIndexedDB } from '../composables/useIndexedDB'
import { useApiStatus } from '../composables/useApiStatus'
import { useModelLoader } from '../composables/useModelLoader'
import { useSlotManagement } from '../composables/useSlotManagement'
import { useHistory } from '../composables/useHistory'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useVirtualScroll } from '../composables/useVirtualScroll'
import {
  NOTIFICATION_TYPES,
  SLOT_COUNT,
  ADETAILER_LABELS,
  ADETAILER_MODELS,
  DEFAULT_ADETAILER,
  INPAINT_PARAM_RANGES,
  INPAINT_FILL_OPTIONS,
  IMAGE_TYPES,
  INITIAL_LOAD_COUNT,
  LOAD_MORE_COUNT
} from '../config/constants'

// Components
import PromptTextarea from '../components/PromptTextarea.vue'
import ImagePreviewPanel from '../components/ImagePreviewPanel.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import HistoryImageItem from '../components/HistoryImageItem.vue'
import HistoryManagerModal from '../components/HistoryManagerModal.vue'
import ApiStatusIndicator from '../components/ApiStatusIndicator.vue'
import ADetailerPromptModal from '../components/ADetailerPromptModal.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import BookmarkManager from '../components/BookmarkManager.vue'
import PresetManager from '../components/PresetManager.vue'

// Composables
import { useBookmarks } from '../composables/useBookmarks'
import { usePresets } from '../composables/usePresets'

const { t } = useI18n()

// Props
const props = defineProps({
  showToast: { type: Function, required: true },
  openModal: { type: Function, required: true },
  showConfirm: { type: Function, required: true },
  isDark: { type: Boolean, default: false },
  toggleTheme: { type: Function, required: true }
})

const emit = defineEmits(['updateCurrentImage'])

// ===== 기본 파라미터 =====
const prompt = ref('')
const negativePrompt = ref('')
const steps = ref(20)
const cfgScale = ref(7)
const samplerName = ref('Euler a')
const scheduler = ref('Normal')
const width = ref(512)
const height = ref(512)
const batchCount = ref(1)
const batchSize = ref(1)
const seed = ref(-1)
const seedVariationRange = ref(1000)
const selectedModel = ref('')

// Inpaint 전용 파라미터
const initImage = ref(null)
const initImageWidth = ref(0)
const initImageHeight = ref(0)
const mask = ref(null) // 마스크 이미지 (base64)
const denoisingStrength = ref(INPAINT_PARAM_RANGES.denoisingStrength.default)
const maskBlur = ref(INPAINT_PARAM_RANGES.maskBlur.default)
const inpaintingFill = ref(INPAINT_FILL_OPTIONS.ORIGINAL)
const inpaintFullRes = ref(false)
const inpaintFullResPadding = ref(INPAINT_PARAM_RANGES.onlyMaskedPadding.default)

// 마스크 도구 상태
const activeTool = ref('brush') // 'brush' | 'eraser'
const brushSize = ref(30)

// ADetailer
const adetailers = ref([
  { ...DEFAULT_ADETAILER },
  { ...DEFAULT_ADETAILER },
  { ...DEFAULT_ADETAILER },
  { ...DEFAULT_ADETAILER }
])

// Notification
const notificationType = ref(NOTIFICATION_TYPES.NONE)
const notificationVolume = ref(0.5)

// UI 상태
const showSettingsPanel = ref(true)
const showHistoryPanel = ref(true)
const isHistoryContentCollapsed = ref(false)
const showImagePanel = ref(true)

// ADetailer 프롬프트 모달
const showADetailerPrompt = ref(false)
const editingADetailerIndex = ref(0)

// 북마크/프리셋 모달
const showBookmarkManager = ref(false)
const showPresetManager = ref(false)

// 북마크/프리셋 composables
const {
  bookmarks,
  loadBookmarks,
  addBookmark,
  updateBookmarkContent
} = useBookmarks()

const {
  presets,
  loadPresets
} = usePresets()

// 시스템 설정
const isSystemSettingsExpanded = ref(false)
const autoCorrectDimensions = ref(false)

// API 상태
const { apiConnected, apiChecking, checkApiStatus } = useApiStatus()

// 모델 로더
const {
  availableModels,
  availableSamplers,
  availableSchedulers,
  availableUpscalers,
  loadModels
} = useModelLoader(props.showToast, t)

// IndexedDB & localStorage
const indexedDB = useIndexedDB()
const localStorage = useLocalStorage()

// ===== Slot Management =====
const INPAINT_SLOT_KEY = 'inpaint-slots'

// Inpaint 기본 설정
const defaultSettings = {
  prompt: '',
  negativePrompt: '',
  steps: 20,
  cfgScale: 7,
  samplerName: 'Euler a',
  scheduler: 'Normal',
  width: 512,
  height: 512,
  batchCount: 1,
  batchSize: 1,
  seed: -1,
  denoisingStrength: INPAINT_PARAM_RANGES.denoisingStrength.default,
  maskBlur: INPAINT_PARAM_RANGES.maskBlur.default,
  inpaintingFill: INPAINT_FILL_OPTIONS.ORIGINAL,
  inpaintFullRes: false,
  inpaintFullResPadding: INPAINT_PARAM_RANGES.onlyMaskedPadding.default
}

// 슬롯에 저장할 설정 refs
const SETTINGS_REFS = {
  prompt,
  negativePrompt,
  steps,
  cfgScale,
  samplerName,
  scheduler,
  width,
  height,
  batchCount,
  batchSize,
  seed,
  denoisingStrength,
  maskBlur,
  inpaintingFill,
  inpaintFullRes,
  inpaintFullResPadding
}

// 슬롯 관리 (inpaint 전용 키 사용)
const slotManagement = useSlotManagement(defaultSettings, SETTINGS_REFS, null, props.showToast, 'sd-inpaint')
const {
  slots,
  activeSlot,
  localStorageKey,
  saveCurrentSlot,
  selectSlot,
  startDebouncedSlotSave,
  getCurrentSettings
} = slotManagement

// Enabled ADetailers computed
const enabledADetailers = computed(() =>
  adetailers.value.filter(ad => ad.enable)
)

// Generation params object
const generationParams = {
  prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
  width, height, batchCount, batchSize, seed, seedVariationRange,
  adetailers, selectedModel, notificationType, notificationVolume,
  // Inpaint 전용
  initImage, mask, denoisingStrength,
  maskBlur, inpaintingFill, inpaintFullRes, inpaintFullResPadding
}

// Image generation composable
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
  toggleInfiniteMode
} = useInpaintGeneration(generationParams, enabledADetailers, props.showToast, t)

// ===== History Composable =====
const historyRefs = {
  generatedImages, currentImage, lastUsedParams, adetailers,
  slots, activeSlot, prompt, negativePrompt, steps, width, height, cfgScale, seed
}
const historyComposables = { indexedDB, localStorage, slotManagement }
const historyCallbacks = { showToast: props.showToast, showConfirm: props.showConfirm }
const historyConstants = { INITIAL_LOAD_COUNT, LOAD_MORE_COUNT, SLOT_COUNT }
const history = useHistory(historyRefs, historyComposables, historyCallbacks, historyConstants, t)
const {
  showFavoriteOnly,
  isSelectionMode,
  selectedImages,
  showHistoryDetail: showHistoryManager,
  selectedHistoryItem: selectedHistoryImage,
  totalImageCount,
  filteredImages,
  toggleImageFavorite,
  deleteImage,
  clearHistory,
  loadMoreImages,
  openHistoryManager,
  closeHistoryDetail: closeHistoryManager,
  handleHistoryDownload,
  handleHistoryDownloadMultiple,
  handleHistoryDeleteMultiple,
  toggleSelectionMode,
  toggleImageSelection,
  selectAllImages,
  deselectAllImages,
  downloadSelectedImages,
  toggleFavoriteFilter,
  addSampleImage
} = history

// History panel ref for virtual scroll
const historyPanelRef = ref(null)

// Virtual scroll container ref
const historyScrollContainerRef = computed(() => {
  return historyPanelRef.value?.scrollContainerRef || null
})

// Virtual scroll for history panel
const historyVirtualScroll = useVirtualScroll({
  items: filteredImages,
  containerRef: historyScrollContainerRef,
  itemHeight: 120,
  columns: 3,
  buffer: 2,
  gap: 16
})
const {
  visibleItems: visibleHistoryItems,
  totalHeight: historyTotalHeight,
  offsetY: historyOffsetY
} = historyVirtualScroll

// Watch current image for parent
watch(currentImage, (newImage) => {
  emit('updateCurrentImage', newImage)
})

// 입력 이미지 크기로 출력 크기 자동 설정
watch([initImageWidth, initImageHeight], ([w, h]) => {
  if (w > 0 && h > 0) {
    // 8의 배수로 조정
    width.value = Math.round(w / 8) * 8
    height.value = Math.round(h / 8) * 8
  }
})

// ===== Methods =====
function handleGenerate() {
  if (!initImage.value) {
    props.showToast(t('inpaint.noImageSelected'), 'error')
    return
  }
  if (!mask.value) {
    props.showToast(t('inpaint.noMaskDrawn'), 'error')
    return
  }
  generateImage()
}

function randomizeSeed() {
  seed.value = Math.floor(Math.random() * 4294967295)
}

function toggleHistoryPanel() {
  showHistoryPanel.value = !showHistoryPanel.value
}

function toggleHistoryContent() {
  isHistoryContentCollapsed.value = !isHistoryContentCollapsed.value
}

function toggleImagePanel() {
  showImagePanel.value = !showImagePanel.value
}

function loadParamsFromHistory(item) {
  const params = item.params || item
  if (params.prompt !== undefined) prompt.value = params.prompt
  if (params.negative_prompt !== undefined) negativePrompt.value = params.negative_prompt
  if (params.steps !== undefined) steps.value = params.steps
  if (params.cfg_scale !== undefined) cfgScale.value = params.cfg_scale
  if (params.width !== undefined) width.value = params.width
  if (params.height !== undefined) height.value = params.height
  if (params.sampler_name !== undefined) samplerName.value = params.sampler_name
  if (params.denoising_strength !== undefined) denoisingStrength.value = params.denoising_strength
  if (params.mask_blur !== undefined) maskBlur.value = params.mask_blur

  props.showToast(t('history.loadParams'), 'success')
}

function handleCompareImage(item) {
  props.openModal('comparison', item.image)
}

// ===== 마스크 도구 함수 =====
function setActiveTool(tool) {
  activeTool.value = tool
}

function clearMask() {
  mask.value = null
  props.showToast(t('inpaint.clearMask'), 'info')
}

function fillMask() {
  // TODO: 전체 마스크 채우기 구현 (MaskCanvas에서 처리)
  props.showToast(t('inpaint.fillMask'), 'info')
}

function invertMask() {
  // TODO: 마스크 반전 구현 (MaskCanvas에서 처리)
  props.showToast(t('inpaint.invertMask'), 'info')
}

// ===== ADetailer Functions =====
function openADetailerPrompt(index) {
  editingADetailerIndex.value = index
  showADetailerPrompt.value = true
}

function updateADetailerPrompts(prompt, negativePrompt) {
  const index = editingADetailerIndex.value
  adetailers.value[index].prompt = prompt
  adetailers.value[index].negativePrompt = negativePrompt
}

function updateADetailerEnable(index, value) {
  adetailers.value[index].enable = value
}

function updateADetailerModel(index, value) {
  adetailers.value[index].model = value
}

function reorderADetailers(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= adetailers.value.length) return
  const temp = adetailers.value[fromIndex]
  adetailers.value[fromIndex] = adetailers.value[toIndex]
  adetailers.value[toIndex] = temp
}

// History image selector modal
const showHistorySelector = ref(false)

function openHistorySelector() {
  showHistorySelector.value = true
}

function closeHistorySelector() {
  showHistorySelector.value = false
}

function selectImageFromHistory(image) {
  initImage.value = image.image
  const img = new Image()
  img.onload = () => {
    initImageWidth.value = img.width
    initImageHeight.value = img.height
  }
  img.src = image.image
  closeHistorySelector()
}

// 파일 업로드
function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    initImage.value = e.target.result
    const img = new Image()
    img.onload = () => {
      initImageWidth.value = img.width
      initImageHeight.value = img.height
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 시스템 설정 저장
function saveAutoCorrectSetting() {
  window.localStorage.setItem('sd-auto-correct-dimensions', String(autoCorrectDimensions.value))
}

// ===== 북마크/프리셋 핸들러 =====
function openBookmarkManager() {
  showPresetManager.value = false
  showBookmarkManager.value = !showBookmarkManager.value
}

function closeBookmarkManager() {
  showBookmarkManager.value = false
}

function openPresetManager() {
  showBookmarkManager.value = false
  showPresetManager.value = !showPresetManager.value
}

function closePresetManager() {
  showPresetManager.value = false
}

// 북마크 적용
function applyBookmark({ prompt: newPrompt, negativePrompt: newNegativePrompt, mode }) {
  if (mode === 'replace') {
    prompt.value = newPrompt
    negativePrompt.value = newNegativePrompt
  } else if (mode === 'prepend') {
    prompt.value = newPrompt + (prompt.value ? ', ' + prompt.value : '')
    negativePrompt.value = newNegativePrompt + (negativePrompt.value ? ', ' + negativePrompt.value : '')
  } else if (mode === 'append') {
    prompt.value = prompt.value + (prompt.value ? ', ' : '') + newPrompt
    negativePrompt.value = negativePrompt.value + (negativePrompt.value ? ', ' : '') + newNegativePrompt
  }
}

// 프리셋 적용
function applyPreset(params) {
  if (params.steps !== undefined) steps.value = params.steps
  if (params.cfgScale !== undefined) cfgScale.value = params.cfgScale
  if (params.cfg_scale !== undefined) cfgScale.value = params.cfg_scale
  if (params.samplerName !== undefined) samplerName.value = params.samplerName
  if (params.sampler_name !== undefined) samplerName.value = params.sampler_name
  if (params.scheduler !== undefined) scheduler.value = params.scheduler
  if (params.width !== undefined) width.value = params.width
  if (params.height !== undefined) height.value = params.height
  if (params.seed !== undefined) seed.value = params.seed
  if (params.batchCount !== undefined) batchCount.value = params.batchCount
  if (params.batchSize !== undefined) batchSize.value = params.batchSize
  if (params.denoisingStrength !== undefined) denoisingStrength.value = params.denoisingStrength
  if (params.denoising_strength !== undefined) denoisingStrength.value = params.denoising_strength
  if (params.adetailers) {
    adetailers.value = JSON.parse(JSON.stringify(params.adetailers))
  }
}

// 현재 파라미터 (프리셋 저장용)
const currentParams = computed(() => ({
  steps: steps.value,
  cfgScale: cfgScale.value,
  samplerName: samplerName.value,
  scheduler: scheduler.value,
  width: width.value,
  height: height.value,
  seed: seed.value,
  batchCount: batchCount.value,
  batchSize: batchSize.value,
  denoisingStrength: denoisingStrength.value,
  maskBlur: maskBlur.value,
  adetailers: JSON.parse(JSON.stringify(adetailers.value))
}))

// ===== Lifecycle =====
onMounted(async () => {
  await checkApiStatus()
  await loadModels()

  // Load bookmarks and presets
  loadBookmarks()
  loadPresets()

  // Load auto-correct setting
  const savedAutoCorrect = window.localStorage.getItem('sd-auto-correct-dimensions')
  if (savedAutoCorrect === 'true') {
    autoCorrectDimensions.value = true
  }

  // Load existing images from IndexedDB
  try {
    const count = await indexedDB.getImageCount()
    totalImageCount.value = count
    const images = await indexedDB.getRecentImages(INITIAL_LOAD_COUNT)
    if (images.length > 0) {
      generatedImages.value = images
      if (images[0]?.image) {
        currentImage.value = images[0].image
      }
    }
  } catch (error) {
    console.error('Failed to load images from IndexedDB:', error)
  }

  // Load slots from IndexedDB
  try {
    const loadedSlots = await indexedDB.loadSlots(INPAINT_SLOT_KEY)
    slots.value = loadedSlots

    const savedActiveSlot = window.localStorage.getItem(localStorageKey)
    if (savedActiveSlot !== null) {
      const slotIndex = parseInt(savedActiveSlot, 10)
      if (!isNaN(slotIndex) && slotIndex >= 0 && slotIndex < SLOT_COUNT) {
        selectSlot(slotIndex)
      }
    }
  } catch (error) {
    console.error('Failed to load slots from IndexedDB:', error)
  }
})

// Slots → IndexedDB persistence
watch(slots, async (newSlots) => {
  try {
    const plainSlots = JSON.parse(JSON.stringify(toRaw(newSlots)))
    await indexedDB.saveSlots(plainSlots, INPAINT_SLOT_KEY)
  } catch (error) {
    console.error('슬롯 IndexedDB 저장 실패:', error)
  }
}, { deep: true })

// Settings change → debounced slot save
watch(
  [prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
   width, height, batchCount, batchSize, seed, denoisingStrength,
   maskBlur, inpaintingFill, inpaintFullRes, inpaintFullResPadding],
  () => {
    if (activeSlot.value !== null) {
      startDebouncedSlotSave()
    }
  }
)
</script>

<template>
  <div class="inpaint-view" :class="{ 'settings-collapsed': !showSettingsPanel }">
    <!-- 1열: 설정 패널 -->
    <div class="advanced-panel" :class="{ collapsed: !showSettingsPanel }">
      <div class="panel-header">
        <button
          class="toggle-advanced-btn"
          @click="showSettingsPanel = !showSettingsPanel"
          :title="showSettingsPanel ? t('advancedPanel.foldPanel') : t('advancedPanel.unfoldPanel')"
        >
          {{ showSettingsPanel ? '◀' : '▶' }}
        </button>
        <h3 class="panel-title">{{ t('advancedPanel.title') }}</h3>
        <div class="header-right">
          <ApiStatusIndicator
            v-if="showSettingsPanel"
            :connected="apiConnected"
            :checking="apiChecking"
            @check="checkApiStatus"
          />
        </div>
      </div>

      <div v-if="showSettingsPanel" class="advanced-content">
        <!-- 모델 선택 -->
        <div class="form-group horizontal">
          <label>Checkpoint</label>
          <select v-model="selectedModel" :disabled="isGenerating">
            <option value="">{{ t('advancedPanel.selectModel') }}</option>
            <option v-for="m in availableModels" :key="m.title" :value="m.title">{{ m.model_name }}</option>
          </select>
        </div>

        <!-- 샘플러 -->
        <div class="form-group horizontal">
          <label>Sampler</label>
          <select v-model="samplerName" :disabled="isGenerating">
            <option v-for="s in availableSamplers" :key="s.name" :value="s.name">{{ s.name }}</option>
          </select>
        </div>

        <!-- 크기 -->
        <div class="form-group horizontal">
          <label>Width</label>
          <input type="number" v-model.number="width" min="64" max="2048" step="64" :disabled="isGenerating" />
        </div>
        <div class="form-group horizontal">
          <label>Height</label>
          <input type="number" v-model.number="height" min="64" max="2048" step="64" :disabled="isGenerating" />
        </div>

        <!-- Denoising Strength -->
        <div class="form-group horizontal">
          <label>Denoising</label>
          <input
            type="range"
            v-model.number="denoisingStrength"
            :min="INPAINT_PARAM_RANGES.denoisingStrength.min"
            :max="INPAINT_PARAM_RANGES.denoisingStrength.max"
            :step="INPAINT_PARAM_RANGES.denoisingStrength.step"
            :disabled="isGenerating"
          />
          <span class="value-display">{{ denoisingStrength.toFixed(2) }}</span>
        </div>

        <!-- Mask Blur -->
        <div class="form-group horizontal">
          <label>{{ t('inpaint.maskBlur') }}</label>
          <input
            type="range"
            v-model.number="maskBlur"
            :min="INPAINT_PARAM_RANGES.maskBlur.min"
            :max="INPAINT_PARAM_RANGES.maskBlur.max"
            :step="INPAINT_PARAM_RANGES.maskBlur.step"
            :disabled="isGenerating"
          />
          <span class="value-display">{{ maskBlur }}</span>
        </div>

        <!-- Masked Content -->
        <div class="form-group horizontal">
          <label>{{ t('inpaint.maskedContent') }}</label>
          <select v-model="inpaintingFill" :disabled="isGenerating">
            <option :value="0">{{ t('inpaint.maskedContentFill') }}</option>
            <option :value="1">{{ t('inpaint.maskedContentOriginal') }}</option>
            <option :value="2">{{ t('inpaint.maskedContentLatentNoise') }}</option>
            <option :value="3">{{ t('inpaint.maskedContentLatentNothing') }}</option>
          </select>
        </div>

        <!-- Inpaint Area -->
        <div class="form-group horizontal">
          <label>{{ t('inpaint.inpaintArea') }}</label>
          <select v-model="inpaintFullRes" :disabled="isGenerating">
            <option :value="false">{{ t('inpaint.inpaintAreaWholePicture') }}</option>
            <option :value="true">{{ t('inpaint.inpaintAreaOnlyMasked') }}</option>
          </select>
        </div>

        <!-- Only Masked Padding -->
        <div v-if="inpaintFullRes" class="form-group horizontal">
          <label>{{ t('inpaint.onlyMaskedPadding') }}</label>
          <input
            type="range"
            v-model.number="inpaintFullResPadding"
            :min="INPAINT_PARAM_RANGES.onlyMaskedPadding.min"
            :max="INPAINT_PARAM_RANGES.onlyMaskedPadding.max"
            :step="INPAINT_PARAM_RANGES.onlyMaskedPadding.step"
            :disabled="isGenerating"
          />
          <span class="value-display">{{ inpaintFullResPadding }}px</span>
        </div>

        <!-- Seed -->
        <div class="form-group horizontal">
          <label>Seed</label>
          <div style="flex: 1; display: flex; gap: 6px;">
            <input type="number" v-model.number="seed" :disabled="isGenerating" style="flex: 1;" />
            <button class="seed-random-btn" @click="randomizeSeed" :disabled="isGenerating" title="Generate random seed">🎲</button>
          </div>
        </div>

        <!-- Steps -->
        <div class="form-group horizontal">
          <label>Steps</label>
          <input type="number" v-model.number="steps" min="1" max="150" :disabled="isGenerating" />
        </div>

        <!-- CFG Scale -->
        <div class="form-group horizontal">
          <label>CFG Scale</label>
          <input type="number" v-model.number="cfgScale" min="1" max="30" step="0.5" :disabled="isGenerating" />
        </div>

        <!-- Batch -->
        <div class="form-group horizontal">
          <label>Batch count</label>
          <input type="number" v-model.number="batchCount" min="1" :disabled="isGenerating" />
        </div>

        <!-- Notification -->
        <div class="section-divider"></div>
        <div class="form-group horizontal">
          <label>Notification</label>
          <select v-model="notificationType" :disabled="isGenerating" style="flex: 1;">
            <option :value="NOTIFICATION_TYPES.NONE">None</option>
            <option :value="NOTIFICATION_TYPES.SOUND">Sound</option>
            <option :value="NOTIFICATION_TYPES.BROWSER">Browser</option>
            <option :value="NOTIFICATION_TYPES.BOTH">Both</option>
          </select>
        </div>

        <!-- ADetailer -->
        <div class="section-divider"></div>
        <div class="adetailer-group">
          <div class="group-title">ADetailer</div>
          <div v-for="(ad, index) in adetailers" :key="index" class="ad-row">
            <div class="ad-header-row">
              <div class="reorder-btns">
                <button :disabled="index === 0 || isGenerating" @click="reorderADetailers(index, index - 1)">▲</button>
                <button :disabled="index === adetailers.length - 1 || isGenerating" @click="reorderADetailers(index, index + 1)">▼</button>
              </div>
              <label class="checkbox-label">
                <input type="checkbox" :checked="ad.enable" @change="updateADetailerEnable(index, $event.target.checked)" :disabled="isGenerating" />
                AD {{ ADETAILER_LABELS[index] }}
              </label>
            </div>
            <template v-if="ad.enable">
              <div class="ad-details">
                <select :value="ad.model" @change="updateADetailerModel(index, $event.target.value)" :disabled="isGenerating">
                  <option v-for="model in ADETAILER_MODELS" :key="model" :value="model">{{ model }}</option>
                </select>
                <button class="prompt-edit-btn" @click="openADetailerPrompt(index)" :disabled="isGenerating">
                  {{ ad.prompt || ad.negativePrompt ? '✏️' : '📝' }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- System Settings Section -->
      <div v-if="showSettingsPanel" class="system-settings-section">
        <div class="system-settings-header" @click="isSystemSettingsExpanded = !isSystemSettingsExpanded">
          <span class="system-settings-title">{{ t('systemSettings.title') }}</span>
          <span class="toggle-icon">{{ isSystemSettingsExpanded ? '▲' : '▼' }}</span>
        </div>

        <transition name="expand">
          <div v-if="isSystemSettingsExpanded" class="system-settings-content">
            <div class="setting-group">
              <label class="setting-label">{{ t('settings.language') }}</label>
              <LanguageSwitcher />
            </div>

            <div class="setting-group">
              <label class="setting-label">{{ t('theme.title') }}</label>
              <div class="theme-toggle">
                <button class="theme-btn" :class="{ active: !props.isDark }" @click="props.toggleTheme" :title="t('theme.light')">
                  {{ t('theme.light') }}
                </button>
                <button class="theme-btn" :class="{ active: props.isDark }" @click="props.toggleTheme" :title="t('theme.dark')">
                  {{ t('theme.dark') }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div v-if="showSettingsPanel" class="panel-footer">
        <span class="footer-title">SD Quick UI</span>
        <button
          v-if="!apiConnected"
          class="footer-btn"
          @click="checkApiStatus"
          :disabled="apiChecking"
          :title="t('api.checkConnection')"
        >
          {{ apiChecking ? t('advancedPanel.checking') : t('advancedPanel.reconnect') }}
        </button>
      </div>
    </div>

    <!-- 2열: 프롬프트 + 생성 -->
    <div class="prompt-panel">
      <div class="prompt-panel-header">
        <h3 class="prompt-panel-title">{{ t('inpaint.title') }}</h3>
        <div class="header-buttons">
          <button
            class="generate-btn"
            @click="handleGenerate"
            :disabled="isGenerating || !apiConnected || !initImage || !mask"
          >
            <template v-if="isGenerating">{{ t('promptPanel.generating') }}</template>
            <template v-else-if="!initImage">{{ t('inpaint.imageRequired') }}</template>
            <template v-else-if="!mask">{{ t('inpaint.maskRequired') }}</template>
            <template v-else-if="!apiConnected">{{ t('promptPanel.apiConnectionRequired') }}</template>
            <template v-else>{{ t('promptPanel.generate') }}</template>
          </button>
        </div>
      </div>

      <!-- Progress -->
      <div v-if="isGenerating" class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">
          <span v-if="progressState" class="progress-state">{{ progressState }}</span>
          <span class="progress-percent">{{ Math.round(progress) }}%</span>
        </div>
      </div>

      <!-- Generation Controls -->
      <div v-if="isGenerating" class="generation-controls">
        <button class="control-btn interrupt-btn" @click="interruptGeneration">
          {{ t('promptPanel.interrupt') }}
        </button>
        <button class="control-btn skip-btn" @click="skipCurrentImage">
          {{ t('promptPanel.skip') }}
        </button>
      </div>

      <!-- 슬롯 버튼 -->
      <div class="slot-section">
        <div class="slot-row">
          <div class="slot-buttons">
            <button
              v-for="i in SLOT_COUNT"
              :key="i"
              class="slot-btn"
              :class="{ active: activeSlot === i - 1, filled: slots[i - 1] !== null }"
              @click="selectSlot(i - 1)"
            >
              {{ i }}
              <span v-if="slots[i - 1]" class="dot">●</span>
            </button>
          </div>
          <div class="tool-buttons">
            <button
              class="tool-btn bookmark-btn"
              :class="{ active: showBookmarkManager }"
              @click="openBookmarkManager"
              :title="t('bookmark.manager')"
            >
              {{ showBookmarkManager ? '✕' : '🔖' }}
            </button>
            <button
              class="tool-btn preset-btn"
              :class="{ active: showPresetManager }"
              @click="openPresetManager"
              :title="t('preset.manager')"
            >
              {{ showPresetManager ? '✕' : '⚙️' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 프롬프트 -->
      <div class="prompt-section">
        <PromptTextarea
          v-model="prompt"
          :label="t('prompt.positive')"
          placeholder="Describe what you want..."
          :is-generating="isGenerating"
        />
        <PromptTextarea
          v-model="negativePrompt"
          :label="t('prompt.negative')"
          placeholder="What to avoid..."
          :is-generating="isGenerating"
          :is-negative="true"
        />
      </div>
    </div>

    <!-- 3열: 캔버스 + 히스토리 영역 -->
    <div v-if="!showBookmarkManager && !showPresetManager" :class="['image-area', { 'history-collapsed': !showHistoryPanel }]">
      <!-- 캔버스 영역 (입력 이미지 + 마스크) -->
      <div class="canvas-column">
        <!-- 이미지 업로드 영역 (이미지가 없을 때) -->
        <div v-if="!initImage" class="upload-area">
          <div class="upload-content">
            <div class="upload-icon">🖼️</div>
            <p>{{ t('inpaint.noImageSelected') }}</p>
            <div class="upload-buttons">
              <label class="upload-btn">
                <input type="file" accept="image/*" @change="handleFileUpload" hidden />
                {{ t('img2img.selectFile') }}
              </label>
              <button class="upload-btn secondary" @click="openHistorySelector">
                {{ t('img2img.selectFromHistory') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 마스크 캔버스 (이미지가 있을 때) -->
        <div v-else class="mask-canvas-container">
          <!-- 마스크 도구바 -->
          <div class="mask-toolbar">
            <div class="tool-group">
              <button
                class="tool-btn"
                :class="{ active: activeTool === 'brush' }"
                @click="setActiveTool('brush')"
                :title="t('inpaint.brush')"
              >
                🖌️
              </button>
              <button
                class="tool-btn"
                :class="{ active: activeTool === 'eraser' }"
                @click="setActiveTool('eraser')"
                :title="t('inpaint.eraser')"
              >
                🧹
              </button>
            </div>
            <div class="tool-group">
              <label class="brush-size-label">
                {{ t('inpaint.brushSize') }}: {{ brushSize }}px
              </label>
              <input
                type="range"
                v-model.number="brushSize"
                min="1"
                max="200"
                class="brush-size-slider"
              />
            </div>
            <div class="tool-group">
              <button class="action-btn" @click="fillMask" :title="t('inpaint.fillMask')">
                {{ t('inpaint.fillMask') }}
              </button>
              <button class="action-btn" @click="clearMask" :title="t('inpaint.clearMask')">
                {{ t('inpaint.clearMask') }}
              </button>
              <button class="action-btn" @click="invertMask" :title="t('inpaint.invertMask')">
                {{ t('inpaint.invertMask') }}
              </button>
            </div>
            <div class="tool-group">
              <label class="upload-btn small">
                <input type="file" accept="image/*" @change="handleFileUpload" hidden />
                📁
              </label>
              <button class="action-btn small" @click="openHistorySelector">📋</button>
            </div>
          </div>

          <!-- 캔버스 영역 (임시 - 이미지만 표시) -->
          <div class="canvas-wrapper">
            <img :src="initImage" alt="Input Image" class="canvas-image" />
            <div v-if="mask" class="mask-overlay">
              <!-- 마스크 오버레이 표시 -->
            </div>
            <p class="canvas-placeholder-text">
              마스크 캔버스는 2단계에서 구현됩니다
            </p>
          </div>
        </div>

        <!-- 출력 이미지 프리뷰 -->
        <ImagePreviewPanel
          class="output-image-panel"
          :current-image="currentImage"
          :is-expanded="showImagePanel"
          @toggle-panel="toggleImagePanel"
          @show-preview="props.openModal('viewer')"
        />
      </div>

      <!-- 히스토리 -->
      <HistoryPanel
        ref="historyPanelRef"
        :is-expanded="showHistoryPanel"
        :is-content-collapsed="isHistoryContentCollapsed"
        :show-favorite-only="showFavoriteOnly"
        :is-selection-mode="isSelectionMode"
        :selected-count="selectedImages.size"
        :image-count="generatedImages.length"
        :total-image-count="totalImageCount"
        :is-empty="filteredImages.length === 0"
        :has-favorites="generatedImages.some(img => img.favorite)"
        :has-images="generatedImages.length > 0"
        :use-virtual-scroll="true"
        :total-height="historyTotalHeight"
        :offset-y="historyOffsetY"
        @toggle-panel="toggleHistoryPanel"
        @toggle-content="toggleHistoryContent"
        @toggle-favorite-filter="toggleFavoriteFilter"
        @toggle-selection-mode="openHistoryManager"
        @select-all="selectAllImages"
        @deselect-all="deselectAllImages"
        @download-selected="downloadSelectedImages"
        @clear-history="clearHistory"
        @add-sample="addSampleImage"
        @load-more="loadMoreImages"
      >
        <HistoryImageItem
          v-for="item in visibleHistoryItems"
          :key="item.id || item.timestamp"
          :item="item"
          :index="item._virtualIndex"
          :is-selection-mode="isSelectionMode"
          :is-selected="selectedImages.has(item.id)"
          @toggle-favorite="toggleImageFavorite"
          @delete="deleteImage"
          @load-params="loadParamsFromHistory"
          @toggle-selection="toggleImageSelection"
          @compare-image="handleCompareImage"
        />
      </HistoryPanel>
    </div>

    <!-- History Manager Modal -->
    <HistoryManagerModal
      v-if="showHistoryManager"
      :items="generatedImages"
      :initial-item="selectedHistoryImage"
      :total-image-count="totalImageCount"
      :current-image="currentImage"
      @close="closeHistoryManager"
      @toggle-favorite="toggleImageFavorite"
      @delete="deleteImage"
      @load-params="loadParamsFromHistory"
      @download="handleHistoryDownload"
      @download-multiple="handleHistoryDownloadMultiple"
      @delete-multiple="handleHistoryDeleteMultiple"
    />

    <!-- History Selector Modal -->
    <div v-if="showHistorySelector" class="modal-overlay" @click="closeHistorySelector">
      <div class="modal-content history-selector-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ t('img2img.selectFromHistory') }}</h3>
          <button class="close-btn" @click="closeHistorySelector">✕</button>
        </div>
        <div class="modal-body">
          <div class="history-selector-grid">
            <div
              v-for="image in generatedImages.slice(0, 50)"
              :key="image.id"
              class="selector-item"
              @click="selectImageFromHistory(image)"
            >
              <img :src="image.image" alt="Select this image" />
            </div>
          </div>
          <div v-if="generatedImages.length === 0" class="empty-state">
            {{ t('history.noImages') }}
          </div>
        </div>
      </div>
    </div>

    <!-- ADetailer Prompt Modal -->
    <ADetailerPromptModal
      v-model="showADetailerPrompt"
      :adetailer="adetailers[editingADetailerIndex]"
      :adetailer-label="ADETAILER_LABELS[editingADetailerIndex]"
      @save="updateADetailerPrompts"
    />

    <!-- Bookmark Manager (replaces image area) -->
    <BookmarkManager
      v-if="showBookmarkManager"
      class="image-area"
      :show-toast="props.showToast"
      :show-confirm="props.showConfirm"
      @apply-bookmark="applyBookmark"
      @close="closeBookmarkManager"
    />

    <!-- Preset Manager (replaces image area) -->
    <PresetManager
      v-if="showPresetManager"
      class="image-area"
      :show-toast="props.showToast"
      :current-params="currentParams"
      @apply-preset="applyPreset"
      @close="closePresetManager"
    />
  </div>
</template>

<style scoped>
.inpaint-view {
  display: grid;
  grid-template-columns: 280px 300px 1fr;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 12px;
  background: var(--color-bg-primary);
  overflow: hidden;
}

.inpaint-view.settings-collapsed {
  grid-template-columns: 48px 300px 1fr;
}

/* ===== Advanced Panel (1열) ===== */
.advanced-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: all 0.3s ease;
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.advanced-panel.collapsed {
  min-width: 48px;
  max-width: 48px;
}

.advanced-panel.collapsed .panel-header {
  justify-content: center;
  padding: 8px 4px;
}

.advanced-panel.collapsed .panel-title,
.advanced-panel.collapsed .header-right {
  display: none;
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.toggle-advanced-btn {
  padding: 4px 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toggle-advanced-btn:hover {
  background: var(--color-bg-hover);
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.advanced-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: var(--color-bg-secondary);
}

.form-group {
  margin-bottom: 12px;
}

.form-group.horizontal {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group.horizontal label {
  flex: 0 0 80px;
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.form-group.horizontal input[type="number"],
.form-group.horizontal input[type="range"],
.form-group.horizontal select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
  font-size: 13px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.form-group.horizontal input[type="range"] {
  padding: 0;
}

.value-display {
  flex: 0 0 50px;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: right;
}

.seed-random-btn {
  padding: 6px 10px;
  background: var(--color-success);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.seed-random-btn:hover:not(:disabled) {
  background: var(--color-success-dark);
}

.seed-random-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-divider {
  height: 1px;
  background: var(--color-border-primary);
  margin: 16px 0;
}

/* ADetailer 그룹 */
.adetailer-group {
  padding-top: 0;
}

.adetailer-group .group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.ad-row {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.ad-row:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.ad-header-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.reorder-btns {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.reorder-btns button {
  width: 18px;
  height: 14px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reorder-btns button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.ad-details {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  padding-left: 24px;
}

.ad-details select {
  flex: 1;
  padding: 4px 6px;
  font-size: 11px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.prompt-edit-btn {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  cursor: pointer;
  font-size: 12px;
}

/* System Settings */
.system-settings-section {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
}

.system-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
}

.system-settings-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.toggle-icon {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.system-settings-content {
  padding: 12px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-primary);
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-group + .setting-group {
  margin-top: 12px;
}

.setting-label {
  flex: 0 0 80px;
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.theme-toggle {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn.active {
  border-color: var(--color-primary);
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Panel Footer */
.panel-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-primary);
}

.footer-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.footer-btn {
  padding: 4px 10px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 2열: 프롬프트 패널 ===== */
.prompt-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.prompt-panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.prompt-panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.generate-btn {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-text-secondary);
}

.progress-container {
  flex-shrink: 0;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.progress-bar {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.progress-state {
  font-weight: 500;
  color: var(--color-text-primary);
}

.progress-percent {
  font-weight: 600;
  color: var(--color-primary);
}

.generation-controls {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fef3c7;
  border-bottom: 1px solid #fde68a;
}

.control-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.interrupt-btn {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.skip-btn {
  background: var(--color-info);
  color: var(--color-text-inverse);
}

.slot-section {
  flex-shrink: 0;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-primary);
}

.slot-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slot-buttons {
  display: flex;
  gap: 8px;
  flex: 1;
}

.tool-buttons {
  display: flex;
  gap: 6px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.tool-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.slot-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.slot-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.slot-btn.filled:not(.active) {
  border-color: var(--color-success);
}

.slot-btn .dot {
  font-size: 8px;
  color: var(--color-success);
}

.slot-btn.active .dot {
  color: var(--color-text-inverse);
}

.prompt-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== 3열: 이미지 영역 ===== */
.image-area {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 16px;
  overflow: hidden;
}

.image-area.history-collapsed {
  grid-template-columns: 1fr 40px;
}

/* 캔버스 컬럼 */
.canvas-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

/* 이미지 업로드 영역 */
.upload-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border: 2px dashed var(--color-border-primary);
  border-radius: 8px;
  min-height: 300px;
}

.upload-content {
  text-align: center;
  color: var(--color-text-secondary);
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.upload-content p {
  margin: 0 0 16px;
  font-size: 14px;
}

.upload-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.upload-btn {
  padding: 10px 20px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.upload-btn.secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.upload-btn.small {
  padding: 6px 12px;
  font-size: 14px;
}

/* 마스크 캔버스 컨테이너 */
.mask-canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.mask-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brush-size-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.brush-size-slider {
  width: 100px;
}

.action-btn {
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--color-bg-hover);
}

.action-btn.small {
  padding: 6px 10px;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  overflow: hidden;
  min-height: 0;
}

.canvas-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.mask-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.canvas-placeholder-text {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
}

/* 출력 이미지 패널 */
.output-image-panel {
  flex: 0 0 auto;
  max-height: 35%;
  min-height: 150px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  max-width: 800px;
  max-height: 80vh;
  width: 90%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 16px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.history-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.selector-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.selector-item:hover {
  border-color: var(--color-primary);
  transform: scale(1.02);
}

.selector-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
}
</style>
