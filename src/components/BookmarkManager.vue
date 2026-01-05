<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookmarks } from '../composables/useBookmarks'
import { useIndexedDB } from '../composables/useIndexedDB'
import { logError } from '../composables/useErrorHandler'
import LazyImage from './LazyImage.vue'

const { t } = useI18n()
const indexedDB = useIndexedDB()

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
const fileInput = ref(null)

// Thumbnail management
const thumbnails = ref(new Map())  // bookmarkId → imageDataUrl
const showThumbnailPicker = ref(false)
const selectedImageForThumbnail = ref(null)
const targetBookmarkId = ref(null)
const generatedImages = ref([])

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
  exportBookmarks,
  importBookmarks,
  setBookmarkThumbnail,
  getBookmarkThumbnail,
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
    bookmarkId: selectedBookmark.value.id,
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

// Export bookmarks to JSON file
function handleExportBookmarks() {
  const result = exportBookmarks()
  if (result.success) {
    props.showToast?.(t('bookmark.exported', { count: result.count }), 'success')
  } else {
    props.showToast?.(t('bookmark.noBookmarksToExport'), 'warning')
  }
}

// Trigger file input for import
function handleImportBookmarks() {
  fileInput.value?.click()
}

// Handle file selection for import
async function handleFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const result = await importBookmarks(file)
    props.showToast?.(t('bookmark.imported', { count: result.count }), 'success')

    // Reset file input
    event.target.value = ''
  } catch (error) {
    logError(error, 'importBookmarks')
    props.showToast?.(t('bookmark.importFailed'), 'error')
  }
}

// Load thumbnails for all bookmarks (parallel loading)
async function loadThumbnails() {
  const promises = bookmarks.value
    .filter(bookmark => bookmark.thumbnailId)
    .map(async (bookmark) => {
      const thumbnailUrl = await getBookmarkThumbnail(bookmark.id, indexedDB)
      if (thumbnailUrl) {
        thumbnails.value.set(bookmark.id, thumbnailUrl)
      }
    })

  await Promise.all(promises)
}

// Open thumbnail picker
function openThumbnailPicker(bookmarkId) {
  targetBookmarkId.value = bookmarkId
  selectedImageForThumbnail.value = null
  showThumbnailPicker.value = true
}

// Close thumbnail picker
function closeThumbnailPicker() {
  showThumbnailPicker.value = false
  targetBookmarkId.value = null
  selectedImageForThumbnail.value = null
}

// Confirm thumbnail selection
function confirmThumbnailSelection() {
  if (selectedImageForThumbnail.value && targetBookmarkId.value) {
    setBookmarkThumbnail(targetBookmarkId.value, selectedImageForThumbnail.value.id)

    // Update local thumbnail map
    thumbnails.value.set(targetBookmarkId.value, selectedImageForThumbnail.value.image)

    props.showToast?.(t('bookmark.thumbnailSet'), 'success')
  }
  closeThumbnailPicker()
}

// Handle thumbnail load error
function handleThumbnailError(bookmarkId) {
  // Remove broken thumbnail
  thumbnails.value.delete(bookmarkId)
}

// Lifecycle
onMounted(async () => {
  loadBookmarks()

  // Load generated images for thumbnail picker
  try {
    generatedImages.value = await indexedDB.getRecentImages(200)
  } catch (error) {
    logError(error, 'loadGeneratedImages')
  }

  // Load thumbnails
  await loadThumbnails()
})
</script>

