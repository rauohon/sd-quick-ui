<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_IMAGE_FORMATS } from '../config/constants'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  imageWidth: {
    type: Number,
    default: 0
  },
  imageHeight: {
    type: Number,
    default: 0
  },
  isGenerating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:imageWidth', 'update:imageHeight', 'openHistorySelector'])

// Drag state
const isDragging = ref(false)
const fileInput = ref(null)

// Computed
const hasImage = computed(() => !!props.modelValue)

const imageSizeText = computed(() => {
  if (props.imageWidth && props.imageHeight) {
    return t('img2img.imageSize', { width: props.imageWidth, height: props.imageHeight })
  }
  return ''
})

// Methods
function openFileDialog() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    processFile(file)
  }
  // Reset input for re-selecting same file
  event.target.value = ''
}

function handleDrop(event) {
  event.preventDefault()
  event.stopPropagation() // Prevent global PNG info handler
  isDragging.value = false

  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}

function handleDragOver(event) {
  event.preventDefault()
  event.stopPropagation() // Prevent global drag handler
  isDragging.value = true
}

function handleDragLeave(event) {
  event.preventDefault()
  event.stopPropagation() // Prevent global drag handler
  isDragging.value = false
}

async function processFile(file) {
  // Check format
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    console.warn('Unsupported format:', file.type)
    return
  }

  try {
    const base64 = await fileToBase64(file)
    const dimensions = await getImageDimensions(base64)

    emit('update:modelValue', base64)
    emit('update:imageWidth', dimensions.width)
    emit('update:imageHeight', dimensions.height)
  } catch (error) {
    console.error('Failed to process image:', error)
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = base64
  })
}

function removeImage() {
  emit('update:modelValue', null)
  emit('update:imageWidth', 0)
  emit('update:imageHeight', 0)
}

function openHistorySelector() {
  emit('openHistorySelector')
}

// Expose for external image loading (from history)
function loadImageFromUrl(imageUrl) {
  const img = new Image()
  img.onload = () => {
    emit('update:modelValue', imageUrl)
    emit('update:imageWidth', img.width)
    emit('update:imageHeight', img.height)
  }
  img.src = imageUrl
}

defineExpose({ loadImageFromUrl })
</script>

<template>
  <div class="image-upload-panel">
    <div class="panel-header">
      <span class="panel-title">{{ t('img2img.inputImage') }}</span>
      <span v-if="imageSizeText" class="image-size">{{ imageSizeText }}</span>
    </div>

    <div
      class="upload-area"
      :class="{
        'has-image': hasImage,
        'dragging': isDragging,
        'disabled': isGenerating
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <!-- Image Preview -->
      <template v-if="hasImage">
        <img :src="modelValue" class="preview-image" alt="Input image" />
        <button
          v-if="!isGenerating"
          class="remove-btn"
          @click="removeImage"
          :title="t('img2img.removeImage')"
        >
          ✕
        </button>
      </template>

      <!-- Upload Placeholder -->
      <template v-else>
        <div class="upload-placeholder">
          <span class="upload-icon">🖼️</span>
          <span class="upload-text">{{ t('img2img.dropImageHere') }}</span>
          <span class="upload-hint">{{ t('img2img.dragDropHint') }}</span>
        </div>
      </template>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button
        class="action-btn file-btn"
        @click="openFileDialog"
        :disabled="isGenerating"
      >
        {{ t('img2img.selectFile') }}
      </button>
      <button
        class="action-btn history-btn"
        @click="openHistorySelector"
        :disabled="isGenerating"
      >
        {{ t('img2img.selectFromHistory') }}
      </button>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<style scoped>
.image-upload-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.image-size {
  font-size: 11px;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
}

.upload-area {
  position: relative;
  min-height: 150px;
  border: 2px dashed var(--color-border-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  overflow: hidden;
  background: var(--color-bg-tertiary);
}

.upload-area.dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.upload-area.has-image {
  border-style: solid;
  border-color: var(--color-border-primary);
}

.upload-area.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 100, 100, 0.9);
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(255, 70, 70, 1);
  transform: scale(1.1);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.upload-icon {
  font-size: 32px;
  opacity: 0.5;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  opacity: 0.7;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-btn {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.file-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.history-btn {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.history-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}
</style>
