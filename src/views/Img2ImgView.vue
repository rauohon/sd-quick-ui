<script setup>
import { ref, computed, onMounted, onUnmounted, watch, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImg2imgGeneration } from '../composables/useImg2imgGeneration'
import { useIndexedDB } from '../composables/useIndexedDB'
import { usePipelineImage } from '../composables/usePipelineImage'
import { usePipeline } from '../composables/usePipeline'
import { useApiStatus } from '../composables/useApiStatus'
import { useModelLoader } from '../composables/useModelLoader'
import { useSlotManagement } from '../composables/useSlotManagement'
import {
  SLOT_COUNT,
  ADETAILER_LABELS,
  ADETAILER_MODELS,
  ASPECT_RATIOS,
  DEFAULT_ADETAILER,
  IMG2IMG_PARAM_RANGES,
  IMAGE_TYPES,
  INITIAL_LOAD_COUNT,
  LOAD_MORE_COUNT
} from '../config/constants'

// Components
import ImageUploadPanel from '../components/ImageUploadPanel.vue'
import PromptTextarea from '../components/PromptTextarea.vue'
import ImagePreviewPanel from '../components/ImagePreviewPanel.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import HistoryImageItem from '../components/HistoryImageItem.vue'
import HistoryManagerModal from '../components/HistoryManagerModal.vue'
import ApiStatusIndicator from '../components/ApiStatusIndicator.vue'
import ADetailerPromptModal from '../components/ADetailerPromptModal.vue'
import SystemSettingsSection from '../components/SystemSettingsSection.vue'
import BookmarkManager from '../components/BookmarkManager.vue'
import PresetManager from '../components/PresetManager.vue'
import HistorySelectorModal from '../components/HistorySelectorModal.vue'
import ControlNetPanel from '../components/ControlNetPanel.vue'
import ControlNetManager from '../components/ControlNetManager.vue'

// Composables
import { useBookmarks } from '../composables/useBookmarks'
import { usePresets } from '../composables/usePresets'
import { useHistory } from '../composables/useHistory'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useVirtualScroll } from '../composables/useVirtualScroll'
import { usePanelVisibility } from '../composables/usePanelVisibility'
import { useADetailerHandlers } from '../composables/useADetailerHandlers'
import { useBookmarkPresetHandlers } from '../composables/useBookmarkPresetHandlers'
import { useControlNetUnits } from '../composables/useControlNet'
import { useNotificationSettings } from '../composables/useNotificationSettings'

const { t } = useI18n()

// Props
const props = defineProps({
  showToast: { type: Function, required: true },
  openModal: { type: Function, required: true },
  showConfirm: { type: Function, required: true },
  isDark: { type: Boolean, default: false },
  toggleTheme: { type: Function, required: true }
})

const emit = defineEmits(['updateCurrentImage', 'switch-tab'])

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

// img2img 전용 파라미터
const initImage = ref(null)
const initImageWidth = ref(0)
const initImageHeight = ref(0)
const denoisingStrength = ref(IMG2IMG_PARAM_RANGES.denoisingStrength.default)

// 업스케일 파라미터
const enableUpscale = ref(false)
const upscaler = ref('R-ESRGAN 4x+')
const upscaleScale = ref(IMG2IMG_PARAM_RANGES.upscaleScale.default)

// ADetailer
const adetailers = ref([
  { ...DEFAULT_ADETAILER },
  { ...DEFAULT_ADETAILER },
  { ...DEFAULT_ADETAILER },
  { ...DEFAULT_ADETAILER }
])

// Notification (global settings)
const { notificationType, notificationVolume } = useNotificationSettings()

// UI 상태 (usePanelVisibility composable)
const {
  showHistoryPanel,
  isHistoryContentCollapsed,
  showImagePanel,
  showAdvancedPanel: showSettingsPanel,
  toggleHistoryPanel,
  toggleHistoryContent,
  toggleImagePanel,
  initPanelVisibility
} = usePanelVisibility('img2img')

// ControlNet
const { units: controlnetUnits, hasControlNet, enabledCount: controlnetEnabledCount } = useControlNetUnits('img2img')

// ADetailer 핸들러 (composable)
const {
  showADetailerPrompt,
  editingADetailerIndex,
  openADetailerPrompt,
  updateADetailerPrompts,
  updateADetailerEnable,
  updateADetailerModel,
  reorderADetailers
} = useADetailerHandlers(adetailers)

