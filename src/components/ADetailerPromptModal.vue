<template>
  <Teleport to="body">
    <Transition name="ad-fade">
      <div v-if="modelValue && adetailerIndex >= 0" class="ad-prompt-overlay" @click="handleClose">
        <Transition name="ad-scale">
          <div v-if="modelValue && adetailerIndex >= 0" class="ad-prompt-modal" @click.stop>
            <div class="ad-prompt-header">
              <h3>{{ $t('adetailer.modalTitle', { label }) }}</h3>
              <button class="ad-prompt-close-btn" @click="handleClose">✕</button>
            </div>

            <div class="ad-prompt-content" v-if="adetailer">
              <div class="ad-prompt-section">
                <label>Prompt</label>
                <textarea
                  :value="adetailer.prompt"
                  @input="handlePromptInput"
                  placeholder="Positive prompt for this ADetailer (optional)"
                  rows="4"
                ></textarea>
              </div>

              <div class="ad-prompt-section">
                <label>Negative Prompt</label>
                <textarea
                  :value="adetailer.negativePrompt"
                  @input="handleNegativePromptInput"
                  placeholder="Negative prompt for this ADetailer (optional)"
                  rows="4"
                ></textarea>
              </div>

              <div class="ad-prompt-hint">
                {{ $t('adetailer.hint') }}
              </div>
            </div>

            <div class="ad-prompt-actions">
              <button class="ad-prompt-done-btn" @click="handleClose">{{ $t('common.done') }}</button>
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
  adetailerIndex: {
    type: Number,
    default: -1
  },
  adetailer: {
    type: Object,
    default: null
  },
  label: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:prompt', 'update:negativePrompt'])

function handlePromptInput(event) {
  emit('update:prompt', event.target.value)
}

function handleNegativePromptInput(event) {
  emit('update:negativePrompt', event.target.value)
}

function handleClose() {
  emit('update:modelValue', false)
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    handleClose()
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
.ad-prompt-overlay {
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

.ad-prompt-modal {
  width: 90%;
  max-width: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ad-prompt-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.ad-prompt-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.ad-prompt-close-btn {
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

.ad-prompt-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ad-prompt-content {
  padding: 20px;
}

.ad-prompt-section {
  margin-bottom: 16px;
}

.ad-prompt-section:last-of-type {
  margin-bottom: 0;
}

.ad-prompt-section label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.ad-prompt-section textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  background: #fafafa;
  transition: all 0.2s;
}

.ad-prompt-section textarea:focus {
  outline: none;
  border-color: #f59e0b;
  background: white;
}

.ad-prompt-hint {
  margin-top: 16px;
  padding: 12px;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  font-size: 13px;
  color: #92400e;
}

.ad-prompt-actions {
  flex-shrink: 0;
  display: flex;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.ad-prompt-done-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.ad-prompt-done-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* Animations */
.ad-fade-enter-active,
.ad-fade-leave-active {
  transition: opacity 0.15s ease;
}

.ad-fade-enter-from,
.ad-fade-leave-to {
  opacity: 0;
}

.ad-scale-enter-active,
.ad-scale-leave-active {
  transition: all 0.15s ease;
}

.ad-scale-enter-from,
.ad-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
