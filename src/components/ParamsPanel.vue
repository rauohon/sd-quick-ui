<template>
  <div class="params-panel" :class="{ collapsed: !isExpanded }">
    <div class="panel-header">
      <button
        class="toggle-advanced-btn"
        @click="$emit('toggle-panel')"
        :title="isExpanded ? $t('advancedPanel.foldPanel') : $t('advancedPanel.unfoldPanel')"
      >
        {{ isExpanded ? '◀' : '▶' }}
      </button>
      <h3 class="panel-title">{{ $t('paramsPanel.title') }}</h3>
    </div>

    <div v-if="isExpanded" class="params-content">
      <div class="form-group horizontal">
        <label>Sampling steps</label>
        <input
          type="number"
          :value="steps"
          @input="$emit('update:steps', Number($event.target.value))"
          min="1"
          max="150"
          :disabled="isGenerating"
        >
      </div>

      <div class="form-group horizontal">
        <label>CFG Scale</label>
        <input
          type="number"
          :value="cfgScale"
          @input="$emit('update:cfgScale', Number($event.target.value))"
          min="1"
          max="30"
          step="0.5"
          :disabled="isGenerating"
        >
      </div>

      <div class="section-divider"></div>
      <h4 class="section-title">Hires. fix</h4>

      <div class="form-group horizontal">
        <label>Upscaler</label>
        <select
          :value="hrUpscaler"
          @change="$emit('update:hrUpscaler', $event.target.value)"
          :disabled="isGenerating"
        >
          <option v-for="upscaler in availableUpscalers" :key="upscaler.name" :value="upscaler.name">
            {{ upscaler.name }}
          </option>
        </select>
      </div>

      <div class="form-group horizontal">
        <label>Hires steps</label>
        <input
          type="number"
          :value="hrSteps"
          @input="$emit('update:hrSteps', Number($event.target.value))"
          min="0"
          max="150"
          :disabled="isGenerating"
        >
      </div>

      <div class="form-group horizontal">
        <label>Denoising</label>
        <input
          type="number"
          :value="denoisingStrength"
          @input="$emit('update:denoisingStrength', Number($event.target.value))"
          min="0"
          max="1"
          step="0.01"
          :disabled="isGenerating"
        >
      </div>

      <div class="form-group horizontal">
        <label>Upscale by</label>
        <input
          type="number"
          :value="hrUpscale"
          @input="$emit('update:hrUpscale', Number($event.target.value))"
          min="1"
          max="4"
          step="0.1"
          :disabled="isGenerating"
        >
      </div>

      <!-- ADetailer sections -->
      <template v-for="(ad, index) in adetailers" :key="index">
        <div class="section-divider"></div>
        <div class="form-group ad-title">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="ad.enable"
              @change="$emit('update:adetailer-enable', index, $event.target.checked)"
              :disabled="isGenerating"
            >
            <span>AD {{ adetailerLabels[index] }}</span>
          </label>
        </div>

        <template v-if="ad.enable">
          <div class="form-group horizontal">
            <label>Model</label>
            <select
              :value="ad.model"
              @change="$emit('update:adetailer-model', index, $event.target.value)"
              :disabled="isGenerating"
            >
              <option v-for="model in adetailerModels" :key="model" :value="model">
                {{ model }}
              </option>
            </select>
          </div>

          <div class="form-group horizontal">
            <label>Prompt</label>
            <button
              class="ad-prompt-btn"
              @click="$emit('open-adetailer-prompt', index)"
              :disabled="isGenerating"
              :title="ad.prompt || ad.negativePrompt ? 'Edit prompts (Has content)' : 'Edit prompts'"
            >
              {{ ad.prompt || ad.negativePrompt ? $t('paramsPanel.editPromptsWithContent') : $t('paramsPanel.editPrompts') }}
            </button>
          </div>

          <div class="form-group horizontal">
            <label>Confidence</label>
            <input
              type="number"
              :value="ad.confidence"
              @input="$emit('update:adetailer-confidence', index, Number($event.target.value))"
              min="0"
              max="1"
              step="0.01"
              :disabled="isGenerating"
            >
          </div>

          <div class="form-group horizontal">
            <label>Dilate/Erode</label>
            <input
              type="number"
              :value="ad.dilateErode"
              @input="$emit('update:adetailer-dilateErode', index, Number($event.target.value))"
              min="-128"
              max="128"
              :disabled="isGenerating"
            >
          </div>

          <div class="form-group horizontal">
            <label>Inpaint denoise</label>
            <input
              type="number"
              :value="ad.inpaintDenoising"
              @input="$emit('update:adetailer-inpaintDenoising', index, Number($event.target.value))"
              min="0"
              max="1"
              step="0.01"
              :disabled="isGenerating"
            >
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                :checked="ad.inpaintOnlyMasked"
                @change="$emit('update:adetailer-inpaintOnlyMasked', index, $event.target.checked)"
                :disabled="isGenerating"
              >
              <span>Inpaint only masked</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                :checked="ad.useSeparateSteps"
                @change="$emit('update:adetailer-useSeparateSteps', index, $event.target.checked)"
                :disabled="isGenerating"
              >
              <span>Separate steps</span>
            </label>
          </div>

          <div v-if="ad.useSeparateSteps" class="form-group horizontal">
            <label>AD Steps</label>
            <input
              type="number"
              :value="ad.steps"
              @input="$emit('update:adetailer-steps', index, Number($event.target.value))"
              min="1"
              max="150"
              :disabled="isGenerating"
            >
          </div>
        </template>
      </template>
    </div>

    <div v-if="isExpanded" class="panel-footer">
      <span class="footer-label">{{ $t('paramsPanel.promptSlots') }}</span>
      <div class="footer-buttons">
        <button
          v-for="i in slotCount"
          :key="i"
          class="page-btn"
          :class="{
            'has-data': slots[i - 1] !== null,
            'active': activeSlot === i - 1
          }"
          @click="$emit('select-slot', i - 1)"
          :title="$t('prompt.slotClickToSelect', { i })"
        >
          {{ i }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isExpanded: {
    type: Boolean,
    default: true
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  steps: {
    type: Number,
    default: 20
  },
  cfgScale: {
    type: Number,
    default: 7
  },
  hrUpscaler: {
    type: String,
    default: 'Latent'
  },
  hrSteps: {
    type: Number,
    default: 10
  },
  denoisingStrength: {
    type: Number,
    default: 0.7
  },
  hrUpscale: {
    type: Number,
    default: 2
  },
  availableUpscalers: {
    type: Array,
    default: () => []
  },
  adetailers: {
    type: Array,
    default: () => []
  },
  adetailerLabels: {
    type: Array,
    default: () => ['1st', '2nd', '3rd', '4th']
  },
  adetailerModels: {
    type: Array,
    default: () => []
  },
  slots: {
    type: Array,
    default: () => []
  },
  activeSlot: {
    type: Number,
    default: 0
  },
  slotCount: {
    type: Number,
    default: 3
  }
})

