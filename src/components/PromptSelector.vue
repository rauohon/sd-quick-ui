<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEasyPrompts } from '../composables/useEasyPrompts'

const { t } = useI18n()

// Props
const props = defineProps({
  showToast: Function,
})

// Emits
const emit = defineEmits(['addPrompt', 'addNegative', 'close'])

// Composable
const {
  mergedCategories,
  getSubcategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addPrompt: addPromptToStore,
  updatePrompt,
  deletePrompt: deletePromptFromStore,
  exportData,
  importData,
  loadUserData
} = useEasyPrompts()

// State
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedSubcategory = ref('all')
const selectedPrompt = ref(null)
const collectorText = ref('')

// Dialog states
const showPromptDialog = ref(false)
const showCategoryDialog = ref(false)
const showImportHelp = ref(false)
const editingPrompt = ref(null)
const editingCategory = ref(null)
const newlyAddedPromptId = ref(null) // For highlight effect

// Form data
const promptForm = ref({
  label: '',
  text: '',
  categoryKey: '',
  subcategory: ''
})

const categoryForm = ref({
  name: '',
  icon: ''
})

// Available icons for category
const categoryIcons = ['📁', '⭐', '🎨', '🎵', '💡', '🔥', '💎', '🌟', '🎯', '🎪', '🎭', '🎬', '📷', '🖼️', '✨', '💫']

// Initialize
onMounted(() => {
  loadUserData()
})

// Computed
const categories = computed(() => {
  return Object.keys(mergedCategories.value)
})

const subcategories = computed(() => {
  if (selectedCategory.value === 'all') return []
  return getSubcategories(selectedCategory.value)
})

const filteredPrompts = computed(() => {
  let prompts = []

  if (selectedCategory.value === 'all') {
    // Show all prompts from all categories
    Object.entries(mergedCategories.value).forEach(([key, category]) => {
      prompts.push(...category.prompts.map(p => ({
        ...p,
        categoryKey: key,
        categoryName: category.name,
        categoryIcon: category.icon
      })))
    })
  } else {
    // Show prompts from selected category
    const category = mergedCategories.value[selectedCategory.value]
    if (category) {
      prompts = category.prompts.map(p => ({
        ...p,
        categoryKey: selectedCategory.value,
        categoryName: category.name,
        categoryIcon: category.icon
      }))
    }
  }

  // Apply subcategory filter
  if (selectedSubcategory.value !== 'all') {
    prompts = prompts.filter(p => p.subcategory === selectedSubcategory.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    prompts = prompts.filter(p =>
      p.text.toLowerCase().includes(query) ||
      p.label.toLowerCase().includes(query) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(query))
    )
  }

  return prompts
})

// Methods
function selectCategory(category) {
  selectedCategory.value = category
  selectedSubcategory.value = 'all'
}

function selectSubcategory(subcategory) {
  selectedSubcategory.value = subcategory
}

function selectPrompt(prompt) {
  // If it's from "부정" category, automatically add to negative
  if (prompt.categoryKey === '부정') {
    addToNegativeDirectly(prompt)
  } else {
    selectedPrompt.value = prompt
  }
}

function addToNegativeDirectly(prompt) {
  emit('addNegative', prompt.text)
  props.showToast?.(t('easyPrompts.addedToNegative', { label: prompt.label }), 'success')
}

function addToPrompt() {
  if (!selectedPrompt.value) return

  emit('addPrompt', selectedPrompt.value.text)
  props.showToast?.(t('easyPrompts.addedToPrompt', { label: selectedPrompt.value.label }), 'success')
  selectedPrompt.value = null
}

function addToNegative() {
  if (!selectedPrompt.value) return

  emit('addNegative', selectedPrompt.value.text)
  props.showToast?.(t('easyPrompts.addedToNegative', { label: selectedPrompt.value.label }), 'success')
  selectedPrompt.value = null
}

function close() {
  emit('close')
  selectedPrompt.value = null
}

