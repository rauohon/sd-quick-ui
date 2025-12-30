<template>
  <div class="history-panel" :class="{ 'content-collapsed': isContentCollapsed }">
    <div class="panel-header">
      <h3 class="panel-title">
        <span>히스토리</span>
        <span v-if="showFavoriteOnly" style="color: #ffd700; font-size: 16px;">⭐</span>
        <span v-if="isSelectionMode" class="selection-count">{{ selectedCount }}개 선택</span>
      </h3>
      <div style="display: flex; gap: 8px;">
        <template v-if="isSelectionMode">
          <button class="batch-btn" @click="$emit('select-all')" title="전체 선택">
            전체
          </button>
          <button class="batch-btn" @click="$emit('deselect-all')" title="선택 해제">
            해제
          </button>
          <button
            class="batch-download-btn"
            @click="$emit('download-selected')"
            :disabled="selectedCount === 0"
            title="선택된 이미지 다운로드"
          >
            💾 다운
          </button>
          <button class="batch-btn cancel" @click="$emit('toggle-selection-mode')" title="선택 모드 종료">
            취소
          </button>
        </template>
        <template v-else>
          <button
            class="toggle-content-btn"
            @click="$emit('toggle-content')"
            :title="isContentCollapsed ? '내용 펼치기' : '내용 접기'"
          >
            {{ isContentCollapsed ? '▼' : '▲' }}
          </button>
          <button
            class="toggle-panel-btn"
            @click="$emit('toggle-panel')"
            :title="isExpanded ? '패널 숨기기' : '패널 보이기'"
          >
            {{ isExpanded ? '◀' : '▶' }}
          </button>
          <button
            class="filter-favorite-btn"
            @click="$emit('toggle-favorite-filter')"
            :class="{ active: showFavoriteOnly }"
            :title="showFavoriteOnly ? '전체 보기' : '즐겨찾기만 보기'"
            v-if="hasFavorites"
          >
            {{ showFavoriteOnly ? '⭐' : '☆' }}
          </button>
          <button
            class="batch-btn"
            @click="$emit('toggle-selection-mode')"
            v-if="hasImages"
            title="일괄 다운로드"
          >
            📦 선택
          </button>
          <button class="clear-btn" @click="$emit('clear-history')" v-if="hasImages">
            Clear
          </button>
        </template>
      </div>
    </div>
    <div v-if="isExpanded && !isContentCollapsed" class="history-content">
      <slot></slot>
      <div v-if="isEmpty && !showFavoriteOnly" class="history-empty">
        생성된 이미지가 없습니다
        <button class="sample-btn" @click="$emit('add-sample')">
          테스트용 샘플 추가
        </button>
      </div>
      <div v-if="isEmpty && showFavoriteOnly" class="history-empty">
        즐겨찾기한 이미지가 없습니다
      </div>
    </div>
    <div v-if="isExpanded && !isContentCollapsed" class="panel-footer center">
      <span class="image-count">{{ imageCount }}/200</span>
      <button class="footer-btn" @click="$emit('add-sample')">
        + 샘플 추가
      </button>
    </div>
  </div>
</template>

<script setup>
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
  }
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
  'add-sample'
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
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.selection-count {
  margin-left: 8px;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 600;
}

.toggle-content-btn,
.toggle-panel-btn {
  padding: 4px 8px;
  background: #e5e7eb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toggle-content-btn {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}

.toggle-content-btn:hover {
  background: #bfdbfe;
}

.filter-favorite-btn,
.batch-btn,
.clear-btn {
  padding: 5px 13px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  color: #374151;
}

.toggle-panel-btn:hover {
  background: #d1d5db;
}

.filter-favorite-btn:hover,
.batch-btn:hover,
.clear-btn:hover {
  background: #e5e7eb;
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
  background: #4f46e5;
  border: 1px solid #4338ca;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: white;
  transition: all 0.2s;
}

.batch-download-btn:hover:not(:disabled) {
  background: #4338ca;
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 12px;
  background: #fafafa;
}

.history-empty {
  grid-column: 1 / -1;
  padding: 40px 20px;
  text-align: center;
  color: #888;
  font-size: 14px;
}

.sample-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.sample-btn:hover {
  background: #4338ca;
  transform: translateY(-1px);
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

.panel-footer.center {
  justify-content: center;
  gap: 12px;
}

.image-count {
  font-size: 12px;
  color: #666;
  font-weight: 500;
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

.footer-btn:hover {
  background: #4338ca;
  transform: scale(1.05);
}
</style>
