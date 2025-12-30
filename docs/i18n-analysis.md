# i18n 분석 보고서

생성일: 2025-12-30
분석 대상: SD Vue UI 프로젝트

## 📊 전체 개요

- **총 파일 수**: 45개 (.vue, .js)
- **한글 포함 파일**: 41개
- **한글 포함 라인**: 약 1,970줄

## 📁 파일별 한글 분포 (상위 20개)

| 순위 | 파일 | 라인 수 | 카테고리 | 우선순위 |
|------|------|---------|----------|----------|
| 1 | `data/promptsData.js` | 1,212 | 샘플 데이터 | 🟡 중간 |
| 2 | `composables/useImageGeneration.js` | 117 | 핵심 로직 | 🔴 높음 |
| 3 | `composables/useHistory.js` | 78 | 핵심 로직 | 🔴 높음 |
| 4 | `composables/useIndexedDB.js` | 67 | 유틸리티 | 🔴 높음 |
| 5 | `utils/notification.js` | 42 | 유틸리티 | 🔴 높음 |
| 6 | `config/constants.js` | 33 | 설정 | 🟡 중간 |
| 7 | `components/HistoryManagerModal.vue` | 33 | UI | 🔴 높음 |
| 8 | `components/BookmarkManager.vue` | 30 | UI | 🔴 높음 |
| 9 | `components/QueueManager.vue` | 27 | UI | 🔴 높음 |
| 10 | `components/PresetManager.vue` | 27 | UI | 🔴 높음 |
| 11 | `composables/useLocalStorage.js` | 25 | 유틸리티 | 🟡 중간 |
| 12 | `composables/useModelLoader.js` | 23 | 핵심 로직 | 🔴 높음 |
| 13 | `components/HistoryDetailModal.vue` | 23 | UI | 🔴 높음 |
| 14 | `composables/useQueueProcessor.js` | 22 | 핵심 로직 | 🔴 높음 |
| 15 | `components/HistoryPanel.vue` | 19 | UI | 🔴 높음 |
| 16 | `components/PromptPanel.vue` | 18 | UI | 🔴 높음 |
| 17 | `composables/useSlotManagement.js` | 15 | 핵심 로직 | 🔴 높음 |
| 18 | `components/LoraSelector.vue` | 15 | UI | 🔴 높음 |
| 19 | `composables/usePngInfo.js` | 14 | 유틸리티 | 🟡 중간 |
| 20 | `views/Txt2ImgView.vue` | 13 | UI | 🔴 높음 |

## 📂 카테고리별 분류

### 🔴 높은 우선순위 (즉시 번역 필요)

#### UI 컴포넌트 (10개 파일)
- `components/HistoryManagerModal.vue` (33줄)
- `components/BookmarkManager.vue` (30줄)
- `components/QueueManager.vue` (27줄)
- `components/PresetManager.vue` (27줄)
- `components/HistoryDetailModal.vue` (23줄)
- `components/HistoryPanel.vue` (19줄)
- `components/PromptPanel.vue` (18줄)
- `components/LoraSelector.vue` (15줄)
- `views/Txt2ImgView.vue` (13줄)
- 기타 UI 컴포넌트들

**예상 시간**: 2-3시간

#### 핵심 Composables (6개 파일)
- `composables/useImageGeneration.js` (117줄) - 이미지 생성 로직
- `composables/useHistory.js` (78줄) - 히스토리 관리
- `composables/useIndexedDB.js` (67줄) - DB 저장
- `composables/useModelLoader.js` (23줄) - 모델 로딩
- `composables/useQueueProcessor.js` (22줄) - 큐 처리
- `composables/useSlotManagement.js` (15줄) - 슬롯 관리

**예상 시간**: 1-2시간

#### 유틸리티 (2개 파일)
- `utils/notification.js` (42줄) - 알림 메시지
- `composables/useIndexedDB.js` (67줄) - DB 유틸

**예상 시간**: 30분

### 🟡 중간 우선순위 (2차 번역)

#### 설정 및 상수 (2개 파일)
- `config/constants.js` (33줄) - 설정값, 라벨
- `composables/useLocalStorage.js` (25줄) - 로컬 스토리지 키