// ===== Prompt Collector =====
function addToCollector(prompt, event) {
  event?.stopPropagation()
  const text = prompt.text.trim()
  if (!text) return

  if (collectorText.value) {
    // Add with comma and newline
    collectorText.value = collectorText.value.trimEnd() + ',\n' + text
  } else {
    collectorText.value = text
  }

  props.showToast?.(t('easyPrompts.addedToCollector', { label: prompt.label }), 'success')
}

function copyCollector() {
  if (!collectorText.value.trim()) {
    props.showToast?.(t('easyPrompts.collectorEmpty'), 'warning')
    return
  }

  navigator.clipboard.writeText(collectorText.value).then(() => {
    props.showToast?.(t('easyPrompts.copiedToClipboard'), 'success')
  }).catch(() => {
    props.showToast?.(t('easyPrompts.copyFailed'), 'error')
  })
}

function clearCollector() {
  collectorText.value = ''
}

// ===== Prompt Dialog =====
function openAddPromptDialog() {
  editingPrompt.value = null
  promptForm.value = {
    label: '',
    text: '',
    categoryKey: selectedCategory.value !== 'all' ? selectedCategory.value : '',
    subcategory: selectedSubcategory.value !== 'all' ? selectedSubcategory.value : ''
  }
  showPromptDialog.value = true
}

function openEditPromptDialog(prompt, event) {
  event?.stopPropagation()
  editingPrompt.value = prompt
  promptForm.value = {
    label: prompt.label,
    text: prompt.text,
    categoryKey: prompt.categoryKey,
    subcategory: prompt.subcategory || ''
  }
  showPromptDialog.value = true
}

function savePrompt() {
  if (!promptForm.value.label || !promptForm.value.text || !promptForm.value.categoryKey) {
    props.showToast?.(t('easyPrompts.fillRequired'), 'error')
    return
  }

  if (editingPrompt.value) {
    // Update existing
    updatePrompt(promptForm.value.categoryKey, editingPrompt.value, {
      label: promptForm.value.label,
      text: promptForm.value.text,
      subcategory: promptForm.value.subcategory
    })
    props.showToast?.(t('easyPrompts.promptUpdated'), 'success')
  } else {
    // Add new
    const newPrompt = addPromptToStore(promptForm.value.categoryKey, {
      label: promptForm.value.label,
      text: promptForm.value.text,
      subcategory: promptForm.value.subcategory
    })

    // Highlight the new prompt
    newlyAddedPromptId.value = newPrompt.id
    setTimeout(() => {
      newlyAddedPromptId.value = null
    }, 3000)

    // Navigate to the actual category where prompt was added
    selectedCategory.value = newPrompt.categoryKey
    selectedSubcategory.value = 'all'

    // Clear search to avoid confusion
    searchQuery.value = ''

    props.showToast?.(t('easyPrompts.promptAdded'), 'success')
  }

  showPromptDialog.value = false
}

function handleDeletePrompt(prompt, event) {
  event?.stopPropagation()
  if (confirm(t('easyPrompts.confirmDeletePrompt'))) {
    deletePromptFromStore(prompt.categoryKey, prompt)
    props.showToast?.(t('easyPrompts.promptDeleted'), 'success')
  }
}

// ===== Category Dialog =====
function openAddCategoryDialog() {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    icon: '📁'
  }
  showCategoryDialog.value = true
}

function openEditCategoryDialog(categoryKey, event) {
  event?.stopPropagation()
  const category = mergedCategories.value[categoryKey]
  if (!category) return

  editingCategory.value = { key: categoryKey, ...category }
  categoryForm.value = {
    name: category.name,
    icon: category.icon
  }
  showCategoryDialog.value = true
}

function saveCategory() {
  if (!categoryForm.value.name) {
    props.showToast?.(t('easyPrompts.fillRequired'), 'error')
    return
  }

  if (editingCategory.value) {
    // Update existing
    updateCategory(editingCategory.value.key, {
      name: categoryForm.value.name,
      icon: categoryForm.value.icon
    })
    props.showToast?.(t('easyPrompts.categoryUpdated'), 'success')
  } else {
    // Add new
    addCategory(categoryForm.value.name, categoryForm.value.icon)
    props.showToast?.(t('easyPrompts.categoryAdded'), 'success')
  }

  showCategoryDialog.value = false
}

