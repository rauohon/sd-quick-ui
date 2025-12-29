<script setup>
import { ref, onMounted, onUnmounted, h, render } from 'vue'
import Txt2ImgView from './views/Txt2ImgView.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { TOAST_DURATION } from './config/constants'

// Modal state
const showModal = ref(false)
const modalType = ref('') // 'comparison' or 'viewer'
const comparisonImage = ref('')
const currentImage = ref('') // Will be passed from Txt2ImgView

// Toast notification
const toasts = ref([])
let toastIdCounter = 0

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const id = toastIdCounter++
  toasts.value.push({ id, message, type })

  // 타입별 차등 시간 적용
  const duration = TOAST_DURATION[type] || TOAST_DURATION.info

  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }, duration)
}

/**
 * Remove toast manually
 */
function removeToast(id) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

/**
 * Open modal
 */
function openModal(type, image = null) {
  modalType.value = type
  if (type === 'comparison') {
    comparisonImage.value = image
  } else if (type === 'viewer') {
    if (!currentImage.value) return
  }
  showModal.value = true
}

/**
 * Close modal
 */
function closeModal() {
  showModal.value = false
  modalType.value = ''
  comparisonImage.value = ''
}

/**
 * Show confirm dialog
 */
function showConfirm(options) {
  const {
    title = '확인',
    message,
    confirmText = '확인',
    cancelText = '취소',
    onConfirm,
    onCancel
  } = options

  return new Promise((resolve) => {
    // Create container for the confirm dialog
    const container = document.createElement('div')
    document.body.appendChild(container)

    // Create VNode for ConfirmDialog
    const vnode = h(ConfirmDialog, {
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        resolve(true)
        onConfirm?.()
        cleanup()
      },
      onCancel: () => {
        resolve(false)
        onCancel?.()
        cleanup()
      }
    })

    // Render the dialog
    render(vnode, container)

    // Cleanup function
    function cleanup() {
      setTimeout(() => {
        render(null, container)
        document.body.removeChild(container)
      }, 200)
    }
  })
}

/**
 * Handle keyboard events for modal
 */
function handleKeyPress(event) {
  // 입력 요소에서는 무시
  const target = event.target
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return
  }

  // 모달이 열려있을 때만 처리
  if (showModal.value && (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter')) {
    event.preventDefault()
    closeModal()
  }
}

// Set up keyboard listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<template>
  <div class="app">
    <!-- Main View -->
    <Txt2ImgView
      :showToast="showToast"
      :openModal="openModal"
      :showConfirm="showConfirm"
      @updateCurrentImage="currentImage = $event"
    />

    <!-- Universal Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal">✕</button>

        <!-- Comparison Mode -->
        <div v-if="modalType === 'comparison'" class="comparison-images">
          <div class="comparison-side">
            <div class="comparison-label">현재 이미지</div>
            <img :src="currentImage" alt="Current">
          </div>
          <div class="comparison-side">
            <div class="comparison-label">선택한 이미지</div>
            <img :src="comparisonImage" alt="Comparison">
          </div>
        </div>

        <!-- Image Viewer Mode -->
        <div v-else-if="modalType === 'viewer'" class="image-viewer">
          <img :src="currentImage" alt="Full Size Image">
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
        @click="removeToast(toast.id)"
      >
        <div class="toast-icon">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ' }}
        </div>
        <div class="toast-message">{{ toast.message }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
}

/* Universal Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 1600px;
  height: 90%;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  cursor: default;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border: none;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 0.8;
}

/* Comparison Mode */
.comparison-images {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  overflow: hidden;
}

