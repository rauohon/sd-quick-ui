<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  // 원본 이미지 (base64 or URL)
  image: {
    type: String,
    default: ''
  },
  // 브러시/지우개 모드
  tool: {
    type: String,
    default: 'brush', // 'brush' | 'eraser'
    validator: (v) => ['brush', 'eraser'].includes(v)
  },
  // 브러시 크기 (px)
  brushSize: {
    type: Number,
    default: 30
  },
  // 마스크 색상 (반투명 빨간색)
  maskColor: {
    type: String,
    default: 'rgba(255, 0, 0, 0.5)'
  },
  // 읽기 전용 모드
  disabled: {
    type: Boolean,
    default: false
  },
  // 줌 레벨 (1 = 100%)
  zoom: {
    type: Number,
    default: 1
  },
  // 패닝 오프셋
  panX: {
    type: Number,
    default: 0
  },
  panY: {
    type: Number,
    default: 0
  },
  // Outpaint 확장 설정
  expandTop: {
    type: Number,
    default: 0
  },
  expandBottom: {
    type: Number,
    default: 0
  },
  expandLeft: {
    type: Number,
    default: 0
  },
  expandRight: {
    type: Number,
    default: 0
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:mask', 'historyChange', 'update:zoom', 'update:panX', 'update:panY'])

// Refs
const containerRef = ref(null)
const imageCanvasRef = ref(null)
const maskCanvasRef = ref(null)
const cursorCanvasRef = ref(null)

// State
const isDrawing = ref(false)
const lastPoint = ref(null)
const imageLoaded = ref(false)
const imageWidth = ref(512)  // 원본 이미지 크기
const imageHeight = ref(512)
const baseScale = ref(1)

// 확장된 캔버스 크기 (이미지 + 확장 영역)
const canvasWidth = computed(() => {
  if (!props.isExpanded) return imageWidth.value
  return imageWidth.value + props.expandLeft + props.expandRight
})

const canvasHeight = computed(() => {
  if (!props.isExpanded) return imageHeight.value
  return imageHeight.value + props.expandTop + props.expandBottom
})

// 원본 이미지의 캔버스 내 위치 (확장 시 오프셋)
const imageOffset = computed(() => ({
  x: props.isExpanded ? props.expandLeft : 0,
  y: props.isExpanded ? props.expandTop : 0
}))

// 패닝 상태
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const isSpacePressed = ref(false)

// 줌 범위 상수
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

// Undo/Redo 히스토리
const MAX_HISTORY = 20
const history = ref([])
const historyIndex = ref(-1)

// 이미지 로드
const loadedImage = ref(null)

// Canvas contexts
let imageCtx = null
let maskCtx = null
let cursorCtx = null

// Computed
const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// 실제 표시 스케일 = 기본 스케일 × 줌 레벨
const effectiveScale = computed(() => baseScale.value * props.zoom)

// 이미지 로드 및 캔버스 초기화
watch(() => props.image, async (newImage) => {
  if (newImage) {
    await loadImage(newImage)
  } else {
    clearCanvas()
  }
}, { immediate: true })

// 확장 상태 변경 시 캔버스 재초기화
watch(() => props.isExpanded, (newIsExpanded) => {
  if (imageLoaded.value && loadedImage.value) {
    // 기존 마스크 데이터 저장 (확장 적용 시에만)
    const oldMaskData = newIsExpanded && maskCtx
      ? maskCtx.getImageData(0, 0, maskCanvasRef.value.width, maskCanvasRef.value.height)
      : null
    const oldWidth = maskCanvasRef.value?.width || 0
    const oldHeight = maskCanvasRef.value?.height || 0

    nextTick(() => {
      initCanvases()
      drawImageWithExpansion()

      if (newIsExpanded) {
        // 확장 적용: 확장 영역 자동 마스킹 + 기존 마스크 이동
        autoMaskExpansionArea()

        // 기존 마스크를 새 위치에 복원
        if (oldMaskData && maskCtx) {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = oldWidth
          tempCanvas.height = oldHeight
          const tempCtx = tempCanvas.getContext('2d')
          tempCtx.putImageData(oldMaskData, 0, 0)

          // 기존 마스크를 새 오프셋 위치에 합성
          maskCtx.drawImage(tempCanvas, imageOffset.value.x, imageOffset.value.y)
        }
      }
      // 확장 리셋: 마스크 초기화 (clearMask가 initCanvases에서 이미 처리됨)

      saveToHistory()
      emitMask()
    })
  }
})

async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      loadedImage.value = img
      imageLoaded.value = true

      // 원본 이미지 크기 설정
      imageWidth.value = img.width
      imageHeight.value = img.height

      nextTick(() => {
        initCanvases()
        drawImageWithExpansion()
        clearMask()
        saveToHistory()
        resolve()
      })
    }
    img.onerror = () => {
      console.error('Failed to load image')
      imageLoaded.value = false
      resolve()
    }
    img.src = src
  })
}

