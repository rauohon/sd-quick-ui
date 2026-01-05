/**
 * ControlNet 관리 Composable
 * ControlNet 모델, 모듈 로드 및 유닛 상태 관리
 */
import { ref, computed } from 'vue'
import { get, post } from '../api/client'
import { logError } from './useErrorHandler'
import {
  CONTROLNET_MAX_UNITS,
  CONTROLNET_DEFAULT_UNIT,
  CONTROLNET_RESIZE_MODES,
  CONTROLNET_CONTROL_MODES
} from '../config/constants'

// 싱글톤 상태 (모든 뷰에서 공유)
const models = ref([])
const modules = ref([])
const moduleDetails = ref({})
const isLoading = ref(false)
const hasLoaded = ref(false)
const loadError = ref(null)

/**
 * ControlNet composable
 * @returns {Object} ControlNet 관련 상태와 함수들
 */
export function useControlNet() {
  /**
   * 모델 목록 로드
   */
  async function fetchModels() {
    try {
      const response = await get('/controlnet/model_list')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      models.value = data.model_list || []
      return models.value
    } catch (error) {
      logError(error, 'fetchControlNetModels')
      throw error
    }
  }

  /**
   * 모듈(프리프로세서) 목록 로드
   */
  async function fetchModules() {
    try {
      const response = await get('/controlnet/module_list')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      modules.value = data.module_list || []
      moduleDetails.value = data.module_detail || {}
      return { modules: modules.value, details: moduleDetails.value }
    } catch (error) {
      logError(error, 'fetchControlNetModules')
      throw error
    }
  }

  /**
   * 모델 및 모듈 목록 초기 로드
   */
  async function loadControlNetData(force = false) {
    if (hasLoaded.value && !force) {
      return { models: models.value, modules: modules.value }
    }

    isLoading.value = true
    loadError.value = null

    try {
      await Promise.all([fetchModels(), fetchModules()])
      hasLoaded.value = true
      return { models: models.value, modules: modules.value }
    } catch (error) {
      loadError.value = error.message
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 프리프로세서 미리보기 (이미지 전처리)
   * @param {string} module - 프리프로세서 이름
   * @param {string} image - Base64 이미지
   * @param {number} processorRes - 프리프로세서 해상도
   * @param {number} thresholdA - 프리프로세서 파라미터 A
   * @param {number} thresholdB - 프리프로세서 파라미터 B
   * @returns {Promise<string>} 처리된 이미지 (Base64)
   */
  async function detectPreprocess(module, image, processorRes = 512, thresholdA = -1, thresholdB = -1) {
    try {
      const response = await post('/controlnet/detect', {
        controlnet_module: module,
        controlnet_input_images: [image],
        controlnet_processor_res: processorRes,
        controlnet_threshold_a: thresholdA,
        controlnet_threshold_b: thresholdB
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      // 결과 이미지 반환 (첫 번째)
      return data.images?.[0] || null
    } catch (error) {
      logError(error, 'detectPreprocess')
      throw error
    }
  }

  /**
   * 기본 ControlNet 유닛 생성
   * @param {number} index - 유닛 인덱스
   * @returns {Object} 기본 유닛 설정
   */
  function createDefaultUnit(index = 0) {
    return {
      ...CONTROLNET_DEFAULT_UNIT,
      id: `unit-${index}-${Date.now()}`
    }
  }

  /**
   * 모듈별 슬라이더 정보 가져오기
   * @param {string} moduleName - 모듈 이름
   * @returns {Array} 슬라이더 설정 배열
   */
  function getModuleSliders(moduleName) {
    const detail = moduleDetails.value[moduleName]
    if (!detail) {
      return []
    }
    return detail.sliders || []
  }

  /**
   * 모듈이 모델 없이 동작 가능한지 확인
   * @param {string} moduleName - 모듈 이름
   * @returns {boolean}
   */
  function isModelFreeModule(moduleName) {
    const detail = moduleDetails.value[moduleName]
    return detail?.model_free === true
  }

  // API에서 기대하는 문자열 값으로 변환
  const RESIZE_MODE_STRINGS = {
    0: 'Just Resize',
    1: 'Crop and Resize',
    2: 'Resize and Fill'
  }

  const CONTROL_MODE_STRINGS = {
    0: 'Balanced',
    1: 'My prompt is more important',
    2: 'ControlNet is more important'
  }

  /**
   * ControlNet API 요청용 args 배열 생성
   * @param {Array} units - ControlNet 유닛 배열
   * @returns {Array} API에 전달할 args 배열
   */
  function buildControlNetArgs(units) {
    return units
      .filter(unit => unit.enabled && unit.image)
      .map(unit => {
        // 변환된 이미지가 있으면 사용, 없으면 원본 사용
        const imageToUse = unit.transformedImage || unit.image
        const args = {
          enabled: true,
          module: unit.module || 'none',
          model: unit.model || 'None',
          image: imageToUse, // Base64 (transformed or original)
          weight: unit.weight,
          resize_mode: RESIZE_MODE_STRINGS[unit.resizeMode] || 'Crop and Resize',
          control_mode: CONTROL_MODE_STRINGS[unit.controlMode] || 'Balanced',
          guidance_start: unit.guidanceStart,
          guidance_end: unit.guidanceEnd,
          processor_res: unit.processorRes,
          threshold_a: unit.thresholdA,
          threshold_b: unit.thresholdB,
          pixel_perfect: unit.pixelPerfect || false
        }
        // 프롬프트가 있으면 추가 (비어있으면 메인 프롬프트 사용)
        if (unit.prompt && unit.prompt.trim()) {
          args.prompt = unit.prompt.trim()
        }
        return args
      })
  }

  /**
   * alwayson_scripts에 추가할 ControlNet 객체 생성
   * @param {Array} units - ControlNet 유닛 배열
   * @returns {Object|null} ControlNet 스크립트 객체 또는 null
   */
  function buildControlNetScript(units) {
    const args = buildControlNetArgs(units)
    if (args.length === 0) {
      return null
    }
    return {
      controlnet: {
        args: args
      }
    }
  }

  /**
   * 활성화된 유닛 수
   */
  function getEnabledCount(units) {
    return units.filter(u => u.enabled && u.image).length
  }

  /**
   * 카테고리별 모듈 그룹핑
   */
  const groupedModules = computed(() => {
    const groups = {
      'Pose': [],
      'Edge': [],
      'Depth': [],
      'Lineart': [],
      'Reference': [],
      'IP-Adapter': [],
      'Tile': [],
      'Inpaint': [],
      'Other': []
    }

    modules.value.forEach(module => {
      if (module.includes('openpose') || module.includes('dw_openpose') || module.includes('animal_openpose') || module.includes('densepose')) {
        groups['Pose'].push(module)
      } else if (module.includes('canny') || module.includes('hed') || module.includes('softedge') || module.includes('pidinet') || module.includes('mlsd') || module.includes('scribble')) {
        groups['Edge'].push(module)
      } else if (module.includes('depth') || module.includes('normal')) {
        groups['Depth'].push(module)
      } else if (module.includes('lineart')) {
        groups['Lineart'].push(module)
      } else if (module.includes('reference')) {
        groups['Reference'].push(module)
      } else if (module.includes('ip-adapter') || module.includes('instant_id') || module.includes('pulid')) {
        groups['IP-Adapter'].push(module)
      } else if (module.includes('tile') || module.includes('recolor') || module.includes('blur')) {
        groups['Tile'].push(module)
      } else if (module.includes('inpaint')) {
        groups['Inpaint'].push(module)
      } else if (module !== 'none') {
        groups['Other'].push(module)
      }
    })

    // 빈 그룹 제거
    return Object.fromEntries(
      Object.entries(groups).filter(([, items]) => items.length > 0)
    )
  })

  return {
    // 상태 (읽기 전용)
    models: computed(() => models.value),
    modules: computed(() => modules.value),
    moduleDetails: computed(() => moduleDetails.value),
    groupedModules,
    isLoading: computed(() => isLoading.value),
    hasLoaded: computed(() => hasLoaded.value),
    loadError: computed(() => loadError.value),

    // API 함수
    fetchModels,
    fetchModules,
    loadControlNetData,
    detectPreprocess,

    // 헬퍼 함수
    createDefaultUnit,
    getModuleSliders,
    isModelFreeModule,
    buildControlNetArgs,
    buildControlNetScript,
    getEnabledCount
  }
}

// ===== ControlNet 유닛 싱글톤 상태 (뷰 간 공유) =====
// 각 탭(txt2img, img2img, inpaint)별로 독립적인 유닛 상태
const unitsByTab = {
  txt2img: null,
  img2img: null,
  inpaint: null
}

function initializeUnits(tabId, maxUnits) {
  if (!unitsByTab[tabId]) {
    unitsByTab[tabId] = ref(
      Array.from({ length: maxUnits }, (_, i) => ({
        ...CONTROLNET_DEFAULT_UNIT,
        id: `unit-${tabId}-${i}-${Date.now()}`
      }))
    )
  }
  return unitsByTab[tabId]
}

/**
 * ControlNet 유닛 상태 관리 Composable
 * 싱글톤 패턴: 같은 탭에서 호출하면 동일한 상태 공유
 * @param {string} tabId - 탭 ID ('txt2img', 'img2img', 'inpaint')
 * @param {number} maxUnits - 최대 유닛 수 (기본 3)
 * @returns {Object} 유닛 상태와 관리 함수
 */
export function useControlNetUnits(tabId = 'txt2img', maxUnits = CONTROLNET_MAX_UNITS) {
  const { createDefaultUnit } = useControlNet()

  // 탭별 싱글톤 유닛 상태 가져오기/생성
  const units = initializeUnits(tabId, maxUnits)

  /**
   * 특정 유닛 업데이트
   * @param {number} index - 유닛 인덱스
   * @param {Object} updates - 업데이트할 필드
   */
  function updateUnit(index, updates) {
    if (index >= 0 && index < units.value.length) {
      units.value[index] = { ...units.value[index], ...updates }
    }
  }

  /**
   * 특정 유닛 리셋
   * @param {number} index - 유닛 인덱스
   */
  function resetUnit(index) {
    if (index >= 0 && index < units.value.length) {
      units.value[index] = {
        ...CONTROLNET_DEFAULT_UNIT,
        id: `unit-${tabId}-${index}-${Date.now()}`
      }
    }
  }

  /**
   * 모든 유닛 리셋
   */
  function resetAllUnits() {
    units.value = Array.from({ length: maxUnits }, (_, i) => ({
      ...CONTROLNET_DEFAULT_UNIT,
      id: `unit-${tabId}-${i}-${Date.now()}`
    }))
  }

  /**
   * 유닛 활성화 토글
   * @param {number} index - 유닛 인덱스
   */
  function toggleUnit(index) {
    if (index >= 0 && index < units.value.length) {
      units.value[index].enabled = !units.value[index].enabled
    }
  }

  /**
   * 유닛에 이미지 설정
   * @param {number} index - 유닛 인덱스
   * @param {string} image - Base64 이미지
   */
  function setUnitImage(index, image) {
    if (index >= 0 && index < units.value.length) {
      units.value[index].image = image
    }
  }

  /**
   * 유닛 이미지 삭제
   * @param {number} index - 유닛 인덱스
   */
  function clearUnitImage(index) {
    if (index >= 0 && index < units.value.length) {
      units.value[index].image = null
      units.value[index].preprocessedImage = null
      units.value[index].transformedImage = null
    }
  }

  /**
   * 활성화된 유닛 목록
   */
  const enabledUnits = computed(() =>
    units.value.filter(u => u.enabled && u.image)
  )

  /**
   * 활성화된 유닛 수
   */
  const enabledCount = computed(() => enabledUnits.value.length)

  /**
   * ControlNet 사용 여부
   */
  const hasControlNet = computed(() => enabledCount.value > 0)

  return {
    units,
    enabledUnits,
    enabledCount,
    hasControlNet,
    updateUnit,
    resetUnit,
    resetAllUnits,
    toggleUnit,
    setUnitImage,
    clearUnitImage
  }
}
