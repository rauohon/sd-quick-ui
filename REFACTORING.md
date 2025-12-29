# 🔧 SD Vue UI 리팩토링 계획

## 진행 상황

- [x] ✅ 급한 버그 수정 완료
  - [x] 메모리 누수 수정 (progressInterval)
  - [x] localStorage quota 처리
  - [x] 키보드 이벤트 충돌 수정
  - [x] watch debounce 적용

---

## 📋 완벽 추구 개선 계획 (A → B → C → D → E)

### A. 중복 코드 제거 (예상: 30분)

**목표**: 코드 간결화, 유지보수성 향상

- [ ] ADetailer 기본값 중복 제거
  - 현재: `adetailers` (라인 31-72), `defaultSettings.adetailers` (라인 111-152)
  - 목표: `DEFAULT_ADETAILER` 상수 정의, `createADetailerPreset()` 헬퍼 함수

- [ ] 설정 매핑 코드 리팩토링
  - 현재: `getCurrentSettings()`, `applySettings()` 필드 반복
  - 목표: `SETTINGS_KEYS` 배열로 통합

**예상 효과**:
- 코드 라인 수 ~50줄 감소
- 설정 추가 시 한 곳만 수정

---

### B. 에러 처리 개선 (예상: 1시간)

**목표**: 사용자 경험 향상, 디버깅 용이

- [ ] Toast/Notification 시스템 추가
  - `alert()` 제거 (6곳)
  - 간단한 Toast 컴포넌트 구현
  - 성공/에러/경고 타입 지원

- [ ] 네트워크 에러 상세 처리
  - HTTP 상태 코드별 메시지 (401, 403, 500, 503)
  - 연결 실패 vs 서버 에러 구분
  - 재시도 제안 메시지

- [ ] localStorage 에러 사용자 알림
  - 현재: console.error만 출력
  - 목표: Toast로 사용자에게 알림

**예상 효과**:
- 사용자 친화적 에러 메시지
- 문제 해결 가이드 제공

---

### C. computed 활용 최적화 (예상: 20분)

**목표**: 불필요한 재계산 방지, 성능 향상

- [ ] `enabledADetailers` computed로 변경
  - 현재: 매번 filter 실행 (라인 213)
  - 목표: computed로 캐싱

- [ ] 기타 계산 가능한 값 찾기
  - 히스토리 개수
  - 슬롯 상태 플래그

**예상 효과**:
- 렌더링 성능 향상
- 메모리 사용 최적화

---

### D. 타입 안정성 추가 (예상: 1시간)

**목표**: 런타임 에러 방지, 데이터 무결성

- [ ] 숫자 입력 검증 함수
  - `validateNumber(value, min, max, defaultValue)`
  - width, height, steps, cfg_scale 등 적용

- [ ] computed setter 패턴 적용
  - NaN, 음수, 범위 초과 자동 보정
  - 사용자에게 피드백

- [ ] ADetailer 설정 검증
  - confidence: 0-1
  - dilateErode: -128~128
  - steps: 1-150

**예상 효과**:
- API 호출 실패 방지
- 사용자 입력 에러 사전 차단

---

### E. 컴포넌트 분리 (예상: 4-6시간)

**목표**: 장기적 유지보수성, 코드 재사용성

#### 5.1 Composables 분리

- [ ] `composables/useImageGeneration.js`
  - generateImage, progress polling
  - ~150줄

- [ ] `composables/useLocalStorage.js`
  - saveToLocalStorage, loadFromLocalStorage
  - ~50줄

- [ ] `composables/useSlotManagement.js`
  - slot 저장/불러오기, selectSlot
  - ~100줄

- [ ] `composables/useModal.js`
  - 모달 상태 관리
  - ~30줄

#### 5.2 컴포넌트 분리

- [ ] `components/AdvancedSettings.vue`
  - Sampler, Scheduler, Width, Height, Batch, Seed
  - ~150줄

- [ ] `components/ParametersPanel.vue`
  - Steps, CFG, Hires.fix, ADetailer
  - ~200줄

- [ ] `components/ADetailerSettings.vue`
  - 1st/2nd/3rd/4th 설정
  - ~150줄

- [ ] `components/PromptPanel.vue`
  - 프롬프트 입력, 슬롯 버튼, 생성 버튼
  - ~100줄

- [ ] `components/ImagePreview.vue`
  - 이미지 프리뷰, 진행바
  - ~80줄

- [ ] `components/ImageHistory.vue`
  - 히스토리 목록, Clear 버튼
  - ~80줄

- [ ] `components/UniversalModal.vue`
  - 비교/뷰어 모달
  - ~100줄

- [ ] `components/PngInfoTab.vue`
  - PNG Info 탭 전체
  - ~100줄

#### 5.3 Props/Emit 설계

- [ ] Props 타입 정의
- [ ] Emit 이벤트 명세
- [ ] 상태 전달 구조도 작성

**예상 효과**:
- App.vue: 1687줄 → ~300줄
- 테스트 가능한 단위로 분리
- 재사용 가능한 컴포넌트

---

## 📊 진행 현황

| 단계 | 상태 | 시작 시각 | 완료 시각 | 소요 시간 |
|------|------|-----------|-----------|-----------|
| 버그 수정 | ✅ 완료 | - | - | ~30분 |
| A. 중복 코드 제거 | ⏳ 대기 | - | - | - |
| B. 에러 처리 개선 | ⏳ 대기 | - | - | - |
| C. computed 최적화 | ⏳ 대기 | - | - | - |
| D. 타입 안정성 | ⏳ 대기 | - | - | - |
| E. 컴포넌트 분리 | ⏳ 대기 | - | - | - |

**총 예상 시간**: ~7시간
**실제 소요 시간**: TBD

---

## 🎯 각 단계별 성공 기준

### A. 중복 코드 제거
- ✅ ADetailer 기본값이 한 곳에만 정의됨
- ✅ 설정 필드 추가 시 한 곳만 수정하면 됨

### B. 에러 처리 개선
- ✅ alert() 사용 0개
- ✅ 모든 네트워크 에러에 사용자 친화적 메시지
- ✅ Toast 시스템 작동

### C. computed 최적화
- ✅ enabledADetailers가 computed로 구현됨
- ✅ 불필요한 재계산 제거 확인

### D. 타입 안정성
- ✅ 모든 숫자 입력에 검증 적용
- ✅ 잘못된 값 입력 시 자동 보정
- ✅ API 호출 전 모든 값 유효성 검증

### E. 컴포넌트 분리
- ✅ App.vue < 400줄
- ✅ 각 컴포넌트 < 200줄
- ✅ 모든 기능 정상 작동
- ✅ Props/Emit 명확히 정의됨

---

## 📝 노트

- 각 단계 완료 후 브라우저에서 전체 기능 테스트 필요
- 리팩토링 중 기능 추가는 최소화
- Git commit은 각 단계별로 진행 권장

---

**마지막 업데이트**: 2025-12-27
