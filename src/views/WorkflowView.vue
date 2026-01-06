<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePipeline } from '../composables/usePipeline'
import { useApiStatus } from '../composables/useApiStatus'
import { useModelLoader } from '../composables/useModelLoader'
import { useNotificationSettings } from '../composables/useNotificationSettings'
import SystemSettingsSection from '../components/SystemSettingsSection.vue'

const { t } = useI18n()

// Props
const props = defineProps({
  showToast: { type: Function, required: true },
  isDark: { type: Boolean, default: false },
  toggleTheme: { type: Function, required: true }
})

// Notification settings (shared singleton)
const { notificationType, notificationVolume } = useNotificationSettings()

// Pipeline
const pipeline = usePipeline()

// API Status
const { apiConnected, checkApiStatus } = useApiStatus(props.showToast)

// Model Loader (to show current model)
const selectedModel = ref('')
const { availableModels, loadModels } = useModelLoader(selectedModel, props.showToast)

// Panel collapse state (persisted in localStorage)
const SETTINGS_COLLAPSED_KEY = 'workflow-settings-collapsed'
const isSettingsCollapsed = ref(localStorage.getItem(SETTINGS_COLLAPSED_KEY) === 'true')

// Watch and persist collapse state
watch(isSettingsCollapsed, (collapsed) => {
  localStorage.setItem(SETTINGS_COLLAPSED_KEY, String(collapsed))
})

// Toggle settings panel
function toggleSettings() {
  isSettingsCollapsed.value = !isSettingsCollapsed.value
}

// API checking state
const apiChecking = ref(false)

// Check API connection
async function checkApi() {
  apiChecking.value = true
  await checkApiStatus()
  if (apiConnected.value) {
    await loadModels()
  }
  apiChecking.value = false
}

// Pipeline template functions
function createTxt2ImgToImg2Img() {
  pipeline.clearSteps()
  pipeline.addStep('txt2img')
  pipeline.addStep('img2img')
}

function createTxt2ImgToInpaint() {
  pipeline.clearSteps()
  pipeline.addStep('txt2img')
  pipeline.addStep('inpaint')
}

function createFullPipeline() {
  pipeline.clearSteps()
  pipeline.addStep('txt2img')
  pipeline.addStep('img2img')
  pipeline.addStep('inpaint')
}

// Pipeline controls
function startPipeline() {
  pipeline.startPipeline()
}

function stopPipeline() {
  pipeline.stopPipeline()
}

function clearPipeline() {
  pipeline.clearSteps()
}

function removeStep(stepId) {
  pipeline.removeStep(stepId)
}

// Move step up/down
function moveStepUp(stepId) {
  pipeline.moveStep(stepId, 'up')
}

function moveStepDown(stepId) {
  pipeline.moveStep(stepId, 'down')
}

// Add step
const showAddStepDropdown = ref(false)

function addStep(type) {
  pipeline.addStep(type)
  showAddStepDropdown.value = false
}

function toggleAddStepDropdown() {
  showAddStepDropdown.value = !showAddStepDropdown.value
}

// Close dropdown on outside click
function handleOutsideClick(event) {
  const dropdown = document.querySelector('.add-step-container')
  if (dropdown && !dropdown.contains(event.target)) {
    showAddStepDropdown.value = false
  }
}

// Get step status emoji
function getStepStatusEmoji(status) {
  switch (status) {
    case 'pending': return '⏳'
    case 'running': return '🔄'
    case 'completed': return '✅'
    case 'failed': return '❌'
    default: return '⏳'
  }
}

// Computed: current model name
const currentModelName = computed(() => {
  if (!selectedModel.value) return t('workflow.noModel')
  // Extract model name from full path
  const parts = selectedModel.value.split(/[/\\]/)
  return parts[parts.length - 1] || selectedModel.value
})

