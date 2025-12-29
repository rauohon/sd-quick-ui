<script setup>
import { ref, computed } from 'vue'
import { promptCategories as importedCategories } from '../data/promptsData.js'

// Props
const props = defineProps({
  showToast: Function,
})

// Emits
const emit = defineEmits(['addPrompt', 'addNegative', 'close'])

// State
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedPrompt = ref(null)

// Use imported data
const promptCategories = ref(importedCategories)

// Computed
const categories = computed(() => {
  return Object.keys(promptCategories.value)
})

const filteredPrompts = computed(() => {
  let prompts = []

  if (selectedCategory.value === 'all') {
    // Show all prompts from all categories
    Object.entries(promptCategories.value).forEach(([key, category]) => {
      prompts.push(...category.prompts.map(p => ({
        ...p,
        categoryKey: key,
        categoryName: category.name,
        categoryIcon: category.icon
      })))
    })
  } else {
    // Show prompts from selected category
    const category = promptCategories.value[selectedCategory.value]
    if (category) {
      prompts = category.prompts.map(p => ({
        ...p,
        categoryKey: selectedCategory.value,
        categoryName: category.name,
        categoryIcon: category.icon
      }))
    }
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
  props.showToast?.(`Added to Negative: ${prompt.label}`, 'success')
}

function addToPrompt() {
  if (!selectedPrompt.value) return

  emit('addPrompt', selectedPrompt.value.text)
  props.showToast?.(`Added to Prompt: ${selectedPrompt.value.label}`, 'success')
  selectedPrompt.value = null
}

function addToNegative() {
  if (!selectedPrompt.value) return

  emit('addNegative', selectedPrompt.value.text)
  props.showToast?.(`Added to Negative: ${selectedPrompt.value.label}`, 'success')
  selectedPrompt.value = null
}

function close() {
  emit('close')
  selectedPrompt.value = null
}
</script>

<template>
  <div class="prompt-selector-panel">
    <div class="panel-header">
      <h3>✨ Easy Prompts</h3>
      <button class="close-btn" @click="close">✕</button>
    </div>

      <!-- Search Bar -->
      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Search prompts..."
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
          🌟 All
        </button>
        <button
          v-for="(category, key) in promptCategories"
          :key="key"
          class="category-tab"
          :class="{
            active: selectedCategory === key,
            negative: key === '부정'
          }"
          @click="selectCategory(key)"
        >
          {{ category.icon }} {{ category.name }}
        </button>
      </div>

      <!-- Prompts Grid -->
      <div class="prompts-grid">
        <div
          v-for="(prompt, index) in filteredPrompts"
          :key="index"
          class="prompt-item"
          :class="{
            selected: selectedPrompt?.text === prompt.text,
            negative: prompt.categoryKey === '부정'
          }"
          @click="selectPrompt(prompt)"
        >
          <div class="prompt-header">
            <span class="prompt-category">{{ prompt.categoryIcon }} {{ prompt.categoryName }}</span>
            <span class="prompt-label">{{ prompt.label }}</span>
          </div>
          <div class="prompt-text">{{ prompt.text }}</div>
        </div>

        <div v-if="filteredPrompts.length === 0" class="no-prompts">
          검색 결과가 없습니다
        </div>
      </div>

    <!-- Action Buttons -->
    <div v-if="selectedPrompt" class="action-panel">
      <div class="selected-info">
        <strong>Selected:</strong> {{ selectedPrompt.label }}
      </div>
      <div class="action-buttons">
        <button @click="addToPrompt" class="add-prompt-btn">
          ➕ Add to Prompt
        </button>
        <button @click="addToNegative" class="add-negative-btn">
          ➖ Add to Negative
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Prompt Selector Panel */
.prompt-selector-panel {
  height: 100%;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  display: flex !important;
  grid-template-columns: unset !important;
  gap: 0;
}

/* Panel Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 2px solid #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: white;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Search Section */
.search-section {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
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
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;
}

.category-tab {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  color: #666;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
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
  background: #ffebee;
}

.category-tab.negative:hover {
  background: #ffcdd2;
}

.category-tab.negative.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-color: #ff6b6b;
  color: white;
}

/* Prompts Grid */
.prompts-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  align-content: start;
}

.prompt-item {
  padding: 12px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.prompt-item:hover {
  background: #e8eaf6;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.prompt-item.selected {
  border-color: #667eea;
  border-width: 3px;
  background: #e8eaf6;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.prompt-item.negative {
  border-color: #ffcdd2;
  background: #ffebee;
}

.prompt-item.negative:hover {
  border-color: #ff6b6b;
  background: #ffe0e0;
}

.prompt-item.negative .prompt-label {
  color: #d32f2f;
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.prompt-category {
  font-size: 11px;
  color: #999;
}

.prompt-label {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
}

.prompt-text {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.no-prompts {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

/* Action Panel */
.action-panel {
  flex-shrink: 0;
  padding: 20px;
  border-top: 2px solid #e0e0e0;
  background: #fafafa;
}

.selected-info {
  margin-bottom: 16px;
  font-size: 14px;
  color: #333;
}

.selected-info strong {
  color: #667eea;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.add-prompt-btn,
.add-negative-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
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
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.add-negative-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
}

.add-negative-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

/* Scrollbar Styling */
.prompts-grid::-webkit-scrollbar {
  width: 6px;
}

.prompts-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.prompts-grid::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.prompts-grid::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}
</style>
