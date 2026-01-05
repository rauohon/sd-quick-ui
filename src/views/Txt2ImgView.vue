<script setup>
import { ref, computed, onMounted, onUnmounted, watch, toRaw, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImageGeneration } from '../composables/useImageGeneration'
import { useSlotManagement } from '../composables/useSlotManagement'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useIndexedDB } from '../composables/useIndexedDB'
import { useBookmarks } from '../composables/useBookmarks'
import { notifyCompletion } from '../utils/notification'
import { generateAllCombinations, getCombinationCount, extractUsedCombinations } from '../utils/promptCombination'
import {
  INITIAL_LOAD_COUNT,
  LOAD_MORE_COUNT,
  DEBOUNCE_TEXT_INPUT,
  DEBOUNCE_NUMBER_INPUT,
  NOTIFICATION_TYPES,
  SLOT_COUNT,
  ADETAILER_LABELS,
  ADETAILER_MODELS,
  ASPECT_RATIOS
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
import ControlNetPanel from '../components/ControlNetPanel.vue'
import ControlNetManager from '../components/ControlNetManager.vue'
import { useQueue } from '../composables/useQueue'
import { useControlNetUnits } from '../composables/useControlNet'
import { usePngInfo } from '../composables/usePngInfo'
import { useAspectRatio } from '../composables/useAspectRatio'
import { useParamsApplication } from '../composables/useParamsApplication'
import { useHistory } from '../composables/useHistory'
import { usePipelineImage } from '../composables/usePipelineImage'
import { usePipeline } from '../composables/usePipeline'
import { useApiStatus } from '../composables/useApiStatus'
import { useModelLoader } from '../composables/useModelLoader'
import { useModals } from '../composables/useModals'
import { useQueueProcessor } from '../composables/useQueueProcessor'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useDragAndDrop } from '../composables/useDragAndDrop'
import { useVirtualScroll } from '../composables/useVirtualScroll'
import { usePanelVisibility } from '../composables/usePanelVisibility'
import { useResizer } from '../composables/useResizer'
import { useGenerationState } from '../composables/useGenerationState'
import { useBookmarkTracking } from '../composables/useBookmarkTracking'

// i18n
const { t } = useI18n()

// Bookmarks composable
const { bookmarks, loadBookmarks, addBookmark, updateBookmarkContent } = useBookmarks()

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
  },
  isDark: {
    type: Boolean,
    default: false
  },
  toggleTheme: {
    type: Function,
    required: true
  }
})

// Emits
const emit = defineEmits(['updateCurrentImage', 'switch-tab', 'update:isGenerating'])

// Constants (expose to template)
const NOTIFICATION_TYPES_CONST = NOTIFICATION_TYPES

// Initialize Modals composable
const modalSystem = useModals()
const {
  showLoraSelector,
  showPromptSelector,
  showBookmarkManager,
  showPresetManager,
  showQueueManager,
  showControlNetManager,
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
  openControlNetManager,
  closeControlNetManager,
  openADetailerPrompt,
  closeADetailerPrompt,
} = modalSystem

// Ref to prompt textarea for keyboard shortcuts
const promptTextareaRef = ref(null)

// Panel visibility composable
const {
  showHistoryPanel,
  isHistoryContentCollapsed,
  showImagePanel,
  showAdvancedPanel,
  showParamsPanel,
  toggleHistoryPanel,
  toggleHistoryContent,
  toggleImagePanel,
  toggleAdvancedPanel,
  toggleParamsPanel,
  initPanelVisibility
} = usePanelVisibility()

// Use Resizer for prompt/image panel width
const { promptPanelWidth, isResizing, startResize } = useResizer()

// Use Queue
const queueSystem = useQueue()
const {
  queue: queueItems,
  isRunning: isQueueRunning,
  isPaused: isQueuePaused,
  currentIndex: queueCurrentIndex,
  updateQueueItem: updateQueue,
  saveQueue: saveQueueState,
  addToQueue,
} = queueSystem