.comparison-side {
  display: flex;
  flex-direction: column;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.comparison-label {
  flex-shrink: 0;
  padding: 12px;
  background: #667eea;
  color: white;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.comparison-side img {
  flex: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fafafa;
}

/* Image Viewer Mode */
.image-viewer {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.image-viewer img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s;
}

.image-viewer img:hover {
  transform: scale(1.02);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  min-width: 300px;
  max-width: 500px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
  cursor: pointer;
  animation: slideIn 0.3s ease-out;
  border-left: 4px solid #667eea;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.toast-success {
  border-left-color: #10b981;
}

.toast-success .toast-icon {
  background: #10b981;
  color: white;
}

.toast-error {
  border-left-color: #ef4444;
}

.toast-error .toast-icon {
  background: #ef4444;
  color: white;
}

.toast-warning {
  border-left-color: #f59e0b;
}

.toast-warning .toast-icon {
  background: #f59e0b;
  color: white;
}

.toast-info {
  border-left-color: #667eea;
}

.toast-info .toast-icon {
  background: #667eea;
  color: white;
}

.toast:hover {
  opacity: 0.9;
}
</style>

<style>
/* Global styles for child components */
.tab-content {
  flex: 1;
  overflow: hidden;
  padding: 16px;
  display: flex;
  gap: 16px;
}

.container {
  display: grid;
  grid-template-columns: 280px 300px 420px;
  gap: 16px;
  height: 100%;
  flex-shrink: 0;
}

.image-area {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.advanced-panel,
.params-panel,
.prompt-panel,
.preview-panel,
.history-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 2px solid #667eea;
  height: 50px;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.image-count {
  font-size: 12px;
  font-weight: 500;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: auto;
}

.panel-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  height: 50px;
}

.panel-footer.center {
  justify-content: center;
}

.footer-title {
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.footer-buttons {
  display: flex;
  gap: 8px;
}

.footer-btn {
  height: 32px;
  padding: 0 16px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.footer-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.infinite-btn-header {
  width: 40px;
  height: 32px;
  padding: 0;
  border: none;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.infinite-btn-header:hover {
  opacity: 0.9;
  transform: scale(1.05);
}

.infinite-btn-header.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  animation: pulse-infinite 2s ease-in-out infinite;
}

.advanced-content,
.params-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.prompt-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 16px;
  min-height: 0;
}

.param-display {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.param-item {
  text-align: center;
}

.param-item label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.param-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.section-title {
  margin: 12px 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
}

.section-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 16px 0 12px 0;
}

.form-group {
  margin-bottom: 12px;
}

.form-group.horizontal {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.form-group.horizontal label {
  flex-shrink: 0;
  width: 85px;
  font-weight: 500;
  color: #333;
  font-size: 12px;
  margin: 0;
}

.form-group.horizontal input,
.form-group.horizontal select {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

/* Seed Random Button */
.seed-random-btn {
  width: 36px;
  height: 28px;
  padding: 0;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.seed-random-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.05);
}

.seed-random-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ADetailer Prompt Button */
.ad-prompt-btn {
  flex: 1;
  height: 28px;
  padding: 0 12px;
  border: none;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ad-prompt-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.ad-prompt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}

.toolbar::-webkit-scrollbar {
  height: 6px;
}

.toolbar::-webkit-scrollbar-track {
  background: #e5e7eb;
}

.toolbar::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 3px;
}

.toolbar::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: nowrap;
}

.toolbar-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}


.tool-btn {
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex-shrink: 0;
}

.tool-btn.lora-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: white;
}

.tool-btn.lora-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.tool-btn.prompt-helper-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tool-btn.prompt-helper-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.tool-btn.prompt-helper-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
}

.tool-btn.bookmark-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.tool-btn.bookmark-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.tool-btn.bookmark-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
}

.tool-btn.preset-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.tool-btn.preset-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.tool-btn.preset-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
}

.tool-btn.queue-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.tool-btn.queue-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.tool-btn.queue-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
}

.form-group textarea,
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  background: white;
}

.form-group textarea {
  resize: vertical;
}