// 북마크/프리셋 핸들러 (composable)
const {
  showBookmarkManager,
  showPresetManager,
  openBookmarkManager,
  closeBookmarkManager,
  openPresetManager,
  closePresetManager,
  applyBookmark,
  applyPreset
} = useBookmarkPresetHandlers(
  { prompt, negativePrompt },
  { steps, cfgScale, samplerName, scheduler, width, height, seed,
    batchCount, batchSize, denoisingStrength, adetailers,
    enableUpscale, upscaler, upscaleScale }
)

// ControlNet 매니저 상태
const showControlNetManager = ref(false)

function openControlNetManager() {
  showBookmarkManager.value = false
  showPresetManager.value = false
  showControlNetManager.value = !showControlNetManager.value
}

function closeControlNetManager() {
  showControlNetManager.value = false
}

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

// ===== Pipeline Image =====
const { consumePendingImage, hasPendingImageFor, sendToInpaint } = usePipelineImage()

// Send to handlers
function handleSendToInpaint(item) {
  sendToInpaint(item.image, 'img2img')
  emit('switch-tab', 'inpaint')
}

// ===== Slot Management =====
const IMG2IMG_SLOT_KEY = 'img2img-slots'

// img2img 기본 설정
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
  seedVariationRange: 1000,
  selectedModel: '',
  denoisingStrength: IMG2IMG_PARAM_RANGES.denoisingStrength.default,
  enableUpscale: false,
  upscaler: 'R-ESRGAN 4x+',
  upscaleScale: IMG2IMG_PARAM_RANGES.upscaleScale.default
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
  seedVariationRange,
  selectedModel,
  denoisingStrength,
  enableUpscale,
  upscaler,
  upscaleScale
}

// 슬롯 관리 (img2img 전용 키 사용)
const slotManagement = useSlotManagement(defaultSettings, SETTINGS_REFS, adetailers, props.showToast, 'sd-img2img')
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
  // img2img 전용
  initImage, denoisingStrength,
  // 업스케일
  enableUpscale, upscaler, upscaleScale,
  // ControlNet
  controlnetUnits
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
  toggleInfiniteMode,
  setOnComplete
} = useImg2imgGeneration(generationParams, enabledADetailers, props.showToast, t)

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
    props.showToast(t('img2img.noImageSelected'), 'error')
    return
  }
  generateImage()
}

function randomizeSeed() {
  seed.value = Math.floor(Math.random() * 4294967295)
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

  props.showToast(t('history.loadParams'), 'success')
}

function handleCompareImage(item) {
  // item은 객체이고, image 속성에 실제 이미지 URL이 있음
  props.openModal('comparison', item.image)
}

// History image selector modal
const showHistorySelector = ref(false)

function openHistorySelector() {
  showHistorySelector.value = true
}

function selectImageFromHistory(image) {
  initImage.value = image.image
  // 이미지 크기 가져오기
  const img = new Image()
  img.onload = () => {
    initImageWidth.value = img.width
    initImageHeight.value = img.height
  }
  img.src = image.image
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
  enableUpscale: enableUpscale.value,
  upscaler: upscaler.value,
  upscaleScale: upscaleScale.value,
  adetailers: JSON.parse(JSON.stringify(adetailers.value))
}))

// ===== Pipeline Integration =====
const pipeline = usePipeline()

function setInputImageFromPipeline(imageData) {
  initImage.value = imageData
  // Get image dimensions
  const img = new Image()
  img.onload = () => {
    initImageWidth.value = img.width
    initImageHeight.value = img.height
  }
  img.src = imageData
}

function registerPipelineView() {
  pipeline.registerView('img2img', {
    generate: generateImage,
    setInputImage: setInputImageFromPipeline
  })

  // Set completion callback for pipeline
  setOnComplete((outputImage) => {
    pipeline.onStepComplete('img2img', outputImage)
  })
}

