<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImg2imgGeneration } from '../composables/useImg2imgGeneration'
import { useIndexedDB } from '../composables/useIndexedDB'
import { useApiStatus } from '../composables/useApiStatus'
import { useModelLoader } from '../composables/useModelLoader'
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
const { getRecentImages, getImageCount } = useIndexedDB()
const totalImageCount = ref(0)

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
  initImage, denoisingStrength
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
      // 첫 번째 이미지를 currentImage로 설정하지 않음 (img2img는 입력 이미지가 따로 있음)
    }
  } catch (error) {
    console.error('Failed to load images from IndexedDB:', error)
  }
})

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
        @toggle-favorites="showFavoriteOnly = !showFavoriteOnly"
      >
        <div
          v-for="image in filteredImages.slice(0, 20)"
          :key="image.id"
          class="history-item"
          :class="{
            'is-img2img': image.type === 'img2img'
          }"
          @click="currentImage = image.image"
        >
          <img :src="image.image" :alt="'Generated image'" />
          <span v-if="image.type === 'img2img'" class="type-badge">i2i</span>
        </div>
      </HistoryPanel>
    </div>

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
