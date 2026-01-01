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