// ===== Lifecycle =====
onMounted(async () => {
  // Register with pipeline
  registerPipelineView()

  // Initialize panel visibility (load from localStorage)
  initPanelVisibility()

  await checkApiStatus()
  await loadModels()

  // Load bookmarks and presets
  loadBookmarks()
  loadPresets()

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
    const loadedSlots = await indexedDB.loadSlots(IMG2IMG_SLOT_KEY)
    slots.value = loadedSlots

    // Load active slot from localStorage (default to slot 0)
    const savedActiveSlot = window.localStorage.getItem(localStorageKey)
    const slotIndex = savedActiveSlot !== null ? parseInt(savedActiveSlot, 10) : 0
    if (!isNaN(slotIndex) && slotIndex >= 0 && slotIndex < SLOT_COUNT) {
      selectSlot(slotIndex)
    }
  } catch (error) {
    console.error('Failed to load slots from IndexedDB:', error)
  }

  // Check for pending pipeline image
  if (hasPendingImageFor('img2img')) {
    const pending = consumePendingImage()
    if (pending) {
      initImage.value = pending.image
      // 이미지 크기 가져오기
      const img = new Image()
      img.onload = () => {
        initImageWidth.value = img.width
        initImageHeight.value = img.height
      }
      img.src = pending.image
      props.showToast(t('img2img.imageReceived', { from: pending.sourceTab || 'unknown' }), 'success')
    }
  }

  // Mark view as ready for pipeline
  pipeline.setViewReady('img2img', true)
})

onUnmounted(() => {
  // Unregister from pipeline
  pipeline.unregisterView('img2img')
  setOnComplete(null)

  // 탭 전환 시 현재 슬롯 즉시 저장 (debounce 대기 중인 저장 취소 후 즉시 저장)
  slotManagement.cancelDebouncedSlotSave()
  slotManagement.saveCurrentSlot()
})

// Slots → IndexedDB persistence
watch(slots, async (newSlots) => {
  try {
    const plainSlots = JSON.parse(JSON.stringify(toRaw(newSlots)))
    await indexedDB.saveSlots(plainSlots, IMG2IMG_SLOT_KEY)
  } catch (error) {
    console.error('슬롯 IndexedDB 저장 실패:', error)
  }
}, { deep: true })

// Settings change → debounced slot save
watch(
  [prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
   width, height, batchCount, batchSize, seed, seedVariationRange,
   selectedModel, denoisingStrength, enableUpscale, upscaler, upscaleScale],
  () => {
    if (activeSlot.value !== null) {
      startDebouncedSlotSave()
    }
  }
)

</script>

<template>
  <div class="generation-view img2img-view" :class="{ 'settings-collapsed': !showSettingsPanel }">
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
            type="number"
            v-model.number="denoisingStrength"
            :min="IMG2IMG_PARAM_RANGES.denoisingStrength.min"
            :max="IMG2IMG_PARAM_RANGES.denoisingStrength.max"
            :step="IMG2IMG_PARAM_RANGES.denoisingStrength.step"
            :disabled="isGenerating"
          />
        </div>

        <!-- 업스케일 -->
        <div class="form-group horizontal">
          <label class="checkbox-inline">
            <input type="checkbox" v-model="enableUpscale" :disabled="isGenerating" />
            Upscale
          </label>
        </div>
        <template v-if="enableUpscale">
          <div class="form-group horizontal">
            <label>Upscaler</label>
            <select v-model="upscaler" :disabled="isGenerating">
              <option v-for="u in availableUpscalers" :key="u.name" :value="u.name">{{ u.name }}</option>
            </select>
          </div>
          <div class="form-group horizontal">
            <label>Scale</label>
            <input type="number" v-model.number="upscaleScale" :min="1" :max="4" :step="0.5" :disabled="isGenerating" />
          </div>
        </template>

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
        <div class="form-group horizontal">
          <label>Batch size</label>
          <input type="number" v-model.number="batchSize" min="1" :disabled="isGenerating" />
        </div>

        <!-- ADetailer -->
        <div class="section-divider"></div>
        <div class="adetailer-group">
          <div class="group-title">🎯 ADetailer</div>
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

        <!-- ControlNet 버튼 -->
        <div class="section-divider"></div>
        <div class="controlnet-section">
          <button
            class="controlnet-btn"
            :class="{ active: showControlNetManager }"
            @click="openControlNetManager"
            :disabled="isGenerating"
          >
            <span class="controlnet-icon">🎛️</span>
            <span class="controlnet-label">ControlNet</span>
            <span v-if="controlnetEnabledCount > 0" class="controlnet-badge">{{ controlnetEnabledCount }}</span>
            <span class="controlnet-arrow">{{ showControlNetManager ? '✕' : '▶' }}</span>
          </button>
        </div>
      </div>

      <!-- System Settings Section -->
      <SystemSettingsSection
        v-if="showSettingsPanel"
        :isDark="props.isDark"
        :toggleTheme="props.toggleTheme"
        :notificationType="notificationType"
        :notificationVolume="notificationVolume"
        :isGenerating="isGenerating"
        @update:notificationType="notificationType = $event"
        @update:notificationVolume="notificationVolume = $event"
      />

      <div v-if="showSettingsPanel" class="panel-footer">
        <span class="footer-title">⚡ SD Quick UI</span>
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
        <h3 class="prompt-panel-title">{{ t('promptPanel.title') }}</h3>
        <div class="header-buttons">
          <button
            class="generate-btn"
            @click="handleGenerate"
            :disabled="isGenerating || !apiConnected || !initImage"
          >
            <template v-if="isGenerating">{{ t('promptPanel.generating') }}</template>
            <template v-else-if="!initImage">{{ t('img2img.imageRequired') }}</template>
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

    <!-- 3열: 이미지 영역 OR 북마크/프리셋/ControlNet 매니저 -->
    <div v-if="!showBookmarkManager && !showPresetManager && !showControlNetManager" :class="['image-area', { 'history-collapsed': !showHistoryPanel }]">
      <!-- 이미지 컬럼 (입력 + 출력 상하 분할) -->
      <div class="image-column">
        <!-- 입력 이미지 업로드 (상단) -->
        <ImageUploadPanel
          class="input-image-panel"
          v-model="initImage"
          :is-generating="isGenerating"
          :generated-images="generatedImages"
          @update:width="initImageWidth = $event"
          @update:height="initImageHeight = $event"
          @open-history-selector="openHistorySelector"
        />

        <!-- 출력 이미지 프리뷰 (하단) -->
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
          current-tab="img2img"
          @toggle-favorite="toggleImageFavorite"
          @delete="deleteImage"
          @load-params="loadParamsFromHistory"
          @toggle-selection="toggleImageSelection"
          @compare-image="handleCompareImage"
          @send-to-inpaint="handleSendToInpaint"
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
    <HistorySelectorModal
      v-model="showHistorySelector"
      :images="generatedImages"
      @select="selectImageFromHistory"
    />

    <!-- ADetailer Prompt Modal -->
    <ADetailerPromptModal
      v-model="showADetailerPrompt"
      :adetailer-index="editingADetailerIndex"
      :adetailer="editingADetailerIndex >= 0 ? adetailers[editingADetailerIndex] : null"
      :label="editingADetailerIndex >= 0 ? ADETAILER_LABELS[editingADetailerIndex] : ''"
      @update:prompt="adetailers[editingADetailerIndex].prompt = $event"
      @update:negativePrompt="adetailers[editingADetailerIndex].negativePrompt = $event"
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

    <!-- ControlNet Manager (replaces image area) -->
    <ControlNetManager
      v-if="showControlNetManager"
      class="image-area"
      :is-generating="isGenerating"
      :showToast="props.showToast"
      tab-id="img2img"
      @close="closeControlNetManager"
    />
  </div>
