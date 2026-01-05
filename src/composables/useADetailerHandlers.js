import { ref } from 'vue'

/**
 * ADetailer 관련 핸들러 composable
 * ADetailer 모달 상태와 업데이트 함수들을 관리
 *
 * @param {Ref<Array>} adetailers - ADetailer 배열 ref
 * @returns {Object} ADetailer 관련 상태와 함수들
 */
export function useADetailerHandlers(adetailers) {
  // 모달 상태
  const showADetailerPrompt = ref(false)
  const editingADetailerIndex = ref(0)

  /**
   * ADetailer 프롬프트 모달 열기
   */
  function openADetailerPrompt(index) {
    editingADetailerIndex.value = index
    showADetailerPrompt.value = true
  }

  /**
   * ADetailer 프롬프트 모달 닫기
   */
  function closeADetailerPrompt() {
    showADetailerPrompt.value = false
  }

  /**
   * ADetailer 프롬프트 업데이트
   */
  function updateADetailerPrompts(prompt, negativePrompt) {
    const index = editingADetailerIndex.value
    adetailers.value[index].prompt = prompt
    adetailers.value[index].negativePrompt = negativePrompt
  }

  /**
   * ADetailer 필드 업데이트 (제네릭)
   * @param {number} index - ADetailer 인덱스
   * @param {string} field - 필드명 (enable, model, confidence, dilateErode, etc.)
   * @param {any} value - 새 값
   */
  function updateADetailerField(index, field, value) {
    adetailers.value[index][field] = value
  }

  /**
   * ADetailer 순서 변경 (재정렬)
   */
  function reorderADetailers(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= adetailers.value.length) return
    const temp = adetailers.value[fromIndex]
    adetailers.value[fromIndex] = adetailers.value[toIndex]
    adetailers.value[toIndex] = temp
  }

  return {
    // 모달 상태
    showADetailerPrompt,
    editingADetailerIndex,

    // 모달 함수
    openADetailerPrompt,
    closeADetailerPrompt,

    // 업데이트 함수
    updateADetailerPrompts,
    updateADetailerField,
    reorderADetailers
  }
}
