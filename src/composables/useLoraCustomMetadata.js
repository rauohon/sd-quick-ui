import { ref } from 'vue'
import { logError } from './useErrorHandler'

const LORA_CUSTOM_METADATA_KEY = 'lora_custom_metadata'

// 싱글톤 패턴: 모듈 레벨에서 상태 정의
const metadata = ref({})
let isInitialized = false

/**
 * LoRA 사용자 정의 메타데이터 관리 composable
 * 트리거 워드, 메모, 기본 가중치 등을 사용자가 직접 편집하고 저장
 */
export function useLoraCustomMetadata() {

  /**
   * localStorage에서 메타데이터 로드
   */
  function loadMetadata() {
    try {
      const saved = localStorage.getItem(LORA_CUSTOM_METADATA_KEY)
      if (saved) {
        metadata.value = JSON.parse(saved)
      }
    } catch (error) {
      logError(error, 'loadLoraCustomMetadata')
      metadata.value = {}
    }
  }

  /**
   * localStorage에 메타데이터 저장
   */
  function saveToStorage() {
    try {
      localStorage.setItem(LORA_CUSTOM_METADATA_KEY, JSON.stringify(metadata.value))
    } catch (error) {
      logError(error, 'saveLoraCustomMetadata')
    }
  }

  /**
   * 특정 LoRA의 사용자 정의 메타데이터 조회
   * @param {string} loraName - LoRA 파일명
   * @returns {Object|null} 메타데이터 객체 또는 null
   */
  function getCustomMetadata(loraName) {
    return metadata.value[loraName] || null
  }

  /**
   * 특정 LoRA의 사용자 정의 트리거 워드 조회
   * @param {string} loraName - LoRA 파일명
   * @returns {string[]} 트리거 워드 배열 (없으면 빈 배열)
   */
  function getCustomTriggerWords(loraName) {
    const custom = metadata.value[loraName]
    if (custom?.triggerWords?.length > 0) {
      return custom.triggerWords
    }
    return []
  }

  /**
   * 특정 LoRA의 사용자 정의 가중치 조회
   * @param {string} loraName - LoRA 파일명
   * @returns {number|null} 가중치 또는 null
   */
  function getCustomWeight(loraName) {
    const custom = metadata.value[loraName]
    return custom?.customWeight ?? null
  }

  /**
   * LoRA 메타데이터 저장/업데이트
   * @param {string} loraName - LoRA 파일명
   * @param {Object} data - 저장할 데이터 { triggerWords?, memo?, customWeight? }
   */
  function saveCustomMetadata(loraName, data) {
    try {
      const existing = metadata.value[loraName] || {}

      metadata.value[loraName] = {
        ...existing,
        ...data,
        updatedAt: Date.now()
      }

      saveToStorage()
      return true
    } catch (error) {
      logError(error, 'saveCustomMetadata')
      return false
    }
  }

  /**
   * LoRA 메타데이터 삭제
   * @param {string} loraName - LoRA 파일명
   */
  function deleteCustomMetadata(loraName) {
    try {
      if (metadata.value[loraName]) {
        delete metadata.value[loraName]
        saveToStorage()
        return true
      }
      return false
    } catch (error) {
      logError(error, 'deleteCustomMetadata')
      return false
    }
  }

  /**
   * 특정 LoRA에 사용자 정의 메타데이터가 있는지 확인
   * @param {string} loraName - LoRA 파일명
   * @returns {boolean}
   */
  function hasCustomMetadata(loraName) {
    return !!metadata.value[loraName]
  }

  /**
   * 전체 메타데이터 내보내기 (JSON 문자열)
   * @returns {string}
   */
  function exportMetadata() {
    return JSON.stringify(metadata.value, null, 2)
  }

  /**
   * 메타데이터 가져오기 (JSON 문자열에서)
   * @param {string} jsonString - JSON 형식 문자열
   * @param {boolean} merge - true면 기존과 병합, false면 덮어쓰기
   * @returns {boolean} 성공 여부
   */
  function importMetadata(jsonString, merge = true) {
    try {
      const imported = JSON.parse(jsonString)

      if (merge) {
        metadata.value = { ...metadata.value, ...imported }
      } else {
        metadata.value = imported
      }

      saveToStorage()
      return true
    } catch (error) {
      logError(error, 'importMetadata')
      return false
    }
  }

  // 초기 로드 (한 번만 실행)
  if (!isInitialized) {
    loadMetadata()
    isInitialized = true
  }

  return {
    metadata,
    loadMetadata,
    getCustomMetadata,
    getCustomTriggerWords,
    getCustomWeight,
    saveCustomMetadata,
    deleteCustomMetadata,
    hasCustomMetadata,
    exportMetadata,
    importMetadata
  }
}
