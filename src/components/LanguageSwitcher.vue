<template>
  <div class="language-switcher">
    <button
      v-for="lang in languages"
      :key="lang.code"
      :class="['lang-btn', { active: currentLocale === lang.code }]"
      @click="switchLanguage(lang.code)"
      :title="lang.name"
    >
      {{ lang.label }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, getLocale } from '../i18n'

const { locale } = useI18n()
const currentLocale = ref(getLocale())

const languages = [
  { code: 'ko', label: '한국어', name: 'Korean' },
  { code: 'en', label: 'English', name: 'English' }
]

function switchLanguage(langCode) {
  setLocale(langCode)
  currentLocale.value = langCode
}

onMounted(() => {
  currentLocale.value = getLocale()
})
</script>

<style scoped>
.language-switcher {
  display: flex;
  gap: 8px;
  align-items: center;
}

.lang-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.lang-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-hover);
}

.lang-btn.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}
</style>
