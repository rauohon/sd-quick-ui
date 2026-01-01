<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { mockLoras } from '../mocks/lorasMock'
import { logError } from '../composables/useErrorHandler'
import { useCivitaiCache } from '../composables/useCivitaiCache'
import {
  getCategory,
  getSdVersion,
  getResolution,
  getTriggerWords,
  getThumbnailUrl
} from '../utils/loraUtils'
import LazyImage from './LazyImage.vue'

const { t } = useI18n()
const API_URL = 'http://127.0.0.1:7860'
const USE_MOCK_DATA = import.meta.env.VITE_MOCK_API === 'true'

// Civitai cache composable
const { fetchTriggerWords: fetchCivitaiTriggerWords } = useCivitaiCache()

// Props
const props = defineProps({
  showToast: Function,
})

// Emits
const emit = defineEmits(['close', 'selectLora'])

// State
const loras = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedLora = ref(null)
const loraWeight = ref(1.0)
const hasLoaded = ref(false) // 한 번만 로드
const selectedCategory = ref('all') // 선택된 카테고리

// Computed
const categories = computed(() => {
  const cats = new Set(['all'])
  loras.value.forEach(lora => {
    cats.add(getCategory(lora))
  })
  return Array.from(cats).sort()
})

const filteredLoras = computed(() => {
  let filtered = loras.value

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(lora => getCategory(lora) === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(lora =>
      lora.name.toLowerCase().includes(query) ||
      (lora.alias && lora.alias.toLowerCase().includes(query))
    )
  }

  return filtered
})

/**
 * Fetch LoRA list from API (or use mock data in dev mode)
 */
async function fetchLoras(force = false) {
  // 이미 로드했고 강제 새로고침이 아니면 스킵
  if (hasLoaded.value && !force) {
    return
  }

  loading.value = true

  try {
    // 개발 모드에서는 Mock 데이터 사용
    if (USE_MOCK_DATA) {
      console.log('🎭 Using Mock LoRA data (WebUI not required)')
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
      loras.value = mockLoras
      hasLoaded.value = true
      return
    }

    // 프로덕션: 실제 API 호출
    const response = await fetch(`${API_URL}/sdapi/v1/loras`)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    loras.value = data

    // Fetch Civitai trigger words for all LoRAs with hash (background)
    data.forEach(async (lora) => {
      if (lora.hash) {
        const civitaiWords = await fetchCivitaiTriggerWords(lora)
        if (civitaiWords && civitaiWords.length > 0) {
          lora.civitaiWords = civitaiWords
        }
      }
    })

    hasLoaded.value = true
  } catch (error) {
    logError(error, 'fetchLoras')
    props.showToast?.(t('lora.loadFailed'), 'error')
  } finally {
    loading.value = false
  }
}


/**
 * Refresh LoRA list
 */
async function refreshLoras() {
  loading.value = true
  try {
    // Call API to refresh LoRA file list on backend
    const response = await fetch(`${API_URL}/sdapi/v1/refresh-loras`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error(`Refresh API error: ${response.status}`)
    }

    // Then fetch the updated list
    await fetchLoras(true)
    props.showToast?.(t('lora.refreshed'), 'success')
  } catch (error) {
    logError(error, 'refreshLoras')
    props.showToast?.(t('lora.refreshFailed'), 'error')
  } finally {
    loading.value = false
  }
}

/**
 * Get thumbnail URL for LoRA (wrapper to pass API_URL)
 */
function getLoraThumbUrl(lora) {
  return getThumbnailUrl(lora, API_URL)
}

/**
 * Quick add LoRA with trigger words to prompt
 */
