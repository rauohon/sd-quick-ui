# i18n 번역 범위 정의

생성일: 2025-12-30
프로젝트: SD Vue UI

## 🎯 번역 정책

### ✅ 번역 대상

#### 1. UI 요소
- 모든 버튼 텍스트
- 메뉴 및 탭 이름
- 폼 라벨
- 플레이스홀더
- 툴팁 (title 속성)

#### 2. 메시지
- 성공/에러/경고 알림
- 확인 다이얼로그
- 검증 메시지
- 정보성 메시지

#### 3. 설명 텍스트
- 도움말
- 안내 문구
- 빈 상태 메시지

#### 4. 날짜/시간 표현
- "방금", "5분 전" 등
- 날짜 포맷

### ❌ 번역 제외

#### 1. 기술 용어 (그대로 유지)
```
- Stable Diffusion
- LoRA
- Sampler (Euler, DPM++ 등)
- CFG Scale
- Denoising Strength
- Clip Skip
- VAE
- Checkpoint
- Embedding
- Hypernetwork
```

**이유**: 국제적으로 통용되는 전문 용어

#### 2. API 키 및 필드명
```
- sd_model_checkpoint
- sampler_name
- cfg_scale
- steps
- seed
```

**이유**: API와의 호환성 유지

#### 3. 파일 경로 및 확장자
```
- .safetensors
- .ckpt
- .png
- models/Lora/
```

#### 4. 코드 및 정규표현식
```
- <lora:name:weight>
- (prompt:1.2)
- [keyword]
```

#### 5. 개발자 메시지
```
- console.log() 메시지
- 디버그 로그
```

**예외**: 사용자에게 표시되는 에러 메시지는 번역

### ⚠️ 선택적 번역

#### 1. 샘플 프롬프트 (promptsData.js)
**현재 상태**: 1,212줄의 한국어 샘플 프롬프트

**옵션 A**: 그대로 유지 (한국어만)
- 장점: 작업 시간 절약
- 단점: 영어 사용자가 이해 어려움

**옵션 B**: 영어 번역 추가
- 장점: 완전한 다국어 지원
- 단점: 2-3시간 추가 작업

**권장**: **옵션 A** (한국어 유지)
- 샘플 프롬프트는 참고용이며 핵심 기능 아님
- 사용자는 자신의 프롬프트를 입력함
- 추후 커뮤니티 기여로 추가 가능

#### 2. Mock 데이터
**위치**: `mocks/lorasMock.js`

**권장**: 번역 제외
- 개발 전용 데이터
- 프로덕션에서 사용 안 함

## 📝 카테고리별 번역 키 구조

### 1. 공통 (common)
자주 사용되는 기본 액션 및 상태

```javascript
common: {
  // 액션
  generate: '생성',
  save: '저장',
  load: '불러오기',
  delete: '삭제',
  cancel: '취소',
  close: '닫기',
  edit: '수정',
  confirm: '확인',

  // 상태
  generating: '생성 중...',
  loading: '로딩 중...',
  saving: '저장 중...',
}
```

### 2. 프롬프트 (prompt)
프롬프트 관련 UI 및 메시지

```javascript
prompt: {
  title: '프롬프트',
  positive: '포지티브 프롬프트',
  negative: '네거티브 프롬프트',
  placeholder: '프롬프트를 입력하세요...',

  infiniteMode: '무한 생성 모드',
  infiniteModeOn: '무한 생성 모드 켜기',
  infiniteModeOff: '무한 생성 모드 끄기',
}
```

### 3. LoRA (lora)
LoRA 선택 및 관리

```javascript
lora: {
  title: 'LoRA 선택',
  search: '검색',
  weight: '가중치',
  addToPrompt: '프롬프트에 추가',

  noLorasFound: 'LoRA를 찾을 수 없습니다',
}
```

### 4. 북마크 (bookmark)
북마크 관리

```javascript
bookmark: {
  title: '북마크',
  add: '북마크 추가',
  name: '북마크 이름',

  // 메시지
  saved: '북마크가 저장되었습니다',
  deleted: '북마크가 삭제되었습니다',
  deleteConfirm: '이 북마크를 삭제하시겠습니까?',
}
```

### 5. 히스토리 (history)
이미지 히스토리

```javascript
history: {
  title: '히스토리',
  clear: '전체 삭제',

  noImages: '생성된 이미지가 없습니다',

  today: '오늘',
  yesterday: '어제',

  useSeed: '시드 사용',
  copyParams: '파라미터 복사',
}
```

### 6. 큐 (queue)
생성 큐 관리

```javascript
queue: {
  title: '큐 관리',
  add: '큐에 추가',

  status: {
    pending: '대기 중',
    running: '실행 중',
    completed: '완료',
  },
}
```

### 7. 설정 (settings)
앱 설정