// Generation state composable
const generationState = useGenerationState()
const {
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
} = generationState

// Bookmark tracking composable
const bookmarkTracking = useBookmarkTracking(
  { prompt, negativePrompt },
  { bookmarks, addBookmark, updateBookmarkContent },
  { showToast: props.showToast, t }
)
const {
  appliedBookmarkId,
  bookmarkPromptChanged,
  handleApplyBookmark,
  handleUpdateBookmark,
  handleSaveAsNewBookmark,
  handleDismissBookmarkNotice,
  initBookmarkTracking
} = bookmarkTracking

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
// 프롬프트가 마지막 생성과 다른지 체크 (lastUsedParams 의존)
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

// Pipeline Image
const { sendToImg2Img, sendToInpaint } = usePipelineImage()

// Send to handlers
function handleSendToImg2Img(item) {
  sendToImg2Img(item.image, 'txt2img')
  emit('switch-tab', 'img2img')
}

function handleSendToInpaint(item) {
  sendToInpaint(item.image, 'txt2img')
  emit('switch-tab', 'inpaint')
}

const slotManagement = useSlotManagement(defaultSettings, SETTINGS_REFS, adetailers, props.showToast)
const {
  slots,
  activeSlot,
  saveCurrentSlot,
  selectSlot,
  startDebouncedSlotSave,
  getCurrentSettings,
} = slotManagement

// ADetailer reorder function
function reorderADetailers(fromIndex, toIndex) {
  const newArray = [...adetailers.value]
  const [item] = newArray.splice(fromIndex, 1)
  newArray.splice(toIndex, 0, item)
  adetailers.value = newArray
}

// ControlNet
const { units: controlnetUnits, hasControlNet, enabledCount: controlnetEnabledCount } = useControlNetUnits('txt2img')

const imageGeneration = useImageGeneration(
  {
    prompt, negativePrompt, steps, cfgScale, samplerName, scheduler,
    width, height, batchCount, batchSize, seed, seedVariationRange,
    enableHr, hrUpscaler, hrSteps, denoisingStrength, hrUpscale,
    adetailers, notificationType, notificationVolume, selectedModel,
    controlnetUnits
  },
  enabledADetailers,
  props.showToast,
  t,
  appliedBookmarkId
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
  setOnComplete,
} = imageGeneration

// Combination mode
const combinationMode = ref(window.localStorage.getItem('sd-combination-mode') === 'true')
const combinationCount = computed(() => {
  if (!combinationMode.value) return 1
  return getCombinationCount(prompt.value)
})

// 사용된 조합 값만 추출 (원본 프롬프트와 비교)
const usedCombinationResult = computed(() => {
  if (!lastUsedParams.value?.prompt) return ''
  return extractUsedCombinations(prompt.value, lastUsedParams.value.prompt)
})

function saveCombinationMode(value) {
  combinationMode.value = value
  window.localStorage.setItem('sd-combination-mode', String(value))
}