.prompt-section .form-group {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.prompt-section .form-group:first-child {
  flex: 2;
}

.prompt-section .form-group:last-child {
  flex: 1;
}

.prompt-textarea,
.negative-textarea {
  flex: 1;
  min-height: 100px;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.5;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.checkbox-label span {
  cursor: pointer;
}

.generate-btn,
.analyze-btn,
.load-btn,
.lora-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.panel-header .generate-btn,
.panel-header .lora-btn {
  flex-shrink: 0;
  margin: 0;
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lora-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}

/* Page Buttons (for slot pagination) */
.page-btn {
  min-width: 40px;
  height: 32px;
  padding: 0 12px;
  border: 2px solid #e0e0e0;
  background: white;
  color: #666;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f0ff;
  transform: translateY(-1px);
}

.page-btn.has-data {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.page-btn.has-data:hover {
  opacity: 0.9;
}

.page-btn.active {
  border-width: 3px;
  box-shadow: 0 0 12px rgba(102, 126, 234, 0.6);
  transform: scale(1.05);
}

.page-btn.active.has-data {
  box-shadow: 0 0 16px rgba(102, 126, 234, 0.8);
}

/* Last Params Section */
.last-params-section {
  padding: 12px 16px;
  background: #f0f4ff;
  border-bottom: 1px solid #d0d8f0;
  flex-shrink: 0;
  transition: padding 0.2s ease;
}

.last-params-section.collapsed {
  padding: 6px 16px;
}

.params-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 2px solid #667eea;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.last-params-section.collapsed .params-section-title {
  margin-bottom: 0;
  padding: 4px 0;
  border-bottom: none;
}

.params-section-title:hover {
  color: #5568d3;
  background: rgba(102, 126, 234, 0.05);
}

.params-section-content {
  /* Container for all param groups */
}

.params-group {
  margin-bottom: 12px;
}

.params-group:last-child {
  margin-bottom: 0;
}

.params-group-label {
  font-size: 12px;
  font-weight: 800;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
  text-align: center;
  padding: 4px 0;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.params-group-label:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.params-group-label:active {
  transform: translateY(0);
}

.fold-icon {
  font-size: 10px;
  transition: transform 0.2s;
  display: inline-block;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 12px;
}

.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.param-label {
  color: #666;
  font-weight: 500;
}

.param-value {
  color: #667eea;
  font-weight: 700;
  font-family: 'Consolas', 'Monaco', monospace;
}

.adetailer-row .param-value {
  color: #f59e0b;
  font-size: 11px;
}

.analyze-btn,
.load-btn {
  width: 100%;
  margin-top: 8px;
}

.generate-btn:hover,
.analyze-btn:hover,
.load-btn:hover {
  opacity: 0.9;
}

.generate-btn:disabled,
.analyze-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-container {
  margin: 8px 16px;
  flex-shrink: 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  margin-top: 4px;
  font-size: 11px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.progress-state {
  color: #667eea;
  font-weight: 600;
  font-size: 12px;
}

.progress-percent {
  font-weight: 600;
  color: #333;
}

.infinite-indicator {
  color: #667eea;
  font-weight: 600;
  font-size: 12px;
}

/* Generation Controls */
.generation-controls {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: #fffbeb;
  border-bottom: 1px solid #fde68a;
  flex-shrink: 0;
  justify-content: center;
}

.control-btn {
  height: 32px;
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.control-btn.interrupt-btn {
  background: #ef4444;
  color: white;
}

.control-btn.interrupt-btn:hover:not(:disabled) {
  background: #dc2626;
}

.control-btn.skip-btn {
  background: #f59e0b;
  color: white;
}

.control-btn.skip-btn:hover:not(:disabled) {
  background: #d97706;
}

.control-btn.pause-btn {
  background: #06b6d4;
  color: white;
}

.control-btn.pause-btn:hover:not(:disabled) {
  background: #0891b2;
}

.control-btn.infinite-btn {
  background: #667eea;
  color: white;
}

.control-btn.infinite-btn:hover:not(:disabled) {
  background: #5568d3;
}

.control-btn.infinite-btn.active {
  background: #10b981;
  animation: pulse-infinite 2s ease-in-out infinite;
}

@keyframes pulse-infinite {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-panel {
  overflow: hidden;
}

.preview-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fafafa;
  position: relative;
  transition: all 0.3s;
}

.preview-main.drag-over {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 3px dashed #667eea;
}

.preview-main.loading-png {
  background: #fff8e1;
}

.preview-main img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  font-size: 14px;
}

.preview-placeholder.loading {
  color: #ff8c00;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

.drop-hint {
  font-size: 12px;
  color: #667eea;
  padding: 8px 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 6px;
  border: 1px dashed #667eea;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-content: start;
}

.history-item {
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.history-item:hover {
  border-color: #667eea;
  transform: scale(1.02);
}

.history-item:hover .history-actions {
  opacity: 1;
}

.history-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.history-time {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
  color: white;
  font-size: 11px;
  padding: 3px 4px;
  text-align: center;
}

.history-actions {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  display: flex;
  justify-content: space-between;
  opacity: 0;
  transition: opacity 0.2s;
}

.load-params-btn {
  width: 28px;
  height: 28px;
  background: rgba(102, 126, 234, 0.95);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.load-params-btn:hover {
  background: #667eea;
  transform: scale(1.1);
}

.favorite-btn {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.95);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.favorite-btn:hover {
  background: #fffbea;
  border-color: #ffd700;
  transform: scale(1.1);
}

.delete-btn {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.95);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.delete-btn:hover {
  background: #fee;
  border-color: #ef4444;
  transform: scale(1.1);
}

/* 미완성 이미지 스타일 */
.history-item.is-interrupted img {
  opacity: 0.5;
  filter: grayscale(30%);
}

.interrupted-badge {
  position: absolute;
  top: 50%;
  left: 4px;
  transform: translateY(-50%);
  background: rgba(255, 193, 7, 0.95);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.history-item.is-favorite {
  outline: 2px solid #ffd700;
  outline-offset: -2px;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.history-item.is-favorite .favorite-btn {
  background: #ffd700;
  color: white;
  border-color: #ffd700;
}

.history-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #999;
  padding: 40px 12px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.filter-favorite-btn {
  padding: 5px 10px;
  background: white;
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 32px;
}

.filter-favorite-btn:hover {
  background: #fffbea;
  border-color: #ffd700;
  transform: translateY(-1px);
}

.filter-favorite-btn.active {
  background: #ffd700;
  color: white;
  border-color: #ffd700;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.clear-btn {
  padding: 5px 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.clear-btn:hover {
  opacity: 0.8;
}

.sample-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.sample-btn:hover {
  opacity: 0.8;
}

.pnginfo-container {
  max-width: 1000px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.upload-section {
  flex-shrink: 0;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.upload-label {
  display: inline-block;
  padding: 14px 28px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 12px;
  transition: background 0.3s;
}

.upload-label:hover {
  background: #e0e0e0;
}

.file-input {
  display: block;
  margin: 12px auto;
}

.pnginfo-result {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.pnginfo-result h3 {
  margin-top: 0;
  font-size: 16px;
}

.info-section,
.params-section {
  margin-bottom: 16px;
}

.info-section h4,
.params-section h4 {
  font-size: 14px;
  margin-bottom: 8px;
}

.info-section pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
}

.params-grid {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.pnginfo-result .param-item {
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 6px;
  font-size: 13px;
}

.pnginfo-result .param-item strong {
  color: #667eea;
}

.no-info {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style>
