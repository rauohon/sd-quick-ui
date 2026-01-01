<script setup>
import { ref, onMounted, onUnmounted, h, render } from 'vue'
import Txt2ImgView from './views/Txt2ImgView.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { TOAST_DURATION } from './config/constants'
import { useDarkMode } from './composables/useDarkMode'

// Dark mode initialization
const { isDark, toggleTheme } = useDarkMode()

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
    showDontAskAgain = false,
    dontAskAgainText = null,
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
      showDontAskAgain,
      dontAskAgainText,
      onConfirm: (dontAskAgain) => {
        resolve({ confirmed: true, dontAskAgain })
        onConfirm?.(dontAskAgain)
        cleanup()
      },
      onCancel: (dontAskAgain) => {
        resolve({ confirmed: false, dontAskAgain })
        onCancel?.(dontAskAgain)
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
      :isDark="isDark"
      :toggleTheme="toggleTheme"
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
  background: var(--color-bg-primary);
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
  background: var(--color-bg-secondary);
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
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
}

.comparison-label {
  flex-shrink: 0;
  padding: 12px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.comparison-side img {
  flex: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--color-bg-tertiary);
}

/* Image Viewer Mode */
.image-viewer {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
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
  background: var(--color-bg-secondary);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
  cursor: pointer;
  animation: slideIn 0.3s ease-out;
  border-left: 4px solid var(--color-primary);
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
  color: var(--color-text-primary);
}

.toast-success {
  border-left-color: var(--color-success);
}

.toast-success .toast-icon {
  background: var(--color-success);
  color: var(--color-text-inverse);
}

.toast-error {
  border-left-color: var(--color-error);
}

.toast-error .toast-icon {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.toast-warning {
  border-left-color: var(--color-warning);
}

.toast-warning .toast-icon {
  background: var(--color-warning);
  color: var(--color-text-inverse);
}

.toast-info {
  border-left-color: var(--color-primary);
}

.toast-info .toast-icon {
  background: var(--color-primary);
  color: var(--color-text-inverse);
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
  transition: grid-template-columns 0.3s ease;
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
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
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
  border-bottom: 2px solid var(--color-primary);
  height: 50px;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
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
  color: var(--color-primary);
  background: var(--color-primary-light);
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
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-primary);
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
  color: var(--color-text-secondary);
}

.footer-buttons {
  display: flex;
  gap: 8px;
}

.footer-btn {
  height: 32px;
  padding: 0 16px;
  border: none;
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
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
  background: var(--gradient-info);
  color: var(--color-text-inverse);
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
  background: var(--gradient-success);
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
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.param-item .value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.section-title {
  margin: 12px 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.section-divider {
  height: 1px;
  background: var(--color-border-primary);
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
  color: var(--color-text-primary);
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
  color: var(--color-text-primary);
  font-size: 13px;
}

/* Seed Random Button */
.seed-random-btn {
  width: 36px;
  height: 28px;
  padding: 0;
  border: none;
  background: var(--gradient-success);
  color: var(--color-text-inverse);
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
  background: var(--gradient-warning);
  color: var(--color-text-inverse);
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
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
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
  color: var(--color-text-secondary);
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
  background: var(--gradient-warning);
  color: var(--color-text-inverse);
}

.tool-btn.lora-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.tool-btn.prompt-helper-btn {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
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
  background: var(--gradient-success);
  color: var(--color-text-inverse);
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
  background: var(--gradient-success);
  color: var(--color-text-inverse);
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
  background: var(--gradient-warning);
  color: var(--color-text-inverse);
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
  border: 1px solid var(--color-border-secondary);
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
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
  color: var(--color-text-primary);
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
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
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
  background: var(--gradient-warning);
}

/* Page Buttons (for slot pagination) */
.page-btn {
  min-width: 40px;
  height: 32px;
  padding: 0 12px;
  border: 2px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
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
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-hover);
  transform: translateY(-1px);
}

.page-btn.has-data {
  border-color: var(--color-primary);
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
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
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
  transition: padding 0.2s ease;
}

.last-params-section.collapsed {
  padding: 6px 16px;
}

.params-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 2px solid var(--color-primary);
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
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
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
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
  text-align: center;
  padding: 4px 0;
  background: var(--color-primary-light);
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
  background: var(--color-bg-hover);
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
  color: var(--color-text-secondary);
  font-weight: 500;
}

.param-value {
  color: var(--color-primary);
  font-weight: 700;
  font-family: 'Consolas', 'Monaco', monospace;
}

.adetailer-row .param-value {
  color: var(--color-warning);
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
  background: var(--color-bg-tertiary);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.progress-state {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 12px;
}

.progress-percent {
  font-weight: 600;
  color: var(--color-text-primary);
}

.infinite-indicator {
  color: var(--color-primary);
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
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.control-btn.interrupt-btn:hover:not(:disabled) {
  background: var(--color-error-dark);
}

.control-btn.skip-btn {
  background: var(--color-warning);
  color: var(--color-text-inverse);
}

.control-btn.skip-btn:hover:not(:disabled) {
  background: var(--color-warning-dark);
}

.control-btn.pause-btn {
  background: var(--color-info);
  color: var(--color-text-inverse);
}

.control-btn.pause-btn:hover:not(:disabled) {
  background: var(--color-info-dark);
}

.control-btn.infinite-btn {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.control-btn.infinite-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.control-btn.infinite-btn.active {
  background: var(--color-success);
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
  background: var(--color-bg-tertiary);
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
  color: var(--color-text-tertiary);
  font-size: 14px;
}

.preview-placeholder.loading {
  color: #ff8c00;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

.drop-hint {
  font-size: 12px;
  color: var(--color-primary);
  padding: 8px 16px;
  background: var(--color-primary-light);
  border-radius: 6px;
  border: 1px dashed var(--color-primary);
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
  height: 130px;
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
  color: var(--color-text-tertiary);
  padding: 40px 12px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.filter-favorite-btn {
  padding: 5px 10px;
  background: var(--color-bg-secondary);
  color: var(--color-gold);
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
  background: var(--color-gold);
  color: var(--color-text-inverse);
  border-color: var(--color-gold);
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.clear-btn {
  padding: 5px 12px;
  background: var(--color-error);
  color: var(--color-text-inverse);
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
  background: var(--color-primary);
  color: var(--color-text-inverse);
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

/* History panel collapsed state - Horizontal collapse */
.image-area.history-collapsed {
  grid-template-columns: 1fr 40px;
}

.image-area.history-collapsed .history-panel {
  width: 40px;
}

/* FIXED: Only affect history panel's header, not preview panel */
.image-area.history-collapsed .history-panel .panel-header {
  flex-direction: column;
  padding: 12px 8px;
  align-items: center;
  gap: 12px;
}

.image-area.history-collapsed .history-panel .panel-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  margin: 0;
  font-size: 13px;
  white-space: nowrap;
  order: 2;
}

.image-area.history-collapsed .history-panel .panel-header > div {
  order: 1;
}

.image-area.history-collapsed .history-panel .toggle-content-btn,
.image-area.history-collapsed .history-panel .filter-favorite-btn,
.image-area.history-collapsed .history-panel .batch-btn,
.image-area.history-collapsed .history-panel .clear-btn {
  display: none;
}

.image-area.history-collapsed .history-panel .history-content,
.image-area.history-collapsed .history-panel .panel-footer {
  display: none;
}

/* History content collapsed state - Vertical collapse (NEW) */
.history-panel.content-collapsed .history-content {
  display: none;
}

.history-panel.content-collapsed .panel-footer {
  display: none;
}
</style>
