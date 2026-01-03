<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ $t('history.detailsTitle') }}</h3>
        <div class="header-actions">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('history.searchPlaceholder')"
            class="search-input"
          />
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <!-- Left: Image Preview -->
        <div class="image-section">
          <div class="image-wrapper">
            <img :src="currentItem.image" :alt="'Image ' + currentIndex" />
          </div>
          <div class="image-navigation">
            <button
              @click="navigatePrevious"
              :disabled="currentIndex === 0"
              class="nav-btn"
            >
              ◀ {{ $t('history.previous') }}
            </button>
            <span class="image-counter">{{ currentIndex + 1 }} / {{ filteredItems.length }}</span>
            <button
              @click="navigateNext"
              :disabled="currentIndex === filteredItems.length - 1"
              class="nav-btn"
            >
              {{ $t('history.next') }} ▶
            </button>
          </div>
        </div>

        <!-- Right: Actions & Info -->
        <div class="info-section">
          <div class="action-buttons">
            <button
              @click="toggleFavorite"
              :class="['action-btn', { favorite: currentItem.favorite }]"
              :title="currentItem.favorite ? $t('history.removeFavorite') : $t('history.addFavorite')"
            >
              {{ currentItem.favorite ? '⭐ ' + $t('history.removeFavorite') : '☆ ' + $t('history.addFavorite') }}
            </button>
            <button @click="loadParams" class="action-btn" :title="$t('history.loadParams')">
              🔄 {{ $t('history.loadParams') }}
            </button>
            <button @click="downloadImage" class="action-btn" :title="$t('history.download')">
              💾 {{ $t('history.download') }}
            </button>
            <button @click="startCompare" class="action-btn" :title="$t('history.compare')">
              🔍 {{ $t('history.compare') }}
            </button>
            <button @click="deleteImage" class="action-btn delete" :title="$t('common.delete')">
              🗑️ {{ $t('common.delete') }}
            </button>
          </div>

          <div class="image-info">
            <div class="info-item">
              <strong>{{ $t('history.generatedAt') }}:</strong> {{ formatFullTimestamp(currentItem.timestamp) }}
              <span v-if="currentItem.duration" class="duration">({{ formatDuration(currentItem.duration) }})</span>
            </div>
            <div v-if="currentItem.interrupted" class="info-item warning">
              <strong>{{ $t('history.status') }}:</strong> ⚠️ {{ $t('history.interrupted') }}
            </div>
            <div v-if="currentItem.params" class="params-section">
              <strong>{{ $t('history.parameters') }}:</strong>
              <div class="params-content">
                <div v-if="currentItem.params.prompt" class="param-item">
                  <span class="param-label">Prompt:</span>
                  <span class="param-value">{{ currentItem.params.prompt }}</span>
                </div>
                <div v-if="currentItem.params.negative_prompt" class="param-item">
                  <span class="param-label">Negative:</span>
                  <span class="param-value">{{ currentItem.params.negative_prompt }}</span>
                </div>
                <div class="param-grid">
                  <div v-if="currentItem.params.width" class="param-item-small">
                    <span class="param-label">Size:</span>
                    <span class="param-value">{{ currentItem.params.width }}×{{ currentItem.params.height }}</span>
                  </div>
                  <div v-if="currentItem.params.steps" class="param-item-small">
                    <span class="param-label">Steps:</span>
                    <span class="param-value">{{ currentItem.params.steps }}</span>
                  </div>
                  <div v-if="currentItem.params.cfg_scale" class="param-item-small">
                    <span class="param-label">CFG:</span>
                    <span class="param-value">{{ currentItem.params.cfg_scale }}</span>
                  </div>
                  <div v-if="currentItem.params.seed" class="param-item-small">
                    <span class="param-label">Seed:</span>
                    <span class="param-value">{{ currentItem.params.seed }}</span>
                  </div>
                  <div v-if="currentItem.params.sampler_name" class="param-item-small">
                    <span class="param-label">Sampler:</span>
                    <span class="param-value">{{ currentItem.params.sampler_name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Mode -->
      <div v-if="isCompareMode" class="compare-section">
        <h4>{{ $t('history.selectCompareImage') }}</h4>
        <div class="compare-grid">
          <div
            v-for="(item, index) in allItems.filter(i => i.id !== currentItem.id)"
            :key="item.id"
            class="compare-item"
            @click="selectCompareImage(item)"
          >
            <img :src="item.image" :alt="'Compare ' + index" />
            <div class="compare-time">{{ formatTimestamp(item.timestamp) }}</div>
          </div>
        </div>
        <button @click="cancelCompare" class="cancel-compare-btn">{{ $t('common.cancel') }}</button>
      </div>

      <!-- Comparison View -->
      <div v-if="compareImage" class="comparison-view">
        <div class="comparison-images">
          <div class="compare-image-wrapper">
            <h4>{{ $t('history.currentImage') }}</h4>
            <img :src="currentItem.image" alt="Current" />
          </div>
          <div class="compare-image-wrapper">
            <h4>{{ $t('history.compareImage') }}</h4>
            <img :src="compareImage.image" alt="Compare" />
          </div>
        </div>
        <button @click="closeCompare" class="close-compare-btn">{{ $t('history.closeCompare') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTimestamp, formatFullTimestamp as formatFullTimestampUtil, formatDuration } from '../utils/dateUtils'

const { t } = useI18n()

// Wrapper to provide i18n fallback text
function formatFullTimestamp(timestamp) {
  return formatFullTimestampUtil(timestamp, t('history.unknown'))
}

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  initialItem: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'close',
  'toggle-favorite',
  'delete',
  'load-params',
  'download'
])

const searchQuery = ref('')
const isCompareMode = ref(false)
const compareImage = ref(null)

// Filter items based on search
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.items
  }

  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item => {
    // Search in prompt
    if (item.params?.prompt?.toLowerCase().includes(query)) return true
    // Search in negative prompt
    if (item.params?.negative_prompt?.toLowerCase().includes(query)) return true
    // Search in timestamp
    if (formatFullTimestamp(item.timestamp).toLowerCase().includes(query)) return true
    return false
  })
})

