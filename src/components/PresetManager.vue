<script setup>
/**
 * PresetManager.vue - 프리셋 관리 컴포넌트
 *
 * 리팩토링 분석 (2026-01-01):
 * - 코드 라인: 406 (script 169 + template 237)
 * - Scoped CSS: 489 라인 (분리 불필요)
 *
 * 현재 구조가 적절한 이유:
 * 1. Add/Edit 다이얼로그가 의도적으로 분리됨
 *    - Add: 저장될 값 미리보기(Save Preview) 섹션 포함
 *    - Edit: 이름/설명만 수정 (파라미터 변경 불가)
 *    - 기능이 다르므로 통합 시 오히려 복잡해짐
 *
 * 2. getParam, getPresetSummary 유틸 함수
 *    - 이 컴포넌트에서만 사용됨
 *    - 외부 분리 시 오히려 관리 복잡해짐
 *
 * 3. usePresets composable 이미 분리됨
 *    - CRUD 로직이 composable로 분리되어 있음
 *    - 컴포넌트는 UI 로직만 담당
 */
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
const expandedPresetId = ref(null)

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

// Helper to safely access params (handles both camelCase and snake_case)
function getParam(params, camelKey, snakeKey, defaultValue = '') {
  return params[camelKey] ?? params[snakeKey] ?? defaultValue
}

function getPresetSummary(params) {
  const parts = []

  // Core settings
  const sampler = getParam(params, 'samplerName', 'sampler_name', 'Unknown')
  const steps = getParam(params, 'steps', 'steps', 20)
  const cfg = getParam(params, 'cfgScale', 'cfg_scale', 7)
  const width = getParam(params, 'width', 'width', 512)
  const height = getParam(params, 'height', 'height', 512)
  const scheduler = getParam(params, 'scheduler', 'scheduler', '')

  parts.push(`${sampler}${scheduler ? ` (${scheduler})` : ''} | ${steps}steps | CFG${cfg} | ${width}×${height}`)

  // Batch settings
  const batchCount = getParam(params, 'batchCount', 'batch_count', 1)
  const batchSize = getParam(params, 'batchSize', 'batch_size', 1)
  if (batchCount > 1 || batchSize > 1) {
    parts.push(`Batch: ${batchCount}×${batchSize}=${batchCount * batchSize}img`)
  }

  // Hires Fix
  const enableHr = getParam(params, 'enable_hr', 'enable_hr', false)
  if (enableHr) {
    const hrUpscaler = getParam(params, 'hrUpscaler', 'hr_upscaler', 'Latent')
    const hrScale = getParam(params, 'hrUpscale', 'hr_scale', 2)
    parts.push(`Hires: ${hrUpscaler} ${hrScale}x`)
  }

  // ADetailer
  const adetailers = params.adetailers || []
  const enabledCount = adetailers.filter(ad => ad.enable).length
  if (enabledCount > 0) {
    parts.push(`AD: ${enabledCount}`)
  }

  return parts.join(' | ')
}