function addLoraWithTriggers(lora, event) {
  // Prevent card selection
  if (event) {
    event.stopPropagation()
  }

  // Build prompt text: LoRA tag + trigger words
  const loraTag = `<lora:${lora.name}:${loraWeight.value}>`
  const triggers = getTriggerWords(lora)

  let promptText = loraTag
  if (triggers.length > 0) {
    promptText = triggers.join(', ') + ', ' + loraTag
  }

  // Emit to parent to add to prompt
  emit('selectLora', promptText)
  props.showToast?.(t('lora.addedToPrompt', { name: lora.alias || lora.name }), 'success')

  // Close modal
  emit('close')
}

/**
 * Select LoRA
 */
function selectLora(lora) {
  selectedLora.value = lora
}

/**
 * Confirm selection and add to prompt
 */
function confirmSelection() {
  if (!selectedLora.value) return

  const loraTag = `<lora:${selectedLora.value.name}:${loraWeight.value}>`
  emit('selectLora', loraTag)
  emit('close')
}

/**
 * Close modal
 */
function close() {
  emit('close')
}

// Lazy load: 첫 오픈 시에만 로드
onMounted(() => {
  fetchLoras() // hasLoaded로 중복 방지됨
})
</script>

<template>
  <div class="lora-selector-panel">
    <div class="panel-header">
      <h3>📦 LoRA Selector</h3>
      <div class="header-actions">
        <button class="refresh-btn" @click="refreshLoras" :disabled="loading" title="Refresh LoRA list">
          🔄 {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
        <button class="close-btn" @click="close">✕</button>
      </div>
    </div>

    <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Search LoRA by name..."
          class="search-input"
        >
        
        <div class="category-filters" v-if="categories.length > 1">
          <button
            v-for="category in categories"
            :key="category"
            class="category-chip"
            :class="{ active: selectedCategory === category }"
            @click="selectedCategory = category"
          >
            {{ category === 'all' ? '📂 All' : category }}
          </button>
        </div>

        <div class="lora-count" v-if="loras.length > 0">
          {{ filteredLoras.length }} / {{ loras.length }} LoRAs
        </div>
      </div>

      <div class="lora-grid" v-if="!loading">
        <div
          v-for="lora in filteredLoras"
          :key="lora.name"
          class="lora-card"
          :class="{ selected: selectedLora?.name === lora.name }"
          @click="selectLora(lora)"
        >
          <div class="lora-thumbnail">
            <LazyImage
              v-if="getLoraThumbUrl(lora)"
              :src="getLoraThumbUrl(lora)"
              :alt="lora.name"
            />
            <div v-else class="no-preview-placeholder">No Preview</div>
            <div v-if="getSdVersion(lora)" class="version-badge">
              {{ getSdVersion(lora) }}
            </div>
            <button
              class="quick-add-btn"
              @click="addLoraWithTriggers(lora, $event)"
              :title="`'${lora.alias || lora.name}'을(를) 트리거 워드와 함께 프롬프트에 추가`"
            >
              ➕
            </button>
          </div>
          <div class="lora-name" :title="lora.name">
            {{ lora.alias || lora.name }}
          </div>
        </div>

        <div v-if="filteredLoras.length === 0" class="no-results">
          검색 결과가 없습니다
        </div>
      </div>

      <div v-else class="loading">
        Loading LoRAs...
      </div>

      <div v-if="selectedLora" class="selection-panel">
        <div class="selection-info">
          <div class="selected-name">
            <strong>Selected:</strong> {{ selectedLora.alias || selectedLora.name }}
          </div>
          <div v-if="getSdVersion(selectedLora)" class="metadata-item">
            <span class="metadata-label">Version:</span> {{ getSdVersion(selectedLora) }}
          </div>
          <div v-if="getResolution(selectedLora)" class="metadata-item">
            <span class="metadata-label">Resolution:</span> {{ getResolution(selectedLora) }}
          </div>
          <div v-if="getTriggerWords(selectedLora).length > 0" class="metadata-item">
            <span class="metadata-label">Triggers:</span>
            <span
              class="trigger-word"
              v-for="word in getTriggerWords(selectedLora)"
              :key="word"
            >
              {{ word }}
            </span>
          </div>
        </div>
        <div class="weight-control">
          <label>Weight: {{ loraWeight }}</label>
          <input
            type="range"
            v-model.number="loraWeight"
            min="-2"
            max="2"
            step="0.05"
            class="weight-slider"
          >
          <div class="weight-presets">
            <button @click="loraWeight = 0.5" class="preset-btn">0.5</button>
            <button @click="loraWeight = 0.75" class="preset-btn">0.75</button>
            <button @click="loraWeight = 1.0" class="preset-btn">1.0</button>
            <button @click="loraWeight = 1.25" class="preset-btn">1.25</button>
            <button @click="loraWeight = 1.5" class="preset-btn">1.5</button>
          </div>
        </div>
        <button @click="confirmSelection" class="confirm-btn">
          Add to Prompt
        </button>
      </div>
  </div>
</template>

<style scoped>
.lora-selector-panel {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex !important;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  flex: 1;
  grid-template-columns: unset !important;
  gap: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-inverse);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  height: 32px;
  padding: 0 14px;
  border: 2px solid var(--color-text-inverse);
  background: transparent;
  color: var(--color-text-inverse);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-bg-elevated);
  color: #667eea;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-text-inverse);
  background: transparent;
  color: var(--color-text-inverse);
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--color-bg-elevated);
  color: #667eea;
}

