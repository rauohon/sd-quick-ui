<template>
  <div class="preview-panel">
    <div class="panel-header">
      <h3 class="panel-title">{{ $t('imagePreview.title') }}</h3>
      <button
        class="toggle-panel-btn"
        @click="$emit('toggle-panel')"
        :title="isExpanded ? $t('history.hidePanel') : $t('history.showPanel')"
      >
        {{ isExpanded ? '▲' : '▼' }}
      </button>
    </div>
    <div
      v-if="isExpanded"
      class="preview-main"
      :class="{ 'drag-over': isDragging, 'loading-png': isLoading }"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <!-- 이미지 사이즈 표시 -->
      <div v-if="displaySize" class="image-size-info" :class="{ 'expected': displaySize.isExpected }">
        {{ displaySize.width }} × {{ displaySize.height }}
        <span v-if="displaySize.isExpected" class="expected-label">⏳</span>
      </div>
      <img
        v-if="currentImage"
        ref="imageRef"
        :src="currentImage"
        alt="Generated Image"
        @click="$emit('show-preview')"
        @load="handleImageLoad"
        class="preview-image"
      >
      <div v-else-if="isLoading" class="preview-placeholder loading">
        <p>⏳ Loading PNG metadata...</p>
      </div>
      <div v-else class="preview-placeholder">
        <p>{{ $t('imagePreview.noImagePlaceholder') }}</p>
        <p class="drop-hint">📎 Drop PNG image here to load settings</p>
      </div>
    </div>

    <!-- 사용된 프롬프트 표시 -->
    <div v-if="isExpanded && usedPrompt" class="used-prompt-section">
      <div class="used-prompt-header">{{ $t('imagePreview.usedPrompt') }}</div>
      <div class="used-prompt-text">{{ usedPrompt }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  currentImage: {
    type: String,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isExpanded: {
    type: Boolean,
    default: true
  },
  usedPrompt: {
    type: String,
    default: ''
  },
  // 생성 중 예상 크기 표시용
  isGenerating: {
    type: Boolean,
    default: false
  },
  expectedWidth: {
    type: Number,
    default: 0
  },
  expectedHeight: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['toggle-panel', 'show-preview', 'load-png-info'])

const isDragging = ref(false)
const imageRef = ref(null)
const imageSize = ref(null)

// 표시할 크기: 생성 중이면 예상 크기, 아니면 실제 이미지 크기
const displaySize = computed(() => {
  // 생성 중이고 예상 크기가 있으면 예상 크기 표시
  if (props.isGenerating && props.expectedWidth > 0 && props.expectedHeight > 0) {
    return {
      width: props.expectedWidth,
      height: props.expectedHeight,
      isExpected: true
    }
  }
  // 아니면 실제 이미지 크기
  if (imageSize.value) {
    return {
      width: imageSize.value.width,
      height: imageSize.value.height,
      isExpected: false
    }
  }
  return null
})

// 이미지 로드 완료 시 사이즈 저장
function handleImageLoad(e) {
  const img = e.target
  imageSize.value = {
    width: img.naturalWidth,
    height: img.naturalHeight
  }
}

// 이미지 변경 시 사이즈 초기화
watch(() => props.currentImage, () => {
  imageSize.value = null
})

function handleDragEnter(e) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e) {
  e.preventDefault()
  isDragging.value = false
}

function handleDragOver(e) {
  e.preventDefault()
}

async function handleDrop(e) {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (!file.type.startsWith('image/')) {
    emit('load-png-info', null, 'Please drop an image file')
    return
  }

  emit('load-png-info', file)
}
</script>

<style scoped>
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid #e0e0e0;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.toggle-panel-btn {
  padding: 4px 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
  color: var(--color-text-secondary);
}

.toggle-panel-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-hover);
}

.preview-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
}

.image-size-info {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  z-index: 10;
  pointer-events: none;
}

.image-size-info.expected {
  background: rgba(59, 130, 246, 0.85);
}

.expected-label {
  margin-left: 4px;
}

.preview-main.drag-over {
  background: var(--color-primary-light);
  border: 2px dashed var(--color-primary);
}

.preview-main.loading-png {
  background: var(--color-bg-elevated);
}

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

.preview-placeholder {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: 20px;
}

.preview-placeholder p {
  margin: 8px 0;
  font-size: 13px;
}

.drop-hint {
  font-size: 12px;
  color: var(--color-primary);
}

.preview-placeholder.loading {
  color: var(--color-warning);
  font-weight: 500;
}

.used-prompt-section {
  flex-shrink: 0;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-primary);
  max-height: 80px;
  overflow-y: auto;
}

.used-prompt-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.used-prompt-text {
  font-size: 12px;
  color: var(--color-text-primary);
  line-height: 1.4;
  word-break: break-word;
}
</style>