<template>
  <div class="bookmark-manager-panel">
    <div class="panel-header">
      <h3>{{ $t('bookmark.promptBookmarks') }}</h3>
      <div class="header-actions">
        <button
          class="import-btn"
          @click="handleImportBookmarks"
          :title="$t('bookmark.import')"
        >
          📥
        </button>
        <button
          class="export-btn"
          @click="handleExportBookmarks"
          :title="$t('bookmark.export')"
        >
          📤
        </button>
        <button class="add-btn" @click="openAddDialog">
          {{ $t('bookmark.addNew') }}
        </button>
        <button class="close-btn" @click="close">✕</button>
      </div>
    </div>

    <!-- Hidden file input for import -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileSelected"
    >

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

    <!-- Bookmarks Grid -->
    <div class="bookmarks-grid">
      <div
        v-for="bookmark in filteredBookmarks"
        :key="bookmark.id"
        class="bookmark-card"
        :class="{ selected: selectedBookmark?.id === bookmark.id }"
        @click="selectBookmark(bookmark)"
      >
        <!-- Thumbnail (180×180px) -->
        <div class="bookmark-thumbnail">
          <!-- Real thumbnail if available -->
          <LazyImage
            v-if="thumbnails.get(bookmark.id)"
            :src="thumbnails.get(bookmark.id)"
            :alt="bookmark.name"
          />
          <!-- Placeholder with initials -->
          <div v-else class="no-thumbnail-placeholder">
            <span>{{ bookmark.name.substring(0, 2).toUpperCase() }}</span>
          </div>

          <!-- Overlay buttons (shown on hover) -->
          <div class="thumbnail-overlay">
            <button
              class="overlay-btn thumbnail-btn"
              @click.stop="openThumbnailPicker(bookmark.id)"
              :title="$t('bookmark.setThumbnail')"
            >
              🖼️
            </button>
            <button
              class="overlay-btn edit-btn"
              @click.stop="handleEditBookmark(bookmark, $event)"
              :title="$t('common.edit')"
            >
              ✏️
            </button>
            <button
              class="overlay-btn delete-btn"
              @click.stop="handleDeleteBookmark(bookmark, $event)"
              :title="$t('common.delete')"
            >
              🗑️
            </button>
          </div>
        </div>

        <!-- Name (60px) -->
        <div class="bookmark-name" :title="bookmark.name">
          {{ bookmark.name }}
        </div>

        <!-- Updated badge -->
        <div v-if="bookmark.updatedAt" class="updated-badge" :title="bookmark.updatedAt">
          ✏️
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
              rows="8"
            ></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('bookmark.negativePrompt') }}</label>
            <textarea
              v-model="bookmarkNegativePrompt"
              :placeholder="$t('bookmark.negativePromptPlaceholder')"
              class="form-textarea"
              rows="6"
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

    <!-- Thumbnail Picker Modal -->
    <div v-if="showThumbnailPicker" class="dialog-overlay" @click="closeThumbnailPicker">
      <div class="dialog thumbnail-picker-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ $t('bookmark.selectThumbnail') }}</h3>
          <button class="close-btn" @click="closeThumbnailPicker">✕</button>
        </div>
        <div class="dialog-content">
          <p class="picker-hint">{{ $t('bookmark.selectThumbnailHint') }}</p>
          <div class="history-grid">
            <div
              v-for="image in generatedImages"
              :key="image.id"
              class="history-thumbnail"
              :class="{ selected: selectedImageForThumbnail?.id === image.id }"
              @click="selectedImageForThumbnail = image"
            >
              <LazyImage :src="image.image" :alt="`Image ${image.id}`" />
            </div>
          </div>
          <div v-if="generatedImages.length === 0" class="no-images">
            {{ $t('history.noImages') }}
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="closeThumbnailPicker">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="save-btn"
            @click="confirmThumbnailSelection"
            :disabled="!selectedImageForThumbnail"
          >
            {{ $t('common.apply') }}
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
  background: var(--color-bg-elevated);
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
  color: var(--color-text-inverse);
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
  color: var(--color-text-inverse);
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
  border: 2px solid var(--color-text-inverse);
  background: transparent;
  color: var(--color-text-inverse);
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.import-btn,
.export-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  color: var(--color-text-inverse);
  border: 2px solid var(--color-text-inverse);
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-btn:hover,
.export-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Search */
.search-section {
  padding: 16px;
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--color-border-primary);
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  margin-bottom: 8px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.bookmark-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: right;
}

/* Bookmarks Grid */
.bookmarks-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, 180px);
  gap: 12px;
  align-content: start;
  justify-content: start;
}

.bookmark-card {
  background: var(--color-bg-elevated);
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  height: 240px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.bookmark-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.bookmark-card.selected {
  border-color: #667eea;
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.bookmark-thumbnail {
  width: 100%;
  height: 180px;
  background: var(--color-bg-tertiary);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.bookmark-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-text-inverse);
  font-size: 48px;
  font-weight: 700;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.bookmark-card:hover .thumbnail-overlay {
  opacity: 1;
}

.overlay-btn {
  width: 36px;
  height: 36px;
  background: var(--color-bg-elevated);
  border: none;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.overlay-btn:hover {
  transform: scale(1.1);
}

.overlay-btn.edit-btn:hover {
  background: #fff3cd;
}

.overlay-btn.delete-btn:hover {
  background: #f8d7da;
}

.bookmark-name {
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

.updated-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: rgba(245, 158, 11, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.empty-state,
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-tertiary);
}

.add-first-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-text-inverse);
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
  background: var(--color-bg-elevated);
}

.selected-info {
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--color-text-primary);
}

.selected-info strong {
  color: #667eea;
}

.apply-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-text-inverse);
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
  max-width: 800px;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  cursor: default;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
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
  color: var(--color-text-inverse);
  font-size: 18px;
}

.dialog-content {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 15px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
  line-height: 1.6;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--color-border-primary);
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
  color: var(--color-text-secondary);
}

.cancel-btn:hover {
  background: var(--color-bg-hover);
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-text-inverse);
}

.save-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Scrollbar */
.bookmarks-grid::-webkit-scrollbar,
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.bookmarks-grid::-webkit-scrollbar-track,
.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.bookmarks-grid::-webkit-scrollbar-thumb,
.dialog-content::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.bookmarks-grid::-webkit-scrollbar-thumb:hover,
.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}

/* Apply Mode Selector */
.apply-mode-section {
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.mode-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
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
  color: var(--color-text-secondary);
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
  background: linear-gradient(90deg, var(--color-border-primary) 0%, var(--color-border-primary) 100%);
}

/* Thumbnail Picker Modal */
.thumbnail-picker-dialog {
  max-width: 800px;
  max-height: 90vh;
}

.picker-hint {
  margin-bottom: 16px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 120px);
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.history-thumbnail {
  width: 120px;
  height: 120px;
  cursor: pointer;
  border: 2px solid var(--color-border-primary);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s;
}

.history-thumbnail:hover {
  border-color: #667eea;
  transform: scale(1.05);
}

.history-thumbnail.selected {
  border-color: #667eea;
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.history-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-images {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-tertiary);
  font-size: 14px;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn:disabled:hover {
  transform: none;
}
</style>
