import { ref } from 'vue'

const API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:7860' : ''
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * 모델 로더 composable
 * SD 모델, 샘플러, 스케줄러, 업스케일러 로드 및 관리
 *
 * @param {Ref<string>} selectedModel - 선택된 모델 ref
 * @param {Function} showToast - 토스트 메시지 표시 함수
 * @returns {Object} 모델 로더 관련 상태와 함수들
 */
export function useModelLoader(selectedModel, showToast) {
  // State
  const availableModels = ref([])
  const availableSamplers = ref([])
  const availableSchedulers = ref([])
  const availableUpscalers = ref([])

  /**
   * API에서 사용 가능한 모델 목록 로드 (캐싱 지원)
   * @param {boolean} forceRefresh - 캐시 무시하고 강제 새로고침
   */
  async function loadModels(forceRefresh = false) {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedModels = loadFromCache('sd-models')
        const cachedSamplers = loadFromCache('sd-samplers')
        const cachedSchedulers = loadFromCache('sd-schedulers')
        const cachedUpscalers = loadFromCache('sd-upscalers')

        if (cachedModels && cachedSamplers && cachedSchedulers && cachedUpscalers) {
          availableModels.value = cachedModels
          availableSamplers.value = cachedSamplers
          availableSchedulers.value = cachedSchedulers
          availableUpscalers.value = cachedUpscalers
          return
        }
      }

      // Load from API
      const [modelsRes, samplersRes, schedulersRes, upscalersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sdapi/v1/sd-models`),
        fetch(`${API_BASE_URL}/sdapi/v1/samplers`),
        fetch(`${API_BASE_URL}/sdapi/v1/schedulers`),
        fetch(`${API_BASE_URL}/sdapi/v1/upscalers`)
      ])

      if (modelsRes.ok && samplersRes.ok && schedulersRes.ok && upscalersRes.ok) {
        const models = await modelsRes.json()
        const samplers = await samplersRes.json()
        const schedulers = await schedulersRes.json()
        const upscalers = await upscalersRes.json()

        availableModels.value = models
        availableSamplers.value = samplers
        availableSchedulers.value = schedulers
        availableUpscalers.value = upscalers

        // Cache results
        saveToCache('sd-models', models)
        saveToCache('sd-samplers', samplers)
        saveToCache('sd-schedulers', schedulers)
        saveToCache('sd-upscalers', upscalers)

        showToast?.('모델 목록 로드 완료', 'success')
      } else {
        throw new Error('API 응답 오류')
      }
    } catch (error) {
      console.error('모델 목록 로드 실패:', error)
      showToast?.('모델 목록 로드 실패', 'error')
    }
  }

  /**
   * WebUI에서 모델 변경
   * @param {string} modelTitle - 변경할 모델 제목
   */
  async function changeModel(modelTitle) {
    try {
      const response = await fetch(`${API_BASE_URL}/sdapi/v1/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sd_model_checkpoint: modelTitle
        })
      })

      if (response.ok) {
        showToast?.(`모델 변경: ${modelTitle}`, 'success')
      } else {
        throw new Error('모델 변경 실패')
      }
    } catch (error) {
      console.error('모델 변경 실패:', error)
      showToast?.('모델 변경 실패', 'error')
    }
  }

  /**
   * localStorage에서 캐시 로드
   * @param {string} key - 캐시 키
   * @returns {any|null} 캐시된 데이터 또는 null
   */
  function loadFromCache(key) {
    try {
      const cached = window.localStorage.getItem(key)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (now - timestamp < CACHE_DURATION) {
        return data
      } else {
        // Clear expired cache
        window.localStorage.removeItem(key)
        return null
      }
    } catch (error) {
      console.error(`Cache load error for ${key}:`, error)
      return null
    }
  }

  /**
   * localStorage에 캐시 저장
   * @param {string} key - 캐시 키
   * @param {any} data - 저장할 데이터
   */
  function saveToCache(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      window.localStorage.setItem(key, JSON.stringify(cacheData))
    } catch (error) {
      console.error(`Cache save error for ${key}:`, error)
    }
  }

  return {
    // State
    availableModels,
    availableSamplers,
    availableSchedulers,
    availableUpscalers,

    // Functions
    loadModels,
    changeModel
  }
}
