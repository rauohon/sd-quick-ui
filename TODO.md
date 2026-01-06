# TODO - SD Vue UI

> 완료된 작업은 TODO_COMPLETED.md 참조

## In Progress

### Workflow UI 개선 & Phase 3 구현
> 다른 뷰와 동일한 3컬럼 레이아웃 + 스텝별 오버라이드 기능

---

## Recently Completed

(없음 - TODO_COMPLETED.md 참조)

---

## Planned

### Workflow UI 개선 & Phase 3 구현

**목표**: 다른 생성 뷰(txt2img, img2img, inpaint)와 동일한 3컬럼 레이아웃으로 통일

**레이아웃**:
```
┌──────────────────┬──────────────────────┬─────────────────────────┐
│   설정 패널      │    스텝 편집 패널     │      결과/미리보기      │
│   (280px)        │    (300px)           │       (1fr)             │
├──────────────────┼──────────────────────┼─────────────────────────┤
│ ■ 시스템 상태    │ 파이프라인 스텝      │  [각 스텝별 출력 이미지]│
│   API 연결 상태  │ ┌─ txt2img ────────┐ │                         │
│   현재 모델      │ │ [편집] [▲▼] [X] │ │  Step 1: [이미지]       │
│                  │ └──────────────────┘ │  Step 2: [이미지]       │
│ ■ 템플릿         │         ↓            │  Step 3: [이미지]       │
│   [txt→img2img]  │ ┌─ img2img ───────┐  │                         │
│   [txt→inpaint]  │ │ Denoise: 0.5    │  │                         │
│   [전체]         │ └──────────────────┘ │                         │
│                  │                      │                         │
│ ■ 저장된 워크플로│ [+ 스텝 추가]        │                         │
├──────────────────┼──────────────────────┼─────────────────────────┤
│ [Theme] [Lang]   │ [▶실행] [■중지]     │ 진행률: ████░░ 66%      │
└──────────────────┴──────────────────────┴─────────────────────────┘
```

**구현 단계**:

- [x] Step 1: 3컬럼 레이아웃 구조 ✅
  - WorkflowView.vue 컴포넌트 분리
  - 3컬럼 그리드 레이아웃 적용
  - API 상태, 템플릿, 스텝 편집, 결과 미리보기 패널

- [x] Step 2: 왼쪽 패널 - 시스템 & 설정 ✅
  - API 연결 상태 표시 (🟢/🔴)
  - 현재 로드된 모델명 표시
  - 파이프라인 템플릿 버튼 (기존 기능 이동)
  - 저장된 워크플로 목록 (placeholder)
  - SystemSettingsSection 컴포넌트 (테마/언어/알림 - 탭간 동기화)
  - 패널 접기 상태 localStorage 저장
  - Footer에 "⚡ SD Quick UI" 타이틀 + 재연결 버튼

- [x] Step 3: 중앙 패널 - 스텝 편집 ✅
  - 스텝 카드 UI 개선 (화살표 연결 - 녹색 강조)
  - 스텝 순서 변경 (▲▼ 버튼)
  - [+ 스텝 추가] 버튼 + 타입 선택 (외부 클릭시 닫힘)
  - 실행 컨트롤 상단 헤더로 이동 (실행/중지/초기화)

- [x] Step 4: 스텝별 오버라이드 ✅
  - 각 스텝 [편집] 버튼 → 오버라이드 설정
  - 공통: 프롬프트, 네거티브, Steps, CFG
  - img2img: Denoising Strength
  - inpaint: Denoising, Mask Blur, Inpaint Area
  - usePipeline.js에서 오버라이드 적용 로직
  - 편집 UI: 오른쪽 패널 대체 방식 (인라인 편집)

- [x] Step 5: 파이프라인 실행 개선 & 결과 미리보기 ✅
  - usePipeline.js 재작성: generationEngine 직접 사용 (탭 전환 제거)
  - 기본 프롬프트 입력 UI (왼쪽 패널)
  - 실시간 진행률 표시 (currentEngineState.progress, progressState)
  - 생성 중 이미지 미리보기 (currentEngineState.currentImage)
  - 각 스텝별 출력 이미지 표시
  - 최종 결과 하이라이트
  - 이미지 클릭 시 확대 모달
  - 오버라이드 프롬프트 유효성 검사 개선

- [ ] Step 6: 워크플로 저장/불러오기
  - 현재 파이프라인을 템플릿으로 저장
  - localStorage 또는 IndexedDB 저장
  - 저장된 워크플로 목록에서 불러오기/삭제

**스텝별 오버라이드 옵션**:
| 스텝 타입 | 오버라이드 가능 항목 |
|----------|---------------------|
| 공통 | 프롬프트, 네거티브, Steps, CFG |
| img2img | Denoising Strength |
| inpaint | Denoising, Mask Blur, Inpaint Area |

---

### 스텝 기반 파이프라인 (이전 계획 - 참조용)

- [x] Phase 1: 이미지 전달 메커니즘 ✅
- [x] Phase 2: 파이프라인 실행 엔진 & UI ✅
- [ ] Phase 3: 위 "Workflow UI 개선" 계획으로 대체

## Backlog

(없음)

## Notes
- Use `[x]` for completed tasks
- Use `[ ]` for pending tasks
- Add dates when completing tasks for reference
- Keep this file updated across Claude Code sessions
- 완료된 작업은 TODO_COMPLETED.md로 이동하여 토큰 절약

---
Last updated: 2026-01-06 (Step 5 완료 - 파이프라인 실행 개선)