function initCanvases() {
  if (!imageCanvasRef.value || !maskCanvasRef.value || !cursorCanvasRef.value) return

  const width = canvasWidth.value
  const height = canvasHeight.value

  // 캔버스 크기 설정
  imageCanvasRef.value.width = width
  imageCanvasRef.value.height = height
  maskCanvasRef.value.width = width
  maskCanvasRef.value.height = height
  cursorCanvasRef.value.width = width
  cursorCanvasRef.value.height = height

  // Context 가져오기
  imageCtx = imageCanvasRef.value.getContext('2d')
  maskCtx = maskCanvasRef.value.getContext('2d')
  cursorCtx = cursorCanvasRef.value.getContext('2d')

  // 스케일 계산 (컨테이너에 맞추기)
  calculateScale()
}

function calculateScale() {
  if (!containerRef.value) return

  const containerWidth = containerRef.value.clientWidth
  const containerHeight = containerRef.value.clientHeight

  const scaleX = containerWidth / canvasWidth.value
  const scaleY = containerHeight / canvasHeight.value

  baseScale.value = Math.min(scaleX, scaleY, 1) // 최대 1배율
}

// Fit to screen - 컨테이너에 맞게 줌/팬 리셋
function fitToScreen() {
  emit('update:zoom', 1)
  emit('update:panX', 0)
  emit('update:panY', 0)
}

// 100% view - 실제 크기로 보기
function resetZoom() {
  if (!containerRef.value) return

  const containerWidth = containerRef.value.clientWidth
  const containerHeight = containerRef.value.clientHeight
  const scaleX = containerWidth / canvasWidth.value
  const scaleY = containerHeight / canvasHeight.value
  const fitScale = Math.min(scaleX, scaleY, 1)

  // fitScale이 baseScale이므로, zoom = 1/fitScale이면 100%
  const targetZoom = Math.min(Math.max(1 / fitScale, MIN_ZOOM), MAX_ZOOM)
  emit('update:zoom', targetZoom)
  emit('update:panX', 0)
  emit('update:panY', 0)
}

// 체크무늬 패턴 생성 (확장 영역 시각화용)
function createCheckerPattern() {
  const patternCanvas = document.createElement('canvas')
  const patternSize = 16
  patternCanvas.width = patternSize * 2
  patternCanvas.height = patternSize * 2

  const patternCtx = patternCanvas.getContext('2d')

  // 밝은 회색 배경
  patternCtx.fillStyle = '#e0e0e0'
  patternCtx.fillRect(0, 0, patternSize * 2, patternSize * 2)

  // 어두운 회색 체크
  patternCtx.fillStyle = '#c0c0c0'
  patternCtx.fillRect(0, 0, patternSize, patternSize)
  patternCtx.fillRect(patternSize, patternSize, patternSize, patternSize)

  return patternCanvas
}

// 이미지 그리기 (확장 영역 포함)
function drawImageWithExpansion() {
  if (!imageCtx || !loadedImage.value) return

  const width = canvasWidth.value
  const height = canvasHeight.value

  imageCtx.clearRect(0, 0, width, height)

  // 확장 모드일 때 체크무늬 배경 그리기
  if (props.isExpanded) {
    const checkerPattern = createCheckerPattern()
    const pattern = imageCtx.createPattern(checkerPattern, 'repeat')
    imageCtx.fillStyle = pattern
    imageCtx.fillRect(0, 0, width, height)

    // 확장 영역 경계선 표시
    imageCtx.strokeStyle = 'rgba(100, 100, 255, 0.8)'
    imageCtx.lineWidth = 2
    imageCtx.setLineDash([8, 4])
    imageCtx.strokeRect(
      imageOffset.value.x,
      imageOffset.value.y,
      imageWidth.value,
      imageHeight.value
    )
    imageCtx.setLineDash([])
  }

  // 원본 이미지를 올바른 위치에 그리기
  imageCtx.drawImage(
    loadedImage.value,
    imageOffset.value.x,
    imageOffset.value.y
  )
}

