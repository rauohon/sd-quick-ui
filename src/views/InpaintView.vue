<script setup>
import { ref, computed, onMounted, onUnmounted, watch, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInpaintGeneration } from '../composables/useInpaintGeneration'
import { useIndexedDB } from '../composables/useIndexedDB'
import { useApiStatus } from '../composables/useApiStatus'
import { useModelLoader } from '../composables/useModelLoader'
import { useSlotManagement } from '../composables/useSlotManagement'
import { useHistory } from '../composables/useHistory'
import { useLocalStorage } from '../composables/useLocalStorage'
import { usePanelVisibility } from '../composables/usePanelVisibility'
import { useADetailerHandlers } from '../composables/useADetailerHandlers'
import { useBookmarkPresetHandlers } from '../composables/useBookmarkPresetHandlers'
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
import SystemSettingsSection from '../components/SystemSettingsSection.vue'
import BookmarkManager from '../components/BookmarkManager.vue'
import PresetManager from '../components/PresetManager.vue'
import MaskCanvas from '../components/MaskCanvas.vue'
import HistorySelectorModal from '../components/HistorySelectorModal.vue'

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
const initImageFormat = ref('')
const mask = ref(null) // 마스크 이미지 (base64)

// 이미지 정보 계산
const initImageFileSize = computed(() => {
  if (!initImage.value) return 0
  // base64 데이터에서 실제 파일 크기 계산
  const base64 = initImage.value.split(',')[1] || initImage.value
  const padding = (base64.match(/=/g) || []).length
  return Math.floor((base64.length * 3) / 4 - padding)
})

const initImageFileSizeFormatted = computed(() => {
  const bytes = initImageFileSize.value
  if (bytes === 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
})
const denoisingStrength = ref(INPAINT_PARAM_RANGES.denoisingStrength.default)
const maskBlur = ref(INPAINT_PARAM_RANGES.maskBlur.default)
const inpaintingFill = ref(INPAINT_FILL_OPTIONS.ORIGINAL)
const inpaintFullRes = ref(false)
const inpaintFullResPadding = ref(INPAINT_PARAM_RANGES.onlyMaskedPadding.default)

// 마스크 도구 상태
const activeTool = ref('brush') // 'brush' | 'eraser'
const brushSize = ref(30)
const maskCanvasRef = ref(null)
const canUndo = ref(false)
const canRedo = ref(false)

// 줌/패닝 상태
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)

// 줌 범위 상수
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.1

// Outpaint 확장 상태
const expandTop = ref(0)
const expandBottom = ref(0)
const expandLeft = ref(0)
const expandRight = ref(0)
const isExpanded = ref(false) // 확장이 적용되었는지 여부
const expandFillMode = ref('fill') // 'fill' | 'noise'
const expandFillColor = ref('#000000') // 단색 채우기 색상

// 확장 프리셋 값들
const EXPAND_PRESETS = [64, 128, 256, 512]
const EXPAND_FILL_COLORS = ['#000000', '#808080', '#ffffff'] // 검정, 회색, 흰색

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
} = usePanelVisibility('inpaint')

// 드래그앤드롭 상태
const isDragging = ref(false)
const dragCounter = ref(0)

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
    batchCount, batchSize, denoisingStrength, adetailers, maskBlur }
)

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
const systemSettingsRef = ref(null)
const autoCorrectEnabled = ref(false)

function handleAutoCorrectChange(value) {
  autoCorrectEnabled.value = value
}

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
async function handleGenerate() {
  // 이미지 검증
  if (!initImage.value) {
    props.showToast(t('inpaint.noImageSelected'), 'error')
    return
  }

  // 마스크 검증 (Outpaint일 경우 확장 영역이 자동 마스킹됨)
  const hasMask = maskCanvasRef.value?.isMaskEmpty ? !maskCanvasRef.value.isMaskEmpty() : !!mask.value
  if (!hasMask && !isExpanded.value) {
    props.showToast(t('inpaint.noMaskDrawn'), 'error')
    return
  }

  try {
    // 기본 오버라이드 (없음)
    const overrides = {}

    // Outpaint 모드: 확장된 이미지와 마스크 사용
    if (isExpanded.value) {
      props.showToast(t('inpaint.preparingOutpaint'), 'info')

      // 확장된 이미지 생성
      overrides.initImage = await generateExpandedImage()

      // 확장된 마스크 가져오기 (확장 영역은 자동 마스킹됨)
      overrides.mask = getExpandedMask()

      // 확장된 크기 설정
      overrides.width = initImageWidth.value + expandLeft.value + expandRight.value
      overrides.height = initImageHeight.value + expandTop.value + expandBottom.value
    }

    // 이미지 생성 호출 (원본 initImage/mask는 수정하지 않음)
    await generateImage(overrides)

  } catch (error) {
    console.error('Generation preparation failed:', error)
    props.showToast(t('inpaint.preparationFailed'), 'error')
  }
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
  maskCanvasRef.value?.clearMask()
}

