<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQueue } from '../composables/useQueue'

const { t } = useI18n()

// Props
const props = defineProps({
  showToast: Function,
  currentPrompt: String,
  currentNegativePrompt: String,
  currentParams: Object,
  isGenerating: Boolean,
})

// Emits
const emit = defineEmits(['close', 'startQueue', 'pauseQueue', 'stopQueue'])

// Use composable
const {
  queue,
  isRunning,
  isPaused,
  currentIndex,
  loadQueue,
  addToQueue,
  removeFromQueue,
  updateQueueItem,
  moveUp,
  moveDown,
  clearCompleted,
  clearAll,
  resetFailed,
  getStats,
} = useQueue()

// State
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showClearConfirm = ref(false)
const editingItem = ref(null)

// Form data
const queuePrompt = ref('')
const queueNegativePrompt = ref('')
const queueBatchCount = ref(1)

// Computed
const stats = computed(() => getStats())

const progress = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.completed / stats.value.total) * 100)
})

const canStart = computed(() => {
  return !isRunning.value && stats.value.pending > 0 && !props.isGenerating
})

const canPause = computed(() => {
  return isRunning.value && !isPaused.value
})

const canResume = computed(() => {
  return isRunning.value && isPaused.value
})

const canStop = computed(() => {
  return isRunning.value
})

// Methods
function openAddDialog() {
  queuePrompt.value = props.currentPrompt || ''
  queueNegativePrompt.value = props.currentNegativePrompt || ''
  queueBatchCount.value = 1
  showAddDialog.value = true
}

function closeAddDialog() {
  showAddDialog.value = false
}

function handleAddToQueue() {
  if (!queuePrompt.value.trim()) {
    props.showToast?.(t('queue.promptRequiredError'), 'error')
    return
  }

  if (!props.currentParams) {
    props.showToast?.(t('queue.noSettings'), 'error')
    return
  }

  addToQueue(
    queuePrompt.value,
    queueNegativePrompt.value,
    props.currentParams,
    queueBatchCount.value
  )

  props.showToast?.(t('queue.added'), 'success')
  closeAddDialog()
}

function openEditDialog(item) {
  editingItem.value = item
  queuePrompt.value = item.prompt
  queueNegativePrompt.value = item.negativePrompt
  queueBatchCount.value = item.batchCount
  showEditDialog.value = true
}

function closeEditDialog() {
  showEditDialog.value = false
  editingItem.value = null
}

function handleUpdateItem() {
  if (!queuePrompt.value.trim()) {
    props.showToast?.(t('queue.promptRequiredError'), 'error')
    return
  }

  updateQueueItem(editingItem.value.id, {
    prompt: queuePrompt.value,
    negativePrompt: queueNegativePrompt.value,
    batchCount: queueBatchCount.value,
  })

  props.showToast?.(t('queue.updated'), 'success')
  closeEditDialog()
}

function handleRemove(id) {
  removeFromQueue(id)
  props.showToast?.(t('queue.removed'), 'info')
}

function handleMoveUp(id) {
  moveUp(id)
}

function handleMoveDown(id) {
  moveDown(id)
}

function handleStart() {
  emit('startQueue')
}

function handlePause() {
  emit('pauseQueue')
}

function handleResume() {
  emit('startQueue')
}

function handleStop() {
  emit('stopQueue')
}

function handleClearCompleted() {
  clearCompleted()
  props.showToast?.(t('queue.completedRemoved'), 'info')
}

function openClearConfirm() {
  showClearConfirm.value = true
}

function closeClearConfirm() {
  showClearConfirm.value = false
}

function handleClearAll() {
  clearAll()
  props.showToast?.(t('queue.allRemoved'), 'info')
  closeClearConfirm()
}

function handleResetFailed() {
  resetFailed()
  props.showToast?.(t('queue.retrying'), 'info')
}

function getStatusIcon(status) {
  switch (status) {
    case 'pending': return '⏳'
    case 'generating': return '🔄'
    case 'completed': return '✓'
    case 'failed': return '✗'
    default: return '•'
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'pending': return '#999'
    case 'generating': return '#667eea'
    case 'completed': return '#10b981'
    case 'failed': return '#ef4444'
    default: return '#999'
  }
}

function truncateText(text, maxLength = 50) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

function close() {
  emit('close')
}

// Load queue on mount
onMounted(() => {
  loadQueue()
})
</script>