// 레거시 호환용
function drawImage() {
  drawImageWithExpansion()
}

// 확장 영역 자동 마스킹
function autoMaskExpansionArea() {
  if (!maskCtx || !props.isExpanded) return

  const width = canvasWidth.value
  const height = canvasHeight.value
  const offsetX = imageOffset.value.x
  const offsetY = imageOffset.value.y

  maskCtx.fillStyle = props.maskColor

  // 상단 확장 영역
  if (props.expandTop > 0) {
    maskCtx.fillRect(0, 0, width, offsetY)
  }

  // 하단 확장 영역
  if (props.expandBottom > 0) {
    maskCtx.fillRect(0, offsetY + imageHeight.value, width, props.expandBottom)
  }

  // 좌측 확장 영역
  if (props.expandLeft > 0) {
    maskCtx.fillRect(0, offsetY, offsetX, imageHeight.value)
  }

  // 우측 확장 영역
  if (props.expandRight > 0) {
    maskCtx.fillRect(offsetX + imageWidth.value, offsetY, props.expandRight, imageHeight.value)
  }
}

function clearCanvas() {
  imageLoaded.value = false
  loadedImage.value = null
  history.value = []
  historyIndex.value = -1

  if (imageCtx) {
    imageCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  }
  if (maskCtx) {
    maskCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  }
}

// 마스크 그리기 관련
function getCanvasPoint(e) {
  if (!maskCanvasRef.value) return null

  const rect = maskCanvasRef.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / effectiveScale.value
  const y = (e.clientY - rect.top) / effectiveScale.value

  return { x, y }
}

function startDrawing(e) {
  if (props.disabled || !imageLoaded.value) return

  isDrawing.value = true
  lastPoint.value = getCanvasPoint(e)

  // 점 하나 찍기
  if (lastPoint.value) {
    drawPoint(lastPoint.value)
  }
}

function draw(e) {
  if (!isDrawing.value || props.disabled) return

  const point = getCanvasPoint(e)
  if (!point || !lastPoint.value) return

  drawLine(lastPoint.value, point)
  lastPoint.value = point

  // 커서 업데이트
  updateCursor(point)
}

function stopDrawing() {
  if (isDrawing.value) {
    isDrawing.value = false
    lastPoint.value = null
    saveToHistory()
    emitMask()
  }
}

function drawPoint(point) {
  if (!maskCtx) return

  maskCtx.globalCompositeOperation = props.tool === 'eraser' ? 'destination-out' : 'source-over'
  maskCtx.fillStyle = props.maskColor
  maskCtx.beginPath()
  maskCtx.arc(point.x, point.y, props.brushSize / 2, 0, Math.PI * 2)
  maskCtx.fill()
}

function drawLine(from, to) {
  if (!maskCtx) return

  maskCtx.globalCompositeOperation = props.tool === 'eraser' ? 'destination-out' : 'source-over'
  maskCtx.strokeStyle = props.maskColor
  maskCtx.lineWidth = props.brushSize
  maskCtx.lineCap = 'round'
  maskCtx.lineJoin = 'round'

  maskCtx.beginPath()
  maskCtx.moveTo(from.x, from.y)
  maskCtx.lineTo(to.x, to.y)
  maskCtx.stroke()
}

// 커서 표시
function updateCursor(point) {
  if (!cursorCtx || !point) return

  cursorCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  // 브러시 크기 원 그리기
  cursorCtx.strokeStyle = props.tool === 'eraser' ? '#ffffff' : '#ff0000'
  cursorCtx.lineWidth = 2
  cursorCtx.setLineDash([5, 5])
  cursorCtx.beginPath()
  cursorCtx.arc(point.x, point.y, props.brushSize / 2, 0, Math.PI * 2)
  cursorCtx.stroke()
  cursorCtx.setLineDash([])
}

