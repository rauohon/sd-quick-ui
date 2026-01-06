<script setup>
/**
 * ControlNetManager.vue - ControlNet 관리 패널 (BookmarkManager 스타일)
 * 넓은 공간에서 ControlNet 유닛을 편리하게 관리
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useControlNet, useControlNetUnits } from '../composables/useControlNet'
import {
  CONTROLNET_RESIZE_MODES,
  CONTROLNET_CONTROL_MODES,
  CONTROLNET_PARAM_RANGES
} from '../config/constants'

const { t } = useI18n()

const props = defineProps({
  isGenerating: { type: Boolean, default: false },
  showToast: { type: Function, default: null },
  tabId: { type: String, default: 'txt2img' }
})

const emit = defineEmits(['close', 'update:units'])

// ControlNet composables
const {
  models,
  modules,
  moduleDetails,
  groupedModules,
  isLoading,
  hasLoaded,
  loadControlNetData,
  detectPreprocess,
  getModuleSliders,
  isModelFreeModule
} = useControlNet()

const {
  units,
  enabledCount,
  hasControlNet,
  updateUnit,
  resetUnit,
  toggleUnit,
  setUnitImage,
  clearUnitImage
} = useControlNetUnits(props.tabId)

// UI 상태
const isPreprocessing = ref([false, false, false])
const isDragging = ref([false, false, false])
const showAdvanced = ref([false, false, false])
const expandedUnit = ref(0) // 확장된 유닛 인덱스 (-1이면 모두 축소)

// 이미지 변환 상태 (확대/축소/이동)
const imageTransform = ref([
  { scale: 1, offsetX: 0, offsetY: 0 },
  { scale: 1, offsetX: 0, offsetY: 0 },
  { scale: 1, offsetX: 0, offsetY: 0 }
])
const isDraggingImage = ref([false, false, false])
const dragStart = ref([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }])

// 빠른 프리셋
const quickPresets = [
  { id: 'openpose', name: 'OpenPose', module: 'openpose', icon: '🧍' },
  { id: 'openpose_full', name: 'OpenPose Full', module: 'openpose_full', icon: '🕺' },
  { id: 'canny', name: 'Canny Edge', module: 'canny', icon: '✏️' },
  { id: 'depth', name: 'Depth', module: 'depth_anything_v2', icon: '🌊' },
  { id: 'lineart', name: 'Line Art', module: 'lineart', icon: '🖊️' },
  { id: 'tile', name: 'Tile', module: 'tile_resample', icon: '🔲' }
]

// 강도 프리셋 (모듈별 weight, guidanceEnd 값)
const intensityPresets = {
  openpose: {
    weak: { weight: 0.6, guidanceEnd: 0.7 },
    normal: { weight: 0.7, guidanceEnd: 0.8 },
    strong: { weight: 0.9, guidanceEnd: 1.0 }
  },
  depth: {
    weak: { weight: 0.5, guidanceEnd: 0.6, controlMode: CONTROLNET_CONTROL_MODES.MY_PROMPT },
    normal: { weight: 0.7, guidanceEnd: 0.8, controlMode: CONTROLNET_CONTROL_MODES.BALANCED },
    strong: { weight: 0.9, guidanceEnd: 1.0, controlMode: CONTROLNET_CONTROL_MODES.CONTROLNET }
  },
  canny: {
    weak: { weight: 0.4, guidanceEnd: 0.6 },
    normal: { weight: 0.6, guidanceEnd: 0.8 },
    strong: { weight: 0.8, guidanceEnd: 1.0 }
  },
  lineart: {
    weak: { weight: 0.4, guidanceEnd: 0.6 },
    normal: { weight: 0.6, guidanceEnd: 0.8 },
    strong: { weight: 0.8, guidanceEnd: 1.0 }
  },
  tile: {
    weak: { weight: 0.3, guidanceEnd: 0.5 },
    normal: { weight: 0.5, guidanceEnd: 0.7 },
    strong: { weight: 0.7, guidanceEnd: 0.9 }
  }
}

// 모듈 이름에서 프리셋 키 추출
function getPresetKeyFromModule(moduleName) {
  if (!moduleName || moduleName === 'none') return null
  const lower = moduleName.toLowerCase()
  if (lower.includes('openpose')) return 'openpose'
  if (lower.includes('depth')) return 'depth'
  if (lower.includes('canny')) return 'canny'
  if (lower.includes('lineart') || lower.includes('line_art')) return 'lineart'
  if (lower.includes('tile')) return 'tile'
  return null
}

// 현재 값이 어느 프리셋에 가까운지 판단
function getCurrentIntensity(unitIndex) {
  const unit = units.value[unitIndex]
  const presetKey = getPresetKeyFromModule(unit.module)

  if (!presetKey || !intensityPresets[presetKey]) return null

  const presets = intensityPresets[presetKey]
  let closestIntensity = null
  let minDistance = Infinity

  for (const [intensity, preset] of Object.entries(presets)) {
    // weight와 guidanceEnd의 차이를 계산
    const weightDiff = Math.abs(unit.weight - preset.weight)
    const guidanceEndDiff = Math.abs(unit.guidanceEnd - preset.guidanceEnd)
    const distance = weightDiff + guidanceEndDiff

    if (distance < minDistance) {
      minDistance = distance
      closestIntensity = intensity
    }
  }

  // 거리가 0.15 이내면 해당 프리셋으로 판단 (약간의 여유)
  return minDistance <= 0.15 ? closestIntensity : null
}

// 강도 적용
function applyIntensity(unitIndex, intensity) {
  const unit = units.value[unitIndex]
  const presetKey = getPresetKeyFromModule(unit.module)

  if (!presetKey || !intensityPresets[presetKey]) {
    props.showToast?.(t('controlnet.noIntensityPreset'), 'warning')
    return
  }

  const preset = intensityPresets[presetKey][intensity]
  if (!preset) return

  const updates = {
    weight: preset.weight,
    guidanceEnd: preset.guidanceEnd
  }

  // Depth의 경우 controlMode도 설정
  if (preset.controlMode !== undefined) {
    updates.controlMode = preset.controlMode
  }

  updateUnit(unitIndex, updates)

  const intensityLabels = { weak: t('controlnet.weak'), normal: t('controlnet.normal'), strong: t('controlnet.strong') }
  props.showToast?.(`${intensityLabels[intensity]} ${t('controlnet.intensityApplied')}`, 'success')
}

// Resize Mode 라벨
const resizeModeLabels = {
  [CONTROLNET_RESIZE_MODES.JUST_RESIZE]: 'Just Resize',
  [CONTROLNET_RESIZE_MODES.CROP_AND_RESIZE]: 'Crop and Resize',
  [CONTROLNET_RESIZE_MODES.RESIZE_AND_FILL]: 'Resize and Fill'
}

// Control Mode 라벨
const controlModeLabels = {
  [CONTROLNET_CONTROL_MODES.BALANCED]: 'Balanced',
  [CONTROLNET_CONTROL_MODES.MY_PROMPT]: 'My Prompt',
  [CONTROLNET_CONTROL_MODES.CONTROLNET]: 'ControlNet'
}

// 초기 로드
onMounted(async () => {
  try {
    await loadControlNetData()
  } catch (error) {
    props.showToast?.(t('controlnet.loadFailed'), 'error')
  }
})

// 이미지 업로드 핸들러
function handleFileUpload(event, unitIndex) {
  const file = event.target.files?.[0]
  if (!file) return
  loadImageFile(file, unitIndex)
  event.target.value = ''
}

function loadImageFile(file, unitIndex) {
  if (!file.type.startsWith('image/')) {
    props.showToast?.(t('controlnet.invalidFileType'), 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    setUnitImage(unitIndex, e.target.result)
    updateUnit(unitIndex, { enabled: true, transformedImage: null })
    // 새 이미지 로드 시 변환 상태 리셋
    resetTransform(unitIndex)
    expandedUnit.value = unitIndex
    props.showToast?.(t('controlnet.imageLoaded'), 'success')
  }
  reader.readAsDataURL(file)
}

// 드래그 앤 드롭
function handleDragEnter(e, unitIndex) {
  e.preventDefault()
  e.stopPropagation() // Prevent global drag handler
  isDragging.value[unitIndex] = true
}

function handleDragLeave(e, unitIndex) {
  e.preventDefault()
  e.stopPropagation() // Prevent global drag handler
  isDragging.value[unitIndex] = false
}

function handleDragOver(e) {
  e.preventDefault()
  e.stopPropagation() // Prevent global drag handler
}

function handleDrop(e, unitIndex) {
  e.preventDefault()
  e.stopPropagation() // Prevent global PNG info handler
  isDragging.value[unitIndex] = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    loadImageFile(files[0], unitIndex)
  }
}

// 클립보드 붙여넣기
function handlePaste(e, unitIndex) {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) {
        loadImageFile(file, unitIndex)
      }
      return
    }
  }
}

// 이미지 변환 함수들
function resetTransform(unitIndex) {
  imageTransform.value[unitIndex] = { scale: 1, offsetX: 0, offsetY: 0 }
}

function updateScale(unitIndex, scale) {
  imageTransform.value[unitIndex].scale = Math.max(0.5, Math.min(3, scale))
}

function startImageDrag(e, unitIndex) {
  if (e.button !== 0) return // 좌클릭만
  isDraggingImage.value[unitIndex] = true
  dragStart.value[unitIndex] = {
    x: e.clientX - imageTransform.value[unitIndex].offsetX,
    y: e.clientY - imageTransform.value[unitIndex].offsetY
  }
  e.preventDefault()
}

function onImageDrag(e, unitIndex) {
  if (!isDraggingImage.value[unitIndex]) return
  imageTransform.value[unitIndex].offsetX = e.clientX - dragStart.value[unitIndex].x
  imageTransform.value[unitIndex].offsetY = e.clientY - dragStart.value[unitIndex].y
}

function stopImageDrag(unitIndex) {
  isDraggingImage.value[unitIndex] = false
}

// 디바운스된 변환 이미지 저장 함수
let transformSaveTimeout = null
async function saveTransformedImages() {
  for (let i = 0; i < units.value.length; i++) {
    const unit = units.value[i]
    const transform = imageTransform.value[i]

    // 이미지가 있고 변환이 적용된 경우에만 저장
    if (unit.image && (transform.scale !== 1 || transform.offsetX !== 0 || transform.offsetY !== 0)) {
      const transformed = await getTransformedImage(i)
      updateUnit(i, { transformedImage: transformed })
    } else if (unit.image) {
      // 변환이 없으면 transformedImage를 null로 설정 (원본 사용)
      updateUnit(i, { transformedImage: null })
    }
  }
}

// 변환 변경 시 자동으로 transformedImage 저장 (디바운스)
watch(imageTransform, () => {
  if (transformSaveTimeout) {
    clearTimeout(transformSaveTimeout)
  }
  transformSaveTimeout = setTimeout(saveTransformedImages, 300)
}, { deep: true })

// 변환된 이미지를 canvas로 생성
function getTransformedImage(unitIndex) {
  return new Promise((resolve) => {
    const unit = units.value[unitIndex]
    const transform = imageTransform.value[unitIndex]

    // 변환이 없으면 원본 반환
    if (transform.scale === 1 && transform.offsetX === 0 && transform.offsetY === 0) {
      resolve(unit.image)
      return
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      // 미리보기 영역 크기 (CSS에서 약 200px)
      const previewSize = 200
      // 원본 이미지와 미리보기의 비율 계산
      const ratio = Math.max(img.width, img.height) / previewSize

      // 캔버스 중앙 기준으로 변환 적용
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      // 오프셋에 비율 적용
      ctx.translate(
        canvas.width / 2 + transform.offsetX * ratio,
        canvas.height / 2 + transform.offsetY * ratio
      )
      ctx.scale(transform.scale, transform.scale)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()

      resolve(canvas.toDataURL('image/png'))
    }
    img.src = unit.image
  })
}

// 프리프로세서 미리보기
async function runPreprocess(unitIndex) {
  const unit = units.value[unitIndex]
  if (!unit.image || unit.module === 'none') {
    props.showToast?.(t('controlnet.selectModuleFirst'), 'warning')
    return
  }

  isPreprocessing.value[unitIndex] = true
  try {
    // 변환된 이미지 사용
    const transformedImage = await getTransformedImage(unitIndex)
    const imageData = transformedImage.includes(',')
      ? transformedImage.split(',')[1]
      : transformedImage

    const result = await detectPreprocess(
      unit.module,
      imageData,
      unit.processorRes,
      unit.thresholdA,
      unit.thresholdB
    )

    if (result) {
      updateUnit(unitIndex, {
        preprocessedImage: `data:image/png;base64,${result}`
      })
      props.showToast?.(t('controlnet.preprocessDone'), 'success')
    }
  } catch (error) {
    props.showToast?.(t('controlnet.preprocessFailed'), 'error')
  } finally {
    isPreprocessing.value[unitIndex] = false
  }
}

// 모듈 변경 시 슬라이더 기본값 설정
function handleModuleChange(unitIndex, moduleName) {
  const sliders = getModuleSliders(moduleName)
  const updates = { module: moduleName }

  // 프리프로세서가 none이면 모델도 None으로
  if (moduleName === 'none') {
    updates.model = 'None'
  }

  sliders.forEach((slider, idx) => {
    if (slider.name === 'Resolution' || slider.name.includes('Resolution')) {
      updates.processorRes = slider.value
    } else if (idx === 1) {
      updates.thresholdA = slider.value
    } else if (idx === 2) {
      updates.thresholdB = slider.value
    }
  })

  updateUnit(unitIndex, updates)
}

// 프리셋 적용
function applyPreset(preset, unitIndex) {
  handleModuleChange(unitIndex, preset.module)

  // 해당 모듈에 맞는 모델 자동 선택
  const matchingModel = models.value.find(m =>
    m.toLowerCase().includes(preset.id.split('_')[0])
  )
  if (matchingModel) {
    updateUnit(unitIndex, { model: matchingModel })
    props.showToast?.(`${preset.name} ${t('controlnet.presetApplied')}`, 'success')
  } else {
    // 모델이 없으면 None으로 설정하고 경고 표시
    updateUnit(unitIndex, { model: 'None' })
    props.showToast?.(t('controlnet.modelNotFound', { preset: preset.name }), 'warning')
  }
}

// 모델 자동 매칭
function findMatchingModel(moduleName) {
  if (!moduleName || moduleName === 'none') return null

  const modulePrefix = moduleName.split('_')[0].toLowerCase()
  return models.value.find(m => m.toLowerCase().includes(modulePrefix))
}

// 유닛 리셋 (변환 상태도 함께 리셋)
function handleResetUnit(index) {
  resetUnit(index)
  resetTransform(index)
}

// 유닛 상태 요약
function getUnitSummary(unit, index) {
  if (!unit.enabled) return t('controlnet.disabled')
  if (!unit.image) return t('controlnet.noImage')
  return unit.module !== 'none' ? unit.module : t('controlnet.selectPreprocessor')
}

// 닫기
function close() {
  emit('close')
}
</script>

<template>
  <div class="controlnet-manager-panel">
    <!-- 헤더 -->
    <div class="panel-header">
      <h3>
        🎛️ ControlNet
        <span v-if="enabledCount > 0" class="enabled-badge">{{ enabledCount }} {{ t('controlnet.enabled') }}</span>
      </h3>
      <div class="header-actions">
        <span v-if="isLoading" class="loading-indicator">{{ t('common.loading') }}...</span>
        <button class="close-btn" @click="close">✕</button>
      </div>
    </div>

    <!-- 빠른 프리셋 -->
    <div class="quick-presets">
      <span class="presets-label">{{ t('controlnet.quickPresets') }}:</span>
      <div class="preset-buttons">
        <button
          v-for="preset in quickPresets"
          :key="preset.id"
          class="preset-btn"
          @click="applyPreset(preset, expandedUnit >= 0 ? expandedUnit : 0)"
          :disabled="isGenerating"
          :title="preset.name"
        >
          <span class="preset-icon">{{ preset.icon }}</span>
          <span class="preset-name">{{ preset.name }}</span>
        </button>
      </div>
    </div>

    <!-- 유닛 카드들 -->
    <div class="units-container">
      <div
        v-for="(unit, index) in units"
        :key="index"
        class="unit-card"
        :class="{
          expanded: expandedUnit === index,
          enabled: unit.enabled && unit.image,
          collapsed: expandedUnit !== index
        }"
      >
        <!-- 유닛 헤더 -->
        <div class="unit-header" @click="expandedUnit = expandedUnit === index ? -1 : index">
          <div class="unit-title">
            <span class="unit-number">Unit {{ index }}</span>
            <span v-if="unit.enabled && unit.image" class="unit-status active">●</span>
            <span v-else class="unit-status">○</span>
            <span class="unit-summary">{{ getUnitSummary(unit, index) }}</span>
          </div>
          <div class="unit-actions">
            <label class="enable-toggle" @click.stop>
              <input
                type="checkbox"
                :checked="unit.enabled"
                @change="toggleUnit(index)"
                :disabled="isGenerating"
              />
              <span>{{ t('controlnet.enable') }}</span>
            </label>
            <button
              class="reset-btn"
              @click.stop="handleResetUnit(index)"
              :disabled="isGenerating"
              :title="t('controlnet.reset')"
            >
              🔄
            </button>
            <span class="expand-icon">{{ expandedUnit === index ? '▼' : '▶' }}</span>
          </div>
        </div>

        <!-- 유닛 내용 (확장 시) -->
        <div v-if="expandedUnit === index" class="unit-content">
          <div class="content-layout">
            <!-- 왼쪽: 이미지 업로드 -->
            <div class="image-section">
              <div
                class="image-upload"
                :class="{ dragging: isDragging[index], 'has-image': unit.image }"
                @dragenter="handleDragEnter($event, index)"
                @dragleave="handleDragLeave($event, index)"
                @dragover="handleDragOver"
                @drop="handleDrop($event, index)"
                @paste="handlePaste($event, index)"
                tabindex="0"
              >
                <template v-if="unit.image">
                  <div
                    class="image-transform-container"
                    @mousedown="startImageDrag($event, index)"
                    @mousemove="onImageDrag($event, index)"
                    @mouseup="stopImageDrag(index)"
                    @mouseleave="stopImageDrag(index)"
                  >
                    <img
                      :src="unit.image"
                      alt="Control image"
                      class="preview-img transformable"
                      :style="{
                        transform: `translate(${imageTransform[index].offsetX}px, ${imageTransform[index].offsetY}px) scale(${imageTransform[index].scale})`,
                        cursor: isDraggingImage[index] ? 'grabbing' : 'grab'
                      }"
                      draggable="false"
                    />
                  </div>
                  <button
                    class="clear-btn"
                    @click="clearUnitImage(index)"
                    :disabled="isGenerating"
                  >
                    ✕
                  </button>
                </template>
                <template v-else>
                  <div class="upload-placeholder">
                    <span class="upload-icon">📷</span>
                    <span class="upload-text">{{ t('controlnet.dropImage') }}</span>
                    <label class="upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        @change="handleFileUpload($event, index)"
                        hidden
                      />
                      {{ t('controlnet.selectFile') }}
                    </label>
                  </div>
                </template>
              </div>

              <!-- 이미지 변환 컨트롤 (확대/축소) -->
              <div v-if="unit.image" class="transform-controls">
                <div class="transform-slider">
                  <span class="transform-label">🔍</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    :value="imageTransform[index].scale"
                    @input="updateScale(index, Number($event.target.value))"
                    class="scale-slider"
                  />
                  <span class="transform-value">{{ (imageTransform[index].scale * 100).toFixed(0) }}%</span>
                </div>
                <button
                  v-if="imageTransform[index].scale !== 1 || imageTransform[index].offsetX !== 0 || imageTransform[index].offsetY !== 0"
                  class="reset-transform-btn"
                  @click="resetTransform(index)"
                  :title="t('controlnet.resetTransform')"
                >
                  ↺
                </button>
              </div>

              <!-- 프리프로세서 미리보기 -->
              <div v-if="unit.preprocessedImage" class="preprocessed-section">
                <div class="preprocessed-header">
                  <span>{{ t('controlnet.preprocessResult') }}</span>
                  <button
                    class="use-btn"
                    @click="setUnitImage(index, unit.preprocessedImage)"
                    :disabled="isGenerating"
                  >
                    {{ t('controlnet.useAsInput') }}
                  </button>
                </div>
                <img :src="unit.preprocessedImage" alt="Preprocessed" class="preprocessed-img" />
              </div>
            </div>

            <!-- 오른쪽: 설정 -->
            <div class="settings-section">
              <!-- 프리프로세서 -->
              <div class="form-group">
                <label>{{ t('controlnet.preprocessor') }}</label>
                <div class="select-with-btn">
                  <select
                    :value="unit.module"
                    @change="handleModuleChange(index, $event.target.value)"
                    :disabled="isGenerating"
                  >
                    <option value="none">none</option>
                    <optgroup v-for="(mods, category) in groupedModules" :key="category" :label="category">
                      <option v-for="mod in mods" :key="mod" :value="mod">
                        {{ mod }}
                      </option>
                    </optgroup>
                  </select>
                  <button
                    class="preprocess-btn"
                    @click="runPreprocess(index)"
                    :disabled="isGenerating || isPreprocessing[index] || !unit.image || unit.module === 'none'"
                    :title="t('controlnet.runPreprocess')"
                  >
                    {{ isPreprocessing[index] ? '...' : '💡' }}
                  </button>
                </div>
              </div>

              <!-- 모델 -->
              <div class="form-group">
                <label>{{ t('controlnet.model') }}</label>
                <select
                  :value="unit.model"
                  @change="updateUnit(index, { model: $event.target.value })"
                  :disabled="isGenerating || isModelFreeModule(unit.module)"
                >
                  <option value="None">None</option>
                  <option v-for="model in models" :key="model" :value="model">
                    {{ model }}
                  </option>
                </select>
              </div>

              <!-- Weight -->
              <div class="form-group slider-group">
                <label>{{ t('controlnet.weight') }}</label>
                <div class="slider-row">
                  <input
                    type="range"
                    :min="CONTROLNET_PARAM_RANGES.weight.min"
                    :max="CONTROLNET_PARAM_RANGES.weight.max"
                    :step="CONTROLNET_PARAM_RANGES.weight.step"
                    :value="unit.weight"
                    @input="updateUnit(index, { weight: Number($event.target.value) })"
                    :disabled="isGenerating"
                  />
                  <span class="slider-value">{{ unit.weight.toFixed(2) }}</span>
                </div>
              </div>

              <!-- 강도 프리셋 버튼 -->
              <div v-if="getPresetKeyFromModule(unit.module)" class="intensity-section">
                <div class="intensity-desc">{{ t(`controlnet.moduleDesc.${getPresetKeyFromModule(unit.module)}`) }}</div>
                <div class="intensity-buttons">
                  <button
                    class="intensity-btn weak"
                    :class="{ active: getCurrentIntensity(index) === 'weak' }"
                    @click="applyIntensity(index, 'weak')"
                    :disabled="isGenerating"
                  >
                    {{ t('controlnet.weak') }}
                  </button>
                  <button
                    class="intensity-btn normal"
                    :class="{ active: getCurrentIntensity(index) === 'normal' }"
                    @click="applyIntensity(index, 'normal')"
                    :disabled="isGenerating"
                  >
                    {{ t('controlnet.normal') }}
                  </button>
                  <button
                    class="intensity-btn strong"
                    :class="{ active: getCurrentIntensity(index) === 'strong' }"
                    @click="applyIntensity(index, 'strong')"
                    :disabled="isGenerating"
                  >
                    {{ t('controlnet.strong') }}
                  </button>
                </div>
                <div class="intensity-hint">{{ t('controlnet.intensityHint') }}</div>
              </div>

              <!-- Prompt (선택) -->
              <div class="form-group">
                <label>{{ t('controlnet.prompt') }} <span class="optional-hint">({{ t('controlnet.promptHint') }})</span></label>
                <textarea
                  :value="unit.prompt"
                  @input="updateUnit(index, { prompt: $event.target.value })"
                  :placeholder="t('controlnet.promptPlaceholder')"
                  :disabled="isGenerating"
                  class="prompt-textarea"
                  rows="2"
                ></textarea>
              </div>

              <!-- 고급 설정 토글 -->
              <button
                class="advanced-toggle"
                @click="showAdvanced[index] = !showAdvanced[index]"
              >
                {{ showAdvanced[index] ? '▼' : '▶' }} {{ t('controlnet.advancedSettings') }}
              </button>

              <!-- 고급 설정 -->
              <div v-if="showAdvanced[index]" class="advanced-settings">
                <!-- 동적 슬라이더 -->
                <template v-if="unit.module !== 'none'">
                  <div
                    v-for="(slider, idx) in getModuleSliders(unit.module)"
                    :key="slider.name"
                    class="form-group slider-group"
                  >
                    <label>{{ slider.name }}</label>
                    <div class="slider-row">
                      <input
                        type="range"
                        :min="slider.min"
                        :max="slider.max"
                        :step="slider.step"
                        :value="idx === 0 ? unit.processorRes : (idx === 1 ? unit.thresholdA : unit.thresholdB)"
                        @input="updateUnit(index, {
                          [idx === 0 ? 'processorRes' : (idx === 1 ? 'thresholdA' : 'thresholdB')]: Number($event.target.value)
                        })"
                        :disabled="isGenerating"
                      />
                      <span class="slider-value">
                        {{ idx === 0 ? unit.processorRes : (idx === 1 ? unit.thresholdA : unit.thresholdB) }}
                      </span>
                    </div>
                  </div>
                </template>

                <!-- Guidance -->
                <div class="form-group slider-group">
                  <label>{{ t('controlnet.guidance') }} Start</label>
                  <div class="slider-row">
                    <input
                      type="range"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      :value="unit.guidanceStart"
                      @input="updateUnit(index, { guidanceStart: Number($event.target.value) })"
                      :disabled="isGenerating"
                    />
                    <span class="slider-value">{{ unit.guidanceStart.toFixed(2) }}</span>
                  </div>
                </div>

                <div class="form-group slider-group">
                  <label>{{ t('controlnet.guidance') }} End</label>
                  <div class="slider-row">
                    <input
                      type="range"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      :value="unit.guidanceEnd"
                      @input="updateUnit(index, { guidanceEnd: Number($event.target.value) })"
                      :disabled="isGenerating"
                    />
                    <span class="slider-value">{{ unit.guidanceEnd.toFixed(2) }}</span>
                  </div>
                </div>

                <!-- Control Mode -->
                <div class="form-group">
                  <label>{{ t('controlnet.controlMode') }}</label>
                  <select
                    :value="unit.controlMode"
                    @change="updateUnit(index, { controlMode: Number($event.target.value) })"
                    :disabled="isGenerating"
                  >
                    <option
                      v-for="(label, mode) in controlModeLabels"
                      :key="mode"
                      :value="mode"
                    >
                      {{ label }}
                    </option>
                  </select>
                </div>

                <!-- Resize Mode -->
                <div class="form-group">
                  <label>{{ t('controlnet.resizeMode') }}</label>
                  <select
                    :value="unit.resizeMode"
                    @change="updateUnit(index, { resizeMode: Number($event.target.value) })"
                    :disabled="isGenerating"
                  >
                    <option
                      v-for="(label, mode) in resizeModeLabels"
                      :key="mode"
                      :value="mode"
                    >
                      {{ label }}
                    </option>
                  </select>
                </div>

                <!-- Pixel Perfect -->
                <div class="form-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="unit.pixelPerfect"
                      @change="updateUnit(index, { pixelPerfect: $event.target.checked })"
                      :disabled="isGenerating"
                    />
                    <span>Pixel Perfect</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 요약 -->
    <div class="panel-footer">
      <div class="summary">
        <span v-if="enabledCount === 0">{{ t('controlnet.noUnitsEnabled') }}</span>
        <span v-else>{{ enabledCount }} {{ t('controlnet.unitsEnabled') }}</span>
      </div>
      <button class="done-btn" @click="close">
        {{ t('common.done') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.controlnet-manager-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.enabled-badge {
  background: #667eea;
  color: white;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-indicator {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.close-btn {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* Quick Presets */