// Handle generate with combination support
function handleGenerate() {
  if (combinationMode.value && combinationCount.value > 1) {
    const combinations = generateAllCombinations(prompt.value)
    const currentSettings = getCurrentSettings()

    // prompt와 negativePrompt는 별도로 전달되므로 params에서 제거
    const { prompt: _p, negativePrompt: _np, ...paramsWithoutPrompts } = currentSettings

    combinations.forEach(combo => {
      addToQueue(combo, negativePrompt.value, paramsWithoutPrompts, batchCount.value)
    })

    props.showToast(t('queue.combinationsAdded', { count: combinations.length }), 'success')
    openQueueManager()

    // 큐가 실행 중이 아니면 자동 시작
    if (!isQueueRunning.value) {
      startQueue()
    }
    return
  }

  generateImage()
}

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
const historyConstants = { INITIAL_LOAD_COUNT, LOAD_MORE_COUNT, SLOT_COUNT }
const history = useHistory(historyRefs, historyComposables, historyCallbacks, historyConstants, t)
const {
  showFavoriteOnly,
  isSelectionMode,
  selectedImages,
  showHistoryDetail,
  selectedHistoryItem,
  totalImageCount,
  filteredImages,
  toggleImageFavorite,
  deleteImage,
  clearHistory,
  loadMoreImages,
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

// History panel ref for virtual scroll
const historyPanelRef = ref(null)

// Virtual scroll container ref (will be set after HistoryPanel mounts)
const historyScrollContainerRef = computed(() => {
  return historyPanelRef.value?.scrollContainerRef || null
})

// Virtual scroll for history panel
// Item height: 120px (image) + gap 16px = 136px per row (3 columns)
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

// Image comparison handler
function handleCompareImage(item) {
  props.openModal('comparison', item.image)
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

// Initialize Keyboard Shortcuts
useKeyboardShortcuts({
  generateImage,
  selectSlot,
  promptRef: promptTextareaRef,
  isGenerating,
  apiConnected,
  modals: {
    showLoraSelector,
    showPromptSelector,
    showBookmarkManager,
    showPresetManager,
    showQueueManager,
    showADetailerPrompt
  }
})

// Initialize Drag and Drop
const { isDragging } = useDragAndDrop(handleLoadPngInfo)

// ============================================================================
// AUTO-SAVE WATCHERS
// Note: 의도적으로 Txt2ImgView에 유지. 분리 시 20개+ refs 전달 필요하여 복잡도 증가.
// startDebouncedSlotSave가 핵심 로직 담당, 여기는 단순 선언적 watchers만 존재.
// ============================================================================

// Text fields (1000ms debounce)
watch(
  [prompt, negativePrompt, samplerName, scheduler, hrUpscaler],
  () => startDebouncedSlotSave(DEBOUNCE_TEXT_INPUT)
)

// Number fields (500ms debounce - faster feedback)
watch(
  [steps, cfgScale, width, height, batchCount, batchSize, seed, hrSteps, denoisingStrength, hrUpscale],
  () => startDebouncedSlotSave(DEBOUNCE_NUMBER_INPUT)
)

// ADetailer (computed string to avoid expensive deep watch)
watch(
  () => adetailers.value.map(ad =>
    `${ad.enable}-${ad.model}-${ad.prompt}-${ad.confidence}-${ad.inpaintDenoising}`
  ).join('|'),
  () => startDebouncedSlotSave(DEBOUNCE_TEXT_INPUT)
)

// Slots → IndexedDB persistence
watch(slots, async (newSlots) => {
  try {
    const plainSlots = JSON.parse(JSON.stringify(toRaw(newSlots)))
    await indexedDB.saveSlots(plainSlots)
  } catch (error) {
    console.error('슬롯 IndexedDB 저장 실패:', error)
  }
}, { deep: true })

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

// Emit isGenerating updates to parent (for tab switch blocking)
watch(isGenerating, (newValue) => {
  emit('update:isGenerating', newValue)
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

// Pipeline integration
const pipeline = usePipeline()

// Register view with pipeline
function registerPipelineView() {
  pipeline.registerView('txt2img', {
    generate: handleGenerate,
    setInputImage: null  // txt2img doesn't have input image
  })

  // Set completion callback for pipeline
  setOnComplete((outputImage) => {
    pipeline.onStepComplete('txt2img', outputImage)
  })
}

// Lifecycle
onMounted(async () => {
  // Register with pipeline
  registerPipelineView()

  // Load bookmarks from localStorage
  loadBookmarks()

  // Initialize panel visibility (load from localStorage + setup watchers)
  initPanelVisibility()

  // Initialize bookmark tracking (setup prompt change watcher)
  initBookmarkTracking()

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

  // Mark initial load as complete and notify pipeline
  setTimeout(() => {
    isInitialLoad.value = false
    pipeline.setViewReady('txt2img', true)
  }, 1000)
})

onUnmounted(() => {
  stopProgressPolling()
  stopQueue() // Clean up queue processor interval

  // Unregister from pipeline
  pipeline.unregisterView('txt2img')
  setOnComplete(null)

  // 탭 전환 시 현재 슬롯 즉시 저장 (debounce 대기 중인 저장 취소 후 즉시 저장)
  slotManagement.cancelDebouncedSlotSave()
  slotManagement.saveCurrentSlot()

  // Clean up completion timeout to prevent memory leak
  if (completionTimeout) {
    clearTimeout(completionTimeout)
    completionTimeout = null
  }
})
</script>

<template>
  <div class="tab-content">
    <div class="container" :style="{ '--prompt-panel-width': promptPanelWidth + 'px' }">
      <!-- 1단: 고급 설정 -->
      <AdvancedSettingsPanel
        :is-expanded="showAdvancedPanel"
        :is-generating="isGenerating"
        :api-connected="apiConnected"
        :api-checking="apiChecking"
        :is-dark="isDark"
        :toggle-theme="toggleTheme"
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
        :show-confirm="showConfirm"
        :show-toast="showToast"
        :show-controlnet-manager="showControlNetManager"
        :controlnet-enabled-count="controlnetEnabledCount"
        @toggle-panel="toggleAdvancedPanel"
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
        @open-controlnet="openControlNetManager"
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
        @toggle-panel="toggleParamsPanel"
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
        @reorder-adetailers="reorderADetailers"
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
        :combination-mode="combinationMode"
        :combination-count="combinationCount"
        @toggle-infinite="toggleInfiniteMode"
        @generate="handleGenerate"
        @interrupt="interruptGeneration"
        @stop-infinite="stopInfiniteModeOnly"
        @skip="skipCurrentImage"
        @open-bookmark="openBookmarkManager"
        @open-preset="openPresetManager"
        @open-queue="openQueueManager"
        @open-lora="openLoraSelector"
        @open-prompts="openPromptSelector"
        @update:combination-mode="saveCombinationMode"
      >
        <PromptTextarea
          ref="promptTextareaRef"
          v-model="prompt"
          :label="$t('prompt.positive')"
          placeholder="beautiful landscape, detailed, masterpiece, best quality..."
          :is-generating="isGenerating"
          :is-changed="promptChanged"
          :is-negative="false"
        />

        <!-- Bookmark Update Actions (between prompts) -->
        <div v-if="appliedBookmarkId && bookmarkPromptChanged" class="bookmark-actions">
          <button
            class="bookmark-actions-dismiss"
            @click="handleDismissBookmarkNotice"
            :title="$t('bookmark.dismissTooltip')"
          >×</button>
          <div class="bookmark-actions-hint">
            <span>{{ $t('bookmark.promptModified', { name: bookmarks.find(b => b.id === appliedBookmarkId)?.name || '' }) }}</span>
          </div>
          <div class="bookmark-actions-buttons">
            <button
              class="action-btn update-btn"
              @click="handleUpdateBookmark"
              :title="$t('bookmark.updateTooltip')"
            >
              ✏️ {{ $t('bookmark.updateBookmark') }}
            </button>
            <button
              class="action-btn save-new-btn"
              @click="handleSaveAsNewBookmark"
              :title="$t('bookmark.saveAsNewTooltip')"
            >
              ➕ {{ $t('bookmark.saveAsNew') }}
            </button>
          </div>
        </div>

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

    <!-- Resizer between prompt and image panels -->
    <div
      class="panel-resizer"
      :class="{ 'resizing': isResizing }"
      @mousedown="startResize"
      title="Drag to resize"
    ></div>

    <!-- 4단: 이미지 프리뷰 + 히스토리 OR Easy Prompt Selector OR Bookmark Manager OR Preset Manager OR Queue Manager OR LoRA Selector OR ControlNet Manager -->
    <div v-if="!showPromptSelector && !showBookmarkManager && !showPresetManager && !showQueueManager && !showLoraSelector && !showControlNetManager" :class="['image-area', { 'history-collapsed': !showHistoryPanel }]">
      <ImagePreviewPanel
        :current-image="currentImage"
        :is-loading="isLoadingPngInfo"
        :is-expanded="showImagePanel"
        :used-prompt="usedCombinationResult"
        @toggle-panel="toggleImagePanel"
        @show-preview="props.openModal('viewer')"
        @load-png-info="handleLoadPngInfo"
      />

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
          current-tab="txt2img"
          @toggle-favorite="toggleImageFavorite"
          @delete="deleteImage"
          @load-params="loadParamsFromHistory"
          @toggle-selection="toggleImageSelection"
          @compare-image="handleCompareImage"
          @send-to-img2img="handleSendToImg2Img"
          @send-to-inpaint="handleSendToInpaint"
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

    <!-- ControlNet Manager (replaces image area) -->
    <ControlNetManager
      v-if="showControlNetManager"
      class="image-area"
      :is-generating="isGenerating"
      :showToast="showToast"
      tab-id="txt2img"
      @close="closeControlNetManager"
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
      :total-image-count="totalImageCount"
      :current-image="currentImage"
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

    <!-- Drag and Drop Overlay (hide when ControlNetManager is open) -->
    <div v-if="isDragging && !showControlNetManager" class="drag-drop-overlay">
      <div class="drag-drop-content">
        <div class="drag-drop-icon">📁</div>
        <div class="drag-drop-text">{{ $t('dragDrop.dropHere') }}</div>
        <div class="drag-drop-hint">{{ $t('dragDrop.pngOnly') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Drag and Drop Overlay */
.drag-drop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(102, 126, 234, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.drag-drop-content {
  text-align: center;
  color: white;
  padding: 60px;
  border: 4px dashed rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.drag-drop-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.drag-drop-text {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.drag-drop-hint {
  font-size: 18px;
  font-weight: 500;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

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
  grid-template-columns: 280px 300px var(--prompt-panel-width, 420px);
  gap: 12px;
  transition: grid-template-columns 0.3s ease;
}

/* Advanced panel collapsed only */
.container:has(.advanced-panel.collapsed):not(:has(.params-panel.collapsed)) {
  grid-template-columns: 40px 300px var(--prompt-panel-width, 420px);
}

/* Params panel collapsed only */
.container:has(.params-panel.collapsed):not(:has(.advanced-panel.collapsed)) {
  grid-template-columns: 280px 40px var(--prompt-panel-width, 420px);
}

/* Both panels collapsed */
.container:has(.advanced-panel.collapsed):has(.params-panel.collapsed) {
  grid-template-columns: 40px 40px var(--prompt-panel-width, 420px);
}

/* Panel Resizer */
.panel-resizer {
  width: 6px;
  cursor: col-resize;
  background: var(--color-border-primary);
  border-radius: 3px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.panel-resizer:hover,
.panel-resizer.resizing {
  background: var(--color-primary);
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

/* Bookmark Actions */
.bookmark-actions {
  position: relative;
  margin-top: 8px;
  margin-bottom: 8px;
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
}

.bookmark-actions-dismiss {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #92400e;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.bookmark-actions-dismiss:hover {
  opacity: 1;
}

.bookmark-actions-hint {
  font-size: 12px;
  color: #92400e;
  margin-bottom: 8px;
  font-weight: 500;
}

.bookmark-actions-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.update-btn {
  background: #f59e0b;
  color: white;
}

.update-btn:hover {
  background: #d97706;
  transform: translateY(-1px);
}

.save-new-btn {
  background: #10b981;
  color: white;
}

.save-new-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

</style>