function handleMouseMove(e) {
  const point = getCanvasPoint(e)
  updateCursor(point)

  if (isDrawing.value) {
    draw(e)
  }
}

function handleMouseLeave() {
  if (cursorCtx) {
    cursorCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  }
  if (isDrawing.value) {
    stopDrawing()
  }
  if (isPanning.value) {
    isPanning.value = false
  }
}

// 마우스 휠로 줌
function handleWheel(e) {
  if (props.disabled || !imageLoaded.value) return

  e.preventDefault()

  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.min(Math.max(props.zoom + delta, MIN_ZOOM), MAX_ZOOM)

  emit('update:zoom', newZoom)
}

// 패닝 시작 (스페이스바 + 마우스 드래그)
function startPanning(e) {
  if (!isSpacePressed.value) return

  isPanning.value = true
  panStart.value = { x: e.clientX - props.panX, y: e.clientY - props.panY }
}

// 패닝 중
function doPanning(e) {
  if (!isPanning.value) return

  const newPanX = e.clientX - panStart.value.x
  const newPanY = e.clientY - panStart.value.y

  emit('update:panX', newPanX)
  emit('update:panY', newPanY)
}

// 패닝 종료
function stopPanning() {
  isPanning.value = false
}

// 마우스 다운 핸들러 (통합)
function handleMouseDown(e) {
  if (isSpacePressed.value) {
    startPanning(e)
  } else {
    startDrawing(e)
  }
}

// 마우스 업 핸들러 (통합)
function handleMouseUp() {
  if (isPanning.value) {
    stopPanning()
  } else {
    stopDrawing()
  }
}

// 마우스 이동 핸들러 (통합)
function handleMouseMoveUnified(e) {
  if (isPanning.value) {
    doPanning(e)
  } else {
    handleMouseMove(e)
  }
}

// 마스크 편집 기능
function clearMask() {
  if (!maskCtx) return

  maskCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  saveToHistory()
  emitMask()
}

function fillMask() {
  if (!maskCtx) return

  maskCtx.fillStyle = props.maskColor
  maskCtx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  saveToHistory()
  emitMask()
}

function invertMask() {
  if (!maskCtx) return

  // 현재 마스크 데이터 가져오기
  const imageData = maskCtx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
  const data = imageData.data

  // 알파 채널 반전 (마스크된 영역 <-> 마스크되지 않은 영역)
  for (let i = 3; i < data.length; i += 4) {
    data[i] = data[i] > 0 ? 0 : 128 // 반투명 마스크
  }

  // 반전된 데이터를 마스크 색상으로 변환
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = 255     // R
      data[i + 1] = 0   // G
      data[i + 2] = 0   // B
    }
  }

  maskCtx.putImageData(imageData, 0, 0)
  saveToHistory()
  emitMask()
}

// Undo/Redo
function saveToHistory() {
  if (!maskCtx) return

  // 현재 인덱스 이후의 히스토리 삭제
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  // 현재 마스크 상태 저장
  const imageData = maskCtx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
  history.value.push(imageData)

  // 최대 히스토리 제한
  if (history.value.length > MAX_HISTORY) {
    history.value.shift()
  } else {
    historyIndex.value++
  }

  emit('historyChange', { canUndo: canUndo.value, canRedo: canRedo.value })
}

function undo() {
  if (!canUndo.value || !maskCtx) return

  historyIndex.value--
  const imageData = history.value[historyIndex.value]
  maskCtx.putImageData(imageData, 0, 0)
  emitMask()
  emit('historyChange', { canUndo: canUndo.value, canRedo: canRedo.value })
}

function redo() {
  if (!canRedo.value || !maskCtx) return

  historyIndex.value++
  const imageData = history.value[historyIndex.value]
  maskCtx.putImageData(imageData, 0, 0)
  emitMask()
  emit('historyChange', { canUndo: canUndo.value, canRedo: canRedo.value })
}

