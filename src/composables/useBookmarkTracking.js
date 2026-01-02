import { ref, watch } from 'vue'

/**
 * 북마크 추적 composable
 * 적용된 북마크와 프롬프트 변경 상태를 추적
 *
 * @param {Object} promptRefs - prompt, negativePrompt refs
 * @param {Object} bookmarkSystem - bookmarks, addBookmark, updateBookmarkContent from useBookmarks
 * @param {Object} callbacks - showToast, t (i18n) functions
 * @returns {Object} 북마크 추적 관련 상태와 함수들
 */
export function useBookmarkTracking(promptRefs, bookmarkSystem, callbacks) {
  const { prompt, negativePrompt } = promptRefs
  const { bookmarks, addBookmark, updateBookmarkContent } = bookmarkSystem
  const { showToast, t } = callbacks

  // State
  const appliedBookmarkId = ref(null)
  const bookmarkPromptChanged = ref(false)

  /**
   * 북마크 적용 핸들러
   * @param {Object} data - { bookmarkId, prompt, negativePrompt, mode }
   */
  function handleApplyBookmark(data) {
    // Track applied bookmark ID
    appliedBookmarkId.value = data.bookmarkId
    bookmarkPromptChanged.value = false

    const mode = data.mode || 'replace'

    // Process positive prompt based on mode
    switch (mode) {
      case 'replace':
        prompt.value = data.prompt
        break
      case 'prepend':
        if (data.prompt) {
          prompt.value = data.prompt + (prompt.value ? '\n' + prompt.value : '')
        }
        break
      case 'append':
        if (data.prompt) {
          prompt.value = (prompt.value ? prompt.value + '\n' : '') + data.prompt
        }
        break
    }

    // Negative prompt always replaces (for simplicity)
    negativePrompt.value = data.negativePrompt
  }

  /**
   * 북마크 업데이트 핸들러
   */
  function handleUpdateBookmark() {
    if (!appliedBookmarkId.value) return

    // 업데이트 전에 북마크 이름 저장
    const bookmark = bookmarks.value.find(b => b.id === appliedBookmarkId.value)
    const bookmarkName = bookmark?.name || 'Bookmark'

    const success = updateBookmarkContent(
      appliedBookmarkId.value,
      prompt.value,
      negativePrompt.value
    )

    if (success) {
      bookmarkPromptChanged.value = false
      showToast?.(t('bookmark.bookmarkUpdated', { name: bookmarkName }), 'success')
    }
  }

  /**
   * 새 북마크로 저장 핸들러
   */
  function handleSaveAsNewBookmark() {
    const bookmark = bookmarks.value.find(b => b.id === appliedBookmarkId.value)
    const baseName = bookmark ? bookmark.name : 'Bookmark'

    const newBookmark = addBookmark(
      `${baseName} (Copy)`,
      prompt.value,
      negativePrompt.value
    )

    appliedBookmarkId.value = newBookmark.id
    bookmarkPromptChanged.value = false
    showToast?.(t('bookmark.savedAsNew'), 'success')
  }

  /**
   * 북마크 알림 무시 핸들러
   * 현재 프롬프트 유지하고 북마크 연결만 해제
   */
  function handleDismissBookmarkNotice() {
    appliedBookmarkId.value = null
    bookmarkPromptChanged.value = false
  }

  /**
   * 프롬프트 변경 감지 watcher 설정
   */
  function setupPromptChangeWatcher() {
    watch([prompt, negativePrompt], () => {
      if (appliedBookmarkId.value) {
        const bookmark = bookmarks.value.find(b => b.id === appliedBookmarkId.value)

        if (bookmark) {
          // Check if content differs from the applied bookmark
          const hasChanged =
            prompt.value !== bookmark.prompt ||
            negativePrompt.value !== bookmark.negativePrompt

          bookmarkPromptChanged.value = hasChanged
        }
      }
    })
  }

  /**
   * 북마크 추적 초기화
   */
  function initBookmarkTracking() {
    setupPromptChangeWatcher()
  }

  return {
    // State
    appliedBookmarkId,
    bookmarkPromptChanged,

    // Functions
    handleApplyBookmark,
    handleUpdateBookmark,
    handleSaveAsNewBookmark,
    handleDismissBookmarkNotice,

    // Init
    initBookmarkTracking
  }
}
