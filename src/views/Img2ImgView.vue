<script setup>
import { ref, computed, onMounted, watch, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImg2imgGeneration } from '../composables/useImg2imgGeneration'
import { useIndexedDB } from '../composables/useIndexedDB'
import { useApiStatus } from '../composables/useApiStatus'
import { useModelLoader } from '../composables/useModelLoader'
import { useSlotManagement } from '../composables/useSlotManagement'
import {
  NOTIFICATION_TYPES,
  SLOT_COUNT,
  ADETAILER_LABELS,
  ADETAILER_MODELS,
  ASPECT_RATIOS,
  DEFAULT_ADETAILER,
  IMG2IMG_PARAM_RANGES,
  IMAGE_TYPES
} from '../config/constants'

// Components
import ImageUploadPanel from '../components/ImageUploadPanel.vue'
import PromptTextarea from '../components/PromptTextarea.vue'
import ImagePreviewPanel from '../components/ImagePreviewPanel.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import HistoryImageItem from '../components/HistoryImageItem.vue'
import HistoryManagerModal from '../components/HistoryManagerModal.vue'
import ApiStatusIndicator from '../components/ApiStatusIndicator.vue'

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

// Notification
const notificationType = ref(NOTIFICATION_TYPES.NONE)
const notificationVolume = ref(0.5)

// UI 상태
const showHistoryPanel = ref(true)
const isHistoryContentCollapsed = ref(false)
const showImagePanel = ref(true)
const showFavoriteOnly = ref(false)
const isSelectionMode = ref(false)
const selectedImages = ref(new Set())

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

// IndexedDB
const indexedDB = useIndexedDB()
const { getRecentImages, getImageCount, saveSlots, loadSlots, deleteImage: deleteImageFromDB, toggleFavorite, clearAllImages } = indexedDB
const totalImageCount = ref(0)

// History Manager Modal
const showHistoryManager = ref(false)
const selectedHistoryImage = ref(null)

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
  denoisingStrength,
  enableUpscale,
  upscaler,
  upscaleScale
}

// 슬롯 관리 (img2img 전용 키 사용)
const slotManagement = useSlotManagement(defaultSettings, SETTINGS_REFS, null, props.showToast, 'sd-img2img')
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
  enableUpscale, upscaler, upscaleScale
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
} = useImg2imgGeneration(generationParams, enabledADetailers, props.showToast, t)

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

function toggleHistoryPanel() {
  showHistoryPanel.value = !showHistoryPanel.value
}

function toggleHistoryContent() {
  isHistoryContentCollapsed.value = !isHistoryContentCollapsed.value
}

function toggleImagePanel() {
  showImagePanel.value = !showImagePanel.value
}

function toggleFavoriteFilter() {
  showFavoriteOnly.value = !showFavoriteOnly.value
}

// History Manager
function openHistoryManager(item = null) {
  selectedHistoryImage.value = item
  showHistoryManager.value = true
}

function closeHistoryManager() {
  showHistoryManager.value = false
  selectedHistoryImage.value = null
}

// History download/delete handlers for modal
async function handleHistoryDownload(item) {
  if (!item?.image) return

  const link = document.createElement('a')
  link.href = item.image
  link.download = `img2img_${item.timestamp || Date.now()}.png`
  link.click()
  props.showToast(t('history.downloadStarted'), 'success')
}

async function handleHistoryDownloadMultiple(ids) {
  for (const id of ids) {
    const item = generatedImages.value.find(img => img.id === id)
    if (item) {
      const link = document.createElement('a')
      link.href = item.image
      link.download = `img2img_${item.timestamp || Date.now()}.png`
      link.click()
      await new Promise(r => setTimeout(r, 100)) // Small delay between downloads
    }
  }
  props.showToast(t('history.downloadMultiple', { count: ids.length }), 'success')
}