</template>

<style>
/* 공통 스타일 import */
@import '../styles/generation-view.css';
</style>

<style scoped>
/* ===== Img2Img 고유 스타일 ===== */

/* 입력 이미지 패널 (상단) */
.input-image-panel {
  flex: 0 0 auto;
  max-height: 45%;
  min-height: 150px;
}

/* 히스토리 패널 접힘 시 추가 스타일 */
.image-area.history-collapsed .history-panel {
  width: 40px;
}

.image-area.history-collapsed .history-panel .panel-header {
  flex-direction: column;
  padding: 12px 8px;
  align-items: center;
  gap: 12px;
}

.image-area.history-collapsed .history-panel .panel-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  margin: 0;
  font-size: 13px;
  white-space: nowrap;
  order: 2;
}

.image-area.history-collapsed .history-panel .panel-header > div {
  order: 1;
}

.image-area.history-collapsed .history-panel .toggle-content-btn,
.image-area.history-collapsed .history-panel .filter-favorite-btn,
.image-area.history-collapsed .history-panel .batch-btn,
.image-area.history-collapsed .history-panel .clear-btn {
  display: none;
}

.image-area.history-collapsed .history-panel .history-content,
.image-area.history-collapsed .history-panel .panel-footer {
  display: none;
}

/* History Item - Img2Img 전용 */
.history-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: var(--color-primary);
}

.history-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-item.is-img2img {
  border-color: var(--color-warning);
}

.type-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--color-warning);
  color: white;
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
}

/* ControlNet Button */
.controlnet-section {
  margin-top: 4px;
}

.controlnet-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.controlnet-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: #667eea;
}

.controlnet-btn.active {
  background: rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.controlnet-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.controlnet-icon {
  font-size: 16px;
}

.controlnet-label {
  flex: 1;
  text-align: left;
}

.controlnet-badge {
  background: #667eea;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.controlnet-arrow {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
