<template>
  <div class="history-panel" :class="{ 'content-collapsed': isContentCollapsed }">
    <div class="panel-header">
      <h3 class="panel-title">
        <span>{{ $t('history.title') }}</span>
        <span v-if="showFavoriteOnly" style="color: #ffd700; font-size: 16px;">⭐</span>
        <span v-if="isSelectionMode" class="selection-count">{{ $t('history.selectedCountShort', { count: selectedCount }) }}</span>
      </h3>
      <div style="display: flex; gap: 8px;">
        <template v-if="isSelectionMode">
          <button class="batch-btn" @click="$emit('select-all')" :title="$t('history.selectAll')">
            {{ $t('history.selectAllShort') }}
          </button>
          <button class="batch-btn" @click="$emit('deselect-all')" :title="$t('history.deselectAll')">
            {{ $t('history.deselectAllShort') }}
          </button>
          <button
            class="batch-download-btn"
            @click="$emit('download-selected')"
            :disabled="selectedCount === 0"
            :title="$t('history.downloadSelectedTooltip')"
          >
            {{ $t('history.downloadSelected') }}
          </button>
          <button class="batch-btn cancel" @click="$emit('toggle-selection-mode')" :title="$t('history.cancelSelectionMode')">
            {{ $t('common.cancel') }}
          </button>
        </template>
        <template v-else>
          <button
            class="toggle-content-btn"
            @click="$emit('toggle-content')"
            :title="isContentCollapsed ? $t('history.unfoldContent') : $t('history.foldContent')"
          >
            {{ isContentCollapsed ? '▼' : '▲' }}
          </button>
          <button
            class="toggle-panel-btn"
            @click="$emit('toggle-panel')"
            :title="isExpanded ? $t('history.hidePanel') : $t('history.showPanel')"
          >
            {{ isExpanded ? '◀' : '▶' }}
          </button>
          <button
            class="filter-favorite-btn"
            @click="$emit('toggle-favorite-filter')"
            :class="{ active: showFavoriteOnly }"
            :title="showFavoriteOnly ? $t('history.showAllImages') : $t('history.showFavoritesOnly')"
            v-if="hasFavorites"
          >
            {{ showFavoriteOnly ? '⭐' : '☆' }}
          </button>
          <button
            class="batch-btn"
            @click="$emit('toggle-selection-mode')"
            v-if="hasImages"
            :title="$t('history.batchSelectTooltip')"
          >
            {{ $t('history.batchSelect') }}
          </button>
          <button class="clear-btn" @click="$emit('clear-history')" v-if="hasImages">
            {{ $t('history.clear') }}
          </button>
        </template>
      </div>
    </div>
    <div
      v-if="isExpanded && !isContentCollapsed"
      ref="scrollContainerRef"
      class="history-content"
      :class="{ 'virtual-scroll-mode': useVirtualScroll }"
    >
      <!-- Virtual scroll: spacer for total height -->
      <div v-if="useVirtualScroll" class="virtual-scroll-spacer" :style="{ height: totalHeight + 'px' }">
        <!-- Virtual scroll: positioned content -->
        <div class="virtual-scroll-content" :style="{ transform: `translateY(${offsetY}px)` }">
          <slot></slot>
        </div>
      </div>
      <!-- Non-virtual scroll: direct content -->
      <template v-else>
        <slot></slot>
      </template>
      <div v-if="isEmpty && !showFavoriteOnly" class="history-empty">
        {{ $t('history.noImages') }}
        <button class="sample-btn" @click="$emit('add-sample')">
          {{ $t('history.addTestSample') }}
        </button>
      </div>
      <div v-if="isEmpty && showFavoriteOnly" class="history-empty">
        {{ $t('history.noFavorites') }}
      </div>
    </div>
    <div v-if="isExpanded && !isContentCollapsed" class="panel-footer center">
      <span class="image-count">{{ totalImageCount }}/200</span>
      <button
        v-if="imageCount < totalImageCount"
        class="footer-btn load-more"
        @click="$emit('load-more')"
        :title="$t('history.loadMoreTooltip')"
      >
        {{ $t('history.loadMore') }} ({{ imageCount }}/{{ totalImageCount }})
      </button>
      <button class="footer-btn" @click="$emit('add-sample')">
        {{ $t('history.addSample') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  isExpanded: {
    type: Boolean,
    default: true
  },
  isContentCollapsed: {
    type: Boolean,
    default: false
  },
  showFavoriteOnly: {
    type: Boolean,
    default: false
  },
  isSelectionMode: {
    type: Boolean,
    default: false
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  imageCount: {
    type: Number,
    default: 0
  },
  totalImageCount: {
    type: Number,
    default: 0
  },
  isEmpty: {
    type: Boolean,
    default: true
  },
  hasFavorites: {
    type: Boolean,
    default: false
  },
  hasImages: {
    type: Boolean,
    default: false
  },
  // Virtual scroll props
  useVirtualScroll: {
    type: Boolean,
    default: false
  },
  totalHeight: {
    type: Number,
    default: 0
  },
  offsetY: {
    type: Number,
    default: 0
  }
})

// Scroll container ref for virtual scroll
const scrollContainerRef = ref(null)

// Expose the scroll container ref to parent
defineExpose({
  scrollContainerRef
})

defineEmits([
  'toggle-panel',
  'toggle-content',
  'toggle-favorite-filter',
  'toggle-selection-mode',
  'select-all',
  'deselect-all',
  'download-selected',
  'clear-history',
  'add-sample',
  'load-more'
])
</script>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid #e0e0e0;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.selection-count {
  margin-left: 8px;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
}

.toggle-content-btn,
.toggle-panel-btn {
  padding: 4px 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toggle-content-btn {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: #1e40af;
}

.toggle-content-btn:hover {
  background: var(--color-bg-hover);
}

.filter-favorite-btn,
.batch-btn,
.clear-btn {
  padding: 5px 13px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  color: var(--color-text-primary);
}

.toggle-panel-btn:hover {
  background: var(--color-bg-hover);
}

.filter-favorite-btn:hover,
.batch-btn:hover,
.clear-btn:hover {
  background: var(--color-bg-elevated);
  transform: scale(1.02);
}

.filter-favorite-btn {
  font-size: 16px;
  padding: 4px 10px;
}

.filter-favorite-btn.active {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #92400e;
}

.batch-download-btn {
  padding: 6px 12px;
  background: var(--color-primary);
  border: 1px solid #4338ca;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-inverse);
  transition: all 0.2s;
}

.batch-download-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: scale(1.02);
}

.batch-download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-btn.cancel {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.batch-btn.cancel:hover {
  background: #fecaca;
}

.clear-btn {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.clear-btn:hover {
  background: #fecaca;
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: var(--color-bg-tertiary);
  /* Default: grid layout for non-virtual scroll */
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Virtual scroll mode: remove grid from container */
.history-content.virtual-scroll-mode {
  display: block;
}

/* Virtual scroll container */
.virtual-scroll-spacer {
  position: relative;
  width: 100%;
}

.virtual-scroll-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.history-empty {
  grid-column: 1 / -1;
  width: 100%;
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 14px;
  box-sizing: border-box;
}

.sample-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.sample-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.panel-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-top: 1px solid #e0e0e0;
}

.panel-footer.center {
  justify-content: center;
  gap: 12px;
}

.image-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
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

.footer-btn:hover {
  background: var(--color-primary-dark);
  transform: scale(1.05);
}
</style>
