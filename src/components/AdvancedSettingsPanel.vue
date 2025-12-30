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
        <LanguageSwitcher v-if="isExpanded" />
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
          :value="width"
          @input="$emit('update:width', Number($event.target.value))"
          step="64"
          :disabled="isGenerating"
        >
      </div>

      <div class="form-group horizontal">
        <label>Height</label>
        <input
          type="number"
          :value="height"
          @input="$emit('update:height', Number($event.target.value))"
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
import ApiStatusIndicator from './ApiStatusIndicator.vue'
import LastParamsSection from './LastParamsSection.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'

defineProps({
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
  }
})

defineEmits([
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
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.toggle-advanced-btn {
  padding: 4px 8px;
  background: #e5e7eb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toggle-advanced-btn:hover {
  background: #d1d5db;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.advanced-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: white;
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
  color: #555;
  font-weight: 500;
}

.form-group.horizontal input[type="number"],
.form-group.horizontal input[type="range"],
.form-group.horizontal select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.form-group.horizontal input[type="range"] {
  padding: 0;
}

.volume-display {
  flex: 0 0 40px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.swap-btn {
  padding: 8px 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s;
  min-width: 40px;
}

.swap-btn:hover:not(:disabled) {
  background: #4f46e5;
  transform: scale(1.05);
}

.swap-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.seed-random-btn,
.test-notification-btn {
  padding: 6px 10px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.seed-random-btn:hover:not(:disabled),
.test-notification-btn:hover:not(:disabled) {
  background: #059669;
  transform: scale(1.05);
}

.seed-random-btn:disabled,
.test-notification-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 16px 0;
}

.panel-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.footer-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.footer-btn {
  padding: 4px 10px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
}

.footer-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: scale(1.05);
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
