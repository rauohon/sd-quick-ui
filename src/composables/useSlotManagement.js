/**
 * 슬롯 관리 composable
 */
import { ref } from 'vue'

/**
 * @param {Object} defaultSettings - 기본 설정 객체
 * @param {Object} settingsRefs - 설정 ref 객체들
 * @param {Ref} adetailers - ADetailer 설정 ref (선택적)
 * @param {Function} showToast - 토스트 표시 함수 (선택적)
 * @param {string} slotKeyPrefix - localStorage 키 접두사 (기본값: 'sd', 예: 'sd-img2img')
 */
export function useSlotManagement(defaultSettings, settingsRefs, adetailers = null, showToast = null, slotKeyPrefix = 'sd') {
  const slots = ref([null, null, null]) // 3 slots
  const activeSlot = ref(null) // Currently active slot (0, 1, 2, or null)
  const localStorageKey = `${slotKeyPrefix}-active-slot`

  let saveSlotTimeout = null
  let lastSaveTime = 0 // 마지막 저장 시간 (토스트 중복 방지)

  /**
   * 현재 설정을 객체로 반환
   */
  function getCurrentSettings() {
    const settings = {}

    // 일반 설정
    for (const [key, refObj] of Object.entries(settingsRefs)) {
      settings[key] = refObj.value
    }

    // ADetailer는 깊은 복사 (있는 경우에만)
    if (adetailers) {
      settings.adetailers = JSON.parse(JSON.stringify(adetailers.value))
    }

    return settings
  }

  /**
   * 설정을 적용
   */
  function applySettings(settings) {
    // 일반 설정
    for (const [key, refObj] of Object.entries(settingsRefs)) {
      if (settings[key] !== undefined) {
        refObj.value = settings[key]
      }
    }

    // ADetailer는 깊은 복사 (있는 경우에만)
    if (adetailers && settings.adetailers) {
      adetailers.value = JSON.parse(JSON.stringify(settings.adetailers))
    }
  }

  /**
   * 현재 슬롯에 설정 저장
   */
  function saveCurrentSlot() {
    if (activeSlot.value !== null) {
      slots.value[activeSlot.value] = getCurrentSettings()
      // IndexedDB 저장은 Txt2ImgView.vue의 watch에서 자동으로 처리됨
    }
  }

  /**
   * 슬롯 선택 및 로드
   */
  function selectSlot(slotIndex) {
    // Cancel pending auto-save
    if (saveSlotTimeout) {
      clearTimeout(saveSlotTimeout)
      saveSlotTimeout = null
    }

    // Save current slot before switching (immediate save)
    saveCurrentSlot()

    // Switch to new slot
    activeSlot.value = slotIndex

    // Load slot data (or default if empty)
    const slotData = slots.value[slotIndex]
    if (slotData) {
      applySettings(slotData)
    } else {
      // Empty slot - apply default settings
      applySettings(JSON.parse(JSON.stringify(defaultSettings)))
    }

    localStorage.setItem(localStorageKey, slotIndex)
  }

  /**
   * Debounced 슬롯 저장 시작
   * @param {number} delay - Debounce delay in ms (default: 1000)
   */
  function startDebouncedSlotSave(delay = 1000) {
    if (saveSlotTimeout) {
      clearTimeout(saveSlotTimeout)
    }

    // Debounce: save after specified delay
    saveSlotTimeout = setTimeout(() => {
      saveCurrentSlot()

      // 피드백 표시 (10초에 한 번만 - 너무 자주 표시하지 않음)
      const now = Date.now()
      if (showToast && activeSlot.value !== null && (now - lastSaveTime) > 10000) {
        showToast(`💾 슬롯 #${activeSlot.value + 1} 자동 저장됨`, 'success')
        lastSaveTime = now
      }
    }, delay)
  }

  /**
   * Debounced 슬롯 저장 취소
   */
  function cancelDebouncedSlotSave() {
    if (saveSlotTimeout) {
      clearTimeout(saveSlotTimeout)
      saveSlotTimeout = null
    }
  }

  return {
    slots,
    activeSlot,
    localStorageKey,
    getCurrentSettings,
    applySettings,
    saveCurrentSlot,
    selectSlot,
    startDebouncedSlotSave,
    cancelDebouncedSlotSave,
  }
}
