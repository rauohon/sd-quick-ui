<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePresets } from '../composables/usePresets'

const { t } = useI18n()

// Props
const props = defineProps({
  showToast: Function,
  currentParams: Object, // 현재 설정값을 받아서 저장
})

// Emits
const emit = defineEmits(['close', 'applyPreset'])

// Use composable
const { presets, loadPresets, addPreset, updatePreset, deletePreset, searchPresets } = usePresets()

// State
const searchQuery = ref('')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingPreset = ref(null)
const deletingPreset = ref(null)

// Form data
const presetName = ref('')
const presetDescription = ref('')

// Computed
const filteredPresets = computed(() => searchPresets(searchQuery.value))

// Methods
function openAddDialog() {
  presetName.value = ''
  presetDescription.value = ''
  showAddDialog.value = true
}

function closeAddDialog() {
  showAddDialog.value = false
  presetName.value = ''
  presetDescription.value = ''
}

function handleAddPreset() {
  if (!presetName.value.trim()) {
    props.showToast?.(t('preset.nameRequiredError'), 'error')
    return
  }

  if (!props.currentParams) {
    props.showToast?.(t('preset.noSettings'), 'error')
    return
  }

  const preset = addPreset(presetName.value, presetDescription.value, props.currentParams)
  props.showToast?.(t('preset.savedWithName', { name: preset.name }), 'success')
  closeAddDialog()
}

function openEditDialog(preset) {
  editingPreset.value = preset
  presetName.value = preset.name
  presetDescription.value = preset.description
  showEditDialog.value = true
}

function closeEditDialog() {
  showEditDialog.value = false
  editingPreset.value = null
  presetName.value = ''
  presetDescription.value = ''
}

function handleUpdatePreset() {
  if (!presetName.value.trim()) {
    props.showToast?.(t('preset.nameRequiredError'), 'error')
    return
  }

  updatePreset(editingPreset.value.id, {
    name: presetName.value,
    description: presetDescription.value,
  })
  props.showToast?.(t('preset.updated'), 'success')
  closeEditDialog()
}

function openDeleteConfirm(preset) {
  deletingPreset.value = preset
  showDeleteConfirm.value = true
}

function closeDeleteConfirm() {
  showDeleteConfirm.value = false
  deletingPreset.value = null
}

function handleDeletePreset() {
  deletePreset(deletingPreset.value.id)
  props.showToast?.(t('preset.deleted'), 'success')
  closeDeleteConfirm()
}

function applyPreset(preset) {
  emit('applyPreset', preset.params)
  props.showToast?.(t('preset.appliedWithName', { name: preset.name }), 'success')
}

function close() {
  emit('close')
}

function getPresetSummary(params) {
  return `${params.samplerName} | ${params.steps}steps | CFG${params.cfgScale} | ${params.width}x${params.height}`
}

// Load presets on mount
onMounted(() => {
  loadPresets()
})
</script>

