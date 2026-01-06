<script setup>
import { ref, provide, onMounted, onUnmounted, h, render } from 'vue'
import { useI18n } from 'vue-i18n'
import Txt2ImgView from './views/Txt2ImgView.vue'
import Img2ImgView from './views/Img2ImgView.vue'
import InpaintView from './views/InpaintView.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { TOAST_DURATION } from './config/constants'
import { useDarkMode } from './composables/useDarkMode'
import { usePipeline } from './composables/usePipeline'
import { useGenerationEngine } from './composables/useGenerationEngine'

// i18n
const { t } = useI18n()

// Dark mode initialization
const { isDark, toggleTheme } = useDarkMode()

// Tab navigation
const tabs = [
  { id: 'txt2img', icon: '✏️' },
  { id: 'img2img', icon: '🖼️' },
  { id: 'inpaint', icon: '🎨' },
  { id: 'workflow', icon: '⚙️' }
]
const savedTab = localStorage.getItem('sd-active-tab')
const activeTab = ref(tabs.some(t => t.id === savedTab) ? savedTab : 'txt2img')

// 각 탭별 생성 상태 추적 (img2img, inpaint용 - txt2img은 engine에서 관리)
const generatingTabs = ref({
  txt2img: false,
  img2img: false,
  inpaint: false
})

// Toast function reference (showToast가 정의된 후 engine 초기화)
let generationEngine = null

// 현재 탭이 생성 중인지 확인
function isCurrentTabGenerating() {
  // txt2img, img2img, inpaint은 engine에서 체크
  if ((activeTab.value === 'txt2img' || activeTab.value === 'img2img' || activeTab.value === 'inpaint') && generationEngine) {
    return generationEngine.isViewGenerating(activeTab.value)
  }
  return generatingTabs.value[activeTab.value] || false
}

// 탭 변경 시 저장
async function setActiveTab(tabId, forceSwitch = false) {
  // 같은 탭이면 무시
  if (tabId === activeTab.value) return

  // txt2img, img2img, inpaint의 경우 백그라운드에서 생성이 계속되므로 경고 없이 전환
  if (activeTab.value !== 'txt2img' && activeTab.value !== 'img2img' && activeTab.value !== 'inpaint' && isCurrentTabGenerating() && !forceSwitch) {
    const result = await showConfirm({
      title: t('tabs.switchWarningTitle'),
      message: t('tabs.switchWarningMessage'),
      confirmText: t('tabs.switchAnyway'),
      cancelText: t('common.cancel')
    })

    if (!result?.confirmed) {
      return // 사용자가 취소함
    }
  }

  activeTab.value = tabId
  localStorage.setItem('sd-active-tab', tabId)
}

// 각 탭의 생성 상태 업데이트 (현재 모든 탭이 engine에서 관리됨)
function updateTabGenerating(tabId, isGenerating) {
  // txt2img, img2img, inpaint은 engine에서 관리하므로 무시
  if (tabId === 'txt2img' || tabId === 'img2img' || tabId === 'inpaint') return
  generatingTabs.value[tabId] = isGenerating
}

// Pipeline integration
const pipeline = usePipeline()
pipeline.setSwitchTabCallback(setActiveTab)

// Pipeline controls
function createPipelineTxt2ImgToImg2Img() {
  pipeline.createTxt2ImgToImg2Img()
}

function createPipelineTxt2ImgToInpaint() {
  pipeline.createTxt2ImgToInpaint()
}

function createPipelineFullPipeline() {
  pipeline.createFullPipeline()
}

function startPipeline() {
  pipeline.startPipeline()
}

function stopPipeline() {
  pipeline.stopPipeline()
}

function clearPipeline() {
  pipeline.clearSteps()
}

function removeStep(stepId) {
  pipeline.removeStep(stepId)
}

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

// Set pipeline toast callback (after showToast is defined)
pipeline.setShowToastCallback(showToast)

// Initialize generation engine (after showToast is defined)
generationEngine = useGenerationEngine(showToast, t)

// Provide engine to child components
provide('generationEngine', generationEngine)

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
  // Cleanup generation engine
  generationEngine?.cleanup()
})
</script>