.quick-presets {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-primary);
  overflow-x: auto;
}

.presets-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.preset-buttons {
  display: flex;
  gap: 6px;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-primary);
  transition: all 0.2s;
  white-space: nowrap;
}

.preset-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-icon {
  font-size: 14px;
}

.preset-name {
  font-weight: 500;
}

/* Units Container */
.units-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Unit Card */
.unit-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.unit-card.enabled {
  border-color: #667eea;
}

.unit-card.expanded {
  flex-shrink: 0;
}

.unit-card.collapsed {
  flex-shrink: 0;
}

/* Unit Header */
.unit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  background: var(--color-bg-tertiary);
  transition: background 0.2s;
}

.unit-header:hover {
  background: var(--color-bg-hover);
}

.unit-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit-number {
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text-primary);
}

.unit-status {
  font-size: 10px;
  color: var(--color-text-secondary);
}

.unit-status.active {
  color: #667eea;
}

.unit-summary {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.unit-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.enable-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.enable-toggle input {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.reset-btn {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.reset-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.expand-icon {
  font-size: 10px;
  color: var(--color-text-secondary);
}

/* Unit Content */
.unit-content {
  padding: 14px;
  border-top: 1px solid var(--color-border-primary);
}

.content-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

/* Image Section */
.image-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-upload {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border: 2px dashed var(--color-border-primary);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  background: var(--color-bg-secondary);
}

.image-upload.dragging {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.image-upload.has-image {
  border-style: solid;
}

.image-upload:focus {
  outline: none;
  border-color: #667eea;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.clear-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-btn:hover:not(:disabled) {
  background: rgba(220, 53, 69, 0.9);
  transform: scale(1.1);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
  padding: 20px;
}

.upload-icon {
  font-size: 40px;
  opacity: 0.5;
}

.upload-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
}

.upload-btn {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Preprocessed Section */
.preprocessed-section {
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  padding: 10px;
}

.preprocessed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preprocessed-header span {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.use-btn {
  padding: 4px 10px;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
}

.use-btn:hover:not(:disabled) {
  background: var(--color-success-dark);
}

.preprocessed-img {
  width: 100%;
  border-radius: 4px;
}

/* Image Transform */
.image-transform-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-img.transformable {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: none;
  user-select: none;
}

.transform-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
}

.transform-slider {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.transform-label {
  font-size: 14px;
}

.scale-slider {
  flex: 1;
  height: 4px;
  cursor: pointer;
}

.transform-value {
  font-size: 11px;
  color: var(--color-text-secondary);
  min-width: 40px;
  text-align: right;
}

.reset-transform-btn {
  padding: 4px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.reset-transform-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* Settings Section */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-group select,
.form-group textarea {
  padding: 8px 10px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-text-primary);
}

.form-group select {
  cursor: pointer;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.prompt-textarea {
  width: 100%;
  resize: vertical;
  min-height: 50px;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.4;
}

.prompt-textarea::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.optional-hint {
  font-weight: 400;
  font-size: 11px;
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.select-with-btn {
  display: flex;
  gap: 6px;
}

.select-with-btn select {
  flex: 1;
}

.preprocess-btn {
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.preprocess-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.preprocess-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Slider Group */
.slider-group .slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-group input[type="range"] {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #9ca3af;
  border-radius: 3px;
  cursor: pointer;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-group input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-value {
  min-width: 45px;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: right;
  font-family: monospace;
}

/* Advanced Toggle */
.advanced-toggle {
  padding: 8px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: left;
  transition: color 0.2s;
}

.advanced-toggle:hover {
  color: var(--color-text-primary);
}

/* Advanced Settings */
.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Intensity Section */
.intensity-section {
  margin-top: 8px;
  margin-bottom: 8px;
  padding: 10px;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  border: 1px solid var(--color-border-primary);
}

.intensity-desc {
  font-size: 12px;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  font-weight: 500;
}

.intensity-buttons {
  display: flex;
  gap: 6px;
}

.intensity-hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 8px;
  white-space: normal;
  word-break: keep-all;
}

.intensity-btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.intensity-btn:hover:not(:disabled) {
  border-color: #667eea;
}

.intensity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.intensity-btn.weak {
  border-color: #60a5fa;
}

.intensity-btn.weak.active,
.intensity-btn.weak:hover:not(:disabled) {
  background: #60a5fa;
  color: white;
  border-color: #60a5fa;
}

.intensity-btn.normal {
  border-color: #34d399;
}

.intensity-btn.normal.active,
.intensity-btn.normal:hover:not(:disabled) {
  background: #34d399;
  color: white;
  border-color: #34d399;
}

.intensity-btn.strong {
  border-color: #f97316;
}

.intensity-btn.strong.active,
.intensity-btn.strong:hover:not(:disabled) {
  background: #f97316;
  color: white;
  border-color: #f97316;
}

/* Footer */
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-primary);
}

.summary {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.done-btn {
  padding: 8px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.done-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .image-upload {
    max-width: 300px;
    margin: 0 auto;
  }

  .quick-presets {
    flex-wrap: wrap;
  }
}
</style>