// Lifecycle
onMounted(async () => {
  // Check API connection
  await checkApiStatus()

  // Load models if connected
  if (apiConnected.value) {
    await loadModels()
  }

  // Add outside click listener for dropdown
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div class="workflow-view" :class="{ 'settings-collapsed': isSettingsCollapsed }">
    <!-- Left Panel: Settings -->
    <div class="settings-panel" :class="{ collapsed: isSettingsCollapsed }">
      <div class="panel-header">
        <button class="toggle-btn" @click="toggleSettings">
          {{ isSettingsCollapsed ? '▶' : '◀' }}
        </button>
        <h3 class="panel-title" v-if="!isSettingsCollapsed">{{ t('workflow.settings') }}</h3>
      </div>

      <div class="panel-content" v-if="!isSettingsCollapsed">
        <!-- System Status -->
        <div class="settings-section">
          <h4 class="section-title">{{ t('workflow.systemStatus') }}</h4>
          <div class="status-item">
            <span class="status-label">API</span>
            <span class="status-value" :class="{ connected: apiConnected, disconnected: !apiConnected }">
              {{ apiConnected ? '🟢 ' + t('workflow.connected') : '🔴 ' + t('workflow.disconnected') }}
            </span>
          </div>
          <div class="status-item" v-if="apiConnected">
            <span class="status-label">{{ t('workflow.model') }}</span>
            <span class="status-value model-name" :title="selectedModel">{{ currentModelName }}</span>
          </div>
        </div>

        <!-- Templates -->
        <div class="settings-section">
          <h4 class="section-title">{{ t('workflow.templates') }}</h4>
          <div class="template-list">
            <button @click="createTxt2ImgToImg2Img" class="template-btn">
              txt2img → img2img
            </button>
            <button @click="createTxt2ImgToInpaint" class="template-btn">
              txt2img → inpaint
            </button>
            <button @click="createFullPipeline" class="template-btn">
              txt2img → img2img → inpaint
            </button>
          </div>
        </div>

        <!-- Saved Workflows (placeholder for Step 6) -->
        <div class="settings-section">
          <h4 class="section-title">{{ t('workflow.savedWorkflows') }}</h4>
          <div class="saved-list-empty">
            {{ t('workflow.noSavedWorkflows') }}
          </div>
        </div>
      </div>

      <!-- System Settings -->
      <SystemSettingsSection
        v-if="!isSettingsCollapsed"
        :isDark="isDark"
        :toggleTheme="toggleTheme"
        :notificationType="notificationType"
        :notificationVolume="notificationVolume"
        :isGenerating="pipeline.isRunning.value"
        @update:notificationType="notificationType = $event"
        @update:notificationVolume="notificationVolume = $event"
      />

      <!-- Panel Footer -->
      <div v-if="!isSettingsCollapsed" class="panel-footer">
        <span class="footer-title">⚡ SD Quick UI</span>
        <button
          v-if="!apiConnected"
          class="footer-btn"
          @click="checkApi"
          :disabled="apiChecking"
          :title="t('api.checkConnection')"
        >
          {{ apiChecking ? t('advancedPanel.checking') : t('advancedPanel.reconnect') }}
        </button>
      </div>
    </div>

    <!-- Center Panel: Steps Editor -->
    <div class="steps-panel">
      <div class="panel-header steps-header">
        <div class="header-left">
          <h3 class="panel-title">{{ t('workflow.pipelineSteps') }}</h3>
          <span class="step-count" v-if="pipeline.hasSteps.value">
            {{ pipeline.steps.value.length }} {{ t('workflow.stepsCount') }}
          </span>
        </div>
        <div class="header-controls">
          <button
            @click="clearPipeline"
            class="header-btn clear-btn"
            :disabled="pipeline.isRunning.value || !pipeline.hasSteps.value"
            :title="t('workflow.clear')"
          >
            {{ t('workflow.clear') }}
          </button>
          <button
            v-if="pipeline.isRunning.value"
            @click="stopPipeline"
            class="header-btn stop-btn"
            :title="t('workflow.stop')"
          >
            {{ t('workflow.stop') }}
          </button>
          <button
            v-else
            @click="startPipeline"
            class="header-btn start-btn"
            :disabled="!pipeline.hasSteps.value"
            :title="t('workflow.start')"
          >
            ▶ {{ t('workflow.start') }}
          </button>
        </div>
      </div>

      <div class="panel-content">
        <!-- Steps List -->
        <div class="steps-list" v-if="pipeline.hasSteps.value">
          <div
            v-for="(step, index) in pipeline.steps.value"
            :key="step.id"
            class="step-card"
            :class="{
              'step-running': step.status === 'running',
              'step-completed': step.status === 'completed',
              'step-failed': step.status === 'failed'
            }"
          >
            <div class="step-header">
              <span class="step-number">{{ index + 1 }}</span>
              <span class="step-type">{{ step.type }}</span>
              <span class="step-status">{{ getStepStatusEmoji(step.status) }}</span>
            </div>

            <div class="step-info">
              <span class="step-settings-hint" v-if="!step.settings">
                {{ t('workflow.usingDefaults') }}
              </span>
              <span class="step-settings-hint has-override" v-else>
                {{ t('workflow.hasOverrides') }}
              </span>
            </div>

            <div class="step-actions">
              <button
                class="action-btn edit-btn"
                :disabled="pipeline.isRunning.value"
                :title="t('workflow.edit')"
              >
                ✏️
              </button>
              <button
                class="action-btn move-btn"
                @click="moveStepUp(step.id)"
                :disabled="pipeline.isRunning.value || index === 0"
                :title="t('workflow.moveUp')"
              >
                ▲
              </button>
              <button
                class="action-btn move-btn"
                @click="moveStepDown(step.id)"
                :disabled="pipeline.isRunning.value || index === pipeline.steps.value.length - 1"
                :title="t('workflow.moveDown')"
              >
                ▼
              </button>
              <button
                class="action-btn remove-btn"
                @click="removeStep(step.id)"
                :disabled="pipeline.isRunning.value"
                :title="t('workflow.remove')"
              >
                ✕
              </button>
            </div>

            <!-- Arrow connector (except last) -->
            <div class="step-connector" v-if="index < pipeline.steps.value.length - 1">
              <span class="connector-arrow">↓</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="steps-empty" v-else>
          <p>{{ t('workflow.noSteps') }}</p>
          <p class="empty-hint">{{ t('workflow.selectTemplate') }}</p>
        </div>

        <!-- Add Step Button -->
        <div class="add-step-container">
          <div class="add-step-dropdown" v-if="showAddStepDropdown">
            <button @click="addStep('txt2img')" class="dropdown-item">txt2img</button>
            <button @click="addStep('img2img')" class="dropdown-item">img2img</button>
            <button @click="addStep('inpaint')" class="dropdown-item">inpaint</button>
          </div>
          <button
            class="add-step-btn"
            @click="showAddStepDropdown = !showAddStepDropdown"
            :disabled="pipeline.isRunning.value"
          >
            + {{ t('workflow.addStep') }}
          </button>
        </div>
      </div>

    </div>

    <!-- Right Panel: Results Preview -->
    <div class="results-panel">
      <div class="panel-header">
        <h3 class="panel-title">{{ t('workflow.results') }}</h3>
      </div>

      <div class="panel-content">
        <!-- Progress (when running) -->
        <div class="progress-section" v-if="pipeline.isRunning.value">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: pipeline.progress.value + '%' }"></div>
          </div>
          <span class="progress-text">{{ pipeline.progress.value }}%</span>
        </div>

        <!-- Step Results -->
        <div class="results-list" v-if="pipeline.hasSteps.value">
          <div
            v-for="(step, index) in pipeline.steps.value"
            :key="step.id"
            class="result-item"
            :class="{ 'has-image': step.outputImage }"
          >
            <div class="result-header">
              <span class="result-step">Step {{ index + 1 }}: {{ step.type }}</span>
              <span class="result-status">{{ getStepStatusEmoji(step.status) }}</span>
            </div>
            <div class="result-image" v-if="step.outputImage">
              <img :src="step.outputImage" :alt="`Step ${index + 1} result`" />
            </div>
            <div class="result-placeholder" v-else>
              <span>{{ step.status === 'pending' ? t('workflow.waiting') : step.status === 'running' ? t('workflow.generating') : '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div class="results-empty" v-else>
          <p>{{ t('workflow.noResults') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 3-Column Layout */
.workflow-view {
  display: grid;
  grid-template-columns: 280px 320px 1fr;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 12px;
  background: var(--color-bg-primary);
  overflow: hidden;
}

.workflow-view.settings-collapsed {
  grid-template-columns: 48px 320px 1fr;
}

/* Panel Base Styles */
.settings-panel,
.steps-panel,
.results-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.footer-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.footer-btn {
  padding: 4px 10px;
  font-size: 11px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.footer-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Settings Panel */
.settings-panel.collapsed {
  min-width: 48px;
  max-width: 48px;
}

.settings-panel.collapsed .panel-header {
  justify-content: center;
  padding: 12px 8px;
}

.toggle-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.toggle-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.settings-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Status Items */
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-primary);
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.status-value {
  font-size: 13px;
  font-weight: 500;
}

.status-value.connected {
  color: var(--color-success);
}

.status-value.disconnected {
  color: var(--color-error);
}

.status-value.model-name {
  color: var(--color-primary);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Template Buttons */
.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-btn {
  padding: 10px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.template-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Saved Workflows */
.saved-list-empty {
  padding: 16px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
}

/* Steps Panel Header */
.steps-header {
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-controls {
  display: flex;
  gap: 6px;
}

.header-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-btn.start-btn {
  background: var(--gradient-primary);
  color: white;
}

.header-btn.start-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.header-btn.stop-btn {
  background: var(--color-error);
  color: white;
}

.header-btn.stop-btn:hover {
  opacity: 0.9;
}

.header-btn.clear-btn {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-secondary);
}

.header-btn.clear-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* Steps Panel */
.step-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-primary-light);
  padding: 2px 8px;
  border-radius: 10px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step-card {
  position: relative;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  margin-bottom: 24px;
}

.step-card.step-running {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.step-card.step-completed {
  border-color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}

.step-card.step-failed {
  border-color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.step-number {
  width: 22px;
  height: 22px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.step-type {
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.step-status {
  font-size: 14px;
}

.step-info {
  margin-bottom: 8px;
}

.step-settings-hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.step-settings-hint.has-override {
  color: var(--color-warning);
}

.step-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.remove-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: var(--color-error);
  color: var(--color-error);
}

.step-card:last-child {
  margin-bottom: 0;
}

.step-connector {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.connector-arrow {
  font-size: 20px;
  color: var(--color-success);
  line-height: 1;
  text-shadow: 0 0 4px var(--color-success);
}

/* Empty State */
.steps-empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-tertiary);
}

.steps-empty p {
  margin: 0 0 8px;
}

.empty-hint {
  font-size: 12px;
}

/* Add Step */
.add-step-container {
  position: relative;
  margin-top: 16px;
}

.add-step-btn {
  width: 100%;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border: 2px dashed var(--color-border-primary);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-step-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.add-step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-step-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 4px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  z-index: 10;
}

.dropdown-item {
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: var(--color-bg-hover);
}

/* Results Panel */
.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 40px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
}

.result-item.has-image {
  border-color: var(--color-success);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-step {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.result-status {
  font-size: 14px;
}

.result-image {
  border-radius: 6px;
  overflow: hidden;
}

.result-image img {
  width: 100%;
  height: auto;
  display: block;
}

.result-placeholder {
  padding: 24px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
}

.results-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--color-text-tertiary);
}

.results-empty p {
  margin: 0;
}
</style>
