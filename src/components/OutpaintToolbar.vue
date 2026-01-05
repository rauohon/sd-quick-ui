<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  expandTop: { type: Number, default: 0 },
  expandBottom: { type: Number, default: 0 },
  expandLeft: { type: Number, default: 0 },
  expandRight: { type: Number, default: 0 },
  expandFillMode: { type: String, default: 'fill' },
  expandFillColor: { type: String, default: '#000000' },
  isExpanded: { type: Boolean, default: false },
  isGenerating: { type: Boolean, default: false },
  imageWidth: { type: Number, default: 0 },
  imageHeight: { type: Number, default: 0 },
  expandedWidth: { type: Number, default: 0 },
  expandedHeight: { type: Number, default: 0 },
  presets: { type: Array, default: () => [64, 128, 256, 512] },
  fillColors: { type: Array, default: () => ['#000000', '#808080', '#ffffff'] }
})

const emit = defineEmits([
  'update:expandTop',
  'update:expandBottom',
  'update:expandLeft',
  'update:expandRight',
  'update:expandFillMode',
  'update:expandFillColor',
  'apply-preset',
  'apply',
  'reset'
])

const hasExpansion = computed(() =>
  props.expandTop > 0 || props.expandBottom > 0 ||
  props.expandLeft > 0 || props.expandRight > 0
)

const isDisabled = computed(() => props.isGenerating || props.isExpanded)

import { computed } from 'vue'
</script>

<template>
  <div class="expand-toolbar">
    <div class="expand-title">
      <span class="expand-icon">🔲</span>
      {{ t('inpaint.expand') }}
    </div>

    <!-- 방향별 픽셀 입력 -->
    <div class="expand-inputs">
      <div class="expand-input-group">
        <label>{{ t('inpaint.expandTop') }}</label>
        <input
          type="number"
          :value="expandTop"
          @input="emit('update:expandTop', Number($event.target.value))"
          min="0"
          max="1024"
          step="8"
          :disabled="isDisabled"
        />
      </div>
      <div class="expand-input-group">
        <label>{{ t('inpaint.expandBottom') }}</label>
        <input
          type="number"
          :value="expandBottom"
          @input="emit('update:expandBottom', Number($event.target.value))"
          min="0"
          max="1024"
          step="8"
          :disabled="isDisabled"
        />
      </div>
      <div class="expand-input-group">
        <label>{{ t('inpaint.expandLeft') }}</label>
        <input
          type="number"
          :value="expandLeft"
          @input="emit('update:expandLeft', Number($event.target.value))"
          min="0"
          max="1024"
          step="8"
          :disabled="isDisabled"
        />
      </div>
      <div class="expand-input-group">
        <label>{{ t('inpaint.expandRight') }}</label>
        <input
          type="number"
          :value="expandRight"
          @input="emit('update:expandRight', Number($event.target.value))"
          min="0"
          max="1024"
          step="8"
          :disabled="isDisabled"
        />
      </div>
    </div>

    <!-- 프리셋 버튼 -->
    <div class="expand-presets">
      <span class="preset-label">{{ t('inpaint.expandAll') }}:</span>
      <button
        v-for="preset in presets"
        :key="preset"
        class="preset-btn"
        @click="emit('apply-preset', preset)"
        :disabled="isDisabled"
      >
        {{ preset }}
      </button>
    </div>

    <!-- 채우기 옵션 -->
    <div class="expand-fill-options">
      <span class="fill-label">{{ t('inpaint.expandFill') }}:</span>
      <select
        :value="expandFillMode"
        @change="emit('update:expandFillMode', $event.target.value)"
        :disabled="isDisabled"
        class="fill-mode-select"
      >
        <option value="fill">{{ t('inpaint.fillSolid') }}</option>
        <option value="noise">{{ t('inpaint.fillNoise') }}</option>
      </select>
      <div v-if="expandFillMode === 'fill'" class="fill-colors">
        <button
          v-for="color in fillColors"
          :key="color"
          class="color-btn"
          :class="{ active: expandFillColor === color }"
          :style="{ backgroundColor: color }"
          @click="emit('update:expandFillColor', color)"
          :disabled="isDisabled"
          :title="color"
        />
      </div>
    </div>

    <!-- 확장 적용/리셋 버튼 -->
    <div class="expand-actions">
      <button
        class="expand-apply-btn"
        @click="emit('apply')"
        :disabled="isGenerating || isExpanded || !hasExpansion"
      >
        {{ t('inpaint.applyExpansion') }}
      </button>
      <button
        class="expand-reset-btn"
        @click="emit('reset')"
        :disabled="isGenerating || (!isExpanded && !hasExpansion)"
      >
        {{ t('inpaint.resetExpansion') }}
      </button>
    </div>

    <!-- 확장 미리보기 정보 -->
    <div v-if="hasExpansion" class="expand-preview-info">
      <span class="preview-label">{{ t('inpaint.expandPreview') }}:</span>
      <span class="preview-size">
        {{ imageWidth }} × {{ imageHeight }}
        →
        {{ expandedWidth }} × {{ expandedHeight }}
      </span>
      <span v-if="isExpanded" class="expand-status applied">✓</span>
    </div>
  </div>
</template>

<style scoped>
/* 스타일은 InpaintView.vue scoped styles에서 상속 */
</style>