// 마스크를 Base64로 내보내기 (흑백 이미지)
function emitMask() {
  if (!maskCtx) return

  // 임시 캔버스에 흑백 마스크 생성
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvasWidth.value
  tempCanvas.height = canvasHeight.value
  const tempCtx = tempCanvas.getContext('2d')

  // 배경을 검은색으로
  tempCtx.fillStyle = '#000000'
  tempCtx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)

  // 마스크 영역을 흰색으로
  const maskData = maskCtx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
  const tempData = tempCtx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)

  for (let i = 0; i < maskData.data.length; i += 4) {
    if (maskData.data[i + 3] > 0) {
      tempData.data[i] = 255     // R
      tempData.data[i + 1] = 255 // G
      tempData.data[i + 2] = 255 // B
      tempData.data[i + 3] = 255 // A
    }
  }

  tempCtx.putImageData(tempData, 0, 0)

  // Base64로 변환
  const base64 = tempCanvas.toDataURL('image/png')
  emit('update:mask', base64)
}

// 마스크가 비어있는지 확인
function isMaskEmpty() {
  if (!maskCtx) return true

  const imageData = maskCtx.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
  const data = imageData.data

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return false
  }

  return true
}

// 키보드 단축키
function handleKeyDown(e) {
  if (props.disabled) return

  // Ctrl+Z: Undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
  // Ctrl+Y or Ctrl+Shift+Z: Redo
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
  }
  // Spacebar: 패닝 모드
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault()
    isSpacePressed.value = true
  }
}

function handleKeyUp(e) {
  if (e.code === 'Space') {
    isSpacePressed.value = false
    if (isPanning.value) {
      stopPanning()
    }
  }
}

// 리사이즈 처리
function handleResize() {
  calculateScale()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', handleResize)
})

// Expose methods for parent component
defineExpose({
  clearMask,
  fillMask,
  invertMask,
  undo,
  redo,
  canUndo,
  canRedo,
  isMaskEmpty,
  emitMask,
  fitToScreen,
  resetZoom
})
</script>

<template>
  <div
    ref="containerRef"
    class="mask-canvas-container"
    :class="{ disabled: disabled, 'no-image': !imageLoaded }"
  >
    <!-- 이미지 없을 때 플레이스홀더 -->
    <div v-if="!imageLoaded" class="placeholder">
      <span class="placeholder-icon">🖼️</span>
      <p>{{ t('inpaint.uploadImageFirst') }}</p>
    </div>

    <!-- 캔버스 레이어 -->
    <div
      v-else
      class="canvas-wrapper"
      :style="{
        width: canvasWidth * effectiveScale + 'px',
        height: canvasHeight * effectiveScale + 'px',
        transform: `translate(${panX}px, ${panY}px)`
      }"
      @wheel.prevent="handleWheel"
    >
      <!-- 이미지 레이어 (하단) -->
      <canvas
        ref="imageCanvasRef"
        class="canvas-layer image-layer"
        :style="{
          width: canvasWidth * effectiveScale + 'px',
          height: canvasHeight * effectiveScale + 'px'
        }"
      />

      <!-- 마스크 레이어 (중간) -->
      <canvas
        ref="maskCanvasRef"
        class="canvas-layer mask-layer"
        :style="{
          width: canvasWidth * effectiveScale + 'px',
          height: canvasHeight * effectiveScale + 'px'
        }"
      />

      <!-- 커서 레이어 (상단) -->
      <canvas
        ref="cursorCanvasRef"
        class="canvas-layer cursor-layer"
        :class="{ 'panning-mode': isSpacePressed }"
        :style="{
          width: canvasWidth * effectiveScale + 'px',
          height: canvasHeight * effectiveScale + 'px',
          cursor: disabled ? 'not-allowed' : (isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'none')
        }"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMoveUnified"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
      />
    </div>

    <!-- 이미지 크기 정보 -->
    <div v-if="imageLoaded" class="canvas-info">
      {{ canvasWidth }} x {{ canvasHeight }}
    </div>
  </div>
</template>

<style scoped>
.mask-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
}

.mask-canvas-container.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.mask-canvas-container.no-image {
  border: 2px dashed var(--color-border);
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-secondary);
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

.placeholder p {
  margin: 0;
  font-size: 14px;
}

.canvas-wrapper {
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
}

.image-layer {
  z-index: 1;
}

.mask-layer {
  z-index: 2;
}

.cursor-layer {
  z-index: 3;
}

.canvas-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
}
</style>
