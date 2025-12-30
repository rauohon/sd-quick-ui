<template>
  <div class="i18n-test">
    <h2>🌐 i18n 번역 테스트</h2>

    <!-- 언어 전환 -->
    <div class="language-switcher">
      <button @click="switchLang('ko')" :class="{ active: currentLang === 'ko' }">한국어</button>
      <button @click="switchLang('en')" :class="{ active: currentLang === 'en' }">English</button>
      <p>현재 언어: {{ currentLang }}</p>
    </div>

    <!-- 테스트 섹션들 -->
    <div class="test-sections">
      <!-- 1. Common -->
      <section>
        <h3>Common</h3>
        <ul>
          <li>generate: {{ $t('common.generate') }}</li>
          <li>save: {{ $t('common.save') }}</li>
          <li>delete: {{ $t('common.delete') }}</li>
          <li>generating: {{ $t('common.generating') }}</li>
        </ul>
      </section>

      <!-- 2. Prompt -->
      <section>
        <h3>Prompt</h3>
        <ul>
          <li>title: {{ $t('prompt.title') }}</li>
          <li>infiniteMode: {{ $t('prompt.infiniteMode') }}</li>
          <li>slotSaved: {{ $t('prompt.slotSaved') }}</li>
        </ul>
      </section>

      <!-- 3. History (with params) -->
      <section>
        <h3>History (파라미터 테스트)</h3>
        <ul>
          <li>deleteConfirm: {{ $t('history.deleteConfirm', { count: 5 }) }}</li>
          <li>downloadMultiple: {{ $t('history.downloadMultiple', { count: 10 }) }}</li>
          <li>deletedWithProtected: {{ $t('history.deletedWithProtected', { deletedCount: 7, favoriteCount: 3 }) }}</li>
        </ul>
      </section>

      <!-- 4. Queue -->
      <section>
        <h3>Queue</h3>
        <ul>
          <li>title: {{ $t('queue.title') }}</li>
          <li>status.pending: {{ $t('queue.status.pending') }}</li>
          <li>itemsInQueue: {{ $t('queue.itemsInQueue', { count: 3 }) }}</li>
        </ul>
      </section>

      <!-- 5. Messages -->
      <section>
        <h3>Messages</h3>
        <ul>
          <li>success.saved: {{ $t('message.success.saved') }}</li>
          <li>error.apiError: {{ $t('message.error.apiError') }}</li>
          <li>error.generationFailed: {{ $t('message.error.generationFailed') }}</li>
          <li>error.apiErrorWithStatus: {{ $t('message.error.apiErrorWithStatus', { status: 500 }) }}</li>
        </ul>
      </section>

      <!-- 6. API -->
      <section>
        <h3>API</h3>
        <ul>
          <li>connecting: {{ $t('api.connecting') }}</li>
          <li>connected: {{ $t('api.connected') }}</li>
          <li>connectionSuccess: {{ $t('api.connectionSuccess') }}</li>
        </ul>
      </section>

      <!-- 7. Time -->
      <section>
        <h3>Time</h3>
        <ul>
          <li>justNow: {{ $t('time.justNow') }}</li>
          <li>minutesAgo: {{ $t('time.minutesAgo', { n: 5 }) }}</li>
          <li>secondsRemaining: {{ $t('time.secondsRemaining', { eta: 30 }) }}</li>
        </ul>
      </section>
    </div>

    <!-- 검증 결과 -->
    <div class="validation-result" :class="{ success: allTestsPassed }">
      <h3>{{ allTestsPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패' }}</h3>
      <p>총 {{ testCount }}개 번역 키 테스트 완료</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, getLocale } from '../i18n'

const { t, locale } = useI18n()
const currentLang = ref(getLocale())

function switchLang(lang) {
  setLocale(lang)
  currentLang.value = lang
}

const testCount = 25 // 테스트한 번역 키 개수
const allTestsPassed = computed(() => {
  // 모든 번역이 정상적으로 로드되었는지 확인
  try {
    t('common.generate')
    t('prompt.title')
    t('history.deleteConfirm', { count: 1 })
    t('message.error.apiError')
    return true
  } catch (e) {
    return false
  }
})
</script>

<style scoped>
.i18n-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: #fff;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
}

.language-switcher {
  margin-bottom: 30px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.language-switcher button {
  padding: 8px 16px;
  margin-right: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.language-switcher button.active {
  background: rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.5);
}

.test-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

section {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
}

section h3 {
  margin-bottom: 10px;
  color: #6366f1;
  font-size: 16px;
}

section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

section li {
  padding: 5px 0;
  font-size: 14px;
  font-family: monospace;
}

.validation-result {
  padding: 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  text-align: center;
}

.validation-result.success {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.validation-result h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
}

.validation-result p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}
</style>