<template>
  <div class="queue-manager-panel">
    <div class="panel-header">
      <h3>🎬 Queue Manager</h3>
      <div class="header-actions">
        <button class="add-btn" @click="openAddDialog" :disabled="isGenerating" title="Add current to queue">
          ➕ Add
        </button>
        <button class="close-btn" @click="close">✕</button>
      </div>
    </div>

    <!-- Progress Section -->
    <div class="progress-section" v-if="stats.total > 0">
      <div class="stats-row">
        <div class="stat">
          <span class="stat-label">Total:</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Pending:</span>
          <span class="stat-value pending">{{ stats.pending }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Completed:</span>
          <span class="stat-value completed">{{ stats.completed }}</span>
        </div>
        <div class="stat" v-if="stats.failed > 0">
          <span class="stat-label">Failed:</span>
          <span class="stat-value failed">{{ stats.failed }}</span>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">{{ progress }}%</div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <div class="control-buttons">
        <button
          class="control-btn start-btn"
          @click="handleStart"
          :disabled="!canStart"
          v-if="!isRunning || isPaused"
          title="Start queue"
        >
          ▶️ {{ isPaused ? 'Resume' : 'Start' }}
        </button>
        <button
          class="control-btn pause-btn"
          @click="handlePause"
          :disabled="!canPause"
          v-if="isRunning && !isPaused"
          title="Pause after current"
        >
          ⏸️ Pause
        </button>
        <button
          class="control-btn stop-btn"
          @click="handleStop"
          :disabled="!canStop"
          v-if="isRunning"
          title="Stop queue"
        >
          ⏹️ Stop
        </button>
      </div>
      <div class="utility-buttons">
        <button
          class="utility-btn"
          @click="handleClearCompleted"
          :disabled="stats.completed === 0"
          title="Clear completed"
        >
          🧹
        </button>
        <button
          class="utility-btn"
          @click="handleResetFailed"
          :disabled="stats.failed === 0"
          title="Retry failed"
        >
          🔄
        </button>
        <button
          class="utility-btn danger"
          @click="openClearConfirm"
          :disabled="stats.total === 0"
          title="Clear all"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Queue List -->
    <div class="queue-list">
      <div
        v-for="(item, index) in queue"
        :key="item.id"
        class="queue-item"
        :class="{
          active: index === currentIndex,
          [item.status]: true
        }"
      >
        <div class="item-header">
          <div class="item-status" :style="{ color: getStatusColor(item.status) }">
            {{ getStatusIcon(item.status) }}
          </div>
          <div class="item-number">#{{ index + 1 }}</div>
          <div class="item-batch" v-if="item.batchCount > 1">
            × {{ item.batchCount }}
          </div>
        </div>

        <div class="item-content">
          <div class="item-prompt" :title="item.prompt">
            {{ truncateText(item.prompt, 60) }}
          </div>
          <div class="item-params">
            {{ item.params.samplerName }} | {{ item.params.steps }}steps | CFG{{ item.params.cfgScale }}
          </div>
          <div class="item-error" v-if="item.error">
            Error: {{ item.error }}
          </div>
        </div>

        <div class="item-actions">
          <button
            class="action-btn"
            @click="handleMoveUp(item.id)"
            :disabled="index === 0 || item.status !== 'pending'"
            title="Move up"
          >
            ↑
          </button>
          <button
            class="action-btn"
            @click="handleMoveDown(item.id)"
            :disabled="index === queue.length - 1 || item.status !== 'pending'"
            title="Move down"
          >
            ↓
          </button>
          <button
            class="action-btn edit"
            @click="openEditDialog(item)"
            :disabled="item.status !== 'pending'"
            title="Edit"
          >
            ✏️
          </button>
          <button
            class="action-btn delete"
            @click="handleRemove(item.id)"
            :disabled="item.status === 'generating'"
            title="Remove"
          >
            🗑️
          </button>
        </div>
      </div>

      <div v-if="queue.length === 0" class="empty-state">
        <p>{{ $t('queue.empty') }}</p>
        <button class="add-queue-btn" @click="openAddDialog" :disabled="isGenerating">
          {{ $t('queue.addFirstItem') }}
        </button>
      </div>
    </div>

    <!-- Add Dialog -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="closeAddDialog">
      <div class="dialog" @click.stop>
        <h3>{{ $t('queue.addToQueue') }}</h3>
        <div class="form-group">
          <label>{{ $t('queue.promptRequired') }}</label>
          <textarea
            v-model="queuePrompt"
            placeholder="Enter prompt..."
            rows="3"
          ></textarea>
        </div>
        <div class="form-group">
          <label>{{ $t('queue.negativePrompt') }}</label>
          <textarea
            v-model="queueNegativePrompt"
            placeholder="Enter negative prompt..."
            rows="2"
          ></textarea>
        </div>
        <div class="form-group">
          <label>{{ $t('queue.batchCount') }}</label>
          <input
            type="number"
            v-model.number="queueBatchCount"
            min="1"
            max="100"
          >
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="closeAddDialog">{{ $t('common.cancel') }}</button>
          <button class="confirm-btn" @click="handleAddToQueue">{{ $t('queue.add') }}</button>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="closeEditDialog">
      <div class="dialog" @click.stop>
        <h3>{{ $t('queue.editItem') }}</h3>
        <div class="form-group">
          <label>{{ $t('queue.promptRequired') }}</label>
          <textarea
            v-model="queuePrompt"
            rows="3"
          ></textarea>
        </div>
        <div class="form-group">
          <label>{{ $t('queue.negativePrompt') }}</label>
          <textarea
            v-model="queueNegativePrompt"
            rows="2"
          ></textarea>
        </div>
        <div class="form-group">
          <label>{{ $t('queue.batchCount') }}</label>
          <input
            type="number"
            v-model.number="queueBatchCount"
            min="1"
            max="100"
          >
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="closeEditDialog">{{ $t('common.cancel') }}</button>
          <button class="confirm-btn" @click="handleUpdateItem">{{ $t('common.edit') }}</button>
        </div>
      </div>
    </div>

    <!-- Clear All Confirm -->
    <div v-if="showClearConfirm" class="dialog-overlay" @click="closeClearConfirm">
      <div class="dialog confirm-dialog" @click.stop>
        <h3>{{ $t('queue.clearAllTitle') }}</h3>
        <p>{{ $t('queue.clearAllConfirm') }}</p>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="closeClearConfirm">{{ $t('common.cancel') }}</button>
          <button class="delete-confirm-btn" @click="handleClearAll">{{ $t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.queue-manager-panel {
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
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
  color: #f59e0b;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  color: #f59e0b;
}

/* Progress Section */
.progress-section {
  padding: 16px 20px;
  background: #fffbeb;
  border-bottom: 1px solid #fde68a;
  flex-shrink: 0;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  gap: 6px;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.stat-value.pending {
  color: #f59e0b;
}

.stat-value.completed {
  color: #10b981;
}

.stat-value.failed {
  color: #ef4444;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #fee2e2;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  min-width: 40px;
  text-align: right;
}

/* Controls Section */
.controls-section {
  padding: 12px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-btn {
  height: 32px;
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn {
  background: #10b981;
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: #059669;
}

.pause-btn {
  background: #f59e0b;
  color: white;
}

.pause-btn:hover:not(:disabled) {
  background: #d97706;
}

.stop-btn {
  background: #ef4444;
  color: white;
}

.stop-btn:hover:not(:disabled) {
  background: #dc2626;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.utility-buttons {
  display: flex;
  gap: 6px;
}

.utility-btn {
  width: 32px;
  height: 32px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.utility-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #f0f4ff;
}

.utility-btn.danger:hover:not(:disabled) {
  border-color: #ef4444;
  background: #fee2e2;
}

.utility-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Queue List */
.queue-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.queue-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 2px solid transparent;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  transition: all 0.2s;
}

.queue-item:hover {
  border-color: #f59e0b;
  background: #fffbeb;
}

.queue-item.active {
  border-color: #667eea;
  background: #f0f4ff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.queue-item.generating {
  border-color: #667eea;
  background: linear-gradient(90deg, #f0f4ff 0%, #fffbeb 100%);
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: #667eea; }
  50% { border-color: #f59e0b; }
}

.queue-item.completed {
  opacity: 0.7;
}

.queue-item.failed {
  border-color: #ef4444;
  background: #fee2e2;
}

.item-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 40px;
}

.item-status {
  font-size: 18px;
}

.item-number {
  font-size: 11px;
  color: #666;
  font-weight: 600;
}

.item-batch {
  font-size: 10px;
  color: #f59e0b;
  font-weight: 600;
  background: #fffbeb;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-prompt {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-params {
  font-size: 11px;
  color: #666;
  font-family: monospace;
}

.item-error {
  font-size: 11px;
  color: #ef4444;
  margin-top: 4px;
}

.item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  background: #d1d5db;
}

.action-btn.edit:hover:not(:disabled) {
  background: #fde68a;
}

.action-btn.delete:hover:not(:disabled) {
  background: #fecaca;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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

.add-queue-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-queue-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.add-queue-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 500px;
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
  border-color: #f59e0b;
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
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