// Current index in filtered items
const currentIndex = ref(
  filteredItems.value.findIndex(item => item.id === props.initialItem.id)
)

// Current item being viewed
const currentItem = computed(() => filteredItems.value[currentIndex.value] || props.initialItem)

// All items (for comparison)
const allItems = computed(() => props.items)

function navigatePrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function navigateNext() {
  if (currentIndex.value < filteredItems.value.length - 1) {
    currentIndex.value++
  }
}

function toggleFavorite() {
  emit('toggle-favorite', currentItem.value)
}

function loadParams() {
  emit('load-params', currentItem.value)
  emit('close')
}

function downloadImage() {
  emit('download', currentItem.value)
}

function deleteImage() {
  emit('delete', currentItem.value)
  // Navigate to next or previous image after delete
  if (filteredItems.value.length > 1) {
    if (currentIndex.value >= filteredItems.value.length - 1) {
      navigatePrevious()
    }
  } else {
    emit('close')
  }
}

function startCompare() {
  isCompareMode.value = true
}

function cancelCompare() {
  isCompareMode.value = false
}

function selectCompareImage(item) {
  compareImage.value = item
  isCompareMode.value = false
}

function closeCompare() {
  compareImage.value = null
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  max-width: 1400px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 14px;
  width: 250px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.close-btn {
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--color-border-primary);
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.image-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-wrapper {
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  overflow: hidden;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
}

.image-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #4338ca;
}

.nav-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.image-counter {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 10px 16px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--color-border-primary);
  transform: translateX(2px);
}

.action-btn.favorite {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #92400e;
}

.action-btn.delete {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  padding: 10px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  font-size: 13px;
}

.info-item strong {
  display: block;
  margin-bottom: 4px;
  color: var(--color-text-primary);
}

.info-item.warning {
  background: #fef3c7;
  color: #92400e;
}

.info-item .duration {
  color: var(--color-text-secondary);
  margin-left: 8px;
}

.params-section {
  padding: 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  font-size: 13px;
}

.params-section strong {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-primary);
}

.params-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-label {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.param-value {
  color: var(--color-text-primary);
  word-wrap: break-word;
}

.param-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.param-item-small {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Comparison Mode */
.compare-section {
  position: absolute;
  top: 80px;
  left: 24px;
  right: 24px;
  bottom: 24px;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.compare-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.compare-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.compare-item:hover {
  border-color: #4f46e5;
  transform: scale(1.05);
}

.compare-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.compare-time {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px;
  font-size: 11px;
  text-align: center;
}

.cancel-compare-btn {
  padding: 10px 20px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Comparison View */
.comparison-view {
  position: absolute;
  top: 80px;
  left: 24px;
  right: 24px;
  bottom: 24px;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.comparison-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.compare-image-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compare-image-wrapper h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.compare-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: var(--color-bg-tertiary);
}

.close-compare-btn {
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  align-self: center;
}

.close-compare-btn:hover {
  background: #4338ca;
}
</style>
