<template>
  <Teleport to="body">
    <Transition name="lora-meta-fade">
      <div v-if="modelValue && lora" class="lora-meta-overlay" @click="handleClose">
        <Transition name="lora-meta-scale">
          <div v-if="modelValue && lora" class="lora-meta-modal" @click.stop>
            <div class="lora-meta-header">
              <h3>{{ t('lora.editMetadata') }}</h3>
              <button class="lora-meta-close-btn" @click="handleClose">✕</button>
            </div>

            <div class="lora-meta-content">
              <div class="lora-name-display">
                <span class="lora-name-label">LoRA:</span>
                <span class="lora-name-value">{{ lora.name }}</span>
              </div>

              <div class="lora-meta-section">
                <label>{{ t('lora.customAlias') }}</label>
                <input
                  type="text"
                  v-model="customAlias"
                  :placeholder="lora.alias || lora.name"
                  class="lora-meta-input"
                />
                <div class="lora-meta-hint">
                  {{ t('lora.customAliasHint') }}
                </div>
              </div>

              <div class="lora-meta-section">
                <label>{{ t('lora.customThumbnail') }}</label>
                <input
                  type="text"
                  v-model="customThumbnailUrl"
                  :placeholder="t('lora.customThumbnailPlaceholder')"
                  class="lora-meta-input"
                />
                <div class="lora-meta-hint">
                  {{ t('lora.customThumbnailHint') }}
                </div>
              </div>

              <div class="lora-meta-section">
                <label>{{ t('lora.triggerWords') }}</label>
                <input
                  type="text"
                  v-model="triggerWordsInput"
                  :placeholder="t('lora.triggerWordsPlaceholder')"
                  class="lora-meta-input"
                />
                <div class="lora-meta-hint">
                  {{ t('lora.triggerWordsHint') }}
                </div>
              </div>

              <div class="lora-meta-section">
                <label>{{ t('lora.memo') }}</label>
                <textarea
                  v-model="memo"
                  :placeholder="t('lora.memoPlaceholder')"
                  rows="3"
                  class="lora-meta-textarea"
                ></textarea>
              </div>

              <div class="lora-meta-section">
                <label>{{ t('lora.defaultWeight') }}: {{ customWeight.toFixed(2) }}</label>
                <input
                  type="range"
                  v-model.number="customWeight"
                  min="-2"
                  max="2"
                  step="0.05"
                  class="lora-meta-slider"
                />
                <div class="weight-presets">
                  <button @click="customWeight = 0.5" class="preset-btn">0.5</button>
                  <button @click="customWeight = 0.75" class="preset-btn">0.75</button>
                  <button @click="customWeight = 1.0" class="preset-btn">1.0</button>
                  <button @click="customWeight = 1.25" class="preset-btn">1.25</button>
                </div>
              </div>
            </div>

            <div class="lora-meta-actions">
              <button
                v-if="hasExistingMetadata"
                class="lora-meta-delete-btn"
                @click="handleDelete"
              >
                {{ t('common.delete') }}
              </button>
              <div class="lora-meta-actions-right">
                <button class="lora-meta-cancel-btn" @click="handleClose">
                  {{ t('common.cancel') }}
                </button>
                <button class="lora-meta-save-btn" @click="handleSave">
                  {{ t('common.save') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLoraCustomMetadata } from '../composables/useLoraCustomMetadata'

const { t } = useI18n()
const { getCustomMetadata, saveCustomMetadata, deleteCustomMetadata, hasCustomMetadata } = useLoraCustomMetadata()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  lora: {
    type: Object,
    default: null
  },
  showToast: {
    type: Function,
    default: null
  },
  showConfirm: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

// Form state
const customAlias = ref('')
const customThumbnailUrl = ref('')
const triggerWordsInput = ref('')
const memo = ref('')
const customWeight = ref(1.0)

// Check if there's existing metadata
const hasExistingMetadata = computed(() => {
  if (!props.lora) return false
  return hasCustomMetadata(props.lora.name)
})

// Load existing metadata when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.lora) {
    const existing = getCustomMetadata(props.lora.name)
    if (existing) {
      customAlias.value = existing.customAlias || ''
      customThumbnailUrl.value = existing.customThumbnailUrl || ''
      triggerWordsInput.value = existing.triggerWords?.join(', ') || ''
      memo.value = existing.memo || ''
      customWeight.value = existing.customWeight ?? 1.0
    } else {
      customAlias.value = ''
      customThumbnailUrl.value = ''
      triggerWordsInput.value = ''
      memo.value = ''
      customWeight.value = 1.0
    }
  }
})

