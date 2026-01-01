<template>
  <div
    class="history-item"
    :class="{
      'is-favorite': item.favorite,
      'is-interrupted': item.interrupted,
      'is-selected': isSelectionMode && isSelected
    }"
    @click="isSelectionMode ? $emit('toggle-selection', item.id) : null"
  >
    <LazyImage
      :src="item.thumbnail || item.image"
      :alt="'Generated ' + index"
      @click="isSelectionMode ? $event.stopPropagation() : $emit('compare-image', item)"
    />

    <div v-if="isSelectionMode" class="selection-checkbox" @click.stop="$emit('toggle-selection', item.id)">
      <input type="checkbox" :checked="isSelected" @click.stop>
      <span class="checkmark">{{ isSelected ? '✓' : '' }}</span>
    </div>

    <div class="history-time">{{ formatTimestamp(item.timestamp) }}</div>

    <div v-if="item.interrupted" class="interrupted-badge" title="스킵/중단된 미완성 이미지">⚠️</div>

    <div v-if="!isSelectionMode" class="history-actions">
      <button
        class="favorite-btn"
        @click.stop="$emit('toggle-favorite', item, index)"
        :title="item.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'"
      >
        {{ item.favorite ? '⭐' : '☆' }}
      </button>
      <button class="load-params-btn" @click.stop="$emit('load-params', item)" title="Load these settings">
        🔄
      </button>
      <button class="delete-btn" @click.stop="$emit('delete', item, index)" title="이미지 삭제">
        🗑️
      </button>
    </div>
  </div>
</template>

<script setup>
import LazyImage from './LazyImage.vue'
import { formatTimestamp } from '../utils/dateUtils'

defineProps({
  item: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  isSelectionMode: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-favorite', 'delete', 'load-params', 'toggle-selection', 'compare-image'])
</script>

<style scoped>
.history-item.is-selected {
  outline: 3px solid #4f46e5;
  outline-offset: -3px;
}

.history-item.is-selected img {
  opacity: 0.7;
}
</style>