<template>
  <div class="app">
    <!-- Tab Navigation -->
    <nav class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ t(`tabs.${tab.id}`) }}</span>
      </button>
    </nav>

    <!-- Tab Content -->
    <div class="tab-container">
      <!-- txt2img -->
      <!-- isGenerating는 generationEngine에서 직접 관리 -->
      <Txt2ImgView
        v-if="activeTab === 'txt2img'"
        :showToast="showToast"
        :openModal="openModal"
        :showConfirm="showConfirm"
        :isDark="isDark"
        :toggleTheme="toggleTheme"
        @updateCurrentImage="currentImage = $event"
        @switch-tab="setActiveTab"
      />

      <!-- img2img -->
      <!-- isGenerating는 generationEngine에서 직접 관리 -->
      <Img2ImgView
        v-else-if="activeTab === 'img2img'"
        :showToast="showToast"
        :openModal="openModal"
        :showConfirm="showConfirm"
        :isDark="isDark"
        :toggleTheme="toggleTheme"
        @updateCurrentImage="currentImage = $event"
        @switch-tab="setActiveTab"
      />

      <!-- inpaint -->
      <!-- isGenerating는 generationEngine에서 직접 관리 -->
      <InpaintView
        v-else-if="activeTab === 'inpaint'"
        :showToast="showToast"
        :openModal="openModal"
        :showConfirm="showConfirm"
        :isDark="isDark"
        :toggleTheme="toggleTheme"
        @updateCurrentImage="currentImage = $event"
        @switch-tab="setActiveTab"
      />

      <!-- Pipeline / Workflow -->
      <div v-else-if="activeTab === 'workflow'" class="pipeline-view">
        <div class="pipeline-content">
          <h2>{{ t('pipeline.title') }}</h2>
          <p class="pipeline-description">{{ t('pipeline.description') }}</p>

          <!-- Quick Pipeline Templates -->
          <div class="pipeline-templates">
            <h3>{{ t('pipeline.quickStart') }}</h3>
            <div class="template-buttons">
              <button @click="createPipelineTxt2ImgToImg2Img" class="template-btn">
                txt2img → img2img
              </button>
              <button @click="createPipelineTxt2ImgToInpaint" class="template-btn">
                txt2img → inpaint
              </button>
              <button @click="createPipelineFullPipeline" class="template-btn">
                txt2img → img2img → inpaint
              </button>
            </div>
          </div>

          <!-- Current Pipeline Steps -->
          <div class="pipeline-steps" v-if="pipeline.hasSteps.value">
            <h3>{{ t('pipeline.steps') }} ({{ pipeline.steps.value.length }})</h3>
            <div class="steps-list">
              <div
                v-for="(step, index) in pipeline.steps.value"
                :key="step.id"
                class="step-item"
                :class="{ 'step-running': step.status === 'running', 'step-completed': step.status === 'completed' }"
              >
                <span class="step-number">{{ index + 1 }}</span>
                <span class="step-type">{{ step.type }}</span>
                <span class="step-status" :class="`status-${step.status}`">
                  {{ step.status === 'pending' ? '⏳' : step.status === 'running' ? '🔄' : step.status === 'completed' ? '✅' : '❌' }}
                </span>
                <button @click="removeStep(step.id)" class="remove-step-btn" :disabled="pipeline.isRunning.value">✕</button>
              </div>
            </div>

            <!-- Pipeline Controls -->
            <div class="pipeline-controls">
              <button
                @click="startPipeline"
                class="start-btn"
                :disabled="pipeline.isRunning.value || !pipeline.hasSteps.value"
              >
                {{ pipeline.isRunning.value ? t('pipeline.running') : t('pipeline.start') }}
              </button>
              <button
                @click="stopPipeline"
                class="stop-btn"
                :disabled="!pipeline.isRunning.value"
              >
                {{ t('pipeline.stop') }}
              </button>
              <button
                @click="clearPipeline"
                class="clear-btn"
                :disabled="pipeline.isRunning.value"
              >
                {{ t('pipeline.clear') }}
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="pipeline-progress" v-if="pipeline.isRunning.value">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: pipeline.progress.value + '%' }"></div>
              </div>
              <span class="progress-text">{{ pipeline.progress.value }}%</span>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="pipeline-empty">
            <p>{{ t('pipeline.empty') }}</p>
          </div>
        </div>
      </div>
    </div>

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

/* Tab Navigation */
.tab-nav {
  display: flex;
  gap: 2px;
  padding: 8px 12px 0;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.tab-btn.active {
  background: var(--color-bg-primary);
  color: var(--color-primary);
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  font-size: 13px;
}

/* Tab Container */
.tab-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Placeholder View */
.placeholder-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
}

.placeholder-content {
  text-align: center;
  color: var(--color-text-secondary);
}

.placeholder-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.placeholder-content h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: var(--color-text-primary);
}

.placeholder-content p {
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
}

/* Pipeline View */
.pipeline-view {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 24px;
  background: var(--color-bg-primary);
  overflow-y: auto;
}

.pipeline-content {
  max-width: 600px;
  width: 100%;
}

.pipeline-content h2 {
  margin: 0 0 8px;
  color: var(--color-text-primary);
}

.pipeline-description {
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}

.pipeline-templates h3,
.pipeline-steps h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.template-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.template-btn {
  padding: 8px 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
}

.step-item.step-running {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
}

.step-item.step-completed {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.step-number {
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.step-type {
  flex: 1;
  color: var(--color-text-primary);
  font-weight: 500;
}

.step-status {
  font-size: 16px;
}

.remove-step-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
}

.remove-step-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.remove-step-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pipeline-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.start-btn, .stop-btn, .clear-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.start-btn {
  background: var(--gradient-primary);
  color: white;
}

.start-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.stop-btn {
  background: #ef4444;
  color: white;
}

.stop-btn:hover:not(:disabled) {
  background: #dc2626;
}

.clear-btn {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-primary);
}

.clear-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}

.start-btn:disabled, .stop-btn:disabled, .clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pipeline-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  min-width: 40px;
  text-align: right;
}

.pipeline-empty {
  text-align: center;
  padding: 48px;
  color: var(--color-text-secondary);
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
