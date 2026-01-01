<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-title">
          <h3>{{ $t('history.manage') }}</h3>
          <span class="image-count-badge">{{ totalImageCount }}/200</span>
        </div>
        <div class="header-actions">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('history.searchPlaceholder')"
            class="search-input"
          />
          <select v-model="sortBy" class="sort-select">
            <option value="newest">{{ $t('history.sortNewest') }}</option>
            <option value="oldest">{{ $t('history.sortOldest') }}</option>
            <option value="favorite">{{ $t('history.sortFavorite') }}</option>
          </select>
          <span v-if="selectedIds.size > 0" class="selection-count-badge">{{ $t('history.selectedCount', { count: selectedIds.size }) }}</span>
          <button @click="selectAll" class="select-btn" :disabled="filteredItems.length === 0">{{ $t('history.selectAll') }}</button>
          <button @click="deselectAll" class="select-btn" :disabled="selectedIds.size === 0">{{ $t('history.deselectAll') }}</button>
          <button
            @click="compareSelected"
            :disabled="selectedIds.size === 0 || !selectedItem"
            class="action-btn compare"
            :title="$t('history.compareTooltip')"
          >
            🔍 {{ $t('history.compare') }}
          </button>
          <button
            @click="downloadSelected"
            :disabled="selectedIds.size === 0"
            class="action-btn download"
          >
            💾 {{ $t('history.download') }}
          </button>
          <button
            @click="deleteSelected"
            :disabled="selectedIds.size === 0"
            class="action-btn delete"
          >
            🗑️ {{ $t('common.delete') }}
          </button>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>
      </div>

      <!-- Body: List + Detail -->
      <div class="modal-body">
        <!-- Left: Image Grid -->
        <div class="image-list">
          <div v-if="filteredItems.length === 0" class="empty-state">
            <p>{{ searchQuery ? $t('history.noSearchResults') : $t('history.noImages') }}</p>
          </div>
          <div
            v-for="item in sortedItems"
            :key="item.id"
            class="grid-item"
            :class="{
              'is-selected': selectedItem?.id === item.id,
              'is-checked': selectedIds.has(item.id),
              'is-favorite': item.favorite,
              'is-interrupted': item.interrupted
            }"
            @click="selectItem(item)"
          >
            <div class="checkbox-overlay" @click.stop="toggleSelection(item.id)">
              <input type="checkbox" :checked="selectedIds.has(item.id)" @click.stop>
              <span class="checkmark">{{ selectedIds.has(item.id) ? '✓' : '' }}</span>
            </div>
            <img :src="item.image" :alt="'Image ' + item.id" />
            <div class="item-overlay">
              <div class="item-time">{{ formatTimestamp(item.timestamp) }}</div>
              <div class="item-badges">
                <span v-if="item.favorite" class="badge favorite">⭐</span>
                <span v-if="item.interrupted" class="badge interrupted">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Detail Panel -->
        <div v-if="selectedItem" class="detail-panel">
          <div class="detail-header">
            <h4>{{ $t('history.detailsTitle') }}</h4>
            <div class="detail-nav">
              <button
                @click="navigatePrevious"
                :disabled="!canNavigatePrevious"
                class="nav-btn"
              >
                ◀
              </button>
              <span class="image-counter">{{ currentIndex + 1 }} / {{ sortedItems.length }}</span>
              <button
                @click="navigateNext"
                :disabled="!canNavigateNext"
                class="nav-btn"
              >
                ▶
              </button>
            </div>
          </div>

          <div class="detail-content">
            <!-- Image Preview -->
            <div class="detail-image-wrapper">
              <img :src="selectedItem.image" :alt="'Selected ' + selectedItem.id" />
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button
                @click="toggleFavorite(selectedItem)"
                :class="['action-btn', { favorite: selectedItem.favorite }]"
              >
                {{ selectedItem.favorite ? '⭐ ' + $t('history.removeFavorite') : '☆ ' + $t('history.addFavorite') }}
              </button>
              <button @click="loadParams(selectedItem)" class="action-btn">
                🔄 {{ $t('history.loadParams') }}
              </button>
              <button @click="downloadImage(selectedItem)" class="action-btn">
                💾 {{ $t('history.download') }}
              </button>
              <button @click="startCompareMode(selectedItem)" class="action-btn">
                🔍 {{ $t('history.compareMode') }}
              </button>
              <button @click="deleteImage(selectedItem)" class="action-btn delete">
                🗑️ {{ $t('common.delete') }}
              </button>
            </div>

            <!-- Image Info -->
            <div class="info-section">
              <div class="info-item">
                <strong>{{ $t('history.generatedAt') }}</strong>
                <span>{{ formatFullTimestamp(selectedItem.timestamp) }}</span>
              </div>
              <div v-if="selectedItem.interrupted" class="info-item warning">
                <strong>{{ $t('history.status') }}</strong>
                <span>⚠️ {{ $t('history.interrupted') }}</span>
              </div>
              <div v-if="selectedItem.params" class="params-section">
                <strong>{{ $t('history.parameters') }}</strong>
                <div class="params-content">
                  <div v-if="selectedItem.params.prompt" class="param-item">
                    <span class="param-label">Prompt:</span>
                    <span class="param-value" v-html="highlightText(selectedItem.params.prompt)"></span>
                  </div>
                  <div v-if="selectedItem.params.negative_prompt" class="param-item">
                    <span class="param-label">Negative:</span>
                    <span class="param-value" v-html="highlightText(selectedItem.params.negative_prompt)"></span>
                  </div>
                  <div class="param-grid">
                    <div v-if="selectedItem.params.width" class="param-item-small">
                      <span class="param-label">Size:</span>
                      <span class="param-value">{{ selectedItem.params.width }}×{{ selectedItem.params.height }}</span>
                    </div>
                    <div v-if="selectedItem.params.steps" class="param-item-small">
                      <span class="param-label">Steps:</span>
                      <span class="param-value">{{ selectedItem.params.steps }}</span>
                    </div>
                    <div v-if="selectedItem.params.cfg_scale" class="param-item-small">
                      <span class="param-label">CFG:</span>
                      <span class="param-value">{{ selectedItem.params.cfg_scale }}</span>
                    </div>
                    <div v-if="selectedItem.params.seed" class="param-item-small">
                      <span class="param-label">Seed:</span>
                      <span class="param-value">{{ selectedItem.params.seed }}</span>
                    </div>
                    <div v-if="selectedItem.params.sampler_name" class="param-item-small">
                      <span class="param-label">Sampler:</span>
                      <span class="param-value">{{ selectedItem.params.sampler_name }}</span>
                    </div>
                    <div v-if="selectedItem.params.scheduler" class="param-item-small">
                      <span class="param-label">Scheduler:</span>
                      <span class="param-value">{{ selectedItem.params.scheduler }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty Detail Panel -->
        <div v-else class="detail-panel empty">
          <div class="empty-detail">
            <p>{{ $t('history.selectImage') }}</p>
          </div>
        </div>
      </div>

      <!-- Comparison Mode -->
      <div v-if="isCompareMode" class="compare-overlay">
        <div class="compare-content">
          <h4>{{ $t('history.selectCompareImage') }}</h4>
          <div class="compare-grid">
            <div
              v-for="item in sortedItems.filter(i => i.id !== selectedItem?.id)"
              :key="item.id"
              class="compare-item"
              @click="selectCompareImage(item)"
            >
              <img :src="item.image" :alt="'Compare ' + item.id" />
              <div class="compare-time">{{ formatTimestamp(item.timestamp) }}</div>
            </div>
          </div>
          <button @click="cancelCompare" class="cancel-compare-btn">{{ $t('common.cancel') }}</button>
        </div>
      </div>

      <!-- Comparison View -->
      <div v-if="compareImages.length > 0" class="comparison-overlay" @click.self="closeCompare">
        <div class="comparison-content">
          <div class="comparison-header">
            <h3>{{ $t('history.imageCompare') }}</h3>
            <div class="comparison-nav">
              <button
                @click="previousCompareImage"
                :disabled="compareIndex === 0"
                class="compare-nav-btn"
              >
                ◀ {{ $t('history.previous') }}
              </button>
              <span class="compare-counter">{{ compareIndex + 1 }} / {{ compareImages.length }}</span>
              <button
                @click="nextCompareImage"
                :disabled="compareIndex === compareImages.length - 1"
                class="compare-nav-btn"
              >
                {{ $t('history.next') }} ▶
              </button>
            </div>
          </div>
          <div class="comparison-images">
            <div class="compare-image-wrapper">
              <h4>{{ $t('history.currentImage') }}</h4>
              <img :src="currentImage" alt="Current" />
              <div class="compare-info">{{ $t('history.latestGenerated') }}</div>
            </div>
            <div class="compare-image-wrapper">
              <h4>{{ $t('history.compareImage') }}</h4>
              <img :src="compareImages[compareIndex].image" alt="Compare" />
              <div class="compare-info">{{ formatFullTimestamp(compareImages[compareIndex].timestamp) }}</div>
            </div>
          </div>
          <button @click="closeCompare" class="close-compare-btn">{{ $t('history.closeCompare') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  initialItem: {
    type: Object,
    default: null
  },
  totalImageCount: {
    type: Number,
    default: 0
  },
  currentImage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'close',
  'toggle-favorite',
  'delete',
  'load-params',
  'download',
  'download-multiple',
  'delete-multiple'
])

// State
const searchQuery = ref('')
const sortBy = ref('newest')
const selectedItem = ref(props.initialItem || (props.items.length > 0 ? props.items[0] : null))
const selectedIds = ref(new Set())
const isCompareMode = ref(false)
const compareImages = ref([])
const compareIndex = ref(0)

// Filter items based on search
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.items
  }

  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item => {
    if (item.params?.prompt?.toLowerCase().includes(query)) return true
    if (item.params?.negative_prompt?.toLowerCase().includes(query)) return true
    if (item.params?.sampler_name?.toLowerCase().includes(query)) return true
    if (formatFullTimestamp(item.timestamp).toLowerCase().includes(query)) return true
    return false
  })
})

