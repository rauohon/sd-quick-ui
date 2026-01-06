<script setup>
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
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

// Generation Engine (injected from App.vue)
const generationEngine = inject('generationEngine')

// Pipeline
const pipeline = usePipeline()

// Set generation engine for pipeline
if (generationEngine) {
  pipeline.setGenerationEngine(generationEngine)
}

// Set toast callback
pipeline.setShowToastCallback(props.showToast)

// Default params for pipeline (bound to UI)
const defaultPrompt = ref('')
const defaultNegativePrompt = ref('')

// Sync default params with pipeline
watch([defaultPrompt, defaultNegativePrompt], () => {
  pipeline.setDefaultParams({
    prompt: defaultPrompt.value,
    negativePrompt: defaultNegativePrompt.value,
    notificationType: notificationType.value,
    notificationVolume: notificationVolume.value
  })
}, { immediate: true })

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

// Image preview modal
const previewImage = ref(null)
const previewStepInfo = ref(null)

function openImagePreview(step, index) {
  if (step.outputImage) {
    previewImage.value = step.outputImage
    previewStepInfo.value = { type: step.type, index: index + 1 }
  }
}

function closeImagePreview() {
  previewImage.value = null
  previewStepInfo.value = null
}

// Check if step is the final completed step
function isFinalCompletedStep(step, index) {
  const steps = pipeline.steps.value
  if (step.status !== 'completed') return false
  // Check if this is the last completed step
  for (let i = index + 1; i < steps.length; i++) {
    if (steps[i].status === 'completed') return false
  }
  return true
}

// Step override editing (replaces right panel)
const editingStep = ref(null)
const overrideForm = ref({
  prompt: '',
  negativePrompt: '',
  steps: '',
  cfgScale: '',
  denoisingStrength: '',
  maskBlur: '',
  inpaintFullRes: ''
})

function openOverrideModal(step) {
  editingStep.value = step
  // Load existing settings or empty
  const settings = step.settings || {}
  overrideForm.value = {
    prompt: settings.prompt || '',
    negativePrompt: settings.negativePrompt || '',
    steps: settings.steps || '',
    cfgScale: settings.cfgScale || '',
    denoisingStrength: settings.denoisingStrength || '',
    maskBlur: settings.maskBlur || '',
    inpaintFullRes: settings.inpaintFullRes || ''
  }
}

function closeOverrideModal() {
  editingStep.value = null
}

function clearOverrides() {
  overrideForm.value = {
    prompt: '',
    negativePrompt: '',
    steps: '',
    cfgScale: '',
    denoisingStrength: '',
    maskBlur: '',
    inpaintFullRes: ''
  }
}