defineEmits([
  'toggle-panel',
  'update:steps',
  'update:cfgScale',
  'update:hrUpscaler',
  'update:hrSteps',
  'update:denoisingStrength',
  'update:hrUpscale',
  'update:adetailer-enable',
  'update:adetailer-model',
  'update:adetailer-confidence',
  'update:adetailer-dilateErode',
  'update:adetailer-inpaintDenoising',
  'update:adetailer-inpaintOnlyMasked',
  'update:adetailer-useSeparateSteps',
  'update:adetailer-steps',
  'open-adetailer-prompt',
  'select-slot'
])
</script>

<style scoped>
.params-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: all 0.3s ease;
}

.params-panel.collapsed {
  width: 40px;
}

.panel-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-primary);
}

.toggle-advanced-btn {
  padding: 4px 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toggle-advanced-btn:hover {
  background: var(--color-bg-hover);
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.params-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: var(--color-bg-secondary);
}

.form-group {
  margin-bottom: 12px;
}

.form-group.horizontal {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group.horizontal label {
  flex: 0 0 80px;
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.form-group.horizontal input[type="number"],
.form-group.horizontal select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
  font-size: 13px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.section-divider {
  height: 1px;
  background: var(--color-border-primary);
  margin: 16px 0;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.ad-prompt-btn {
  flex: 1;
  padding: 6px 12px;
  background: var(--color-warning);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.ad-prompt-btn:hover:not(:disabled) {
  background: var(--color-warning-dark);
}

.ad-prompt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-primary);
}

.footer-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.footer-buttons {
  display: flex;
  gap: 6px;
}

.page-btn {
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  color: var(--color-text-secondary);
}

.page-btn:hover {
  background: var(--color-bg-hover);
  transform: scale(1.05);
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary-dark);
  color: var(--color-text-inverse);
  font-weight: 600;
}

.page-btn.has-data {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn.has-data.active {
  background: var(--color-primary);
  border-color: var(--color-primary-dark);
  color: var(--color-text-inverse);
}

.form-group.horizontal .checkbox-label {
  flex: 1;
}

.form-group.ad-title {
  margin-bottom: 8px;
}
.checkbox-label span {
  font-size: 12px;
}
</style>