// Sort items
const sortedItems = computed(() => {
  const items = [...filteredItems.value]

  switch (sortBy.value) {
    case 'newest':
      return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    case 'oldest':
      return items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    case 'favorite':
      return items.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1
        if (!a.favorite && b.favorite) return 1
        return new Date(b.timestamp) - new Date(a.timestamp)
      })
    default:
      return items
  }
})

// Current index
const currentIndex = computed(() => {
  if (!selectedItem.value) return -1
  return sortedItems.value.findIndex(item => item.id === selectedItem.value.id)
})

// Navigation
const canNavigatePrevious = computed(() => currentIndex.value > 0)
const canNavigateNext = computed(() => currentIndex.value < sortedItems.value.length - 1)

function navigatePrevious() {
  if (canNavigatePrevious.value) {
    selectedItem.value = sortedItems.value[currentIndex.value - 1]
  }
}

function navigateNext() {
  if (canNavigateNext.value) {
    selectedItem.value = sortedItems.value[currentIndex.value + 1]
  }
}

// Item selection
function selectItem(item) {
  selectedItem.value = item
}

// Batch selection
function toggleSelection(id) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function selectAll() {
  selectedIds.value = new Set(sortedItems.value.map(item => item.id))
}

function deselectAll() {
  selectedIds.value.clear()
}

