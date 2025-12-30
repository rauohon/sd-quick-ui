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
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.lang-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.3);
}

.lang-btn.active {
  background: rgba(99, 102, 241, 0.3);
  color: #fff;
  border-color: rgba(99, 102, 241, 0.5);
}
</style>