<template>
  <div class="preset-manager-panel">
    <div class="panel-header">
      <h3>{{ $t('preset.manager') }}</h3>
      <div class="header-actions">
        <button class="add-btn" @click="openAddDialog" :title="$t('preset.saveCurrentTooltip')">
          {{ $t('preset.addNew') }}
        </button>
        <button class="close-btn" @click="close">✕</button>
      </div>
    </div>

    <div class="search-section">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="$t('preset.searchPlaceholder')"
        class="search-input"
      >
      <div class="preset-count" v-if="presets.length > 0">
        {{ filteredPresets.length }} / {{ presets.length }} {{ $t('preset.presets') }}
      </div>
    </div>

    <div class="preset-list">
      <div
        v-for="preset in filteredPresets"
        :key="preset.id"
        class="preset-item"
      >
        <div class="preset-header">
          <div class="preset-name">{{ preset.name }}</div>
          <div class="preset-actions">
            <button class="action-btn apply-btn" @click="applyPreset(preset)" :title="$t('preset.applyTooltip')">
              ✓
            </button>
            <button class="action-btn edit-btn" @click="openEditDialog(preset)" :title="$t('common.edit')">
              ✏️
            </button>
            <button class="action-btn delete-btn" @click="openDeleteConfirm(preset)" :title="$t('common.delete')">
              🗑️
            </button>
          </div>
        </div>
        <div class="preset-summary">{{ getPresetSummary(preset.params) }}</div>
        <div v-if="preset.description" class="preset-description">{{ preset.description }}</div>
        <div class="preset-date">{{ preset.createdAt }}</div>
      </div>

      <div v-if="filteredPresets.length === 0 && presets.length === 0" class="empty-state">
        <p>{{ $t('preset.noPresets') }}</p>
        <button class="add-preset-btn" @click="openAddDialog">
          {{ $t('preset.addFirst') }}
        </button>
      </div>

      <div v-if="filteredPresets.length === 0 && presets.length > 0" class="empty-state">
        <p>{{ $t('preset.noSearchResults') }}</p>
      </div>
    </div>

    <!-- Add Dialog -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="closeAddDialog">
      <div class="dialog" @click.stop>
        <h3>{{ $t('preset.newPreset') }}</h3>
        <div class="form-group">
          <label>{{ $t('preset.nameRequired') }}</label>
          <input
            v-model="presetName"
            type="text"
            :placeholder="$t('preset.namePlaceholder')"
            @keyup.enter="handleAddPreset"
          >
        </div>
        <div class="form-group">
          <label>{{ $t('preset.descriptionOptional') }}</label>
          <textarea
            v-model="presetDescription"
            :placeholder="$t('preset.descriptionPlaceholder')"
            rows="3"
          ></textarea>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="closeAddDialog">{{ $t('common.cancel') }}</button>
          <button class="confirm-btn" @click="handleAddPreset">{{ $t('common.save') }}</button>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="closeEditDialog">
      <div class="dialog" @click.stop>
        <h3>{{ $t('preset.editPreset') }}</h3>
        <div class="form-group">
          <label>{{ $t('preset.nameRequired') }}</label>
          <input
            v-model="presetName"
            type="text"
            @keyup.enter="handleUpdatePreset"
          >
        </div>
        <div class="form-group">
          <label>{{ $t('preset.descriptionOptional') }}</label>
          <textarea
            v-model="presetDescription"
            rows="3"
          ></textarea>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="closeEditDialog">{{ $t('common.cancel') }}</button>
          <button class="confirm-btn" @click="handleUpdatePreset">{{ $t('common.edit') }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="showDeleteConfirm" class="dialog-overlay" @click="closeDeleteConfirm">
      <div class="dialog confirm-dialog" @click.stop>
        <h3>{{ $t('preset.delete') }}</h3>
        <p>{{ $t('preset.deleteConfirmWithName', { name: deletingPreset?.name }) }}</p>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="closeDeleteConfirm">{{ $t('common.cancel') }}</button>
          <button class="delete-confirm-btn" @click="handleDeletePreset">{{ $t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preset-manager-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  flex: 1;
  display: flex !important;
  grid-template-columns: unset !important;
  gap: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.add-btn {
  height: 32px;
  padding: 0 14px;
  background: white;
  color: #10b981;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: 2px solid white;
  background: transparent;
  color: white;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: white;
  color: #10b981;
}

.search-section {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
}

.preset-count {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.preset-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.preset-item {
  padding: 14px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.preset-item:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preset-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.preset-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apply-btn {
  background: #10b981;
  color: white;
}

.apply-btn:hover {
  background: #059669;
}

.edit-btn {
  background: #f59e0b;
  color: white;
}

.edit-btn:hover {
  background: #d97706;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.preset-summary {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-family: monospace;
}

.preset-description {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
  font-style: italic;
}

.preset-date {
  font-size: 11px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 14px;
}

.add-preset-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-preset-btn:hover {
  opacity: 0.9;
}

/* Dialog Styles */
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
  z-index: 5000;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #10b981;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.confirm-btn,
.delete-confirm-btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #e5e7eb;
  color: #555;
}

.cancel-btn:hover {
  background: #d1d5db;
}

.confirm-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.confirm-btn:hover {
  opacity: 0.9;
}

.delete-confirm-btn {
  background: #ef4444;
  color: white;
}

.delete-confirm-btn:hover {
  background: #dc2626;
}

.confirm-dialog p {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}
</style>
