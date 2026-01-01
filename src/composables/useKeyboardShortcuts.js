import { onMounted, onUnmounted } from 'vue'

/**
 * 키보드 단축키 composable
 *
 * Keyboard shortcuts:
 * - Ctrl/Cmd + Enter: Generate image
 * - ESC: Close any open modal
 * - Ctrl/Cmd + 1/2/3: Switch slots
 * - Ctrl/Cmd + /: Focus prompt input
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.generateImage - Image generation function
 * @param {Function} options.selectSlot - Slot selection function
 * @param {Object} options.promptRef - Ref to prompt textarea
 * @param {Object} options.isGenerating - Ref to generating state
 * @param {Object} options.apiConnected - Ref to API connection state
 * @param {Object} options.modals - Object containing modal state refs
 * @param {Object} options.modals.showLoraSelector
 * @param {Object} options.modals.showPromptSelector
 * @param {Object} options.modals.showBookmarkManager
 * @param {Object} options.modals.showPresetManager
 * @param {Object} options.modals.showQueueManager
 * @param {Object} options.modals.showADetailerPrompt
 */
export function useKeyboardShortcuts({
  generateImage,
  selectSlot,
  promptRef,
  isGenerating,
  apiConnected,
  modals
}) {
  /**
   * Check if any modal is currently open
   */
  function isAnyModalOpen() {
    return modals.showLoraSelector.value ||
           modals.showPromptSelector.value ||
           modals.showBookmarkManager.value ||
           modals.showPresetManager.value ||
           modals.showQueueManager.value ||
           modals.showADetailerPrompt.value
  }

  /**
   * Close all open modals
   */
  function closeAllModals() {
    modals.showLoraSelector.value = false
    modals.showPromptSelector.value = false
    modals.showBookmarkManager.value = false
    modals.showPresetManager.value = false
    modals.showQueueManager.value = false
    modals.showADetailerPrompt.value = false
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeydown(event) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

    // ESC: Close modals
    if (event.key === 'Escape') {
      if (isAnyModalOpen()) {
        event.preventDefault()
        closeAllModals()
        return
      }
    }

    // Ignore shortcuts if user is typing in an input/textarea
    // EXCEPT for Ctrl+Enter which should work in textareas
    const isTyping = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA'

    if (isTyping && !(cmdOrCtrl && event.key === 'Enter')) {
      // Allow all other shortcuts to work normally when typing
      return
    }

    // Ctrl/Cmd + Enter: Generate image
    if (cmdOrCtrl && event.key === 'Enter') {
      event.preventDefault()
      if (!isGenerating.value && apiConnected.value && !isAnyModalOpen()) {
        generateImage()
      }
      return
    }

    // Don't process other shortcuts if typing
    if (isTyping) {
      return
    }

    // Ctrl/Cmd + 1/2/3: Switch slots
    if (cmdOrCtrl && ['1', '2', '3'].includes(event.key)) {
      event.preventDefault()
      const slotIndex = parseInt(event.key) - 1
      if (!isGenerating.value && !isAnyModalOpen()) {
        selectSlot(slotIndex)
      }
      return
    }

    // Ctrl/Cmd + /: Focus prompt
    if (cmdOrCtrl && event.key === '/') {
      event.preventDefault()
      if (promptRef.value && !isAnyModalOpen()) {
        promptRef.value.focus()
      }
      return
    }
  }

  // Setup event listener on mount
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    // Expose functions for manual use if needed
    closeAllModals,
    isAnyModalOpen
  }
}
