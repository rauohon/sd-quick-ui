<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  maxImages: { type: Number, default: 50 }
})

const emit = defineEmits(['update:modelValue', 'select'])

function close() {
  emit('update:modelValue', false)
}

function selectImage(image) {
  emit('select', image)
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay" @click="close">
    <div class="modal-content history-selector-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ t('img2img.selectFromHistory') }}</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <div class="history-selector-grid">
          <div
            v-for="image in images.slice(0, maxImages)"
            :key="image.id"
            class="selector-item"
            @click="selectImage(image)"
          >
            <img :src="image.image" alt="Select this image" />
          </div>
        </div>
        <div v-if="images.length === 0" class="empty-state">
          {{ t('history.noImages') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 스타일은 generation-view.css에서 상속 */
</style>
