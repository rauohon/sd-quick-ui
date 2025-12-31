<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookmarks } from '../composables/useBookmarks'

const { t } = useI18n()

// Props
const props = defineProps({
  showToast: Function,
  showConfirm: Function,
})

// Emits
const emit = defineEmits(['applyBookmark', 'close'])

// State
const searchQuery = ref('')
const selectedBookmark = ref(null)
const showAddDialog = ref(false)
const editingBookmark = ref(null)
const applyMode = ref('replace') // 'replace' | 'prepend' | 'append'

// Form state
const bookmarkName = ref('')
const bookmarkPrompt = ref('')
const bookmarkNegativePrompt = ref('')

// Composable
const {
  bookmarks,
  loadBookmarks,
  addBookmark,
  updateBookmark,
  deleteBookmark,
  searchBookmarks,
} = useBookmarks()

// Computed
const filteredBookmarks = computed(() => {
  return searchBookmarks(searchQuery.value)
})

// Methods
function openAddDialog() {
  editingBookmark.value = null
  bookmarkName.value = ''
  bookmarkPrompt.value = ''
  bookmarkNegativePrompt.value = ''
  showAddDialog.value = true
}

function openEditDialog(bookmark) {
  editingBookmark.value = bookmark
  bookmarkName.value = bookmark.name
  bookmarkPrompt.value = bookmark.prompt
  bookmarkNegativePrompt.value = bookmark.negativePrompt
  showAddDialog.value = true
}

function closeDialog() {
  showAddDialog.value = false
  editingBookmark.value = null
}

function saveBookmark() {
  if (!bookmarkName.value.trim()) {
    props.showToast?.(t('bookmark.nameRequiredError'), 'error')
    return
  }

  if (editingBookmark.value) {
    // Update existing
    updateBookmark(editingBookmark.value.id, {
      name: bookmarkName.value,
      prompt: bookmarkPrompt.value,
      negativePrompt: bookmarkNegativePrompt.value,
    })
    props.showToast?.(t('bookmark.updated'), 'success')
  } else {
    // Add new
    addBookmark(
      bookmarkName.value,
      bookmarkPrompt.value,
      bookmarkNegativePrompt.value
    )
    props.showToast?.(t('bookmark.added'), 'success')
  }

  closeDialog()
}

function selectBookmark(bookmark) {
  selectedBookmark.value = bookmark
}

function applyBookmark() {
  if (!selectedBookmark.value) return

  emit('applyBookmark', {
    prompt: selectedBookmark.value.prompt,
    negativePrompt: selectedBookmark.value.negativePrompt,
    mode: applyMode.value,
  })
  props.showToast?.(t('bookmark.applied', { name: selectedBookmark.value.name }), 'success')
}