function saveOverrides() {
  if (!editingStep.value) return

  // Build settings object (only include non-empty values)
  const settings = {}
  if (overrideForm.value.prompt) settings.prompt = overrideForm.value.prompt
  if (overrideForm.value.negativePrompt) settings.negativePrompt = overrideForm.value.negativePrompt
  if (overrideForm.value.steps) settings.steps = Number(overrideForm.value.steps)
  if (overrideForm.value.cfgScale) settings.cfgScale = Number(overrideForm.value.cfgScale)
  if (overrideForm.value.denoisingStrength) settings.denoisingStrength = Number(overrideForm.value.denoisingStrength)
  if (overrideForm.value.maskBlur) settings.maskBlur = Number(overrideForm.value.maskBlur)
  if (overrideForm.value.inpaintFullRes) settings.inpaintFullRes = overrideForm.value.inpaintFullRes === 'masked' ? 1 : 0

  // Save to step (null if empty)
  pipeline.updateStepSettings(editingStep.value.id, Object.keys(settings).length > 0 ? settings : null)

  props.showToast(t('common.save') + ' ✓', 'success')
  closeOverrideModal()
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

        <!-- Default Prompts -->
        <div class="settings-section">
          <h4 class="section-title">{{ t('workflow.defaultPrompts') }}</h4>
          <p class="section-description">{{ t('workflow.defaultPromptsDescription') }}</p>

          <div class="form-group compact">
            <label>{{ t('workflow.defaultPositive') }}</label>
            <textarea
              v-model="defaultPrompt"
              rows="4"
              :placeholder="t('prompt.placeholder')"
              class="default-prompt-input"
            ></textarea>
          </div>

          <div class="form-group compact">
            <label>{{ t('workflow.defaultNegative') }}</label>
            <textarea
              v-model="defaultNegativePrompt"
              rows="3"
              :placeholder="t('prompt.negativePlaceholder')"
              class="default-prompt-input"
            ></textarea>
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
                @click="openOverrideModal(step)"
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

    <!-- Right Panel: Results Preview (when not editing) -->
    <div v-if="!editingStep" class="results-panel">
      <div class="panel-header">
        <h3 class="panel-title">{{ t('workflow.results') }}</h3>
        <span v-if="pipeline.hasSteps.value" class="results-summary">
          {{ pipeline.completedSteps.value }}/{{ pipeline.steps.value.length }}
        </span>
      </div>

      <div class="panel-content">
        <!-- Progress (when running) -->
        <div class="progress-section" v-if="pipeline.isRunning.value">
          <div class="progress-info">
            <span class="progress-label">
              {{ t('workflow.runningStep') }} {{ pipeline.currentStepIndex.value + 1 }}/{{ pipeline.steps.value.length }}
              <span v-if="pipeline.currentEngineState.value.progressState" class="progress-state">
                ({{ pipeline.currentEngineState.value.progressState }})
              </span>
            </span>
            <span class="progress-percent">{{ Math.round(pipeline.currentEngineState.value.progress) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: pipeline.currentEngineState.value.progress + '%' }"></div>
          </div>

          <!-- Live Preview Image -->
          <div class="live-preview" v-if="pipeline.currentEngineState.value.currentImage">
            <div class="live-preview-header">
              <span class="live-preview-label">{{ t('workflow.livePreview') }}</span>
            </div>
            <img :src="pipeline.currentEngineState.value.currentImage" alt="Live preview" class="live-preview-image" />
          </div>
        </div>

        <!-- Step Results -->
        <div class="results-list" v-if="pipeline.hasSteps.value">
          <div
            v-for="(step, index) in pipeline.steps.value"
            :key="step.id"
            class="result-item"
            :class="{
              'has-image': step.outputImage,
              'is-running': step.status === 'running',
              'is-final': isFinalCompletedStep(step, index)
            }"
          >
            <div class="result-header">
              <span class="result-step">Step {{ index + 1 }}: {{ step.type }}</span>
              <span class="result-status">{{ getStepStatusEmoji(step.status) }}</span>
            </div>
            <div
              class="result-image"
              v-if="step.outputImage"
              @click="openImagePreview(step, index)"
            >
              <img :src="step.outputImage" :alt="`Step ${index + 1} result`" />
              <div class="image-overlay">
                <span class="zoom-icon">🔍</span>
              </div>
            </div>
            <div class="result-placeholder" v-else>
              <span v-if="step.status === 'pending'">{{ t('workflow.waiting') }}</span>
              <span v-else-if="step.status === 'running'" class="generating-text">{{ t('workflow.generating') }}</span>
              <span v-else>-</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div class="results-empty" v-else>
          <p>{{ t('workflow.noResults') }}</p>
        </div>
      </div>
    </div>

    <!-- Right Panel: Override Editor (when editing) -->
    <div v-else class="results-panel edit-panel">
      <div class="panel-header">
        <div class="header-left">
          <h3 class="panel-title">{{ t('workflow.editStep') }}: {{ editingStep?.type }}</h3>
        </div>
        <button class="header-close-btn" @click="closeOverrideModal" :title="t('common.close')">✕</button>
      </div>

      <div class="panel-content edit-content">
        <p class="edit-description">{{ t('workflow.overrideDescription') }}</p>

        <!-- Common settings -->
        <div class="form-section">
          <h4 class="section-title">{{ t('workflow.overrideSettings') }}</h4>

          <div class="form-group">
            <label>{{ t('workflow.promptOverride') }}</label>
            <textarea
              v-model="overrideForm.prompt"
              rows="15"
              :placeholder="t('prompt.placeholder')"
            ></textarea>
          </div>

          <div class="form-group">
            <label>{{ t('workflow.negativeOverride') }}</label>
            <textarea
              v-model="overrideForm.negativePrompt"
              rows="12"
              :placeholder="t('prompt.negativePlaceholder')"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ t('workflow.stepsOverride') }}</label>
              <input
                type="number"
                v-model="overrideForm.steps"
                min="1"
                max="150"
                placeholder="20"
              />
            </div>
            <div class="form-group">
              <label>{{ t('workflow.cfgOverride') }}</label>
              <input
                type="number"
                v-model="overrideForm.cfgScale"
                min="1"
                max="30"
                step="0.5"
                placeholder="7"
              />
            </div>
          </div>

          <!-- img2img / inpaint specific -->
          <div v-if="editingStep?.type === 'img2img' || editingStep?.type === 'inpaint'" class="form-row">
            <div class="form-group">
              <label>{{ t('workflow.denoisingOverride') }}</label>
              <input
                type="number"
                v-model="overrideForm.denoisingStrength"
                min="0"
                max="1"
                step="0.05"
                placeholder="0.75"
              />
            </div>
          </div>

          <!-- inpaint specific -->
          <div v-if="editingStep?.type === 'inpaint'" class="form-row">
            <div class="form-group">
              <label>{{ t('workflow.maskBlurOverride') }}</label>
              <input
                type="number"
                v-model="overrideForm.maskBlur"
                min="0"
                max="64"
                placeholder="4"
              />
            </div>
            <div class="form-group">
              <label>{{ t('workflow.inpaintAreaOverride') }}</label>
              <select v-model="overrideForm.inpaintFullRes">
                <option value="">-</option>
                <option value="whole">{{ t('workflow.inpaintAreaWholePicture') }}</option>
                <option value="masked">{{ t('workflow.inpaintAreaOnlyMasked') }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer edit-footer">
        <button class="btn btn-secondary" @click="clearOverrides">
          {{ t('workflow.clearOverrides') }}
        </button>
        <button class="btn btn-primary" @click="saveOverrides">
          {{ t('workflow.saveOverrides') }}
        </button>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div v-if="previewImage" class="image-preview-modal" @click.self="closeImagePreview">
      <div class="preview-container">
        <div class="preview-header">
          <span class="preview-title">Step {{ previewStepInfo?.index }}: {{ previewStepInfo?.type }}</span>
          <button class="preview-close" @click="closeImagePreview">✕</button>
        </div>
        <div class="preview-image-wrapper">
          <img :src="previewImage" alt="Preview" />
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
.results-summary {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: auto;
}

.progress-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  border: 1px solid var(--color-primary);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.progress-percent {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.progress-bar {
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

.result-item.is-running {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  animation: pulse-border 1.5s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
  }
}

.result-item.is-final {
  border-color: var(--color-success);
  border-width: 2px;
  background: rgba(16, 185, 129, 0.1);
}

.result-item.is-final .result-step {
  color: var(--color-success);
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
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.result-image img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.2s;
}

.result-image:hover img {
  transform: scale(1.02);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.result-image:hover .image-overlay {
  opacity: 1;
}

.zoom-icon {
  font-size: 24px;
}

.result-placeholder {
  padding: 24px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
}

.generating-text {
  color: var(--color-primary);
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.results-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--color-text-tertiary);
}

.results-empty p {
  margin: 0;
}

/* Edit Panel (replaces results panel when editing) */
.edit-panel {
  border-color: var(--color-primary);
}

.edit-panel .panel-header {
  background: var(--color-primary);
  justify-content: space-between;
}

.edit-panel .panel-header .panel-title {
  color: white;
}

.header-close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.header-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.edit-content {
  padding: 20px;
}

.edit-description {
  margin: 0 0 20px;
  padding: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  line-height: 1.5;
}

.form-section {
  margin-bottom: 20px;
}

.form-section .section-title {
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 13px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-bg-hover);
}

/* Image Preview Modal */
.image-preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.preview-container {
  max-width: 90vw;
  max-height: 90vh;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.preview-close {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.preview-close:hover {
  background: var(--color-error);
  color: white;
}

.preview-image-wrapper {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.preview-image-wrapper img {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  border-radius: 4px;
}

/* Section description */
.section-description {
  margin: 0 0 12px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

/* Compact form group (for settings panel) */
.form-group.compact {
  margin-bottom: 12px;
}

.form-group.compact label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.default-prompt-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 11px;
  resize: vertical;
  min-height: 40px;
}

.default-prompt-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Progress state text */
.progress-state {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: normal;
}

/* Live Preview */
.live-preview {
  margin-top: 12px;
  padding: 8px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--color-border-primary);
}

.live-preview-header {
  margin-bottom: 8px;
}

.live-preview-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.live-preview-image {
  width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
}
</style>
