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
  }
})

const emit = defineEmits(['update:mask', 'historyChange'])

// Refs
const containerRef = ref(null)
const imageCanvasRef = ref(null)
const maskCanvasRef = ref(null)
const cursorCanvasRef = ref(null)

// State
const isDrawing = ref(false)
const lastPoint = ref(null)
const imageLoaded = ref(false)
const canvasWidth = ref(512)
const canvasHeight = ref(512)
const scale = ref(1)

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

// 이미지 로드 및 캔버스 초기화
watch(() => props.image, async (newImage) => {
  if (newImage) {
    await loadImage(newImage)
  } else {
    clearCanvas()
  }
}, { immediate: true })

async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      loadedImage.value = img
      imageLoaded.value = true

      // 캔버스 크기 설정
      canvasWidth.value = img.width
      canvasHeight.value = img.height

      nextTick(() => {
        initCanvases()
        drawImage()
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

  // 캔버스 크기 설정
  imageCanvasRef.value.width = canvasWidth.value
  imageCanvasRef.value.height = canvasHeight.value
  maskCanvasRef.value.width = canvasWidth.value
  maskCanvasRef.value.height = canvasHeight.value
  cursorCanvasRef.value.width = canvasWidth.value
  cursorCanvasRef.value.height = canvasHeight.value

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

  scale.value = Math.min(scaleX, scaleY, 1) // 최대 1배율
}

function drawImage() {
  if (!imageCtx || !loadedImage.value) return

  imageCtx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  imageCtx.drawImage(loadedImage.value, 0, 0)
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
  const x = (e.clientX - rect.left) / scale.value
  const y = (e.clientY - rect.top) / scale.value

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
}

// 리사이즈 처리
function handleResize() {
  calculateScale()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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
  emitMask
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
        width: canvasWidth * scale + 'px',
        height: canvasHeight * scale + 'px'
      }"
    >
      <!-- 이미지 레이어 (하단) -->
      <canvas
        ref="imageCanvasRef"
        class="canvas-layer image-layer"
        :style="{
          width: canvasWidth * scale + 'px',
          height: canvasHeight * scale + 'px'
        }"
      />

      <!-- 마스크 레이어 (중간) -->
      <canvas
        ref="maskCanvasRef"
        class="canvas-layer mask-layer"
        :style="{
          width: canvasWidth * scale + 'px',
          height: canvasHeight * scale + 'px'
        }"
      />

      <!-- 커서 레이어 (상단) -->
      <canvas
        ref="cursorCanvasRef"
        class="canvas-layer cursor-layer"
        :style="{
          width: canvasWidth * scale + 'px',
          height: canvasHeight * scale + 'px',
          cursor: disabled ? 'not-allowed' : 'none'
        }"
        @mousedown="startDrawing"
        @mousemove="handleMouseMove"
        @mouseup="stopDrawing"
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