**예상 시간**: 30분

#### 샘플 데이터 (1개 파일)
- `data/promptsData.js` (1,212줄) - 프롬프트 샘플

**참고**: 이 파일은 선택적으로 번역 가능. 한국어 샘플만 제공해도 무방

**예상 시간**: 생략 가능 또는 2-3시간

### 🟢 낮은 우선순위 (선택적)

#### Mock 데이터
- `mocks/lorasMock.js` - 개발용 데이터

**예상 시간**: 생략 가능

## 📝 텍스트 유형 분류

### 1. UI 라벨 및 버튼
- "생성", "저장", "삭제", "취소" 등
- **위치**: 주로 Vue 템플릿
- **예상 개수**: 약 100-150개

### 2. 알림 메시지
- "저장되었습니다", "삭제하시겠습니까?" 등
- **위치**: composables, utils
- **예상 개수**: 약 80-100개

### 3. 플레이스홀더
- "프롬프트를 입력하세요...", "검색..." 등
- **위치**: 입력 필드
- **예상 개수**: 약 30-40개

### 4. 툴팁 및 도움말
- "클릭하여 설정 열기" 등
- **위치**: title 속성
- **예상 개수**: 약 40-50개

### 5. 에러 메시지
- "파일을 찾을 수 없습니다" 등
- **위치**: try-catch 블록
- **예상 개수**: 약 30-40개

### 6. 설명 텍스트
- 기능 설명, 안내 문구
- **위치**: 모달, 패널
- **예상 개수**: 약 50-60개

## 🎯 번역 전략

### Phase 1: 핵심 기능 (50% 커버리지)
**목표**: 주요 사용자 인터랙션 번역

1. 버튼 및 액션 라벨 (30분)
2. 알림 메시지 (1시간)
3. 주요 컴포넌트 UI (2시간)

**예상 시간**: 3.5시간

### Phase 2: 완전 번역 (90% 커버리지)
**목표**: 거의 모든 텍스트 번역

4. 설정 및 고급 옵션 (1시간)
5. 에러 메시지 및 검증 (30분)
6. 툴팁 및 도움말 (30분)

**예상 시간**: +2시간 (총 5.5시간)

### Phase 3: 완성도 (100% 커버리지)
**목표**: 모든 텍스트 번역

7. promptsData.js 샘플 번역 (선택적)
8. Mock 데이터 번역 (선택적)

**예상 시간**: +2-3시간 (선택 시)

## 📋 다음 단계

- [x] 현재 상태 분석 완료
- [ ] 번역 키 구조 설계
- [ ] 텍스트 추출 스크립트 작성
- [ ] Vue I18n 설치 및 설정
- [ ] 번역 파일 작성
- [ ] 컴포넌트 코드 변환
- [ ] 테스트 및 검증

## 💡 주요 발견사항

### 1. 대량의 샘플 데이터
`promptsData.js`가 전체의 60%를 차지합니다. 이는 샘플 프롬프트 모음으로, 번역 우선순위를 낮춰도 됩니다.

### 2. 잘 구조화된 코드
Composables 패턴을 사용하여 로직이 분리되어 있어, 번역 키를 추가하기 좋은 구조입니다.

### 3. 일관된 메시지 패턴
`showToast()`, `console.log()` 등 일관된 패턴으로 메시지를 표시하여 번역이 용이합니다.

### 4. 예상 고유 텍스트 수
실제로 고유한 텍스트는 약 300-400개로 추정됩니다 (중복 제외).

## 🚨 주의사항

### 번역 제외 대상
다음은 번역하지 않고 그대로 유지:
- API 키 이름 (예: `sd_model_checkpoint`)
- 기술 용어 (예: `CFG Scale`, `Sampler`)
- 파일 경로 및 URL
- 정규표현식 패턴
- CSS 클래스명

### 번역 시 주의
- 파라미터 placeholder 유지: `{count}`, `{name}` 등
- 이모지 유지: `🚀`, `⚠️` 등
- HTML 태그 유지: `<br>`, `<strong>` 등

---

**분석 완료**: ✅
**다음 단계**: Phase 1.2 - 번역 범위 정의
