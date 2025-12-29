<template>
  <Teleport to="body">
    <Transition name="png-fade">
      <div v-if="modelValue" class="png-preview-overlay" @click="handleCancel">
        <Transition name="png-scale">
          <div v-if="modelValue" class="png-preview-modal" @click.stop>
            <div class="png-preview-header">
              <h3>📋 PNG Metadata Preview</h3>
              <button class="png-close-btn" @click="handleCancel">✕</button>
            </div>

            <div class="png-preview-content" v-if="pngInfo">
              <div class="png-section">
                <h4>Prompt</h4>
                <div class="png-text-preview">{{ pngInfo.prompt || '(empty)' }}</div>
              </div>

              <div class="png-section">
                <h4>Negative Prompt</h4>
                <div class="png-text-preview">{{ pngInfo.negativePrompt || '(empty)' }}</div>
              </div>

              <div class="png-section">
                <h4>Parameters</h4>
                <div class="png-params-grid">
                  <div class="png-param-item">
                    <span class="png-param-label">Steps:</span>
                    <span class="png-param-value">{{ pngInfo.steps }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">CFG Scale:</span>
                    <span class="png-param-value">{{ pngInfo.cfgScale }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">Sampler:</span>
                    <span class="png-param-value">{{ pngInfo.samplerName }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">Scheduler:</span>
                    <span class="png-param-value">{{ pngInfo.scheduler }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">Size:</span>
                    <span class="png-param-value">{{ pngInfo.width }}x{{ pngInfo.height }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">Seed:</span>
                    <span class="png-param-value">{{ pngInfo.seed }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">Hires upscale:</span>
                    <span class="png-param-value">{{ pngInfo.hrUpscale }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">Hires upscaler:</span>
                    <span class="png-param-value">{{ pngInfo.hrUpscaler }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">Hires steps:</span>
                    <span class="png-param-value">{{ pngInfo.hrSteps }}</span>
                  </div>
                  <div class="png-param-item">
                    <span class="png-param-label">Denoising:</span>
                    <span class="png-param-value">{{ pngInfo.denoisingStrength }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="png-preview-actions">
              <button class="png-cancel-btn" @click="handleCancel">취소</button>
              <button class="png-apply-btn" @click="handleApply">적용</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  pngInfo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'apply', 'cancel'])

function handleApply() {
  emit('apply')
  emit('update:modelValue', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 'Enter') {
    handleApply()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.png-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.png-preview-modal {
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.png-preview-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.png-preview-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.png-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.png-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.png-preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.png-section {
  margin-bottom: 20px;
}

.png-section:last-child {
  margin-bottom: 0;
}

.png-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.png-text-preview {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  max-height: 150px;
  overflow-y: auto;
}

.png-params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.png-param-item {
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.png-param-label {
  color: #666;
  font-weight: 500;
}

.png-param-value {
  color: #333;
  font-weight: 600;
}

.png-preview-actions {
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.png-cancel-btn,
.png-apply-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.png-cancel-btn {
  background: #e0e0e0;
  color: #666;
}

.png-cancel-btn:hover {
  background: #d0d0d0;
}

.png-apply-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.png-apply-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Animations */
.png-fade-enter-active,
.png-fade-leave-active {
  transition: opacity 0.15s ease;
}

.png-fade-enter-from,
.png-fade-leave-to {
  opacity: 0;
}

.png-scale-enter-active,
.png-scale-leave-active {
  transition: all 0.15s ease;
}

.png-scale-enter-from,
.png-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
