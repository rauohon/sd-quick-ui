<template>
  <div class="prompt-panel">
    <div class="panel-header">
      <h3 class="panel-title">프롬프트</h3>
      <div class="header-buttons">
        <button
          class="control-btn infinite-btn-header"
          :class="{ active: isInfiniteMode }"
          @click="$emit('toggle-infinite')"
          :title="isInfiniteMode ? '무한 생성 모드 끄기 (클릭)' : '무한 생성 모드 켜기'"
        >
          <span v-if="!isInfiniteMode" style="font-size: 22px; font-weight: 700; line-height: 1;">∞</span>
          <span v-else style="font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 2px;">
            <span style="font-size: 16px;">∞</span> ON
          </span>
        </button>
        <button
          class="generate-btn"
          @click="$emit('generate')"
          :disabled="isGenerating || !apiConnected"
          :title="!apiConnected ? 'API가 연결되지 않았습니다' : ''"
        >
          {{ isGenerating ? '생성 중...' : !apiConnected ? '⚠️ API 연결 필요' : '🚀 생성' }}
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
          🔄 무한모드: {{ infiniteCount }}장 생성됨
        </span>
      </div>
    </div>

    <!-- 생성 제어 버튼들 -->
    <div class="generation-controls" v-if="isGenerating">
      <!-- 무한 모드일 때: 두 가지 중단 옵션 제공 -->
      <template v-if="isInfiniteMode">
        <button
          class="control-btn interrupt-btn"
          @click="$emit('interrupt')"
          title="현재 생성 중인 이미지도 즉시 중단"
        >
          ⏹️ 즉시 중단
        </button>
        <button
          class="control-btn pause-btn"
          @click="$emit('stop-infinite')"
          title="현재 이미지 완성 후 무한모드만 해제"
        >
          ⏸️ 무한모드 해제
        </button>
      </template>
      <!-- 일반 모드일 때: 중단 버튼만 -->
      <template v-else>
        <button
          class="control-btn interrupt-btn"
          @click="$emit('interrupt')"
          title="현재 생성 완전 중단"
        >
          ⏹️ 중단
        </button>
      </template>
      <!-- 스킵 버튼 (배치 생성 또는 무한 모드일 때만) -->
      <button
        v-if="batchSize > 1 || isInfiniteMode"
        class="control-btn skip-btn"
        @click="$emit('skip')"
        :title="isInfiniteMode ? '현재 이미지 건너뛰고 다음 생성' : `현재 이미지 건너뛰고 다음 (배치 ${batchSize}개 중)`"
      >
        ⏭️ 스킵
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
  'open-prompts'
])
</script>

<style scoped>
.prompt-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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
  background: #9ca3af;
}

.progress-container {
  flex-shrink: 0;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.progress-container.infinite-mode {
  border: 2px solid #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%);
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
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
  color: #6b7280;
}

.progress-state {
  font-weight: 500;
  color: #374151;
}

.progress-percent {
  font-weight: 600;
  color: #667eea;
}

.infinite-indicator {
  font-weight: 600;
  color: #f59e0b;
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
  background: #ef4444;
  color: white;
}

.interrupt-btn:hover {
  background: #dc2626;
  transform: scale(1.02);
}

.pause-btn {
  background: #f59e0b;
  color: white;
}

.pause-btn:hover {
  background: #d97706;
  transform: scale(1.02);
}

.skip-btn {
  background: #3b82f6;
  color: white;
}

.skip-btn:hover {
  background: #2563eb;
  transform: scale(1.02);
}

.toolbar {
  flex-shrink: 0;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.toolbar-section {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-btn {
  padding: 8px 14px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  color: #374151;
}

.tool-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.tool-btn.active {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
  font-weight: 600;
}

.prompt-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>