```javascript
settings: {
  title: '설정',
  language: '언어',

  general: '일반',
  advanced: '고급',
}
```

### 8. 메시지 (message)
시스템 메시지

```javascript
message: {
  success: {
    saved: '저장되었습니다',
    deleted: '삭제되었습니다',
  },
  error: {
    saveFailed: '저장에 실패했습니다',
    networkError: '네트워크 오류가 발생했습니다',
  },
}
```

### 9. 검증 (validation)
폼 검증 메시지

```javascript
validation: {
  required: '{field}을(를) 입력해주세요',
  invalidFormat: '{field}의 형식이 올바르지 않습니다',
}
```

### 10. 알림 (notification)
브라우저 알림

```javascript
notification: {
  unsupported: '이 브라우저는 알림을 지원하지 않습니다',
  permissionDenied: '알림 권한이 거부되었습니다',
  generationComplete: '이미지 생성이 완료되었습니다',
}
```

## 🔢 예상 번역 키 개수

| 카테고리 | 예상 키 개수 | 우선순위 |
|---------|-------------|---------|
| common | 30-40 | 🔴 높음 |
| prompt | 20-30 | 🔴 높음 |
| lora | 15-20 | 🔴 높음 |
| bookmark | 15-20 | 🔴 높음 |
| history | 25-35 | 🔴 높음 |
| queue | 15-20 | 🔴 높음 |
| preset | 10-15 | 🟡 중간 |
| settings | 20-30 | 🟡 중간 |
| message | 30-40 | 🔴 높음 |
| validation | 10-15 | 🟡 중간 |
| notification | 10-15 | 🟡 중간 |
| pngInfo | 10-15 | 🟡 중간 |
| api | 10-15 | 🟡 중간 |
| time | 10-15 | 🟡 중간 |
| button | 10-15 | 🟡 중간 |
| **총계** | **250-350** | |

## 🎨 번역 스타일 가이드

### 한국어 (ko)

#### 1. 존댓말 vs 반말
**선택**: **해요체** (중립적 존댓말)

```
✅ 저장되었습니다
❌ 저장되었어요 (너무 가벼움)
❌ 저장되었습니다. (너무 격식적)
```

#### 2. 조사 처리
파라미터를 사용한 동적 조사

```javascript
// 받침에 따라 "을/를" 자동 선택
'{field}을(를) 입력해주세요'

// 실제 사용 시
'이름을 입력해주세요'
'값을 입력해주세요'
```

#### 3. 띄어쓰기
```
✅ '이미지 생성'
❌ '이미지생성'

✅ '큐에 추가'
❌ '큐 에 추가'
```

### 영어 (en)

#### 1. 명사 vs 동사형
**버튼**: 동사형 (명령문)
```
Generate (생성)
Save (저장)
Delete (삭제)
```

**라벨**: 명사형
```
History (히스토리)
Settings (설정)
Queue (큐)
```

#### 2. 관사 사용
UI 라벨에서는 관사 생략
```
✅ Delete bookmark
❌ Delete the bookmark

✅ Enter prompt
❌ Enter a prompt
```

#### 3. 대소문자
**Title Case**: 주요 단어 대문자
```
✅ Add to Queue
❌ add to queue
❌ Add To Queue (to는 소문자)
```

**Sentence case**: 일반 메시지
```
✅ Bookmark has been saved
❌ Bookmark Has Been Saved
```

## 📋 번역 체크리스트

### Phase 1: 핵심 기능 (필수)
- [ ] common (공통 액션/상태)
- [ ] message (성공/에러 메시지)
- [ ] prompt (프롬프트 UI)
- [ ] history (히스토리)
- [ ] lora (LoRA 선택)
- [ ] bookmark (북마크)
- [ ] queue (큐)

**예상 시간**: 3-4시간

### Phase 2: 완성도 향상 (권장)
- [ ] settings (설정)
- [ ] validation (검증)
- [ ] notification (알림)
- [ ] preset (프리셋)
- [ ] pngInfo (PNG 정보)
- [ ] api (API 상태)
- [ ] time (시간 표현)

**예상 시간**: 1-2시간

### Phase 3: 선택적
- [ ] promptsData.js (샘플 프롬프트)
- [ ] mocks (개발용 데이터)

**예상 시간**: 2-3시간 (생략 가능)

## 🚀 다음 단계

- [x] Phase 1.1: 현재 상태 분석
- [x] Phase 1.2: 번역 범위 정의
- [ ] Phase 1.3: 텍스트 추출 스크립트 작성
- [ ] Phase 2: Vue I18n 인프라 구축
- [ ] Phase 3: 번역 파일 작성

---

**정의 완료**: ✅
**추정 번역 키**: 250-350개
**예상 작업 시간**: 4-6시간 (핵심), 6-8시간 (전체)
