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

      <!-- ControlNet 버튼 -->
      <div class="form-group controlnet-section">
        <button
          class="controlnet-btn"
          :class="{ active: showControlNetManager }"
          @click="$emit('open-controlnet')"
        >
          <span class="controlnet-icon">🎛️</span>
          <span class="controlnet-label">ControlNet</span>
          <span v-if="controlnetEnabledCount > 0" class="controlnet-badge">{{ controlnetEnabledCount }}</span>
          <span class="controlnet-arrow">{{ showControlNetManager ? '✕' : '▶' }}</span>
        </button>
      </div>

      <!-- Extension slot -->
      <slot />

      <!-- 마지막 생성 설정값 표시 -->
      <LastParamsSection
        :last-params="lastParams"
        :has-enabled-adetailers="hasEnabledADetailers"
        :enabled-adetailers="enabledADetailers"
        :adetailer-labels="adetailerLabels"
      />
    </div>

    <!-- System Settings Section -->
    <SystemSettingsSection
      v-if="isExpanded"
      :isDark="isDark"
      :toggleTheme="toggleTheme"
      :notificationType="notificationType"
      :notificationVolume="notificationVolume"
      :isGenerating="isGenerating"
      @update:notificationType="$emit('update:notificationType', $event)"
      @update:notificationVolume="$emit('update:notificationVolume', $event)"
    />

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
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ApiStatusIndicator from './ApiStatusIndicator.vue'
import LastParamsSection from './LastParamsSection.vue'
import SystemSettingsSection from './SystemSettingsSection.vue'

const { t } = useI18n()

// State

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
    type: Number,
    default: 0
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
  },
  showControlNetManager: {
    type: Boolean,
    default: false
  },
  controlnetEnabledCount: {
    type: Number,
    default: 0
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
  'update:notificationVolume',
  'open-controlnet'
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

/* ControlNet Button */
.controlnet-section {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-primary);
}

.controlnet-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.controlnet-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: #667eea;
}

.controlnet-btn.active {
  background: rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.controlnet-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.controlnet-icon {
  font-size: 16px;
}

.controlnet-label {
  flex: 1;
  text-align: left;
}

.controlnet-badge {
  background: #667eea;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.controlnet-arrow {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