function fillMask() {
  maskCanvasRef.value?.fillMask()
}

function invertMask() {
  maskCanvasRef.value?.invertMask()
}

function undo() {
  maskCanvasRef.value?.undo()
}

function redo() {
  maskCanvasRef.value?.redo()
}

function handleMaskUpdate(maskData) {
  mask.value = maskData
}

function handleHistoryChange({ canUndo: undo, canRedo: redo }) {
  canUndo.value = undo
  canRedo.value = redo
}

// ===== 줌/패닝 함수 =====
function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + ZOOM_STEP, MAX_ZOOM)
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - ZOOM_STEP, MIN_ZOOM)
}

function fitToScreen() {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

function resetToActualSize() {
  maskCanvasRef.value?.resetZoom?.()
}

// 줌 퍼센트 표시용 computed
const zoomPercentage = computed(() => Math.round(zoomLevel.value * 100))

// ===== Outpaint 확장 함수 =====
// 프리셋 값을 모든 방향에 적용
function applyPresetToAll(value) {
  expandTop.value = value
  expandBottom.value = value
  expandLeft.value = value
  expandRight.value = value
}

// 특정 방향에 프리셋 적용
function applyPresetToDirection(direction, value) {
  switch (direction) {
    case 'top': expandTop.value = value; break
    case 'bottom': expandBottom.value = value; break
    case 'left': expandLeft.value = value; break
    case 'right': expandRight.value = value; break
  }
}

// 8의 배수로 보정
function correctTo8Multiple(value) {
  return Math.round(value / 8) * 8
}

// 확장 적용 - 8의 배수 검증 포함
function applyExpansion() {
  const hasExpansion = expandTop.value > 0 || expandBottom.value > 0 ||
                       expandLeft.value > 0 || expandRight.value > 0

  if (!hasExpansion) {
    props.showToast(t('inpaint.noExpansion'), 'warning')
    return
  }

  // 확장 후 크기 계산
  const newWidth = initImageWidth.value + expandLeft.value + expandRight.value
  const newHeight = initImageHeight.value + expandTop.value + expandBottom.value

  // 8의 배수 검증
  const needsWidthCorrection = newWidth % 8 !== 0
  const needsHeightCorrection = newHeight % 8 !== 0
  const needsCorrection = needsWidthCorrection || needsHeightCorrection

  // 자동 보정이 활성화된 경우에만 보정 적용
  if (needsCorrection && autoCorrectEnabled.value) {
    if (needsWidthCorrection) {
      const correctedWidth = correctTo8Multiple(newWidth)
      const diff = correctedWidth - newWidth
      expandRight.value = Math.max(0, expandRight.value + diff)
    }

    if (needsHeightCorrection) {
      const correctedHeight = correctTo8Multiple(newHeight)
      const diff = correctedHeight - newHeight
      expandBottom.value = Math.max(0, expandBottom.value + diff)
    }

    isExpanded.value = true
    const finalWidth = initImageWidth.value + expandLeft.value + expandRight.value
    const finalHeight = initImageHeight.value + expandTop.value + expandBottom.value
    props.showToast(t('inpaint.expansionCorrected', { width: finalWidth, height: finalHeight }), 'info')
  } else if (needsCorrection) {
    // 자동 보정 비활성화: 경고만 표시하고 그대로 적용
    isExpanded.value = true
    props.showToast(t('inpaint.expansionNot8Multiple', { size: `${newWidth}×${newHeight}` }), 'warning')
  } else {
    // 보정 불필요: 그대로 적용
    isExpanded.value = true
    props.showToast(t('inpaint.expansionApplied'), 'success')
  }
}

// 확장 리셋 (UI 버튼용 - 토스트 표시)
function resetExpansion() {
  resetExpansionState()
  props.showToast(t('inpaint.expansionReset'), 'info')
}

// 확장 상태만 초기화 (내부용 - 토스트 없음)
function resetExpansionState() {
  expandTop.value = 0
  expandBottom.value = 0
  expandLeft.value = 0
  expandRight.value = 0
  isExpanded.value = false
}

// 총 확장 픽셀 계산
const totalExpansion = computed(() => ({
  width: expandLeft.value + expandRight.value,
  height: expandTop.value + expandBottom.value
}))

// 확장 후 예상 크기
const expandedSize = computed(() => ({
  width: initImageWidth.value + totalExpansion.value.width,
  height: initImageHeight.value + totalExpansion.value.height
}))

// 생성 시 예상 출력 크기 (Outpaint면 expandedSize, 아니면 width/height)
const expectedOutputSize = computed(() => {
  if (isExpanded.value) {
    return expandedSize.value
  }
  return { width: width.value, height: height.value }
})

// 확장된 이미지 생성 (API 전송용)
function generateExpandedImage() {
  return new Promise((resolve, reject) => {
    if (!initImage.value || !isExpanded.value) {
      resolve(initImage.value)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      const newWidth = expandedSize.value.width
      const newHeight = expandedSize.value.height

      canvas.width = newWidth
      canvas.height = newHeight

      // 확장 영역 채우기
      if (expandFillMode.value === 'fill') {
        // 단색 채우기
        ctx.fillStyle = expandFillColor.value
        ctx.fillRect(0, 0, newWidth, newHeight)
      } else if (expandFillMode.value === 'noise') {
        // 노이즈 채우기
        const imageData = ctx.createImageData(newWidth, newHeight)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const noise = Math.floor(Math.random() * 256)
          data[i] = noise     // R
          data[i + 1] = noise // G
          data[i + 2] = noise // B
          data[i + 3] = 255   // A
        }
        ctx.putImageData(imageData, 0, 0)
      }

      // 원본 이미지를 올바른 위치에 배치
      ctx.drawImage(img, expandLeft.value, expandTop.value)

      // Base64로 변환
      const base64 = canvas.toDataURL('image/png')
      resolve(base64)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image for expansion'))
    }
    img.src = initImage.value
  })
}

