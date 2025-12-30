# Vue I18n 빠른 참조 가이드

## 🚀 기본 사용법

### 템플릿에서 사용

```vue
<template>
  <!-- 기본 번역 -->
  <button>{{ $t('common.generate') }}</button>

  <!-- 파라미터 전달 -->
  <p>{{ $t('queue.itemsInQueue', { count: 5 }) }}</p>

  <!-- 조건부 번역 -->
  <span>{{ isGenerating ? $t('common.generating') : $t('common.generate') }}</span>
</template>
```

### 스크립트에서 사용

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// 번역 사용
const message = t('message.success.saved')

// 파라미터 사용
const confirmMsg = t('bookmark.deleteConfirm', { name: '북마크1' })

// 현재 언어 확인
console.log(locale.value) // 'ko' or 'en'
</script>
```

### 언어 전환

```vue
<script setup>
import { setLocale, getLocale } from '@/i18n'

// 언어 변경
setLocale('en')

// 현재 언어 확인
const currentLang = getLocale()
</script>
```

## 📝 번역 키 구조

```javascript
{
  common: {
    generate: '생성',
    save: '저장',
    generating: '생성 중...'
  },

  message: {
    success: {
      saved: '저장되었습니다'
    },
    error: {
      saveFailed: '저장에 실패했습니다'
    }
  },

  queue: {
    itemsInQueue: '{count}개 항목 대기 중'
  }
}
```

## 🎯 주요 카테고리

| 카테고리 | 용도 | 예시 |
|---------|------|------|
| `common` | 공통 액션/상태 | generate, save, loading |
| `prompt` | 프롬프트 UI | positive, negative, placeholder |
| `lora` | LoRA 선택 | title, search, weight |
| `bookmark` | 북마크 관리 | add, delete, saved |
| `history` | 히스토리 | clear, useSeed, copyParams |
| `queue` | 큐 관리 | add, start, stop, status |
| `message` | 시스템 메시지 | success, error, warning |
| `validation` | 검증 메시지 | required, invalidFormat |
| `settings` | 설정 | language, theme, apiUrl |

## 💡 유용한 패턴

### 1. 동적 메시지 (파라미터)

```javascript
// 번역 파일
{
  deleteConfirm: '{count}개의 이미지를 삭제하시겠습니까?',
  timeRemaining: '{seconds}초 남음'
}

// 사용
$t('deleteConfirm', { count: items.length })
$t('timeRemaining', { seconds: eta })
```

### 2. 상태별 메시지

```javascript
// 번역 파일
{
  queue: {
    status: {
      pending: '대기 중',
      running: '실행 중',
      completed: '완료'
    }
  }
}

// 사용
$t(`queue.status.${queueItem.status}`)
```

### 3. 조건부 번역

```vue
<template>
  <!-- 버튼 라벨 -->
  <button>{{ isLoading ? $t('common.loading') : $t('common.generate') }}</button>

  <!-- 메시지 -->
  <div>{{ success ? $t('message.success.saved') : $t('message.error.saveFailed') }}</div>
</template>
```

### 4. 속성 바인딩

```vue
<template>
  <!-- title 속성 -->
  <button :title="$t('common.generate')">...</button>

  <!-- placeholder -->
  <input :placeholder="$t('prompt.placeholder')">

  <!-- aria-label -->
  <button :aria-label="$t('common.close')">×</button>
</template>
```

## 🌐 언어 전환 컴포넌트

```vue
<template>
  <LanguageSwitcher />
</template>

<script setup>
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
</script>
```

## 📁 파일 구조

```
src/
└── i18n/
    ├── index.js           # i18n 설정 및 초기화
    └── locales/
        ├── ko.js          # 한국어 번역
        └── en.js          # 영어 번역
```

## ⚙️ 설정

### 언어 감지 우선순위

1. localStorage (`sd-vue-ui-locale`)
2. 브라우저 언어 (`navigator.language`)
3. 기본값 (영어)

### localStorage 저장

언어가 변경되면 자동으로 localStorage에 저장됩니다:

```javascript
localStorage.getItem('sd-vue-ui-locale') // 'ko' or 'en'
```

## 🔍 디버깅

### 누락된 번역 키 확인

개발 모드에서는 누락된 번역 키가 콘솔에 표시됩니다 (현재 비활성화됨).

활성화하려면 `src/i18n/index.js`에서:

```javascript
createI18n({
  // ...
  missingWarn: true,   // 개발 시 true로 변경
  fallbackWarn: true
})
```

### 현재 언어 확인

```javascript
import { getLocale } from '@/i18n'
console.log('Current locale:', getLocale())
```

## 📚 더 알아보기

- [Vue I18n 공식 문서](https://vue-i18n.intlify.dev/)
- [Composition API 가이드](https://vue-i18n.intlify.dev/guide/advanced/composition.html)
- [메시지 포맷](https://vue-i18n.intlify.dev/guide/essentials/syntax.html)

---

**작성일**: 2025-12-30
**버전**: Phase 2 완료
