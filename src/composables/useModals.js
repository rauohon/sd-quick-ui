import { ref } from 'vue'

/**
 * 모달 상태 관리 composable
 * LoRA, Prompt Selector, Bookmark, Preset, Queue, ADetailer 모달 관리
 *
 * @returns {Object} 모달 관련 상태와 함수들
 */
export function useModals() {
  // State
  const showLoraSelector = ref(false)
  const showPromptSelector = ref(false)
  const showBookmarkManager = ref(false)
  const showPresetManager = ref(false)
  const showQueueManager = ref(false)
  const showADetailerPrompt = ref(false)
  const editingADetailerIndex = ref(-1)

  // Modal registry
  const modals = {
    lora: showLoraSelector,
    prompt: showPromptSelector,
    bookmark: showBookmarkManager,
    preset: showPresetManager,
    queue: showQueueManager
  }

  /**
   * 모달 토글 (다른 모달은 자동으로 닫힘)
   * @param {string} modalName - 모달 이름 (lora, prompt, bookmark, preset, queue)
   */
  function toggleModal(modalName) {
    const targetModal = modals[modalName]
    if (!targetModal) return

    const isClosing = targetModal.value

    // Close all modals first
    Object.values(modals).forEach(modal => modal.value = false)

    // Open target modal if it was closed
    if (!isClosing) {
      targetModal.value = true
    }
  }

  /**
   * 모달 닫기
   * @param {string} modalName - 모달 이름
   */
  function closeModal(modalName) {
    const targetModal = modals[modalName]
    if (targetModal) {
      targetModal.value = false
    }
  }

  // LoRA handlers
  function openLoraSelector() {
    toggleModal('lora')
  }

  function closeLoraSelector() {
    closeModal('lora')
  }

  // Prompt Selector handlers
  function openPromptSelector() {
    toggleModal('prompt')
  }

  function closePromptSelector() {
    closeModal('prompt')
  }

  // Bookmark Manager handlers
  function openBookmarkManager() {
    toggleModal('bookmark')
  }

  function closeBookmarkManager() {
    closeModal('bookmark')
  }

  // Preset Manager handlers
  function openPresetManager() {
    toggleModal('preset')
  }

  function closePresetManager() {
    closeModal('preset')
  }

  // Queue Manager handlers
  function openQueueManager() {
    toggleModal('queue')
  }

  function closeQueueManager() {
    closeModal('queue')
  }

  // ADetailer Prompt handlers
  function openADetailerPrompt(index) {
    showADetailerPrompt.value = true
    editingADetailerIndex.value = index
  }

  function closeADetailerPrompt() {
    showADetailerPrompt.value = false
    editingADetailerIndex.value = -1
  }

  return {
    // State
    showLoraSelector,
    showPromptSelector,
    showBookmarkManager,
    showPresetManager,
    showQueueManager,
    showADetailerPrompt,
    editingADetailerIndex,

    // Functions
    toggleModal,
    closeModal,
    openLoraSelector,
    closeLoraSelector,
    openPromptSelector,
    closePromptSelector,
    openBookmarkManager,
    closeBookmarkManager,
    openPresetManager,
    closePresetManager,
    openQueueManager,
    closeQueueManager,
    openADetailerPrompt,
    closeADetailerPrompt,
  }
}
