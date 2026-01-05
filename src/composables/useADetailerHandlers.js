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
   * ADetailer 활성화 상태 업데이트
   */
  function updateADetailerEnable(index, value) {
    adetailers.value[index].enable = value
  }

  /**
   * ADetailer 모델 업데이트
   */
  function updateADetailerModel(index, value) {
    adetailers.value[index].model = value
  }

  /**
   * ADetailer Confidence 업데이트
   */
  function updateADetailerConfidence(index, value) {
    adetailers.value[index].confidence = value
  }

  /**
   * ADetailer Dilate/Erode 업데이트
   */
  function updateADetailerDilateErode(index, value) {
    adetailers.value[index].dilateErode = value
  }

  /**
   * ADetailer Inpaint Denoising 업데이트
   */
  function updateADetailerInpaintDenoising(index, value) {
    adetailers.value[index].inpaintDenoising = value
  }

  /**
   * ADetailer Inpaint Only Masked 업데이트
   */
  function updateADetailerInpaintOnlyMasked(index, value) {
    adetailers.value[index].inpaintOnlyMasked = value
  }

  /**
   * ADetailer Use Separate Steps 업데이트
   */
  function updateADetailerUseSeparateSteps(index, value) {
    adetailers.value[index].useSeparateSteps = value
  }

  /**
   * ADetailer Steps 업데이트
   */
  function updateADetailerSteps(index, value) {
    adetailers.value[index].steps = value
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
    updateADetailerEnable,
    updateADetailerModel,
    updateADetailerConfidence,
    updateADetailerDilateErode,
    updateADetailerInpaintDenoising,
    updateADetailerInpaintOnlyMasked,
    updateADetailerUseSeparateSteps,
    updateADetailerSteps,
    reorderADetailers
  }
}
