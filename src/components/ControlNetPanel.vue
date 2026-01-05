<script setup>
/**
 * ControlNetPanel.vue - ControlNet 설정 패널
 * 최대 3개의 ControlNet 유닛을 관리
 */
import { ref, computed, watch, onMounted } from 'vue'
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

const emit = defineEmits(['update:units'])

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
const activeUnitIndex = ref(0)
const isPreprocessing = ref(false)
const isDragging = ref([false, false, false])

// 현재 활성 유닛
const activeUnit = computed(() => units.value[activeUnitIndex.value])

// 유닛 변경 시 부모에게 알림
watch(units, (newUnits) => {
  emit('update:units', newUnits)
}, { deep: true })

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
    // 이미지 업로드 시 자동으로 활성화
    updateUnit(unitIndex, { enabled: true })
    props.showToast?.(t('controlnet.imageLoaded'), 'success')
  }
  reader.readAsDataURL(file)
}

// 드래그 앤 드롭
function handleDragEnter(e, unitIndex) {
  e.preventDefault()
  isDragging.value[unitIndex] = true
}

function handleDragLeave(e, unitIndex) {
  e.preventDefault()
  isDragging.value[unitIndex] = false
}

function handleDragOver(e) {
  e.preventDefault()
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

// 프리프로세서 미리보기
async function runPreprocess(unitIndex) {
  const unit = units.value[unitIndex]
  if (!unit.image || unit.module === 'none') {
    props.showToast?.(t('controlnet.selectModuleFirst'), 'warning')
    return
  }

  isPreprocessing.value = true
  try {
    // Base64 데이터에서 prefix 제거
    const imageData = unit.image.includes(',')
      ? unit.image.split(',')[1]
      : unit.image

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
    isPreprocessing.value = false
  }
}

// 모듈 변경 시 슬라이더 기본값 설정
function handleModuleChange(unitIndex, moduleName) {
  const sliders = getModuleSliders(moduleName)
  const updates = { module: moduleName }

  // 슬라이더 기본값 적용
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

// 유닛 탭 라벨
function getUnitLabel(index) {
  const unit = units.value[index]
  if (unit.enabled && unit.image) {
    return `Unit ${index} ✓`
  }
  return `Unit ${index}`
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
</script>

<template>
  <div class="controlnet-panel">
    <!-- 헤더 -->
    <div class="cn-header">
      <h4 class="cn-title">
        🎛️ ControlNet
        <span v-if="enabledCount > 0" class="cn-badge">{{ enabledCount }}</span>
      </h4>
      <span v-if="isLoading" class="cn-loading">Loading...</span>
    </div>

    <!-- 유닛 탭 -->
    <div class="cn-tabs">
      <button
        v-for="(unit, index) in units"
        :key="index"
        class="cn-tab"
        :class="{
          active: activeUnitIndex === index,
          enabled: unit.enabled && unit.image
        }"
        @click="activeUnitIndex = index"
      >
        {{ getUnitLabel(index) }}
      </button>
    </div>

    <!-- 활성 유닛 내용 -->
    <div class="cn-unit-content">
      <!-- Enable 토글 -->
      <div class="cn-row">
        <label class="cn-checkbox">
          <input
            type="checkbox"
            :checked="activeUnit.enabled"
            @change="toggleUnit(activeUnitIndex)"
            :disabled="isGenerating"
          />
          <span>{{ t('controlnet.enable') }}</span>
        </label>
        <button
          class="cn-reset-btn"
          @click="resetUnit(activeUnitIndex)"
          :disabled="isGenerating"
          :title="t('controlnet.reset')"
        >
          🔄
        </button>
      </div>

      <!-- 이미지 업로드 영역 -->
      <div
        class="cn-image-upload"
        :class="{ dragging: isDragging[activeUnitIndex], 'has-image': activeUnit.image }"
        @dragenter="handleDragEnter($event, activeUnitIndex)"
        @dragleave="handleDragLeave($event, activeUnitIndex)"
        @dragover="handleDragOver"
        @drop="handleDrop($event, activeUnitIndex)"
        @paste="handlePaste($event, activeUnitIndex)"
        tabindex="0"
      >
        <template v-if="activeUnit.image">
          <img :src="activeUnit.image" alt="Control image" class="cn-preview-img" />
          <button
            class="cn-clear-btn"
            @click="clearUnitImage(activeUnitIndex)"
            :disabled="isGenerating"
          >
            ✕
          </button>
        </template>
        <template v-else>
          <div class="cn-upload-placeholder">
            <span class="cn-upload-icon">📷</span>
            <span class="cn-upload-text">{{ t('controlnet.dropImage') }}</span>
            <label class="cn-upload-btn">
              <input
                type="file"
                accept="image/*"
                @change="handleFileUpload($event, activeUnitIndex)"
                hidden
              />
              {{ t('controlnet.selectFile') }}
            </label>
          </div>
        </template>
      </div>

      <!-- 프리프로세서 미리보기 (있을 경우) -->
      <div v-if="activeUnit.preprocessedImage" class="cn-preprocessed">
        <div class="cn-preprocessed-header">
          <span>{{ t('controlnet.preprocessResult') }}</span>
          <button
            class="cn-use-btn"
            @click="setUnitImage(activeUnitIndex, activeUnit.preprocessedImage)"
            :disabled="isGenerating"
          >
            {{ t('controlnet.useAsInput') }}
          </button>
        </div>
        <img :src="activeUnit.preprocessedImage" alt="Preprocessed" class="cn-preprocessed-img" />
      </div>

      <!-- 모델 선택 -->
      <div class="cn-form-group">
        <label>{{ t('controlnet.model') }}</label>
        <select
          :value="activeUnit.model"
          @change="updateUnit(activeUnitIndex, { model: $event.target.value })"
          :disabled="isGenerating || isModelFreeModule(activeUnit.module)"
        >
          <option value="None">None</option>
          <option v-for="model in models" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>

      <!-- 프리프로세서 선택 -->
      <div class="cn-form-group">
        <label>{{ t('controlnet.preprocessor') }}</label>
        <select
          :value="activeUnit.module"
          @change="handleModuleChange(activeUnitIndex, $event.target.value)"
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
          class="cn-preprocess-btn"
          @click="runPreprocess(activeUnitIndex)"
          :disabled="isGenerating || isPreprocessing || !activeUnit.image || activeUnit.module === 'none'"
        >
          {{ isPreprocessing ? '...' : '💡' }}
        </button>
      </div>

      <!-- 동적 슬라이더 (프리프로세서별) -->
      <template v-if="activeUnit.module !== 'none'">
        <div
          v-for="(slider, idx) in getModuleSliders(activeUnit.module)"
          :key="slider.name"
          class="cn-form-group"
        >
          <label>{{ slider.name }}</label>
          <input
            type="range"
            :min="slider.min"
            :max="slider.max"
            :step="slider.step"
            :value="idx === 0 ? activeUnit.processorRes : (idx === 1 ? activeUnit.thresholdA : activeUnit.thresholdB)"
            @input="updateUnit(activeUnitIndex, {
              [idx === 0 ? 'processorRes' : (idx === 1 ? 'thresholdA' : 'thresholdB')]: Number($event.target.value)
            })"
            :disabled="isGenerating"
          />
          <span class="cn-value">
            {{ idx === 0 ? activeUnit.processorRes : (idx === 1 ? activeUnit.thresholdA : activeUnit.thresholdB) }}
          </span>
        </div>
      </template>

      <!-- Weight -->
      <div class="cn-form-group">
        <label>{{ t('controlnet.weight') }}</label>
        <input
          type="range"
          :min="CONTROLNET_PARAM_RANGES.weight.min"
          :max="CONTROLNET_PARAM_RANGES.weight.max"
          :step="CONTROLNET_PARAM_RANGES.weight.step"
          :value="activeUnit.weight"
          @input="updateUnit(activeUnitIndex, { weight: Number($event.target.value) })"
          :disabled="isGenerating"
        />
        <span class="cn-value">{{ activeUnit.weight.toFixed(2) }}</span>
      </div>

      <!-- Guidance Start/End -->
      <div class="cn-form-group cn-guidance">
        <label>{{ t('controlnet.guidance') }}</label>
        <div class="cn-dual-slider">
          <div class="cn-slider-item">
            <span>Start</span>
            <input
              type="range"
              :min="0"
              :max="1"
              :step="0.01"
              :value="activeUnit.guidanceStart"
              @input="updateUnit(activeUnitIndex, { guidanceStart: Number($event.target.value) })"
              :disabled="isGenerating"
            />
            <span class="cn-value">{{ activeUnit.guidanceStart.toFixed(2) }}</span>
          </div>
          <div class="cn-slider-item">
            <span>End</span>
            <input
              type="range"
              :min="0"
              :max="1"
              :step="0.01"
              :value="activeUnit.guidanceEnd"
              @input="updateUnit(activeUnitIndex, { guidanceEnd: Number($event.target.value) })"
              :disabled="isGenerating"
            />
            <span class="cn-value">{{ activeUnit.guidanceEnd.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Control Mode -->
      <div class="cn-form-group">
        <label>{{ t('controlnet.controlMode') }}</label>
        <select
          :value="activeUnit.controlMode"
          @change="updateUnit(activeUnitIndex, { controlMode: Number($event.target.value) })"
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
      <div class="cn-form-group">
        <label>{{ t('controlnet.resizeMode') }}</label>
        <select
          :value="activeUnit.resizeMode"
          @change="updateUnit(activeUnitIndex, { resizeMode: Number($event.target.value) })"
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
      <div class="cn-row">
        <label class="cn-checkbox">
          <input
            type="checkbox"
            :checked="activeUnit.pixelPerfect"
            @change="updateUnit(activeUnitIndex, { pixelPerfect: $event.target.checked })"
            :disabled="isGenerating"
          />
          <span>Pixel Perfect</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controlnet-panel {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  border: 1px solid var(--color-border-primary);
}

.cn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cn-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.cn-badge {
  background: #667eea;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.cn-loading {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Tabs */
.cn-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--color-border-primary);
  padding-bottom: 8px;
}

.cn-tab {
  padding: 6px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.cn-tab:hover {
  background: var(--color-bg-hover);
}

.cn-tab.active {
  background: var(--color-bg-elevated);
  border-bottom-color: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.cn-tab.enabled {
  color: #667eea;
  border-color: #667eea;
}

/* Unit content */
.cn-unit-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cn-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cn-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.cn-checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.cn-reset-btn {
  padding: 4px 8px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.cn-reset-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

/* Image upload */
.cn-image-upload {
  position: relative;
  min-height: 120px;
  border: 2px dashed var(--color-border-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  transition: all 0.2s;
  overflow: hidden;
}

.cn-image-upload:focus {
  outline: none;
  border-color: #667eea;
}

.cn-image-upload.dragging {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.cn-image-upload.has-image {
  border-style: solid;
}

.cn-preview-img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
  border-radius: 4px;
}

.cn-clear-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cn-clear-btn:hover {
  background: rgba(239, 68, 68, 0.8);
}

.cn-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.cn-upload-icon {
  font-size: 24px;
}

.cn-upload-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.cn-upload-btn {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.cn-upload-btn:hover {
  background: #5a6fd6;
}

/* Preprocessed image */
.cn-preprocessed {
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  padding: 8px;
}

.cn-preprocessed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.cn-use-btn {
  padding: 4px 8px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.cn-use-btn:hover:not(:disabled) {
  background: #059669;
}

.cn-preprocessed-img {
  max-width: 100%;
  max-height: 100px;
  object-fit: contain;
  border-radius: 4px;
}

/* Form groups */
.cn-form-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cn-form-group label {
  flex: 0 0 80px;
  font-size: 12px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.cn-form-group select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  font-size: 12px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.cn-form-group input[type="range"] {
  flex: 1;
  height: 6px;
  cursor: pointer;
}

.cn-value {
  flex: 0 0 40px;
  font-size: 11px;
  color: var(--color-text-secondary);
  text-align: right;
  font-family: monospace;
}

.cn-preprocess-btn {
  padding: 6px 10px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.cn-preprocess-btn:hover:not(:disabled) {
  background: #d97706;
}

.cn-preprocess-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dual slider (guidance) */
.cn-guidance {
  flex-direction: column;
  align-items: stretch;
}

.cn-guidance > label {
  flex: none;
  margin-bottom: 6px;
}

.cn-dual-slider {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cn-slider-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cn-slider-item span:first-child {
  flex: 0 0 36px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.cn-slider-item input {
  flex: 1;
}

/* Disabled state */
.cn-form-group select:disabled,
.cn-form-group input:disabled,
.cn-checkbox input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