function togglePresetDetails(presetId) {
  expandedPresetId.value = expandedPresetId.value === presetId ? null : presetId
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
        <div class="preset-summary" @click.stop="togglePresetDetails(preset.id)">
          {{ getPresetSummary(preset.params) }}
          <span class="expand-icon">{{ expandedPresetId === preset.id ? '▼' : '▶' }}</span>
        </div>
        <div v-if="expandedPresetId === preset.id" class="preset-details">
          <div class="detail-row">
            <span class="detail-label">Steps:</span>
            <span class="detail-value">{{ getParam(preset.params, 'steps', 'steps', 20) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">CFG Scale:</span>
            <span class="detail-value">{{ getParam(preset.params, 'cfgScale', 'cfg_scale', 7) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Sampler:</span>
            <span class="detail-value">{{ getParam(preset.params, 'samplerName', 'sampler_name', 'Unknown') }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Scheduler:</span>
            <span class="detail-value">{{ getParam(preset.params, 'scheduler', 'scheduler', 'Automatic') }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Size:</span>
            <span class="detail-value">{{ getParam(preset.params, 'width', 'width', 512) }}×{{ getParam(preset.params, 'height', 'height', 512) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Batch Count:</span>
            <span class="detail-value">{{ getParam(preset.params, 'batchCount', 'batch_count', 1) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Batch Size:</span>
            <span class="detail-value">{{ getParam(preset.params, 'batchSize', 'batch_size', 1) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Seed:</span>
            <span class="detail-value">{{ getParam(preset.params, 'seed', 'seed', -1) }}</span>
          </div>
          <div v-if="getParam(preset.params, 'enable_hr', 'enable_hr', false)" class="detail-section">
            <div class="detail-section-title">Hires Fix</div>
            <div class="detail-row">
              <span class="detail-label">Upscaler:</span>
              <span class="detail-value">{{ getParam(preset.params, 'hrUpscaler', 'hr_upscaler', 'Latent') }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Scale:</span>
              <span class="detail-value">{{ getParam(preset.params, 'hrUpscale', 'hr_scale', 2) }}x</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Steps:</span>
              <span class="detail-value">{{ getParam(preset.params, 'hrSteps', 'hr_steps', 0) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Denoising:</span>
              <span class="detail-value">{{ getParam(preset.params, 'denoisingStrength', 'denoising_strength', 0.7) }}</span>
            </div>
          </div>
          <div v-if="preset.params.adetailers && preset.params.adetailers.length > 0" class="detail-section">
            <div class="detail-section-title">ADetailer</div>
            <div class="detail-row">
              <span class="detail-label">Enabled:</span>
              <span class="detail-value">{{ preset.params.adetailers.filter(ad => ad.enable).length }} / {{ preset.params.adetailers.length }}</span>
            </div>
          </div>
        </div>
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
      <div class="dialog dialog-large" @click.stop>
        <h3>{{ $t('preset.newPreset') }}</h3>

        <!-- Preview of values to be saved -->
        <div class="save-preview-section">
          <div class="preview-header">
            <span class="preview-icon">📋</span>
            <span class="preview-title">저장될 설정값</span>
          </div>
          <div class="preview-content" v-if="currentParams">
            <div class="preview-summary">{{ getPresetSummary(currentParams) }}</div>
            <div class="preview-details">
              <div class="preview-grid">
                <div class="preview-item">
                  <span class="preview-label">Sampler:</span>
                  <span class="preview-value">{{ getParam(currentParams, 'samplerName', 'sampler_name', 'Unknown') }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Scheduler:</span>
                  <span class="preview-value">{{ getParam(currentParams, 'scheduler', 'scheduler', 'Automatic') }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Steps:</span>
                  <span class="preview-value">{{ getParam(currentParams, 'steps', 'steps', 20) }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">CFG Scale:</span>
                  <span class="preview-value">{{ getParam(currentParams, 'cfgScale', 'cfg_scale', 7) }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Size:</span>
                  <span class="preview-value">{{ getParam(currentParams, 'width', 'width', 512) }}×{{ getParam(currentParams, 'height', 'height', 512) }}</span>
                </div>
                <div class="preview-item">
                  <span class="preview-label">Batch:</span>
                  <span class="preview-value">{{ getParam(currentParams, 'batchCount', 'batch_count', 1) }}×{{ getParam(currentParams, 'batchSize', 'batch_size', 1) }}</span>
                </div>
                <div class="preview-item" v-if="getParam(currentParams, 'enable_hr', 'enable_hr', false)">
                  <span class="preview-label">Hires Fix:</span>
                  <span class="preview-value">{{ getParam(currentParams, 'hrUpscaler', 'hr_upscaler', 'Latent') }} {{ getParam(currentParams, 'hrUpscale', 'hr_scale', 2) }}x</span>
                </div>
                <div class="preview-item" v-if="currentParams.adetailers && currentParams.adetailers.length > 0">
                  <span class="preview-label">ADetailer:</span>
                  <span class="preview-value">{{ currentParams.adetailers.filter(ad => ad.enable).length }} enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
  background: var(--color-bg-elevated);
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
  color: var(--color-text-inverse);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.add-btn {
  height: 32px;
  padding: 0 14px;
  background: var(--color-bg-elevated);
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
  color: #10b981;
}

.search-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
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
  border-color: #10b981;
}

.preset-count {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.preset-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.preset-item {
  padding: 14px;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  margin-bottom: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.preset-item:hover {
  border-color: #10b981;
  background: var(--color-bg-hover);
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
  color: var(--color-text-primary);
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
  color: var(--color-text-inverse);
}

.apply-btn:hover {
  background: #059669;
}

.edit-btn {
  background: #f59e0b;
  color: var(--color-text-inverse);
}

.edit-btn:hover {
  background: #d97706;
}

.delete-btn {
  background: #ef4444;
  color: var(--color-text-inverse);
}

.delete-btn:hover {
  background: #dc2626;
}

.preset-summary {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  font-family: monospace;
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 20px;
  transition: color 0.2s;
}

.preset-summary:hover {
  color: #10b981;
}

.expand-icon {
  position: absolute;
  right: 0;
  font-size: 10px;
  color: var(--color-text-tertiary);
  transition: transform 0.2s;
}

.preset-description {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  font-style: italic;
}

.preset-date {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.preset-details {
  margin-top: 8px;
  margin-bottom: 8px;
  padding: 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  font-size: 11px;
  border: 1px solid var(--color-border-primary);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.detail-value {
  color: var(--color-text-primary);
  font-family: monospace;
  font-size: 11px;
}

.detail-section {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 2px solid var(--color-border-primary);
}

.detail-section-title {
  font-weight: 700;
  color: #10b981;
  margin-bottom: 6px;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-tertiary);
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 14px;
}

.add-preset-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: var(--color-text-inverse);
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
  background: var(--color-bg-elevated);
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog-large {
  max-width: 550px;
}

.dialog h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--color-border-primary);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
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
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.cancel-btn:hover {
  background: var(--color-bg-hover);
}

.confirm-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: var(--color-text-inverse);
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
  color: var(--color-text-secondary);
}

/* Save Preview Section */
.save-preview-section {
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 2px solid var(--color-border-primary);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-border-primary);
}

.preview-icon {
  font-size: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
}

.preview-content {
  background: var(--color-bg-elevated);
  border-radius: 6px;
  padding: 12px;
}

.preview-summary {
  font-size: 12px;
  font-family: monospace;
  color: var(--color-text-secondary);
  padding: 8px;
  background: #f0fdf4;
  border-radius: 4px;
  margin-bottom: 12px;
  border-left: 3px solid #10b981;
}

[data-theme="dark"] .preview-summary {
  background: rgba(16, 185, 129, 0.15);
}

.preview-details {
  margin-top: 8px;
}

.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 11px;
}

.preview-item:has(.preview-label:contains("Hires Fix")),
.preview-item:has(.preview-label:contains("ADetailer")) {
  grid-column: 1 / -1;
}

.preview-label {
  color: #666;
  font-weight: 600;
  margin-right: 8px;
}

.preview-value {
  color: #333;
  font-family: monospace;
  text-align: right;
}
</style>
