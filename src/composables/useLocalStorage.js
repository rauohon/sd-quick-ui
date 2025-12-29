/**
 * localStorage 관리 composable
 */
import { MAX_HISTORY_SIZE, MAX_STORAGE_SIZE_MB } from '../config/constants'

export function useLocalStorage() {
  /**
   * 히스토리를 localStorage에 저장
   */
  function saveToLocalStorage(generatedImages, showToast, options = {}) {
    const { isInfiniteMode = false } = options

    // 무한 생성 모드일 때는 저장 스킵
    if (isInfiniteMode) {
      return
    }

    try {
      // 히스토리 크기 제한
      let limitedHistory = generatedImages.value.slice(0, MAX_HISTORY_SIZE)

      // JSON 변환 및 크기 체크
      let data = JSON.stringify(limitedHistory)
      let sizeInMB = new Blob([data]).size / (1024 * 1024)

      // 크기가 너무 크면 점진적으로 줄이기
      while (sizeInMB > MAX_STORAGE_SIZE_MB && limitedHistory.length > 1) {
        limitedHistory = limitedHistory.slice(0, Math.max(1, Math.floor(limitedHistory.length * 0.7)))
        data = JSON.stringify(limitedHistory)
        sizeInMB = new Blob([data]).size / (1024 * 1024)
      }

      if (limitedHistory.length < generatedImages.value.length) {
        console.warn(`히스토리가 ${generatedImages.value.length}개에서 ${limitedHistory.length}개로 축소되었습니다`)
      }

      localStorage.setItem('sd-history', data)
    } catch (error) {
      console.error('localStorage 저장 실패:', error)

      if (error.name === 'QuotaExceededError') {
        // 용량 초과 시: localStorage 완전 클리어 후 최소한만 저장
        try {
          console.warn('QuotaExceededError: localStorage 클리어 시도')

          // 기존 히스토리 제거
          localStorage.removeItem('sd-history')

          // 최신 1개만 저장 시도
          const minimal = generatedImages.value.slice(0, 1)
          const minimalData = JSON.stringify(minimal)
          localStorage.setItem('sd-history', minimalData)

          // 메모리의 히스토리도 제한
          generatedImages.value = minimal

          showToast?.('⚠️ 저장 공간 부족: 히스토리가 초기화되고 최신 1개만 보관됩니다', 'warning')
        } catch (retryError) {
          console.error('히스토리 최소 저장도 실패:', retryError)
          // 완전 실패 - localStorage 전체 클리어
          try {
            localStorage.clear()
            showToast?.('❌ 저장 공간 부족: localStorage가 초기화되었습니다', 'error')
          } catch (clearError) {
            console.error('localStorage 클리어 실패:', clearError)
          }
        }
      } else {
        showToast?.('히스토리 저장에 실패했습니다', 'error')
      }
    }
  }

  /**
   * localStorage에서 히스토리 로드
   */
  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('sd-history')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('localStorage 로드 실패:', error)
    }
    return []
  }

  /**
   * 슬롯을 localStorage에 저장
   */
  function saveSlots(slots) {
    try {
      localStorage.setItem('sd-slots', JSON.stringify(slots.value))
    } catch (error) {
      console.error('슬롯 저장 실패:', error)
    }
  }

  /**
   * localStorage에서 슬롯 로드
   */
  function loadSlots() {
    try {
      const saved = localStorage.getItem('sd-slots')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('슬롯 로드 실패:', error)
    }
    return [null, null, null]
  }

  return {
    saveToLocalStorage,
    loadFromLocalStorage,
    saveSlots,
    loadSlots,
  }
}