function handleDeleteCategory(categoryKey, event) {
  event?.stopPropagation()
  if (confirm(t('easyPrompts.confirmDeleteCategory'))) {
    deleteCategory(categoryKey)
    if (selectedCategory.value === categoryKey) {
      selectedCategory.value = 'all'
    }
    props.showToast?.(t('easyPrompts.categoryDeleted'), 'success')
  }
}

// ===== Import/Export =====
function handleExport() {
  exportData()
  props.showToast?.(t('easyPrompts.exported'), 'success')
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const result = await importData(file)

      // Navigate to the first imported category and highlight
      if (result.firstCategoryKey) {
        selectedCategory.value = result.firstCategoryKey
        selectedSubcategory.value = 'all'
        searchQuery.value = ''

        // Highlight the first prompt
        if (result.firstPromptId) {
          newlyAddedPromptId.value = result.firstPromptId
          setTimeout(() => {
            newlyAddedPromptId.value = null
          }, 3000)
        }
      }

      props.showToast?.(t('easyPrompts.imported'), 'success')
    } catch (error) {
      props.showToast?.(t('easyPrompts.importError'), 'error')
    }
  }
  input.click()
}

function handleImportWithClose() {
  showImportHelp.value = false
  handleImport()
}

// Context menu for category tabs
function handleCategoryContextMenu(categoryKey, event) {
  event.preventDefault()
  if (categoryKey === 'all') return

  // Simple context menu using prompt
  const category = mergedCategories.value[categoryKey]
  const action = prompt(
    `${category.name}\n\n1: ${t('common.edit')}\n2: ${t('common.delete')}\n\n${t('easyPrompts.enterNumber')}:`
  )

  if (action === '1') {
    openEditCategoryDialog(categoryKey)
  } else if (action === '2') {
    handleDeleteCategory(categoryKey)
  }
}
</script>

