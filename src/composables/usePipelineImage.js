/**
 * 파이프라인 이미지 전달 Composable
 * 탭 간 이미지 전달을 위한 전역 상태 관리
 */
import { ref, readonly } from 'vue'

// 싱글톤 상태 (모든 뷰에서 공유)
const pendingImage = ref(null)      // 전달할 이미지 (Base64)
const sourceTab = ref(null)         // 이미지 출처 탭 ('txt2img', 'img2img', 'inpaint')
const targetTab = ref(null)         // 목표 탭
const pendingCallback = ref(null)   // 탭 전환 후 실행할 콜백

/**
 * 파이프라인 이미지 전달 composable
 * @returns {Object} 이미지 전달 관련 상태와 함수들
 */
export function usePipelineImage() {
  /**
   * img2img 탭으로 이미지 전송
   * @param {string} image - Base64 이미지
   * @param {string} from - 출처 탭 ID
   * @param {Function} switchTab - 탭 전환 함수 (App.vue에서 제공)
   */
  function sendToImg2Img(image, from = null, switchTab = null) {
    pendingImage.value = image
    sourceTab.value = from
    targetTab.value = 'img2img'

    if (switchTab) {
      switchTab('img2img')
    }
  }

  /**
   * inpaint 탭으로 이미지 전송
   * @param {string} image - Base64 이미지
   * @param {string} from - 출처 탭 ID
   * @param {Function} switchTab - 탭 전환 함수 (App.vue에서 제공)
   */
  function sendToInpaint(image, from = null, switchTab = null) {
    pendingImage.value = image
    sourceTab.value = from
    targetTab.value = 'inpaint'

    if (switchTab) {
      switchTab('inpaint')
    }
  }

  /**
   * txt2img 탭으로 이미지 전송 (img2img용 참조 이미지로는 사용 안함, 향후 확장용)
   * @param {string} image - Base64 이미지
   * @param {string} from - 출처 탭 ID
   * @param {Function} switchTab - 탭 전환 함수
   */
  function sendToTxt2Img(image, from = null, switchTab = null) {
    pendingImage.value = image
    sourceTab.value = from
    targetTab.value = 'txt2img'

    if (switchTab) {
      switchTab('txt2img')
    }
  }

  /**
   * 대기 중인 이미지 가져오기 및 소비
   * 호출 후 pendingImage는 null로 초기화됨
   * @returns {Object|null} { image, sourceTab, targetTab } 또는 null
   */
  function consumePendingImage() {
    if (!pendingImage.value) {
      return null
    }

    const result = {
      image: pendingImage.value,
      sourceTab: sourceTab.value,
      targetTab: targetTab.value
    }

    // 상태 초기화
    pendingImage.value = null
    sourceTab.value = null
    targetTab.value = null

    return result
  }

  /**
   * 대기 중인 이미지 확인 (소비하지 않음)
   * @returns {boolean} 대기 중인 이미지가 있는지
   */
  function hasPendingImage() {
    return pendingImage.value !== null
  }

  /**
   * 특정 탭으로 향하는 이미지가 있는지 확인
   * @param {string} tabId - 확인할 탭 ID
   * @returns {boolean}
   */
  function hasPendingImageFor(tabId) {
    return pendingImage.value !== null && targetTab.value === tabId
  }

  /**
   * 대기 중인 이미지 취소/초기화
   */
  function clearPendingImage() {
    pendingImage.value = null
    sourceTab.value = null
    targetTab.value = null
  }

  return {
    // 읽기 전용 상태
    pendingImage: readonly(pendingImage),
    sourceTab: readonly(sourceTab),
    targetTab: readonly(targetTab),

    // 전송 함수
    sendToImg2Img,
    sendToInpaint,
    sendToTxt2Img,

    // 소비/확인 함수
    consumePendingImage,
    hasPendingImage,
    hasPendingImageFor,
    clearPendingImage
  }
}