function handleClose() {
  emit('update:modelValue', false)
}

function handleSave() {
  if (!props.lora) return

  // Parse trigger words from comma-separated input
  const triggerWords = triggerWordsInput.value
    .split(',')
    .map(w => w.trim())
    .filter(w => w.length > 0)

  const data = {
    customAlias: customAlias.value.trim() || null,
    customThumbnailUrl: customThumbnailUrl.value.trim() || null,
    triggerWords: triggerWords.length > 0 ? triggerWords : null,
    memo: memo.value.trim() || null,
    customWeight: customWeight.value
  }

  // Remove null values to keep storage clean
  Object.keys(data).forEach(key => {
    if (data[key] === null) delete data[key]
  })

  // If all values are default/empty, delete the entry instead
  if (Object.keys(data).length === 0 || (Object.keys(data).length === 1 && data.customWeight === 1.0)) {
    deleteCustomMetadata(props.lora.name)
  } else {
    saveCustomMetadata(props.lora.name, data)
  }

  props.showToast?.(t('lora.metadataSaved'), 'success')
  emit('saved', props.lora.name)
  handleClose()
}

async function handleDelete() {
  if (!props.lora) return

  // Use confirm dialog if available
  if (props.showConfirm) {
    const confirmed = await props.showConfirm(t('lora.metadataDeleteConfirm'))
    if (!confirmed) return
  }

  deleteCustomMetadata(props.lora.name)
  props.showToast?.(t('lora.metadataDeleted'), 'success')
  emit('deleted', props.lora.name)
  handleClose()
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
.lora-meta-overlay {
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

.lora-meta-modal {
  width: 90%;
  max-width: 500px;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lora-meta-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.lora-meta-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.lora-meta-close-btn {
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

.lora-meta-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lora-meta-content {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.lora-name-display {
  margin-bottom: 20px;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  font-size: 14px;
}

.lora-name-label {
  color: var(--color-text-secondary);
  margin-right: 8px;
}

.lora-name-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.lora-meta-section {
  margin-bottom: 20px;
}

.lora-meta-section:last-child {
  margin-bottom: 0;
}

.lora-meta-section label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.lora-meta-input,
.lora-meta-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  transition: border-color 0.2s;
}

.lora-meta-input:focus,
.lora-meta-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.lora-meta-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

.lora-meta-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.lora-meta-slider {
  width: 100%;
  height: 6px;
  margin-bottom: 10px;
  cursor: pointer;
}

.weight-presets {
  display: flex;
  gap: 8px;
}

.preset-btn {
  flex: 1;
  height: 32px;
  border: 2px solid #667eea;
  background: var(--color-bg-elevated);
  color: #667eea;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #667eea;
  color: white;
}

.lora-meta-actions {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border-primary);
}

.lora-meta-actions-right {
  display: flex;
  gap: 10px;
}

.lora-meta-delete-btn {
  height: 40px;
  padding: 0 16px;
  border: 2px solid #ef4444;
  background: transparent;
  color: #ef4444;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.lora-meta-delete-btn:hover {
  background: #ef4444;
  color: white;
}

.lora-meta-cancel-btn {
  height: 40px;
  padding: 0 20px;
  border: 2px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.lora-meta-cancel-btn:hover {
  border-color: var(--color-text-secondary);
  color: var(--color-text-primary);
}

.lora-meta-save-btn {
  height: 40px;
  padding: 0 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.lora-meta-save-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Animations */
.lora-meta-fade-enter-active,
.lora-meta-fade-leave-active {
  transition: opacity 0.15s ease;
}

.lora-meta-fade-enter-from,
.lora-meta-fade-leave-to {
  opacity: 0;
}

.lora-meta-scale-enter-active,
.lora-meta-scale-leave-active {
  transition: all 0.15s ease;
}

.lora-meta-scale-enter-from,
.lora-meta-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
