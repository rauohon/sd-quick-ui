import { ref } from 'vue'
import { get } from '../api/client'

/**
 * API 연결 상태 관리 composable
 * API 연결 체크 및 상태 추적 기능 제공
 *
 * @param {Function} showToast - 토스트 메시지 표시 함수
 * @returns {Object} API 상태 관련 상태와 함수들
 */
export function useApiStatus(showToast) {
  // State
  const apiConnected = ref(false)
  const apiChecking = ref(true)

  /**
   * API 연결 상태 체크
   */
  async function checkApiStatus() {
    apiChecking.value = true
    try {
      const response = await get('/sdapi/v1/sd-models')
      apiConnected.value = response.ok
      if (response.ok) {
        showToast?.('API 연결 성공', 'success')
      } else {
        showToast?.('API 연결 실패', 'error')
      }
    } catch (error) {
      apiConnected.value = false
      showToast?.('API 연결 실패', 'error')
    } finally {
      apiChecking.value = false
    }
  }

  return {
    // State
    apiConnected,
    apiChecking,

    // Functions
    checkApiStatus
  }
}