// 확장된 마스크 가져오기 (API 전송용)
// 확장 시 확장 영역은 자동으로 마스크됨 (흰색 = inpaint 대상)
function getExpandedMask() {
  // MaskCanvas에서 직접 Base64 마스크 가져오기
  const mask = maskCanvasRef.value?.getMaskBase64?.()
  return mask || maskData.value
}

// History image selector modal
const showHistorySelector = ref(false)

function openHistorySelector() {
  showHistorySelector.value = true
}

async function selectImageFromHistory(image) {
  // 기존 이미지+마스크가 있으면 확인
  if (initImage.value) {
    const confirmed = await confirmImageReplace()
    if (!confirmed) return
  }

  initImage.value = image.image
  // base64에서 포맷 감지
  const formatMatch = image.image.match(/^data:image\/(\w+);/)
  initImageFormat.value = formatMatch ? formatMatch[1].toUpperCase() : 'WEBP'
  const img = new Image()
  img.onload = () => {
    initImageWidth.value = img.width
    initImageHeight.value = img.height
    props.showToast(t('inpaint.imageLoaded'), 'success')
  }
  img.src = image.image
}

// 파일 업로드
function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  loadImageFile(file)
}

// 이미지 파일 로드 (공통 함수)
const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

async function loadImageFile(file) {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    props.showToast(t('inpaint.invalidFileType'), 'error')
    return
  }

  // 기존 이미지+마스크가 있으면 확인
  if (initImage.value) {
    const confirmed = await confirmImageReplace()
    if (!confirmed) return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    initImage.value = e.target.result
    // 포맷 감지
    initImageFormat.value = file.type.split('/')[1]?.toUpperCase() || 'Unknown'
    const img = new Image()
    img.onload = () => {
      initImageWidth.value = img.width
      initImageHeight.value = img.height
      props.showToast(t('inpaint.imageLoaded'), 'success')
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 드래그앤드롭 핸들러
function handleDragEnter(e) {
  e.preventDefault()
  dragCounter.value++
  isDragging.value = true
}

function handleDragLeave(e) {
  e.preventDefault()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
}

function handleDragOver(e) {
  e.preventDefault()
}

function handleDrop(e) {
  e.preventDefault()
  isDragging.value = false
  dragCounter.value = 0

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    loadImageFile(files[0])
  }
}

// 클립보드 붙여넣기 핸들러
function handlePaste(e) {
  // 입력 요소에서는 무시
  const target = e.target
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return
  }

  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) {
        loadImageFromClipboard(file)
      }
      return
    }
  }
}