<template>
  <div class="prompt-selector-panel">
    <div class="panel-header">
      <h3>{{ t('easyPrompts.title') }}</h3>
      <div class="header-actions">
        <button class="header-btn text-btn" @click="openAddPromptDialog">
          + {{ t('easyPrompts.addPrompt') }}
        </button>
        <button class="header-btn text-btn" @click="openAddCategoryDialog">
          + {{ t('easyPrompts.addCategory') }}
        </button>
        <button class="header-btn text-btn" @click="showImportHelp = true">
          {{ t('common.import') }}
        </button>
        <button class="header-btn text-btn" @click="handleExport">
          {{ t('common.export') }}
        </button>
        <button class="close-btn" @click="close">X</button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('easyPrompts.searchPlaceholder')"
        class="search-input"
      >
    </div>

    <!-- Category Tabs -->
    <div class="category-tabs">
      <button
        class="category-tab"
        :class="{ active: selectedCategory === 'all' }"
        @click="selectCategory('all')"
      >
        {{ t('easyPrompts.all') }}
      </button>
      <button
        v-for="(category, key) in mergedCategories"
        :key="key"
        class="category-tab"
        :class="{
          active: selectedCategory === key,
          negative: key === '부정',
          custom: category.isCustom
        }"
        @click="selectCategory(key)"
        @contextmenu="handleCategoryContextMenu(key, $event)"
      >
        {{ category.icon }} {{ category.name }}
        <span v-if="category.isCustom" class="custom-badge">*</span>
      </button>
    </div>

    <!-- Subcategory Tabs -->
    <div v-if="subcategories.length > 0" class="subcategory-tabs">
      <button
        class="subcategory-tab"
        :class="{ active: selectedSubcategory === 'all' }"
        @click="selectSubcategory('all')"
      >
        {{ t('easyPrompts.all') }}
      </button>
      <button
        v-for="subcat in subcategories"
        :key="subcat"
        class="subcategory-tab"
        :class="{ active: selectedSubcategory === subcat }"
        @click="selectSubcategory(subcat)"
      >
        {{ subcat }}
      </button>
    </div>

    <!-- Prompts Grid -->
    <div class="prompts-grid">
      <div
        v-for="(prompt, index) in filteredPrompts"
        :key="prompt.id || index"
        class="prompt-item"
        :class="{
          selected: selectedPrompt?.text === prompt.text,
          negative: prompt.categoryKey === '부정',
          custom: prompt.isCustom,
          modified: prompt.isModified,
          'newly-added': newlyAddedPromptId === prompt.id
        }"
        @click="selectPrompt(prompt)"
      >
        <!-- Hover overlay with action buttons -->
        <div class="prompt-overlay">
          <button class="overlay-btn collect-btn" @click="addToCollector(prompt, $event)" :title="t('easyPrompts.addToCollector')">
            +
          </button>
          <button class="overlay-btn edit-btn" @click="openEditPromptDialog(prompt, $event)">
            {{ t('common.edit') }}
          </button>
          <button class="overlay-btn delete-btn" @click="handleDeletePrompt(prompt, $event)">
            {{ t('common.delete') }}
          </button>
        </div>

        <div class="prompt-header">
          <span class="prompt-category">{{ prompt.categoryIcon }} {{ prompt.categoryName }}</span>
          <span class="prompt-label">
            {{ prompt.label }}
            <span v-if="prompt.isCustom" class="custom-indicator">*</span>
            <span v-if="prompt.isModified" class="modified-indicator">~</span>
          </span>
        </div>
        <div v-if="prompt.subcategory" class="prompt-subcategory">{{ prompt.subcategory }}</div>
        <div class="prompt-text">{{ prompt.text }}</div>
      </div>

      <div v-if="filteredPrompts.length === 0" class="no-prompts">
        {{ t('common.noSearchResults') }}
      </div>
    </div>

    <!-- Prompt Collector -->
    <div class="collector-section">
      <div class="collector-header">
        <span class="collector-title">📋 {{ t('easyPrompts.promptCollector') }}</span>
        <div class="collector-actions">
          <button class="collector-btn copy-btn" @click="copyCollector" :title="t('easyPrompts.copyToClipboard')">
            📋 {{ t('common.copy') }}
          </button>
          <button class="collector-btn clear-btn" @click="clearCollector" :title="t('easyPrompts.clearCollector')">
            🗑️
          </button>
        </div>
      </div>
      <textarea
        v-model="collectorText"
        class="collector-textarea"
        :placeholder="t('easyPrompts.collectorPlaceholder')"
        rows="4"
      ></textarea>
    </div>

    <!-- Action Buttons -->
    <div v-if="selectedPrompt" class="action-panel">
      <div class="selected-info">
        <strong>{{ t('easyPrompts.selected') }}:</strong> {{ selectedPrompt.label }}
      </div>
      <div class="action-buttons">
        <button @click="addToPrompt" class="add-prompt-btn">
          + {{ t('easyPrompts.addToPromptBtn') }}
        </button>
        <button @click="addToNegative" class="add-negative-btn">
          - {{ t('easyPrompts.addToNegativeBtn') }}
        </button>
      </div>
    </div>

    <!-- Prompt Edit Dialog -->
    <div v-if="showPromptDialog" class="dialog-overlay" @click="showPromptDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h4>{{ editingPrompt ? t('easyPrompts.editPrompt') : t('easyPrompts.addPrompt') }}</h4>
          <button class="dialog-close" @click="showPromptDialog = false">X</button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>{{ t('easyPrompts.labelField') }} *</label>
            <input v-model="promptForm.label" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>{{ t('easyPrompts.promptText') }} *</label>
            <textarea v-model="promptForm.text" class="form-textarea" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>{{ t('easyPrompts.category') }} *</label>
            <select v-model="promptForm.categoryKey" class="form-select">
              <option value="">{{ t('easyPrompts.selectCategory') }}</option>
              <option v-for="(cat, key) in mergedCategories" :key="key" :value="key">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('easyPrompts.subcategory') }}</label>
            <input v-model="promptForm.subcategory" type="text" class="form-input" :placeholder="t('easyPrompts.subcategoryPlaceholder')" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showPromptDialog = false">{{ t('common.cancel') }}</button>
          <button class="btn-save" @click="savePrompt">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>

    <!-- Category Edit Dialog -->
    <div v-if="showCategoryDialog" class="dialog-overlay" @click="showCategoryDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h4>{{ editingCategory ? t('easyPrompts.editCategory') : t('easyPrompts.addCategory') }}</h4>
          <button class="dialog-close" @click="showCategoryDialog = false">X</button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>{{ t('easyPrompts.categoryName') }} *</label>
            <input v-model="categoryForm.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>{{ t('easyPrompts.categoryIcon') }}</label>
            <div class="icon-picker">
              <button
                v-for="icon in categoryIcons"
                :key="icon"
                class="icon-option"
                :class="{ selected: categoryForm.icon === icon }"
                @click="categoryForm.icon = icon"
              >
                {{ icon }}
              </button>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showCategoryDialog = false">{{ t('common.cancel') }}</button>
          <button class="btn-save" @click="saveCategory">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>

    <!-- Import Help Dialog -->
    <div v-if="showImportHelp" class="dialog-overlay" @click="showImportHelp = false">
      <div class="dialog dialog-wide" @click.stop>
        <div class="dialog-header">
          <h4>{{ t('common.import') }} - {{ t('easyPrompts.importFormat') }}</h4>
          <button class="dialog-close" @click="showImportHelp = false">X</button>
        </div>
        <div class="dialog-content">
          <p class="import-hint">{{ t('easyPrompts.importHint') }}</p>
          <textarea class="import-example" readonly rows="20">{
  "version": "1.0",
  "data": {
    "categories": {
      "custom-12345": {
        "name": "My Category",
        "icon": "⭐",
        "prompts": [
          {
            "id": "prompt-12345",
            "label": "My Prompt",
            "text": "beautiful landscape",
            "subcategory": "Nature",
            "isCustom": true
          }
        ],
        "isCustom": true
      }
    }
  }
}</textarea>
          <p class="import-tip">{{ t('easyPrompts.importTip') }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showImportHelp = false">{{ t('common.close') }}</button>
          <button class="btn-save" @click="handleImportWithClose">{{ t('easyPrompts.selectFile') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Prompt Selector Panel */
.prompt-selector-panel {
  height: 100%;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Panel Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 2px solid #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: white;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.header-btn {
  height: 26px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.header-btn.text-btn {
  padding: 0 10px;
  white-space: nowrap;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Search Section */
.search-section {
  padding: 12px;
  border-bottom: 1px solid var(--color-border-primary);
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 13px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid var(--color-border-primary);
  overflow-x: auto;
}

.category-tab {
  padding: 5px 10px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  border-radius: 14px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
}

.category-tab:hover {
  border-color: #667eea;
  color: #667eea;
}

.category-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.category-tab.negative {
  border-color: #ff6b6b;
  color: #d32f2f;
}

.category-tab.negative:hover {
  background: #ffebee;
}

.category-tab.negative.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-color: #ff6b6b;
  color: white;
}

.category-tab.custom {
  border-style: dashed;
}

.custom-badge {
  font-size: 9px;
  color: #667eea;
  margin-left: 2px;
}

.category-tab.active .custom-badge {
  color: white;
}

/* Subcategory Tabs */
.subcategory-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-tertiary);
}

.subcategory-tab {
  padding: 3px 8px;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-bg-elevated);
  color: var(--color-text-tertiary);
  border-radius: 10px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.subcategory-tab:hover {
  border-color: #667eea;
  color: #667eea;
}

.subcategory-tab.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* Prompts Grid */
.prompts-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
  align-content: start;
}

.prompt-item {
  padding: 10px;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.prompt-item:hover {
  background: #e8eaf6;
  border-color: #667eea;
  transform: translateY(-1px);
}

.prompt-item.selected {
  border-color: #667eea;
  border-width: 2px;
  background: #e8eaf6;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.prompt-item.negative {
  border-color: #ffcdd2;
  background: #ffebee;
}

.prompt-item.negative:hover {
  border-color: #ff6b6b;
  background: #ffe0e0;
}

.prompt-item.custom {
  border-style: dashed;
}

.prompt-item.modified {
  border-color: #ffd54f;
}

.prompt-item.newly-added {
  border-color: #4caf50;
  border-width: 3px;
  animation: highlight-pulse 1.5s ease-in-out 2;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);
  }
}

