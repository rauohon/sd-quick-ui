<template>
  <div class="last-params-section" :class="{ collapsed: !sectionExpanded }" v-if="lastParams">
    <div class="params-section-title" @click="sectionExpanded = !sectionExpanded">
      <span class="fold-icon">{{ sectionExpanded ? '▼' : '▶' }}</span>
      마지막 생성 설정
    </div>

    <div v-if="sectionExpanded" class="params-section-content">
      <!-- 기본 파라미터 -->
      <div class="params-group">
        <div class="params-group-label" @click="basicExpanded = !basicExpanded">
          <span class="fold-icon">{{ basicExpanded ? '▼' : '▶' }}</span>
          기본
        </div>
        <div v-if="basicExpanded">
          <div class="param-row-full" v-if="lastParams.sd_model_name">
            <span class="param-label">Checkpoint:</span>
            <span class="param-value">{{ lastParams.sd_model_name }}</span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Seed:</span>
            <span class="param-value">
              <template v-if="lastParams.seed === -1">
                {{ lastParams.actual_seed }} <span style="color: #999; font-size: 0.9em;">(랜덤)</span>
              </template>
              <template v-else-if="lastParams.actual_seed && lastParams.actual_seed !== lastParams.seed">
                {{ lastParams.actual_seed }} <span style="color: #999; font-size: 0.9em;">(입력: {{ lastParams.seed }})</span>
              </template>
              <template v-else>
                {{ lastParams.actual_seed || lastParams.seed }}
              </template>
            </span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Sampler:</span>
            <span class="param-value">{{ lastParams.sampler_name }}</span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Scheduler:</span>
            <span class="param-value">{{ lastParams.scheduler }}</span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Steps:</span>
            <span class="param-value">{{ lastParams.steps }}</span>
          </div>

          <div class="param-row-full">
            <span class="param-label">CFG Scale:</span>
            <span class="param-value">{{ lastParams.cfg_scale }}</span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Size:</span>
            <span class="param-value">{{ lastParams.width }}×{{ lastParams.height }}</span>
          </div>
        </div>
      </div>

      <!-- Hires Fix -->
      <div class="params-group">
        <div class="params-group-label" @click="hiresExpanded = !hiresExpanded">
          <span class="fold-icon">{{ hiresExpanded ? '▼' : '▶' }}</span>
          Hires Fix
        </div>
        <div v-if="hiresExpanded">
          <div class="param-row-full">
            <span class="param-label">Upscaler:</span>
            <span class="param-value">{{ lastParams.hr_upscaler }}</span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Upscale:</span>
            <span class="param-value">{{ lastParams.hr_scale }}x</span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Final size:</span>
            <span class="param-value">
              {{ Math.round(lastParams.width * lastParams.hr_scale) }}x{{ Math.round(lastParams.height * lastParams.hr_scale) }}
            </span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Steps:</span>
            <span class="param-value">{{ lastParams.hr_steps }}</span>
          </div>

          <div class="param-row-full">
            <span class="param-label">Denoise:</span>
            <span class="param-value">{{ lastParams.denoising_strength }}</span>
          </div>
        </div>
      </div>

      <!-- ADetailer -->
      <div v-if="hasEnabledADetailers" class="params-group">
        <div class="params-group-label" @click="adetailerExpanded = !adetailerExpanded">
          <span class="fold-icon">{{ adetailerExpanded ? '▼' : '▶' }}</span>
          ADetailer
        </div>
        <div v-if="adetailerExpanded">
          <div v-for="(ad, index) in enabledADetailers" :key="index" class="param-row-full adetailer-row">
            <span class="param-label">AD {{ adetailerLabels[index] }}:</span>
            <span class="param-value">{{ ad.model }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  lastParams: {
    type: Object,
    default: null
  },
  hasEnabledADetailers: {
    type: Boolean,
    default: false
  },
  enabledADetailers: {
    type: Array,
    default: () => []
  },
  adetailerLabels: {
    type: Array,
    default: () => ['1st', '2nd', '3rd', '4th']
  }
})

// Internal folding state
const sectionExpanded = ref(true)
const basicExpanded = ref(true)
const hiresExpanded = ref(true)
const adetailerExpanded = ref(true)
</script>

<style scoped>
.last-params-section {
  margin-top: 8px;
  padding-top: 0;
}

.params-section-title {
  padding: 6px 4px;
  background: transparent;
  border-radius: 0;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
  margin-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
}

.params-section-title:hover {
  color: #333;
}

.fold-icon {
  display: inline-block;
  width: 14px;
  font-size: 9px;
  margin-right: 4px;
  color: #999;
}

.params-section-content {
  padding: 0;
  margin-top: 4px;
}

.param-row-full {
  padding: 3px 8px;
  background: transparent;
  border-radius: 0;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
  border-bottom: 1px solid #f0f0f0;
}

.param-label {
  color: #888;
  font-weight: 400;
  margin-right: 8px;
  flex-shrink: 0;
  font-size: 11px;
}

.param-value {
  color: #555;
  font-weight: 400;
  text-align: right;
  word-break: break-word;
  flex: 1;
  font-size: 11px;
}

.params-group {
  margin-bottom: 8px;
}

.params-group-label {
  padding: 4px 8px;
  background: transparent;
  border-radius: 0;
  font-size: 11px;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  user-select: none;
  margin-bottom: 3px;
  margin-top: 4px;
  transition: color 0.2s;
}

.params-group-label:hover {
  color: #555;
}

.adetailer-row {
  background: transparent;
}
</style>