async function handleDeleteBookmark(bookmark, event) {
  event.stopPropagation()

  const confirmed = await props.showConfirm?.({
    title: t('bookmark.deleteTitle'),
    message: t('bookmark.deleteConfirmWithName', { name: bookmark.name }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel')
  })

  if (confirmed) {
    deleteBookmark(bookmark.id)
    if (selectedBookmark.value?.id === bookmark.id) {
      selectedBookmark.value = null
    }
    props.showToast?.(t('bookmark.deleted'), 'success')
  }
}

function handleEditBookmark(bookmark, event) {
  event.stopPropagation()
  openEditDialog(bookmark)
}

function close() {
  emit('close')
}

// Lifecycle
onMounted(() => {
  loadBookmarks()
})
</script>

<template>
  <div class="bookmark-manager-panel">
    <div class="panel-header">
      <h3>{{ $t('bookmark.promptBookmarks') }}</h3>
      <div class="header-actions">
        <button class="add-btn" @click="openAddDialog">
          {{ $t('bookmark.addNew') }}
        </button>
        <button class="close-btn" @click="close">✕</button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="$t('bookmark.searchPlaceholder')"
        class="search-input"
      >
      <div class="bookmark-count" v-if="bookmarks.length > 0">
        {{ filteredBookmarks.length }} / {{ bookmarks.length }} {{ $t('bookmark.bookmarks') }}
      </div>
    </div>

    <!-- Apply Mode Selector -->
    <div class="apply-mode-section">
      <div class="mode-label">{{ $t('bookmark.applyMode') }}</div>
      <div class="mode-options">
        <label class="mode-option">
          <input
            type="radio"
            :value="'replace'"
            v-model="applyMode"
            :disabled="!selectedBookmark"
          >
          <span>{{ $t('bookmark.applyModeReplace') }}</span>
        </label>
        <label class="mode-option">
          <input
            type="radio"
            :value="'prepend'"
            v-model="applyMode"
            :disabled="!selectedBookmark"
          >
          <span>{{ $t('bookmark.applyModePrepend') }}</span>
        </label>
        <label class="mode-option">
          <input
            type="radio"
            :value="'append'"
            v-model="applyMode"
            :disabled="!selectedBookmark"
          >
          <span>{{ $t('bookmark.applyModeAppend') }}</span>
        </label>
      </div>
    </div>

    <!-- Divider -->
    <div class="mode-divider"></div>

    <!-- Bookmarks List -->
    <div class="bookmarks-list">
      <div
        v-for="bookmark in filteredBookmarks"
        :key="bookmark.id"
        class="bookmark-item"
        :class="{ selected: selectedBookmark?.id === bookmark.id }"
        @click="selectBookmark(bookmark)"
      >
        <div class="bookmark-header">
          <h4 class="bookmark-name">{{ bookmark.name }}</h4>
          <div class="bookmark-actions">
            <button
              class="icon-btn edit-btn"
              @click="handleEditBookmark(bookmark, $event)"
              :title="$t('common.edit')"
            >
              ✏️
            </button>
            <button
              class="icon-btn delete-btn"
              @click="handleDeleteBookmark(bookmark, $event)"
              :title="$t('common.delete')"
            >
              🗑️
            </button>
          </div>
        </div>
        <div class="bookmark-content">
          <div class="bookmark-prompt">
            <strong>{{ $t('prompt.title') }}:</strong> {{ bookmark.prompt || $t('bookmark.none') }}
          </div>
          <div class="bookmark-negative" v-if="bookmark.negativePrompt">
            <strong>{{ $t('bookmark.negativePrompt') }}:</strong> {{ bookmark.negativePrompt }}
          </div>
        </div>
        <div class="bookmark-footer">
          <span class="bookmark-date">{{ bookmark.createdAt }}</span>
        </div>
      </div>

      <div v-if="filteredBookmarks.length === 0 && bookmarks.length > 0" class="no-results">
        {{ $t('bookmark.noSearchResults') }}
      </div>

      <div v-if="bookmarks.length === 0" class="empty-state">
        <p>{{ $t('bookmark.noBookmarks') }}</p>
        <button class="add-first-btn" @click="openAddDialog">
          {{ $t('bookmark.addFirst') }}
        </button>
      </div>
    </div>

    <!-- Apply Button -->
    <div v-if="selectedBookmark" class="action-panel">
      <div class="selected-info">
        <strong>{{ $t('bookmark.selected') }}</strong> {{ selectedBookmark.name }}
      </div>
      <button @click="applyBookmark" class="apply-btn">
        {{ $t('bookmark.applyPrompt') }}
      </button>
    </div>

    <!-- Add/Edit Dialog -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingBookmark ? $t('bookmark.editBookmark') : $t('bookmark.newBookmark') }}</h3>
          <button class="close-btn" @click="closeDialog">✕</button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>{{ $t('bookmark.nameRequired') }}</label>
            <input
              v-model="bookmarkName"
              type="text"
              :placeholder="$t('bookmark.namePlaceholder')"
              class="form-input"
              @keyup.enter="saveBookmark"
            >
          </div>
          <div class="form-group">
            <label>{{ $t('prompt.title') }}</label>
            <textarea
              v-model="bookmarkPrompt"
              :placeholder="$t('bookmark.promptPlaceholder')"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('bookmark.negativePrompt') }}</label>
            <textarea
              v-model="bookmarkNegativePrompt"
              :placeholder="$t('bookmark.negativePromptPlaceholder')"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="closeDialog">{{ $t('common.cancel') }}</button>
          <button class="save-btn" @click="saveBookmark">
            {{ editingBookmark ? $t('common.edit') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Panel */
.bookmark-manager-panel {
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.add-btn {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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

/* Search */
.search-section {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  margin-bottom: 8px;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.bookmark-count {
  font-size: 12px;
  color: #666;
  text-align: right;
}

/* Bookmarks List */
.bookmarks-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.bookmark-item {
  margin-bottom: 12px;
  padding: 14px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.bookmark-item:hover {
  background: #e8eaf6;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.15);
}

.bookmark-item.selected {
  border-color: #667eea;
  border-width: 3px;
  background: #e8eaf6;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.bookmark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.bookmark-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.bookmark-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  transform: scale(1.1);
}

.edit-btn:hover {
  background: #fff3cd;
}

.delete-btn:hover {
  background: #f8d7da;
}

.bookmark-content {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.bookmark-prompt,
.bookmark-negative {
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bookmark-prompt strong,
.bookmark-negative strong {
  color: #667eea;
  font-size: 12px;
}

.bookmark-footer {
  display: flex;
  justify-content: flex-end;
}

.bookmark-date {
  font-size: 11px;
  color: #999;
}

.empty-state,
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.add-first-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-first-btn:hover {
  opacity: 0.9;
}

/* Action Panel */
.action-panel {
  flex-shrink: 0;
  padding: 16px 20px;
  border-top: 2px solid #e0e0e0;
  background: #fafafa;
}

.selected-info {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.selected-info strong {
  color: #667eea;
}

.apply-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  cursor: pointer;
}

.dialog {
  width: 90%;
  max-width: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  cursor: default;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 12px 0 0;
}

.dialog-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.dialog-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.save-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #e0e0e0;
  color: #666;
}

.cancel-btn:hover {
  background: #d0d0d0;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.save-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Scrollbar */
.bookmarks-list::-webkit-scrollbar,
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.bookmarks-list::-webkit-scrollbar-track,
.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.bookmarks-list::-webkit-scrollbar-thumb,
.dialog-content::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.bookmarks-list::-webkit-scrollbar-thumb:hover,
.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}

/* Apply Mode Selector */
.apply-mode-section {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.mode-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.mode-options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  user-select: none;
}

.mode-option input[type="radio"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #667eea;
}

.mode-option input[type="radio"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.mode-option span {
  font-weight: 500;
}

.mode-divider {
  height: 1px;
  background: linear-gradient(90deg, #e0e0e0 0%, #e0e0e0 100%);
}
</style>
