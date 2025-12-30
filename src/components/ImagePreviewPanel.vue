<template>
  <div class="preview-panel">
    <div class="panel-header">
      <h3 class="panel-title">이미지 (PNG Info)</h3>
      <button
        class="toggle-panel-btn"
        @click="$emit('toggle-panel')"
        :title="isExpanded ? '패널 숨기기' : '패널 보이기'"
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
      <img
        v-if="currentImage"
        :src="currentImage"
        alt="Generated Image"
        @click="$emit('show-preview')"
        class="preview-image"
      >
      <div v-else-if="isLoading" class="preview-placeholder loading">
        <p>⏳ Loading PNG metadata...</p>
      </div>
      <div v-else class="preview-placeholder">
        <p>이미지가 여기에 표시됩니다</p>
        <p class="drop-hint">📎 Drop PNG image here to load settings</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
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
  }
})

const emit = defineEmits(['toggle-panel', 'show-preview', 'load-png-info'])

const isDragging = ref(false)

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
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

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

.preview-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
}

.preview-main.drag-over {
  background: #e3f2fd;
  border: 2px dashed #2196F3;
}

.preview-main.loading-png {
  background: #fff3cd;
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
  color: #888;
  padding: 20px;
}

.preview-placeholder p {
  margin: 8px 0;
  font-size: 13px;
}

.drop-hint {
  font-size: 12px;
  color: #2196F3;
}

.preview-placeholder.loading {
  color: #f59e0b;
  font-weight: 500;
}
</style>