// Actions
function toggleFavorite(item) {
  emit('toggle-favorite', item)
}

function loadParams(item) {
  emit('load-params', item)
  emit('close')
}

function downloadImage(item) {
  emit('download', item)
}

function deleteImage(item) {
  emit('delete', item)

  // Select next or previous item after delete
  if (sortedItems.value.length > 1) {
    if (currentIndex.value >= sortedItems.value.length - 1) {
      navigatePrevious()
    } else {
      navigateNext()
    }
  } else {
    selectedItem.value = null
  }
}

// Batch actions
function compareSelected() {
  if (selectedIds.value.size === 0 || !selectedItem.value) return

  const selected = sortedItems.value.filter(item => selectedIds.value.has(item.id))
  compareImages.value = selected
  compareIndex.value = 0
}

function downloadSelected() {
  const items = sortedItems.value.filter(item => selectedIds.value.has(item.id))
  emit('download-multiple', items)
  deselectAll()
}

function deleteSelected() {
  const items = sortedItems.value.filter(item => selectedIds.value.has(item.id))
  emit('delete-multiple', items)
  deselectAll()
  selectedItem.value = null
}

// Compare mode
function startCompareMode() {
  isCompareMode.value = true
}

function cancelCompare() {
  isCompareMode.value = false
}

function selectCompareImage(item) {
  compareImages.value = [item]
  compareIndex.value = 0
  isCompareMode.value = false
}

function previousCompareImage() {
  if (compareIndex.value > 0) {
    compareIndex.value--
  }
}

function nextCompareImage() {
  if (compareIndex.value < compareImages.value.length - 1) {
    compareIndex.value++
  }
}

function closeCompare() {
  compareImages.value = []
  compareIndex.value = 0
}

// Formatting
function formatTimestamp(timestamp) {
  if (!timestamp) return '--:--'

  try {
    const date = new Date(timestamp)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  } catch (e) {
    // Fallback
  }

  return timestamp
}

function formatFullTimestamp(timestamp) {
  if (!timestamp) return t('history.unknown')

  try {
    const date = new Date(timestamp)
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  } catch (e) {
    // Fallback
  }

  return timestamp
}

