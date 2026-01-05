<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  activeTool: { type: String, default: 'brush' },
  brushSize: { type: Number, default: 30 },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  zoomLevel: { type: Number, default: 1 },
  minZoom: { type: Number, default: 0.1 },
  maxZoom: { type: Number, default: 5 }
})

const emit = defineEmits([
  'update:activeTool',
  'update:brushSize',
  'fill-mask',
  'clear-mask',
  'invert-mask',
  'undo',
  'redo',
  'zoom-in',
  'zoom-out',
  'fit-to-screen',
  'file-upload',
  'open-history'
])

const zoomPercentage = computed(() => Math.round(props.zoomLevel * 100))

function handleFileChange(event) {
  emit('file-upload', event)
}

import { computed } from 'vue'
</script>

<template>
  <div class="mask-toolbar">
    <!-- 도구 선택 -->
    <div class="tool-group">
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'brush' }"
        @click="emit('update:activeTool', 'brush')"
        :title="t('inpaint.brush')"
      >
        🖌️
      </button>
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'eraser' }"
        @click="emit('update:activeTool', 'eraser')"
        :title="t('inpaint.eraser')"
      >
        🧹
      </button>
    </div>

    <!-- 브러시 크기 -->
    <div class="tool-group">
      <label class="brush-size-label">
        {{ t('inpaint.brushSize') }}: {{ brushSize }}px
      </label>
      <input
        type="range"
        :value="brushSize"
        @input="emit('update:brushSize', Number($event.target.value))"
        min="1"
        max="200"
        class="brush-size-slider"
      />
    </div>

    <!-- 마스크 액션 -->
    <div class="tool-group">
      <button class="action-btn" @click="emit('fill-mask')" :title="t('inpaint.fillMask')">
        {{ t('inpaint.fillMask') }}
      </button>
      <button class="action-btn" @click="emit('clear-mask')" :title="t('inpaint.clearMask')">
        {{ t('inpaint.clearMask') }}
      </button>
      <button class="action-btn" @click="emit('invert-mask')" :title="t('inpaint.invertMask')">
        {{ t('inpaint.invertMask') }}
      </button>
    </div>

    <!-- Undo/Redo -->
    <div class="tool-group">
      <button
        class="action-btn"
        @click="emit('undo')"
        :disabled="!canUndo"
        :title="t('inpaint.undo') + ' (Ctrl+Z)'"
      >
        ↩️ {{ t('inpaint.undo') }}
      </button>
      <button
        class="action-btn"
        @click="emit('redo')"
        :disabled="!canRedo"
        :title="t('inpaint.redo') + ' (Ctrl+Y)'"
      >
        ↪️ {{ t('inpaint.redo') }}
      </button>
    </div>

    <!-- 파일/히스토리 -->
    <div class="tool-group">
      <label class="upload-btn small">
        <input type="file" accept="image/*" @change="handleFileChange" hidden />
        📁
      </label>
      <button class="action-btn small" @click="emit('open-history')">📋</button>
    </div>

    <!-- 줌 컨트롤 -->
    <div class="tool-group zoom-group">
      <button
        class="action-btn"
        @click="emit('zoom-out')"
        :disabled="zoomLevel <= minZoom"
        :title="t('inpaint.zoomOut')"
      >
        ➖
      </button>
      <span class="zoom-display">{{ zoomPercentage }}%</span>
      <button
        class="action-btn"
        @click="emit('zoom-in')"
        :disabled="zoomLevel >= maxZoom"
        :title="t('inpaint.zoomIn')"
      >
        ➕
      </button>
      <button
        class="action-btn"
        @click="emit('fit-to-screen')"
        :title="t('inpaint.fitToScreen')"
      >
        {{ t('inpaint.fit') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 스타일은 generation-view.css에서 상속 */
</style>
