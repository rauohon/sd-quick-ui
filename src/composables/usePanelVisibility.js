import { ref, watch, onMounted } from 'vue'

const STORAGE_KEYS = {
  historyPanel: 'txt2img_showHistoryPanel',
  historyContentCollapsed: 'txt2img_isHistoryContentCollapsed',
  imagePanel: 'txt2img_showImagePanel',
  advancedPanel: 'txt2img_showAdvancedPanel',
  paramsPanel: 'txt2img_showParamsPanel'
}

/**
 * 패널 가시성 관리 composable
 * 패널 상태를 localStorage에 저장하고 복원
 *
 * @returns {Object} 패널 가시성 관련 상태와 함수들
 */
export function usePanelVisibility() {
  // Panel visibility refs
  const showHistoryPanel = ref(true)
  const isHistoryContentCollapsed = ref(false)
  const showImagePanel = ref(true)
  const showAdvancedPanel = ref(true)
  const showParamsPanel = ref(true)

  /**
   * localStorage에서 패널 상태 로드
   */
  function loadPanelStates() {
    const savedHistoryPanel = window.localStorage.getItem(STORAGE_KEYS.historyPanel)
    if (savedHistoryPanel !== null) {
      showHistoryPanel.value = savedHistoryPanel === 'true'
    }

    const savedHistoryContentCollapsed = window.localStorage.getItem(STORAGE_KEYS.historyContentCollapsed)
    if (savedHistoryContentCollapsed !== null) {
      isHistoryContentCollapsed.value = savedHistoryContentCollapsed === 'true'
    }

    const savedImagePanel = window.localStorage.getItem(STORAGE_KEYS.imagePanel)
    if (savedImagePanel !== null) {
      showImagePanel.value = savedImagePanel === 'true'
    }

    const savedAdvancedPanel = window.localStorage.getItem(STORAGE_KEYS.advancedPanel)
    if (savedAdvancedPanel !== null) {
      showAdvancedPanel.value = savedAdvancedPanel === 'true'
    }

    const savedParamsPanel = window.localStorage.getItem(STORAGE_KEYS.paramsPanel)
    if (savedParamsPanel !== null) {
      showParamsPanel.value = savedParamsPanel === 'true'
    }
  }

  /**
   * 패널 상태 변경 시 localStorage에 저장하는 watchers 설정
   */
  function setupWatchers() {
    watch(showHistoryPanel, (newValue) => {
      window.localStorage.setItem(STORAGE_KEYS.historyPanel, String(newValue))
    })

    watch(isHistoryContentCollapsed, (newValue) => {
      window.localStorage.setItem(STORAGE_KEYS.historyContentCollapsed, String(newValue))
    })

    watch(showImagePanel, (newValue) => {
      window.localStorage.setItem(STORAGE_KEYS.imagePanel, String(newValue))
    })

    watch(showAdvancedPanel, (newValue) => {
      window.localStorage.setItem(STORAGE_KEYS.advancedPanel, String(newValue))
    })

    watch(showParamsPanel, (newValue) => {
      window.localStorage.setItem(STORAGE_KEYS.paramsPanel, String(newValue))
    })
  }

  // Toggle functions
  function toggleHistoryPanel() {
    showHistoryPanel.value = !showHistoryPanel.value
  }

  function toggleHistoryContent() {
    isHistoryContentCollapsed.value = !isHistoryContentCollapsed.value
  }

  function toggleImagePanel() {
    showImagePanel.value = !showImagePanel.value
  }

  function toggleAdvancedPanel() {
    showAdvancedPanel.value = !showAdvancedPanel.value
  }

  function toggleParamsPanel() {
    showParamsPanel.value = !showParamsPanel.value
  }

  /**
   * 초기화 함수 - onMounted에서 호출
   */
  function initPanelVisibility() {
    loadPanelStates()
    setupWatchers()
  }

  return {
    // State
    showHistoryPanel,
    isHistoryContentCollapsed,
    showImagePanel,
    showAdvancedPanel,
    showParamsPanel,

    // Toggle functions
    toggleHistoryPanel,
    toggleHistoryContent,
    toggleImagePanel,
    toggleAdvancedPanel,
    toggleParamsPanel,

    // Init
    initPanelVisibility
  }
}