/* Prompt Overlay */
.prompt-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.prompt-item:hover .prompt-overlay {
  opacity: 1;
}

.overlay-btn {
  height: 20px;
  padding: 0 8px;
  border: none;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  white-space: nowrap;
}

.overlay-btn.edit-btn {
  background: #667eea;
  color: white;
}

.overlay-btn.edit-btn:hover {
  background: #5568d9;
}

.overlay-btn.collect-btn {
  background: #4caf50;
  color: white;
  font-weight: bold;
  font-size: 14px;
  width: 20px;
  padding: 0;
}

.overlay-btn.collect-btn:hover {
  background: #43a047;
}

.overlay-btn.delete-btn {
  background: #ff6b6b;
  color: white;
}

.overlay-btn.delete-btn:hover {
  background: #ee5a5a;
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.prompt-category {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.prompt-label {
  font-size: 11px;
  font-weight: 600;
  color: #667eea;
}

.prompt-item.negative .prompt-label {
  color: #d32f2f;
}

.custom-indicator,
.modified-indicator {
  font-size: 9px;
  margin-left: 2px;
  color: #667eea;
}

.modified-indicator {
  color: #ffa000;
}

.prompt-subcategory {
  font-size: 9px;
  color: var(--color-text-tertiary);
  margin-bottom: 4px;
}

.prompt-text {
  font-size: 12px;
  color: var(--color-text-primary);
  line-height: 1.3;
  word-break: break-word;
}

.no-prompts {
  grid-column: 1 / -1;
  text-align: center;
  padding: 30px 20px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

/* Prompt Collector */
.collector-section {
  flex-shrink: 0;
  padding: 12px;
  border-top: 1px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
}

.collector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.collector-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.collector-actions {
  display: flex;
  gap: 6px;
}

.collector-btn {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.collector-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.collector-btn.copy-btn:hover {
  background: #e8eaf6;
}

.collector-btn.clear-btn {
  padding: 0 6px;
}

.collector-btn.clear-btn:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
  background: #ffebee;
}

.collector-textarea {
  width: 100%;
  min-height: 80px;
  max-height: 150px;
  padding: 10px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  resize: vertical;
  line-height: 1.4;
}

.collector-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.collector-textarea::placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* Action Panel */
.action-panel {
  flex-shrink: 0;
  padding: 12px;
  border-top: 2px solid var(--color-border-primary);
  background: var(--color-bg-tertiary);
}

.selected-info {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--color-text-primary);
}

.selected-info strong {
  color: #667eea;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.add-prompt-btn,
.add-negative-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-prompt-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.add-prompt-btn:hover {
  opacity: 0.9;
}

.add-negative-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
}

.add-negative-btn:hover {
  opacity: 0.9;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
}

.dialog {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dialog-header h4 {
  margin: 0;
  color: white;
  font-size: 14px;
}

.dialog-close {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-content {
  padding: 16px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  font-size: 13px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-option {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  border-color: #667eea;
}

.icon-option.selected {
  border-color: #667eea;
  background: #e8eaf6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-primary);
}

.btn-cancel,
.btn-save {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.btn-cancel:hover {
  background: var(--color-bg-secondary);
}

.btn-save {
  background: #667eea;
  color: white;
}

.btn-save:hover {
  background: #5568d9;
}

/* Scrollbar */
.prompts-grid::-webkit-scrollbar,
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.prompts-grid::-webkit-scrollbar-track,
.dialog-content::-webkit-scrollbar-track {
  background: var(--color-bg-tertiary);
}

.prompts-grid::-webkit-scrollbar-thumb,
.dialog-content::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

/* Import Help Dialog */
.dialog-wide {
  max-width: 550px;
}

.import-hint {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.import-example {
  width: 100%;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  padding: 12px;
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
  resize: none;
  cursor: text;
}

.import-tip {
  margin: 0;
  font-size: 12px;
  color: #667eea;
  font-style: italic;
}
</style>