.search-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.lora-count {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.category-chip {
  padding: 6px 14px;
  border: 2px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
}

.category-chip:hover {
  border-color: #667eea;
  background: #f5f7ff;
  color: #667eea;
}

.category-chip.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-text-inverse);
}

.lora-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, 180px);
  gap: 12px;
  align-content: start;
  justify-content: start;
}

.lora-card {
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  height: 240px;
  display: flex;
  flex-direction: column;
}

.lora-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.lora-card.selected {
  border-color: #667eea;
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.lora-thumbnail {
  width: 100%;
  height: 180px;
  background: var(--color-bg-tertiary);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.lora-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.version-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 3px 8px;
  background: rgba(102, 126, 234, 0.9);
  color: var(--color-text-inverse);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.no-preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  font-size: 14px;
  font-weight: 500;
}

.lora-name {
  padding: 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--color-text-secondary);
}

.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-tertiary);
  font-size: 16px;
}

.selection-panel {
  flex-shrink: 0;
  padding: 16px;
  border-top: 2px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
}

.selection-info {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--color-text-primary);
}

.selected-name {
  margin-bottom: 8px;
}

.selection-info strong {
  color: #667eea;
  font-weight: 600;
}

.metadata-item {
  margin: 4px 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.metadata-label {
  font-weight: 600;
  color: #667eea;
}

.trigger-word {
  display: inline-block;
  padding: 2px 8px;
  background: #e8eaf6;
  color: #5c6bc0;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.quick-add-btn {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 32px;
  height: 32px;
  background: rgba(102, 126, 234, 0.9);
  border: none;
  border-radius: 50%;
  color: var(--color-text-inverse);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.lora-card:hover .quick-add-btn {
  opacity: 1;
}

.quick-add-btn:hover {
  background: rgba(102, 126, 234, 1);
  transform: scale(1.1);
}

.quick-add-btn:active {
  transform: scale(0.95);
}

.weight-control {
  margin-bottom: 14px;
}

.weight-control label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.weight-slider {
  width: 100%;
  height: 6px;
  margin-bottom: 10px;
  cursor: pointer;
}

.weight-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-btn {
  height: 28px;
  padding: 0 12px;
  border: 2px solid #667eea;
  background: var(--color-bg-elevated);
  color: #667eea;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-btn:hover {
  background: #667eea;
  color: var(--color-text-inverse);
}

.confirm-btn {
  width: 100%;
  height: 36px;
  padding: 0 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-btn:hover {
  opacity: 0.95;
  transform: translateY(-1px);
}
</style>