// Highlight search query in text
function highlightText(text) {
  if (!text || !searchQuery.value.trim()) return text

  const query = searchQuery.value.trim()
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  width: 100%;
  max-width: 1600px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Header */
.modal-header {
  padding: 20px 24px;
  border-bottom: 2px solid var(--color-border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.image-count-badge {
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 14px;
  width: 300px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.selection-count-badge {
  padding: 6px 12px;
  background: #4f46e5;
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.select-btn {
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.select-btn:hover:not(:disabled) {
  background: var(--color-border-primary);
}

.select-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn {
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

.action-btn:hover {
  background: #4338ca;
}

.action-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.action-btn.compare {
  background: #06b6d4;
}

.action-btn.compare:hover:not(:disabled) {
  background: #0891b2;
}

.action-btn.download {
  background: #10b981;
}

.action-btn.download:hover:not(:disabled) {
  background: #059669;
}

.action-btn.delete {
  background: #ef4444;
}

.action-btn.delete:hover:not(:disabled) {
  background: #dc2626;
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

/* Selection Actions */
.selection-actions {
  padding: 12px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.selection-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.selection-count {
  font-size: 14px;
  font-weight: 600;
  color: #4f46e5;
}

.select-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.select-btn:hover {
  background: #e5e7eb;
}

.selection-buttons {
  display: flex;
  gap: 8px;
}

.batch-action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.batch-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-action-btn.download {
  background: #4f46e5;
  color: white;
}

.batch-action-btn.download:hover:not(:disabled) {
  background: #4338ca;
}

.batch-action-btn.delete {
  background: #ef4444;
  color: white;
}

.batch-action-btn.delete:hover:not(:disabled) {
  background: #dc2626;
}

/* Body */
.modal-body {
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 0;
  overflow: hidden;
  flex: 1;
}

/* Image List */
.image-list {
  overflow-y: auto;
  padding: 20px;
  background: var(--color-bg-tertiary);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  grid-auto-rows: max-content;
  border-right: 2px solid var(--color-border-primary);
  min-height: 0;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 15px;
}

.grid-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  border: 3px solid transparent;
  transition: all 0.2s;
  background: var(--color-bg-elevated);
}

.grid-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.grid-item.is-selected {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px #4f46e5;
}

.grid-item.is-checked {
  border-color: #10b981;
  box-shadow: 0 0 0 2px #10b981;
}

.grid-item.is-favorite {
  outline: 2px solid #fbbf24;
  outline-offset: -2px;
}

.grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.checkbox-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
}

.checkbox-overlay input[type="checkbox"] {
  display: none;
}

.checkmark {
  font-size: 16px;
  font-weight: bold;
  color: #10b981;
}

.item-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.item-time {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.item-badges {
  display: flex;
  gap: 4px;
}

.badge {
  font-size: 14px;
}

/* Detail Panel */
.detail-panel {
  overflow-y: auto;
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.detail-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-detail {
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 15px;
}

.detail-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.detail-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.detail-nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-btn {
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--color-border-primary);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.image-counter {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 70px;
  text-align: center;
}

.detail-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-image-wrapper {
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  max-height: 400px;
  overflow: hidden;
}

.detail-image-wrapper img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons .action-btn {
  padding: 10px 16px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
  text-align: left;
  font-weight: 500;
}

.action-buttons .action-btn:hover {
  background: var(--color-border-primary);
}

.action-buttons .action-btn.favorite {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #92400e;
}

.action-buttons .action-btn.compare {
  background: #dbeafe;
  border-color: #60a5fa;
  color: #1e40af;
}

.action-buttons .action-btn.compare:hover {
  background: #bfdbfe;
}

.action-buttons .action-btn.delete {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.action-buttons .action-btn.delete:hover {
  background: #fecaca;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  font-size: 13px;
}

.info-item strong {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.info-item.warning {
  background: #fef3c7;
  color: #92400e;
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
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
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
  font-size: 11px;
}

.param-value {
  color: var(--color-text-primary);
  word-wrap: break-word;
  line-height: 1.4;
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

/* Compare Overlay */
.compare-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.compare-content {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.compare-content h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-height: 60vh;
  overflow-y: auto;
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
  padding: 10px 24px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Comparison Overlay */
.comparison-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.comparison-content {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 1400px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border-primary);
}

.comparison-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.comparison-nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

.compare-nav-btn {
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

.compare-nav-btn:hover:not(:disabled) {
  background: #4338ca;
}

.compare-nav-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.compare-counter {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

.comparison-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
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
  font-size: 16px;
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

.compare-info {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.close-compare-btn {
  padding: 10px 24px;
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

/* Highlight */
mark {
  background-color: #fef08a;
  color: #854d0e;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: 600;
}
</style>
