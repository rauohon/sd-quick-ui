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
      :src="item.image"
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

// Format timestamp for display (supports both old and new formats)
function formatTimestamp(timestamp) {
  if (!timestamp) return '--:--'

  try {
    // Try parsing as ISO format (new format)
    const date = new Date(timestamp)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  } catch (e) {
    // Fallback to old format parsing
  }

  // Fallback: extract time from old format "2025. 12. 28. 오후 3:30:45"
  try {
    const parts = timestamp.split(' ')
    // Find time part (contains ":")
    const timePart = parts.find(p => p.includes(':'))
    if (timePart) {
      // Extract HH:MM from "3:30:45" or "15:30:45"
      const [hour, minute] = timePart.split(':')
      return `${hour}:${minute}`
    }
  } catch (e) {
    // Last resort: return original
  }

  return timestamp
}
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
