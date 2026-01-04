<template>
  <div class="prompt-panel">
    <div class="panel-header">
      <h3 class="panel-title">{{ $t('promptPanel.title') }}</h3>
      <div class="header-buttons">
        <button
          class="control-btn infinite-btn-header"
          :class="{ active: isInfiniteMode }"
          @click="$emit('toggle-infinite')"
          :title="isInfiniteMode ? $t('promptPanel.infiniteModeOff') : $t('promptPanel.infiniteModeOn')"
        >
          <span v-if="!isInfiniteMode" style="font-size: 22px; font-weight: 700; line-height: 1;">∞</span>
          <span v-else style="font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 2px;">
            <span style="font-size: 16px;">∞</span> ON
          </span>
        </button>
        <label class="combination-checkbox" :title="$t('promptPanel.combinationMode')">
          <input
            type="checkbox"
            :checked="combinationMode"
            @change="$emit('update:combination-mode', $event.target.checked)"
            :disabled="isGenerating"
          >
          <span class="combination-label">
            {{ $t('promptPanel.combinationMode') }}
            <span v-if="combinationCount > 1" class="combination-count">{{ $t('promptPanel.combinationCount', { count: combinationCount }) }}</span>
          </span>
        </label>
        <button
          class="generate-btn"
          @click="$emit('generate')"
          :disabled="isGenerating || !apiConnected"
          :title="!apiConnected ? $t('promptPanel.apiNotConnected') : ''"
        >
          {{ isGenerating ? $t('promptPanel.generating') : !apiConnected ? $t('promptPanel.apiConnectionRequired') : $t('promptPanel.generate') }}
        </button>
      </div>
    </div>

    <div v-if="isGenerating || isInfiniteMode" class="progress-container" :class="{ 'infinite-mode': isInfiniteMode }">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-text">
        <span v-if="progressState" class="progress-state">{{ progressState }}</span>
        <span class="progress-percent">{{ Math.round(progress) }}%</span>
        <span v-if="isInfiniteMode" class="infinite-indicator">
          {{ $t('promptPanel.infiniteStatus', { count: infiniteCount }) }}
        </span>
      </div>
    </div>

    <div class="generation-controls" v-if="isGenerating">
      <template v-if="isInfiniteMode">
        <button
          class="control-btn interrupt-btn"
          @click="$emit('interrupt')"
          :title="$t('promptPanel.interruptImmediatelyTooltip')"
        >
          {{ $t('promptPanel.interruptImmediately') }}
        </button>
        <button
          class="control-btn pause-btn"
          @click="$emit('stop-infinite')"
          :title="$t('promptPanel.disableInfiniteModeTooltip')"
        >
          {{ $t('promptPanel.disableInfiniteMode') }}
        </button>
      </template>
      <template v-else>
        <button
          class="control-btn interrupt-btn"
          @click="$emit('interrupt')"
          :title="$t('promptPanel.interruptTooltip')"
        >
          {{ $t('promptPanel.interrupt') }}
        </button>
      </template>
      <button
        v-if="batchSize > 1 || isInfiniteMode"
        class="control-btn skip-btn"
        @click="$emit('skip')"
        :title="isInfiniteMode ? $t('promptPanel.skipNextInfinite') : $t('promptPanel.skipNextBatch', { batchSize })"
      >
        {{ $t('promptPanel.skip') }}
      </button>
    </div>

    <!-- 도구 모음 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <button
          class="tool-btn bookmark-btn"
          :class="{ active: showBookmarkManager }"
          @click="$emit('open-bookmark')"
          title="Bookmark Manager"
        >
          {{ showBookmarkManager ? '✕ Close' : '🔖 Bookmarks' }}
        </button>
        <button
          class="tool-btn preset-btn"
          :class="{ active: showPresetManager }"
          @click="$emit('open-preset')"
          title="Preset Manager"
        >
          {{ showPresetManager ? '✕ Close' : '⚙️ Presets' }}
        </button>
        <button
          class="tool-btn queue-btn"
          :class="{ active: showQueueManager }"
          @click="$emit('open-queue')"
          title="Queue Manager"
        >
          {{ showQueueManager ? '✕ Close' : '🎬 Queue' }}
        </button>
        <button
          class="tool-btn lora-btn"
          :class="{ active: showLoraSelector }"
          @click="$emit('open-lora')"
          title="LoRA Selector"
        >
          {{ showLoraSelector ? '✕ Close' : '📦 LoRA' }}
        </button>
        <button
          class="tool-btn prompt-helper-btn"
          :class="{ active: showPromptSelector }"
          @click="$emit('open-prompts')"
          title="Easy Prompt Selector"
        >
          {{ showPromptSelector ? '✕ Close' : '📝 Prompts' }}
        </button>
      </div>
    </div>

    <div class="prompt-section">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isGenerating: {
    type: Boolean,
    default: false
  },
  apiConnected: {
    type: Boolean,
    default: false
  },
  isInfiniteMode: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  progressState: {
    type: String,
    default: ''
  },
  infiniteCount: {
    type: Number,
    default: 0
  },
  batchSize: {
    type: Number,
    default: 1
  },
  showBookmarkManager: {
    type: Boolean,
    default: false
  },
  showPresetManager: {
    type: Boolean,
    default: false
  },
  showQueueManager: {
    type: Boolean,
    default: false
  },
  showLoraSelector: {
    type: Boolean,
    default: false
  },
  showPromptSelector: {
    type: Boolean,
    default: false
  },
  combinationMode: {
    type: Boolean,
    default: false
  },
  combinationCount: {
    type: Number,
    default: 1
  }
})