async function handleHistoryDeleteMultiple(ids) {
  const result = await props.showConfirm({
    title: t('common.delete'),
    message: t('history.deleteConfirm', { count: ids.length }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel')
  })

  if (!result?.confirmed) return

  try {
    for (const id of ids) {
      await deleteImageFromDB(id)
    }
    generatedImages.value = generatedImages.value.filter(img => !ids.includes(img.id))
    totalImageCount.value = Math.max(0, totalImageCount.value - ids.length)
    props.showToast(t('history.imagesDeleted', { count: ids.length }), 'success')
  } catch (error) {
    console.error('Failed to delete multiple images:', error)
    props.showToast(t('history.batchDeleteFailed'), 'error')
  }
}

// History Image Actions
async function toggleImageFavorite(item, index) {
  // Toggle in memory first for instant feedback
  item.favorite = !item.favorite
  const isFavorite = item.favorite

  try {
    if (item.id) {
      await toggleFavorite(item.id)
      props.showToast(
        isFavorite ? t('history.favoriteAdded') : t('history.favoriteRemoved'),
        'success'
      )
    }
  } catch (error) {
    // Revert on error
    item.favorite = !item.favorite
    console.error('Failed to toggle favorite:', error)
    props.showToast(t('history.favoriteUpdateFailed'), 'error')
  }
}

async function deleteImage(item, index) {
  const result = await props.showConfirm({
    title: t('common.delete'),
    message: t('history.deleteConfirm', { count: 1 }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel')
  })

  if (!result?.confirmed) return

  try {
    if (item.id) {
      await deleteImageFromDB(item.id)
    }
    generatedImages.value = generatedImages.value.filter(img => img.id !== item.id)
    totalImageCount.value = Math.max(0, totalImageCount.value - 1)
    props.showToast(t('history.imageDeleted'), 'success')
  } catch (error) {
    console.error('Failed to delete image:', error)
    props.showToast(t('history.deleteFailed'), 'error')
  }
}

function toggleImageSelection(id) {
  if (selectedImages.value.has(id)) {
    selectedImages.value.delete(id)
  } else {
    selectedImages.value.add(id)
  }
  selectedImages.value = new Set(selectedImages.value)
}

function selectAllImages() {
  filteredImages.value.forEach(img => selectedImages.value.add(img.id))
  selectedImages.value = new Set(selectedImages.value)
}

function deselectAllImages() {
  selectedImages.value.clear()
  selectedImages.value = new Set()
}

async function downloadSelectedImages() {
  // TODO: Implement batch download
  props.showToast(t('history.downloadStarted'), 'info')
}

async function clearHistory() {
  const result = await props.showConfirm({
    title: t('history.clear'),
    message: t('history.clearConfirm'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel')
  })

  if (!result?.confirmed) return

  try {
    await clearAllImages()
    generatedImages.value = []
    totalImageCount.value = 0
    currentImage.value = ''
    props.showToast(t('history.deletedCount', { count: totalImageCount.value }), 'success')
  } catch (error) {
    console.error('Failed to clear history:', error)
  }
}

async function addSampleImage() {
  // Generate a sample test image (for development)
  props.showToast(t('history.addSample'), 'info')
}

async function loadMoreImages() {
  try {
    const currentCount = generatedImages.value.length
    const moreImages = await getRecentImages(currentCount + 20)
    generatedImages.value = moreImages
  } catch (error) {
    console.error('Failed to load more images:', error)
  }
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

// History image selector modal (임시 구현)
const showHistorySelector = ref(false)

function openHistorySelector() {
  showHistorySelector.value = true
}

function closeHistorySelector() {
  showHistorySelector.value = false
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
  closeHistorySelector()
}

// ===== Lifecycle =====
onMounted(async () => {
  await checkApiStatus()
  await loadModels()

  // Load existing images from IndexedDB
  try {
    totalImageCount.value = await getImageCount()
    const images = await getRecentImages(50)
    if (images.length > 0) {
      generatedImages.value = images
    }
  } catch (error) {
    console.error('Failed to load images from IndexedDB:', error)
  }

  // Load slots from IndexedDB
  try {
    const loadedSlots = await loadSlots(IMG2IMG_SLOT_KEY)
    slots.value = loadedSlots

    // Load active slot from localStorage
    const savedActiveSlot = localStorage.getItem(localStorageKey)
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
    await saveSlots(plainSlots, IMG2IMG_SLOT_KEY)
  } catch (error) {
    console.error('슬롯 IndexedDB 저장 실패:', error)
  }
}, { deep: true })

// Settings change → debounced slot save
watch(
  [prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
   width, height, batchCount, batchSize, seed, denoisingStrength,
   enableUpscale, upscaler, upscaleScale],
  () => {
    if (activeSlot.value !== null) {
      startDebouncedSlotSave()
    }
  }
)

// Filtered images for history
const filteredImages = computed(() => {
  if (showFavoriteOnly.value) {
    return generatedImages.value.filter(img => img.favorite)
  }
  return generatedImages.value
})
</script>

<template>
  <div class="img2img-view">
    <!-- 왼쪽 패널 -->
    <div class="left-panel">
      <!-- API 상태 -->
      <div class="section api-section">
        <ApiStatusIndicator
          :api-connected="apiConnected"
          :api-checking="apiChecking"
          @check-api="checkApiStatus"
        />
      </div>

      <!-- 이미지 업로드 -->
      <ImageUploadPanel
        v-model="initImage"
        v-model:imageWidth="initImageWidth"
        v-model:imageHeight="initImageHeight"
        :is-generating="isGenerating"
        @open-history-selector="openHistorySelector"
      />

      <!-- 슬롯 버튼 -->
      <div class="section slot-section">
        <div class="slot-buttons">
          <button
            v-for="i in SLOT_COUNT"
            :key="i"
            class="slot-btn"
            :class="{
              active: activeSlot === i - 1,
              filled: slots[i - 1] !== null
            }"
            @click="selectSlot(i - 1)"
            :title="slots[i - 1] ? t('promptPanel.slotFilledTooltip', { slot: i }) : t('promptPanel.slotEmptyTooltip', { slot: i })"
          >
            <span class="slot-number">{{ i }}</span>
            <span v-if="slots[i - 1]" class="slot-indicator">●</span>
          </button>
        </div>
      </div>

      <!-- 생성 버튼 -->
      <div class="section generate-section">
        <button
          v-if="!isGenerating"
          class="generate-btn"
          :class="{ disabled: !apiConnected || !initImage }"
          @click="handleGenerate"
          :disabled="!apiConnected || !initImage"
        >
          <template v-if="!initImage">
            {{ t('img2img.imageRequired') }}
          </template>
          <template v-else-if="!apiConnected">
            {{ t('promptPanel.apiConnectionRequired') }}
          </template>
          <template v-else>
            🚀 {{ t('common.generate') }}
          </template>
        </button>
        <div v-else class="generating-controls">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="progress-text">{{ progressState || t('common.generating') }}</div>
          <div class="control-buttons">
            <button class="interrupt-btn" @click="interruptGeneration">
              {{ t('promptPanel.interrupt') }}
            </button>
            <button class="skip-btn" @click="skipCurrentImage">
              {{ t('promptPanel.skip') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Denoising Strength -->
      <div class="section denoising-section">
        <div class="section-header">
          <label>{{ t('img2img.denoisingStrength') }}</label>
          <span class="value-display">{{ denoisingStrength.toFixed(2) }}</span>
        </div>
        <input
          type="range"
          v-model.number="denoisingStrength"
          :min="IMG2IMG_PARAM_RANGES.denoisingStrength.min"
          :max="IMG2IMG_PARAM_RANGES.denoisingStrength.max"
          :step="IMG2IMG_PARAM_RANGES.denoisingStrength.step"
          :disabled="isGenerating"
        />
        <div class="hint">{{ t('img2img.denoisingHint') }}</div>
      </div>

      <!-- 업스케일 설정 -->
      <div class="section upscale-section">
        <div class="section-header">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="enableUpscale"
              :disabled="isGenerating"
            />
            {{ t('img2img.enableUpscale') }}
          </label>
        </div>
        <div v-if="enableUpscale" class="upscale-options">
          <div class="param-row">
            <label>{{ t('img2img.upscaler') }}</label>
            <select v-model="upscaler" :disabled="isGenerating">
              <option v-for="u in availableUpscalers" :key="u.name" :value="u.name">{{ u.name }}</option>
            </select>
          </div>
          <div class="param-row">
            <label>{{ t('img2img.upscaleScale') }}</label>
            <input
              type="number"
              v-model.number="upscaleScale"
              :min="IMG2IMG_PARAM_RANGES.upscaleScale.min"
              :max="IMG2IMG_PARAM_RANGES.upscaleScale.max"
              :step="IMG2IMG_PARAM_RANGES.upscaleScale.step"
              :disabled="isGenerating"
            />
          </div>
          <div class="hint">{{ t('img2img.upscaleHint', { width: Math.round(width * upscaleScale), height: Math.round(height * upscaleScale) }) }}</div>
        </div>
      </div>

      <!-- 기본 파라미터 -->
      <div class="section params-section">
        <div class="param-row">
          <label>Steps</label>
          <input type="number" v-model.number="steps" min="1" max="150" :disabled="isGenerating" />
        </div>
        <div class="param-row">
          <label>CFG Scale</label>
          <input type="number" v-model.number="cfgScale" min="1" max="30" step="0.5" :disabled="isGenerating" />
        </div>
        <div class="param-row">
          <label>Width</label>
          <input type="number" v-model.number="width" min="64" max="2048" step="8" :disabled="isGenerating" />
        </div>
        <div class="param-row">
          <label>Height</label>
          <input type="number" v-model.number="height" min="64" max="2048" step="8" :disabled="isGenerating" />
        </div>
        <div class="param-row">
          <label>Seed</label>
          <div class="seed-input">
            <input type="number" v-model.number="seed" :disabled="isGenerating" />
            <button @click="randomizeSeed" :disabled="isGenerating" class="dice-btn">🎲</button>
          </div>
        </div>
        <div class="param-row">
          <label>Sampler</label>
          <select v-model="samplerName" :disabled="isGenerating">
            <option v-for="s in availableSamplers" :key="s.name" :value="s.name">{{ s.name }}</option>
          </select>
        </div>
      </div>

      <!-- 프롬프트 -->
      <div class="section prompt-section">
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

    <!-- 오른쪽 패널 -->
    <div class="right-panel">
      <!-- 이미지 프리뷰 -->
      <ImagePreviewPanel
        :current-image="currentImage"
        :is-expanded="showImagePanel"
        @toggle-panel="toggleImagePanel"
        @show-preview="props.openModal('viewer')"
      />

      <!-- 히스토리 -->
      <HistoryPanel
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
          v-for="(item, index) in filteredImages.slice(0, 20)"
          :key="item.id || item.timestamp"
          :item="item"
          :index="index"
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
  </div>
</template>

<style scoped>
.img2img-view {
  display: flex;
  height: 100%;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg-primary);
  overflow: hidden;
}

.left-panel {
  width: 400px;
  min-width: 350px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.section {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 12px;
}

.api-section {
  padding: 8px 12px;
}

/* Denoising Section */
.denoising-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.denoising-section label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.denoising-section .value-display {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-bg-tertiary);
  padding: 2px 8px;
  border-radius: 4px;
}

.denoising-section input[type="range"] {
  width: 100%;
  margin-bottom: 4px;
}

.denoising-section .hint {
  font-size: 11px;
  color: var(--color-text-secondary);
  opacity: 0.8;
}

/* Upscale Section */
.upscale-section .section-header {
  margin-bottom: 8px;
}

.upscale-section .checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
}

.upscale-section .checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.upscale-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
}

.upscale-options .hint {
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 500;
}

/* Params Section */
.params-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-row label {
  width: 80px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.param-row input,
.param-row select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 13px;
}

.seed-input {
  flex: 1;
  display: flex;
  gap: 4px;
}

.seed-input input {
  flex: 1;
}

.dice-btn {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  cursor: pointer;
}

.dice-btn:hover {
  background: var(--color-bg-hover);
}

/* Prompt Section */
.prompt-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Slot Section */
.slot-section {
  padding: 8px 12px;
}

.slot-buttons {
  display: flex;
  gap: 8px;
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

.slot-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.slot-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.slot-btn.filled:not(.active) {
  border-color: var(--color-success);
}

.slot-number {
  font-weight: 700;
}

.slot-indicator {
  font-size: 8px;
  color: var(--color-success);
}

.slot-btn.active .slot-indicator {
  color: var(--color-text-inverse);
}

/* Generate Section */
.generate-section {
  padding: 16px 12px;
}

.generate-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.generate-btn.disabled,
.generate-btn:disabled {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.generating-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.interrupt-btn,
.skip-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.interrupt-btn {
  background: var(--color-error);
  color: white;
}

.skip-btn {
  background: var(--color-warning);
  color: white;
}

/* History */
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
