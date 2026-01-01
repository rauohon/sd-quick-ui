<template>
  <div class="advanced-panel" :class="{ collapsed: !isExpanded }">
    <div class="panel-header">
      <button
        class="toggle-advanced-btn"
        @click="$emit('toggle-panel')"
        :title="isExpanded ? $t('advancedPanel.foldPanel') : $t('advancedPanel.unfoldPanel')"
      >
        {{ isExpanded ? '◀' : '▶' }}
      </button>
      <h3 class="panel-title">{{ $t('advancedPanel.title') }}</h3>
      <div class="header-right">
        <ApiStatusIndicator
          v-if="isExpanded"
          :connected="apiConnected"
          :checking="apiChecking"
          @check="$emit('check-api')"
        />
      </div>
    </div>

    <div v-if="isExpanded" class="advanced-content">
      <div class="form-group horizontal">
        <label>Checkpoint</label>
        <select
          :value="selectedModel"
          @change="$emit('update:selectedModel', $event.target.value)"
          :disabled="isGenerating"
        >
          <option value="">{{ $t('advancedPanel.selectModel') }}</option>
          <option v-for="model in availableModels" :key="model.title" :value="model.title">
            {{ model.model_name }}
          </option>
        </select>
      </div>

      <div class="form-group horizontal">
        <label>Sampler</label>
        <select
          :value="samplerName"
          @change="$emit('update:samplerName', $event.target.value)"
          :disabled="isGenerating"
        >
          <option v-for="sampler in availableSamplers" :key="sampler.name" :value="sampler.name">
            {{ sampler.name }}
          </option>
        </select>
      </div>

      <div class="form-group horizontal">
        <label>Schedule</label>
        <select
          :value="scheduler"
          @change="$emit('update:scheduler', $event.target.value)"
          :disabled="isGenerating"
        >
          <option v-for="sched in availableSchedulers" :key="sched.name" :value="sched.name">
            {{ sched.label }}
          </option>
        </select>
      </div>

      <div class="form-group horizontal">
        <label>Aspect Ratio</label>
        <div style="display: flex; gap: 8px; flex: 1;">
          <select
            :value="selectedAspectRatioIndex"
            @change="(e) => { if (e.target.value !== '') $emit('apply-aspect-ratio', e.target.value) }"
            :disabled="isGenerating"
            style="flex: 1;"
          >
            <option value="">Custom</option>
            <option v-for="(ratio, index) in aspectRatios" :key="index" :value="index">
              {{ ratio.label }}
            </option>
          </select>
          <button
            @click="$emit('swap-dimensions')"
            :disabled="isGenerating"
            class="swap-btn"
            title="Swap width and height"
          >
            ⇄
          </button>
        </div>
      </div>

      <div class="form-group horizontal">
        <label>Width</label>
        <input
          type="number"
          :value="localWidth"
          @input="updateWidth($event.target.value)"
          step="64"
          :disabled="isGenerating"
        >
      </div>

      <div class="form-group horizontal">
        <label>Height</label>
        <input
          type="number"
          :value="localHeight"
          @input="updateHeight($event.target.value)"
          step="64"
          :disabled="isGenerating"
        >
      </div>

      <div class="form-group horizontal">
        <label>Batch count</label>
        <input
          type="number"
          :value="batchCount"
          @input="$emit('update:batchCount', Number($event.target.value))"
          min="1"
          :disabled="isGenerating"
        >
      </div>

      <div class="form-group horizontal">
        <label>Batch size</label>
        <input
          type="number"
          :value="batchSize"
          @input="$emit('update:batchSize', Number($event.target.value))"
          min="1"
          :disabled="isGenerating"
        >
      </div>

      <div class="form-group horizontal">
        <label>Seed</label>
        <div style="flex: 1; display: flex; gap: 6px;">
          <input
            type="number"
            :value="seed"
            @input="$emit('update:seed', Number($event.target.value))"
            :disabled="isGenerating"
            style="flex: 1;"
          >
          <button
            class="seed-random-btn"
            @click="$emit('randomize-seed')"
            :disabled="isGenerating"
            title="Generate random seed"
          >
            🎲
          </button>
        </div>
      </div>

      <div v-if="seed !== -1" class="form-group horizontal">
        <label>{{ $t('advancedPanel.seedVariation') }}</label>
        <input
          type="number"
          :value="seedVariationRange"
          @input="$emit('update:seedVariationRange', Number($event.target.value))"
          min="0"
          max="10000"
          :disabled="isGenerating"
          :title="$t('advancedPanel.seedVariationTooltip')"
        >
      </div>

      <!-- Notification Settings -->
      <div class="section-divider"></div>
      <div class="form-group horizontal">
        <label>Notification</label>
        <div style="flex: 1; display: flex; gap: 6px;">
          <select
            :value="notificationType"
            @change="$emit('update:notificationType', $event.target.value)"
            :disabled="isGenerating"
            style="flex: 1;"
          >
            <option :value="notificationTypes.NONE">🔇 None</option>
            <option :value="notificationTypes.SOUND">🔔 Sound</option>
            <option :value="notificationTypes.BROWSER">📬 Browser</option>
            <option :value="notificationTypes.BOTH">🔔📬 Both</option>
          </select>
          <button
            class="test-notification-btn"
            @click="$emit('test-notification')"
            :disabled="isGenerating || notificationType === notificationTypes.NONE"
            title="Test notification"
          >
            🔔
          </button>
        </div>
      </div>

      <div v-if="notificationType === notificationTypes.SOUND || notificationType === notificationTypes.BOTH" class="form-group horizontal">
        <label>Volume</label>
        <input
          type="range"
          :value="notificationVolume"
          @input="$emit('update:notificationVolume', Number($event.target.value))"
          min="0"
          max="1"
          step="0.1"
          :disabled="isGenerating"
        >
        <span class="volume-display">{{ Math.round(notificationVolume * 100) }}%</span>
      </div>

      <!-- 마지막 생성 설정값 표시 -->
      <LastParamsSection
        :last-params="lastParams"
        :has-enabled-adetailers="hasEnabledADetailers"
        :enabled-adetailers="enabledADetailers"
        :adetailer-labels="adetailerLabels"
      />
    </div>

    <!-- System Settings Section -->
    <div v-if="isExpanded" class="system-settings-section">
      <div class="system-settings-header" @click="isSystemSettingsExpanded = !isSystemSettingsExpanded">
        <span class="system-settings-title">⚙️ {{ $t('systemSettings.title') }}</span>
        <span class="toggle-icon">{{ isSystemSettingsExpanded ? '▲' : '▼' }}</span>
      </div>

      <transition name="expand">
        <div v-if="isSystemSettingsExpanded" class="system-settings-content">
          <div class="setting-group">
            <label class="setting-label">{{ $t('settings.language') }}</label>
            <LanguageSwitcher />
          </div>

          <div class="setting-group">
            <label class="setting-label">{{ $t('theme.title') }}</label>
            <div class="theme-toggle">
              <button
                class="theme-btn"
                :class="{ active: !isDark }"
                @click="toggleTheme"
                :title="$t('theme.light')"
              >
                ☀️ {{ $t('theme.light') }}
              </button>
              <button
                class="theme-btn"
                :class="{ active: isDark }"
                @click="toggleTheme"
                :title="$t('theme.dark')"
              >
                🌙 {{ $t('theme.dark') }}
              </button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label checkbox-label">
              <input
                type="checkbox"
                v-model="autoCorrectDimensions"
                @change="saveAutoCorrectSetting"
              >
              <span>{{ $t('dimensionValidation.autoCorrect') }}</span>
            </label>
          </div>
        </div>
      </transition>
    </div>

    <div v-if="isExpanded" class="panel-footer">
      <span class="footer-title">⚡ SD Quick UI</span>
      <button
        v-if="!apiConnected"
        class="footer-btn"
        @click="$emit('check-api')"
        :disabled="apiChecking"
        :title="$t('api.checkConnection')"
      >
        {{ apiChecking ? $t('advancedPanel.checking') : $t('advancedPanel.reconnect') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ApiStatusIndicator from './ApiStatusIndicator.vue'
import LastParamsSection from './LastParamsSection.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'

const { t } = useI18n()

// State
const isSystemSettingsExpanded = ref(false)
const autoCorrectDimensions = ref(false) // Default: unchecked (will ask user)

const props = defineProps({
  isExpanded: {
    type: Boolean,
    default: true
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  apiConnected: {
    type: Boolean,
    default: false
  },
  apiChecking: {
    type: Boolean,
    default: false
  },
  isDark: {
    type: Boolean,
    default: false
  },
  toggleTheme: {
    type: Function,
    required: true
  },
  selectedModel: {
    type: String,
    default: ''
  },
  availableModels: {
    type: Array,
    default: () => []
  },
  samplerName: {
    type: String,
    default: 'Euler a'
  },
  availableSamplers: {
    type: Array,
    default: () => []
  },
  scheduler: {
    type: String,
    default: 'Automatic'
  },
  availableSchedulers: {
    type: Array,
    default: () => []
  },
  selectedAspectRatioIndex: {
    type: [String, Number],
    default: ''
  },
  aspectRatios: {
    type: Array,
    default: () => []
  },
  width: {
    type: Number,
    default: 512
  },
  height: {
    type: Number,
    default: 512
  },
  batchCount: {
    type: Number,
    default: 1
  },
  batchSize: {
    type: Number,
    default: 1
  },
  seed: {
    type: Number,
    default: -1
  },
  seedVariationRange: {
    type: Number,
    default: 0
  },
  notificationType: {
    type: String,
    default: 'none'
  },
  notificationTypes: {
    type: Object,
    required: true
  },
  notificationVolume: {
    type: Number,
    default: 0.5
  },
  lastParams: {
    type: Object,
    default: null
  },
  hasEnabledADetailers: {
    type: Boolean,
    default: false
  },
  enabledADetailers: {
    type: Array,
    default: () => []
  },
  adetailerLabels: {
    type: Array,
    default: () => []
  },
  showConfirm: {
    type: Function,
    required: true
  },
  showToast: {
    type: Function,
    required: true
  }
})

const emit = defineEmits([
  'toggle-panel',
  'check-api',
  'update:selectedModel',
  'update:samplerName',
  'update:scheduler',
  'apply-aspect-ratio',
  'swap-dimensions',
  'update:width',
  'update:height',
  'update:batchCount',
  'update:batchSize',
  'update:seed',
  'randomize-seed',
  'update:seedVariationRange',
  'update:notificationType',
  'test-notification',
  'update:notificationVolume'
])

// Local state for debounced width/height
const localWidth = ref(props.width)
const localHeight = ref(props.height)

// Debounce timers
const debounceTimers = { width: null, height: null }

// Local refs lookup for dimension updates
const localRefs = { width: localWidth, height: localHeight }

// Watch props to sync local state when changed externally
watch(() => props.width, (newWidth) => {
  localWidth.value = newWidth
})

watch(() => props.height, (newHeight) => {
  localHeight.value = newHeight
})

// Unified dimension update function with debounce and 8-multiple validation
async function updateDimension(type, value) {
  const localRef = localRefs[type]
  localRef.value = value

  if (debounceTimers[type]) {
    clearTimeout(debounceTimers[type])
  }

  debounceTimers[type] = setTimeout(async () => {
    const numValue = Number(value)
    const emitEvent = `update:${type}`
    const messageKey = `dimensionValidation.${type}Message`

    // Check if value is multiple of 8
    if (numValue % 8 !== 0) {
      const correctedValue = Math.round(numValue / 8) * 8
      const setting = localStorage.getItem('sd-auto-correct-dimensions')

      if (setting === null) {
        // No preference set - ask user
        const result = await props.showConfirm({
          title: t('dimensionValidation.title'),
          message: t(messageKey, { original: numValue, corrected: correctedValue }),
          confirmText: t('dimensionValidation.applyCorrection'),
          cancelText: t('dimensionValidation.keepOriginal'),
          showDontAskAgain: true,
          dontAskAgainText: t('common.dontAskAgain')
        })

        if (result.confirmed) {
          localRef.value = correctedValue
          emit(emitEvent, correctedValue)
        } else {
          emit(emitEvent, numValue)
        }

        if (result.dontAskAgain) {
          localStorage.setItem('sd-auto-correct-dimensions', String(result.confirmed))
          autoCorrectDimensions.value = result.confirmed
          props.showToast?.(t('dimensionValidation.settingsHint'), 'info')
        }
      } else if (setting === 'true') {
        localRef.value = correctedValue
        emit(emitEvent, correctedValue)
      } else {
        emit(emitEvent, numValue)
      }
    } else {
      emit(emitEvent, numValue)
    }
  }, 300)
}

// Wrapper functions for template binding
function updateWidth(value) {
  updateDimension('width', value)
}

function updateHeight(value) {
  updateDimension('height', value)
}

// Save auto-correct setting to localStorage
function saveAutoCorrectSetting() {
  localStorage.setItem('sd-auto-correct-dimensions', String(autoCorrectDimensions.value))
}

// Load auto-correct setting from localStorage on mount
onMounted(() => {
  const saved = localStorage.getItem('sd-auto-correct-dimensions')
  if (saved === 'true') {
    autoCorrectDimensions.value = true
  } else if (saved === 'false') {
    autoCorrectDimensions.value = false
  }
  // If saved is null, keep default (false) and will ask user
})
</script>

<style scoped>
.advanced-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: all 0.3s ease;
}

.advanced-panel.collapsed {
  width: 40px;
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.toggle-advanced-btn {
  padding: 4px 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toggle-advanced-btn:hover {
  background: var(--color-bg-hover);
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.advanced-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: var(--color-bg-secondary);
}

.form-group {
  margin-bottom: 12px;
}

.form-group.horizontal {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group.horizontal label {
  flex: 0 0 80px;
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.form-group.horizontal input[type="number"],
.form-group.horizontal input[type="range"],
.form-group.horizontal select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
  font-size: 13px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.form-group.horizontal input[type="range"] {
  padding: 0;
}

.volume-display {
  flex: 0 0 40px;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: right;
}

.swap-btn {
  padding: 8px 12px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s;
  min-width: 40px;
}

.swap-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: scale(1.05);
}

.swap-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.seed-random-btn,
.test-notification-btn {
  padding: 6px 10px;
  background: var(--color-success);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.seed-random-btn:hover:not(:disabled),
.test-notification-btn:hover:not(:disabled) {
  background: var(--color-success-dark);
  transform: scale(1.05);
}

.seed-random-btn:disabled,
.test-notification-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-divider {
  height: 1px;
  background: var(--color-border-primary);
  margin: 16px 0;
}

.panel-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-primary);
}

.footer-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.footer-btn {
  padding: 4px 10px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
}

.footer-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: scale(1.05);
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* System Settings Section */
.system-settings-section {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
}

.system-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.system-settings-header:hover {
  background: var(--color-bg-hover);
}

.system-settings-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-icon {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.system-settings-content {
  padding: 12px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-primary);
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-group + .setting-group {
  margin-top: 12px;
}

.setting-label {
  flex: 0 0 80px;
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.setting-label.checkbox-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.setting-label.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.setting-label.checkbox-label span {
  font-size: 13px;
  color: var(--color-text-primary);
}

/* Transition Animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* LanguageSwitcher override */
.system-settings-content :deep(.language-switcher .lang-btn) {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}

.system-settings-content :deep(.language-switcher .lang-btn:hover) {
  background: var(--color-bg-hover);
}

.system-settings-content :deep(.language-switcher .lang-btn.active) {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary-dark);
}

/* Theme Toggle */
.theme-toggle {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.theme-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-hover);
  transform: translateY(-1px);
}

.theme-btn.active {
  border-color: var(--color-primary);
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.theme-btn.active:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}
</style>