defineEmits([
  'toggle-infinite',
  'generate',
  'interrupt',
  'stop-infinite',
  'skip',
  'open-bookmark',
  'open-preset',
  'open-queue',
  'open-lora',
  'open-prompts',
  'update:combination-mode'
])
</script>

<style scoped>
.prompt-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.infinite-btn-header {
  background: #e0e7ff;
  color: #4338ca;
  border: 2px solid #c7d2fe;
}

.infinite-btn-header:hover {
  background: #c7d2fe;
  border-color: #a5b4fc;
}

.infinite-btn-header.active {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  color: white;
  border-color: #f59e0b;
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
  }
}

.generate-btn {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

.generate-btn:active:not(:disabled) {
  transform: translateY(0);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-text-secondary);
}

.combination-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.combination-checkbox:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-primary);
}

.combination-checkbox:has(input:checked) {
  background: #e0e7ff;
  border-color: #818cf8;
}

.combination-checkbox input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.combination-checkbox input:disabled {
  cursor: not-allowed;
}

.combination-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.combination-count {
  color: var(--color-primary);
  font-weight: 600;
}

.progress-container {
  flex-shrink: 0;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.progress-container.infinite-mode {
  border: 2px solid #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%);
}

.progress-bar {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-container.infinite-mode .progress-fill {
  background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%);
}

.progress-text {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.progress-state {
  font-weight: 500;
  color: var(--color-text-primary);
}

.progress-percent {
  font-weight: 600;
  color: var(--color-primary);
}

.infinite-indicator {
  font-weight: 600;
  color: var(--color-warning);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.generation-controls {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fef3c7;
  border-bottom: 1px solid #fde68a;
}

.interrupt-btn {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.interrupt-btn:hover {
  background: var(--color-error-dark);
  transform: scale(1.02);
}

.pause-btn {
  background: var(--color-warning);
  color: var(--color-text-inverse);
}

.pause-btn:hover {
  background: var(--color-warning-dark);
  transform: scale(1.02);
}

.skip-btn {
  background: var(--color-info);
  color: var(--color-text-inverse);
}

.skip-btn:hover {
  background: var(--color-info-dark);
  transform: scale(1.02);
}

.toolbar {
  flex-shrink: 0;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-primary);
}

.toolbar-section {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-btn {
  padding: 8px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  color: var(--color-text-primary);
}

.tool-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
}

.tool-btn.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

.prompt-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>