async function loadImageFromClipboard(file) {
  // 기존 이미지+마스크가 있으면 확인
  if (initImage.value) {
    const confirmed = await confirmImageReplace()
    if (!confirmed) return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    initImage.value = e.target.result
    // 포맷 감지
    initImageFormat.value = file.type.split('/')[1]?.toUpperCase() || 'PNG'
    const img = new Image()
    img.onload = () => {
      initImageWidth.value = img.width
      initImageHeight.value = img.height
      props.showToast(t('inpaint.imagePasted'), 'success')
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 이미지 제거
async function removeImage() {
  // 마스크가 있거나 확장이 적용된 경우 확인 다이얼로그
  const hasMask = mask.value && !maskCanvasRef.value?.isMaskEmpty?.()
  if (hasMask || isExpanded.value) {
    const result = await props.showConfirm({
      title: t('inpaint.removeImage'),
      message: t('inpaint.confirmImageRemove'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel')
    })
    if (!result?.confirmed) {
      return
    }
  }

  initImage.value = null
  initImageWidth.value = 0
  initImageHeight.value = 0
  initImageFormat.value = ''
  mask.value = null
  // 확장 상태 초기화
  resetExpansionState()
  props.showToast(t('inpaint.imageRemoved'), 'info')
}

// 이미지 교체 전 마스크 확인
async function confirmImageReplace() {
  // 마스크가 있거나 확장이 적용된 경우 확인 다이얼로그
  const hasMask = mask.value && !maskCanvasRef.value?.isMaskEmpty?.()
  if (hasMask || isExpanded.value) {
    const result = await props.showConfirm({
      title: t('inpaint.replaceImage'),
      message: t('inpaint.confirmMaskReset'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel')
    })
    if (!result?.confirmed) {
      return false
    }
  }
  // 마스크 초기화
  mask.value = null
  maskCanvasRef.value?.clearMask?.()
  // 확장 상태 초기화
  resetExpansionState()
  return true
}

// 시스템 설정 저장
function saveAutoCorrectSetting() {
  window.localStorage.setItem('sd-auto-correct-dimensions', String(autoCorrectDimensions.value))
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

// ===== Keyboard Shortcuts =====
const BRUSH_SIZE_STEP = 10
const BRUSH_SIZE_MIN = 1
const BRUSH_SIZE_MAX = 200

function handleKeyDown(e) {
  // 입력 필드에서는 단축키 비활성화
  const isInputField = e.target.tagName === 'INPUT' ||
                       e.target.tagName === 'TEXTAREA' ||
                       e.target.isContentEditable

  // Ctrl+I: 마스크 반전 (입력 필드에서도 동작)
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault()
    invertMask()
    return
  }

  // 입력 필드에서는 나머지 단축키 무시
  if (isInputField) return

  // B: 브러시 도구
  if (e.key === 'b' || e.key === 'B') {
    e.preventDefault()
    setActiveTool('brush')
    return
  }

  // E: 지우개 도구
  if (e.key === 'e' || e.key === 'E') {
    e.preventDefault()
    setActiveTool('eraser')
    return
  }

  // [: 브러시 크기 감소
  if (e.key === '[') {
    e.preventDefault()
    brushSize.value = Math.max(BRUSH_SIZE_MIN, brushSize.value - BRUSH_SIZE_STEP)
    return
  }

  // ]: 브러시 크기 증가
  if (e.key === ']') {
    e.preventDefault()
    brushSize.value = Math.min(BRUSH_SIZE_MAX, brushSize.value + BRUSH_SIZE_STEP)
    return
  }
}

// ===== Lifecycle =====
onMounted(async () => {
  // Initialize panel visibility (load from localStorage)
  initPanelVisibility()

  // 키보드 단축키 이벤트 등록
  window.addEventListener('keydown', handleKeyDown)
  // 클립보드 붙여넣기 이벤트 등록
  window.addEventListener('paste', handlePaste)

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

onUnmounted(() => {
  // 키보드 단축키 이벤트 해제
  window.removeEventListener('keydown', handleKeyDown)
  // 클립보드 붙여넣기 이벤트 해제
  window.removeEventListener('paste', handlePaste)
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
  <div class="generation-view inpaint-view" :class="{ 'settings-collapsed': !showSettingsPanel }">
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

        <!-- 스케줄러 -->
        <div class="form-group horizontal">
          <label>Scheduler</label>
          <select v-model="scheduler" :disabled="isGenerating">
            <option v-for="s in availableSchedulers" :key="s.name" :value="s.name">{{ s.label }}</option>
          </select>
        </div>

        <!-- 크기 -->
        <div class="section-divider"></div>
        <div class="form-group horizontal">
          <label>Width</label>
          <input type="number" v-model.number="width" min="64" max="2048" step="64" :disabled="isGenerating" />
        </div>
        <div class="form-group horizontal">
          <label>Height</label>
          <input type="number" v-model.number="height" min="64" max="2048" step="64" :disabled="isGenerating" />
        </div>

        <!-- Inpaint 설정 -->
        <div class="section-divider"></div>
        <div class="section-title">{{ t('inpaint.inpaintSettings') }}</div>

        <!-- Denoising Strength -->
        <div class="form-group horizontal">
          <label>Denoising</label>
          <input
            type="number"
            v-model.number="denoisingStrength"
            :min="INPAINT_PARAM_RANGES.denoisingStrength.min"
            :max="INPAINT_PARAM_RANGES.denoisingStrength.max"
            :step="INPAINT_PARAM_RANGES.denoisingStrength.step"
            :disabled="isGenerating"
          />
        </div>

        <!-- Mask Blur -->
        <div class="form-group horizontal">
          <label>{{ t('inpaint.maskBlur') }}</label>
          <input
            type="number"
            v-model.number="maskBlur"
            :min="INPAINT_PARAM_RANGES.maskBlur.min"
            :max="INPAINT_PARAM_RANGES.maskBlur.max"
            :step="INPAINT_PARAM_RANGES.maskBlur.step"
            :disabled="isGenerating"
          />
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
            type="number"
            v-model.number="inpaintFullResPadding"
            :min="INPAINT_PARAM_RANGES.onlyMaskedPadding.min"
            :max="INPAINT_PARAM_RANGES.onlyMaskedPadding.max"
            :step="INPAINT_PARAM_RANGES.onlyMaskedPadding.step"
            :disabled="isGenerating"
          />
        </div>

        <!-- 생성 파라미터 -->
        <div class="section-divider"></div>
        <div class="section-title">{{ t('inpaint.generationParams') }}</div>

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
          <input type="number" v-model.number="batchCount" min="1" max="100" :disabled="isGenerating" />
        </div>
        <div class="form-group horizontal">
          <label>Batch size</label>
          <input type="number" v-model.number="batchSize" min="1" max="8" :disabled="isGenerating" />
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
      <SystemSettingsSection
        v-if="showSettingsPanel"
        ref="systemSettingsRef"
        :isDark="props.isDark"
        :toggleTheme="props.toggleTheme"
        @update:autoCorrect="handleAutoCorrectChange"
      />

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
      <div
        class="canvas-column"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <!-- 드래그앤드롭 오버레이 -->
        <div v-if="isDragging" class="drop-overlay">
          <div class="drop-content">
            <div class="drop-icon">📁</div>
            <p>{{ t('inpaint.dropImageHere') }}</p>
          </div>
        </div>

        <!-- 이미지 업로드 영역 (이미지가 없을 때) -->
        <div v-if="!initImage" class="upload-area">
          <div class="upload-content">
            <div class="upload-icon">🖼️</div>
            <p>{{ t('inpaint.noImageSelected') }}</p>
            <p class="upload-hint">{{ t('inpaint.dropImageHere') }}</p>
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
          <!-- Outpaint 확장 컨트롤 바 -->
          <div class="expand-toolbar">
            <div class="expand-title">
              <span class="expand-icon">🔲</span>
              {{ t('inpaint.expand') }}
            </div>

            <!-- 방향별 픽셀 입력 -->
            <div class="expand-inputs">
              <div class="expand-input-group">
                <label>{{ t('inpaint.expandTop') }}</label>
                <input
                  type="number"
                  v-model.number="expandTop"
                  min="0"
                  max="1024"
                  step="8"
                  :disabled="isGenerating || isExpanded"
                />
              </div>
              <div class="expand-input-group">
                <label>{{ t('inpaint.expandBottom') }}</label>
                <input
                  type="number"
                  v-model.number="expandBottom"
                  min="0"
                  max="1024"
                  step="8"
                  :disabled="isGenerating || isExpanded"
                />
              </div>
              <div class="expand-input-group">
                <label>{{ t('inpaint.expandLeft') }}</label>
                <input
                  type="number"
                  v-model.number="expandLeft"
                  min="0"
                  max="1024"
                  step="8"
                  :disabled="isGenerating || isExpanded"
                />
              </div>
              <div class="expand-input-group">
                <label>{{ t('inpaint.expandRight') }}</label>
                <input
                  type="number"
                  v-model.number="expandRight"
                  min="0"
                  max="1024"
                  step="8"
                  :disabled="isGenerating || isExpanded"
                />
              </div>
            </div>

            <!-- 프리셋 버튼 -->
            <div class="expand-presets">
              <span class="preset-label">{{ t('inpaint.expandAll') }}:</span>
              <button
                v-for="preset in EXPAND_PRESETS"
                :key="preset"
                class="preset-btn"
                @click="applyPresetToAll(preset)"
                :disabled="isGenerating || isExpanded"
              >
                {{ preset }}
              </button>
            </div>

            <!-- 채우기 옵션 -->
            <div class="expand-fill-options">
              <span class="fill-label">{{ t('inpaint.expandFill') }}:</span>
              <select
                v-model="expandFillMode"
                :disabled="isGenerating || isExpanded"
                class="fill-mode-select"
              >
                <option value="fill">{{ t('inpaint.fillSolid') }}</option>
                <option value="noise">{{ t('inpaint.fillNoise') }}</option>
              </select>
              <div v-if="expandFillMode === 'fill'" class="fill-colors">
                <button
                  v-for="color in EXPAND_FILL_COLORS"
                  :key="color"
                  class="color-btn"
                  :class="{ active: expandFillColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="expandFillColor = color"
                  :disabled="isGenerating || isExpanded"
                  :title="color"
                />
              </div>
            </div>

            <!-- 확장 적용/리셋 버튼 -->
            <div class="expand-actions">
              <button
                class="expand-apply-btn"
                @click="applyExpansion"
                :disabled="isGenerating || isExpanded || (expandTop === 0 && expandBottom === 0 && expandLeft === 0 && expandRight === 0)"
              >
                {{ t('inpaint.applyExpansion') }}
              </button>
              <button
                class="expand-reset-btn"
                @click="resetExpansion"
                :disabled="isGenerating || (!isExpanded && expandTop === 0 && expandBottom === 0 && expandLeft === 0 && expandRight === 0)"
              >
                {{ t('inpaint.resetExpansion') }}
              </button>
            </div>

            <!-- 확장 미리보기 정보 -->
            <div v-if="expandTop > 0 || expandBottom > 0 || expandLeft > 0 || expandRight > 0" class="expand-preview-info">
              <span class="preview-label">{{ t('inpaint.expandPreview') }}:</span>
              <span class="preview-size">
                {{ initImageWidth }} × {{ initImageHeight }}
                →
                {{ expandedSize.width }} × {{ expandedSize.height }}
              </span>
              <span v-if="isExpanded" class="expand-status applied">✓</span>
            </div>
          </div>

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
              <button
                class="action-btn"
                @click="undo"
                :disabled="!canUndo"
                :title="t('inpaint.undo') + ' (Ctrl+Z)'"
              >
                ↩️ {{ t('inpaint.undo') }}
              </button>
              <button
                class="action-btn"
                @click="redo"
                :disabled="!canRedo"
                :title="t('inpaint.redo') + ' (Ctrl+Y)'"
              >
                ↪️ {{ t('inpaint.redo') }}
              </button>
            </div>
            <div class="tool-group">
              <label class="upload-btn small">
                <input type="file" accept="image/*" @change="handleFileUpload" hidden />
                📁
              </label>
              <button class="action-btn small" @click="openHistorySelector">📋</button>
            </div>
            <div class="tool-group zoom-group">
              <button
                class="action-btn"
                @click="zoomOut"
                :disabled="zoomLevel <= MIN_ZOOM"
                :title="t('inpaint.zoomOut')"
              >
                ➖
              </button>
              <span class="zoom-display">{{ zoomPercentage }}%</span>
              <button
                class="action-btn"
                @click="zoomIn"
                :disabled="zoomLevel >= MAX_ZOOM"
                :title="t('inpaint.zoomIn')"
              >
                ➕
              </button>
              <button
                class="action-btn"
                @click="fitToScreen"
                :title="t('inpaint.fitToScreen')"
              >
                {{ t('inpaint.fit') }}
              </button>
            </div>
          </div>

          <!-- 이미지 정보 바 -->
          <div class="image-info-bar">
            <span class="info-item">
              <span class="info-label">📐</span>
              {{ initImageWidth }} × {{ initImageHeight }}
            </span>
            <span class="info-item">
              <span class="info-label">📦</span>
              {{ initImageFileSizeFormatted }}
            </span>
            <span class="info-item">
              <span class="info-label">🖼️</span>
              {{ initImageFormat }}
            </span>
            <button
              class="remove-image-btn"
              @click="removeImage"
              :title="t('inpaint.removeImage')"
            >
              ✕ {{ t('inpaint.removeImage') }}
            </button>
          </div>

          <!-- 마스크 캔버스 컴포넌트 -->
          <MaskCanvas
            ref="maskCanvasRef"
            :image="initImage"
            :tool="activeTool"
            :brush-size="brushSize"
            :disabled="isGenerating"
            :zoom="zoomLevel"
            :pan-x="panX"
            :pan-y="panY"
            :expand-top="expandTop"
            :expand-bottom="expandBottom"
            :expand-left="expandLeft"
            :expand-right="expandRight"
            :is-expanded="isExpanded"
            @update:mask="handleMaskUpdate"
            @history-change="handleHistoryChange"
            @update:zoom="(val) => zoomLevel = val"
            @update:pan-x="(val) => panX = val"
            @update:pan-y="(val) => panY = val"
          />
        </div>

        <!-- 출력 이미지 프리뷰 -->
        <ImagePreviewPanel
          class="output-image-panel"
          :current-image="currentImage"
          :is-expanded="showImagePanel"
          :is-generating="isGenerating"
          :expected-width="expectedOutputSize.width"
          :expected-height="expectedOutputSize.height"
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
  </div>
</template>

<style>
/* 공통 스타일 import */
@import '../styles/generation-view.css';
</style>

<style scoped>
/* ===== Inpaint 고유 스타일 ===== */

/* ===== Outpaint 확장 컨트롤 ===== */
.expand-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-primary);
  flex-wrap: wrap;
}

.expand-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.expand-icon {
  font-size: 16px;
}

.expand-inputs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.expand-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.expand-input-group label {
  font-size: 11px;
  color: var(--color-text-secondary);
  min-width: 30px;
}

.expand-input-group input {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.expand-input-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.expand-presets {
  display: flex;
  align-items: center;
  gap: 6px;
}

.preset-label {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.preset-btn {
  padding: 4px 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover:not(:disabled) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.expand-actions {
  display: flex;
  gap: 8px;
}

.expand-apply-btn {
  padding: 6px 12px;
  background: var(--color-success);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-apply-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.expand-apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.expand-reset-btn {
  padding: 6px 12px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-reset-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.expand-reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.expand-preview-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: var(--color-bg-elevated);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.preview-label {
  font-weight: 500;
}

.preview-size {
  font-family: monospace;
  color: var(--color-text-primary);
}

.expand-status.applied {
  color: var(--color-success);
  font-weight: 600;
}

/* 채우기 옵션 */
.expand-fill-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fill-label {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.fill-mode-select {
  padding: 4px 8px;
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
  font-size: 11px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
}

.fill-mode-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fill-colors {
  display: flex;
  gap: 4px;
}

.color-btn {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.color-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
