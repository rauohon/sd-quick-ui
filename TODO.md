# TODO - SD Vue UI

> 완료된 작업은 TODO_COMPLETED.md 참조

## In Progress

(없음)

---

## Recently Completed

### 파이프라인 Phase 1: 이미지 전달 메커니즘 ✅ (2026-01-05)
> 탭 간 이미지 전송 기능 구현 완료

**구현 내용:**
- `usePipelineImage.js` composable 생성 (싱글톤 패턴)
- 히스토리 패널에 "Send to" 버튼 추가 (📤 img2img, 🖌️ inpaint)
- 탭 자동 전환 + 이미지 자동 로드
- 토스트 메시지: "이미지 전달: {from} → {to}" 형식
- Mock 이미지에 MOCK, 시간, 크기 표시 추가 (테스트 용이성)

### ControlNet 연동 구현 ✅ (2026-01-05)
> txt2img, img2img, inpaint 뷰에서 ControlNet 사용 가능

- API 레이어: `useControlNet.js` (모델/모듈 조회, 프리프로세서 미리보기)
- UI: `ControlNetPanel.vue` (간단), `ControlNetManager.vue` (넓은 패널)
- 생성 로직: 3개 뷰 모두 `alwayson_scripts.controlnet` 지원
- 빠른 프리셋: OpenPose, Canny, Depth, Lineart, Tile
- 슬롯 저장 스킵 (이미지 용량 문제, 세션 단위 사용 패턴)

**추가 개선 (2026-01-05):**
- 프리셋-모델 매칭: 모델이 없으면 경고 토스트 + 모델을 None으로 설정
- 프리프로세서 none 선택 시 모델도 자동으로 None 설정
- 유닛별 프롬프트 필드 추가 (선택사항, 비어있으면 메인 프롬프트 사용)

### Img2ImgView / InpaintView 리팩토링 ✅ (2026-01-05)
> **최종: 4,616줄 → 2,303줄 (2,313줄, 50% 절감)**

**Phase 1-5:**
- 공통 스타일 추출 (`src/styles/generation-view.css`)
- Composables: `useADetailerHandlers.js`, `useBookmarkPresetHandlers.js`
- 공통 컴포넌트: `HistorySelectorModal.vue`
- `usePanelVisibility` 동적 prefix 지원

**Phase 6:**
- Composables: `useOutpaint.js`, `useImageUpload.js`
- 컴포넌트: `OutpaintToolbar.vue`, `MaskToolbar.vue`
- InpaintView.vue: 2,887줄 → 1,346줄 (53% 감소)

---

## Planned

### 스텝 기반 파이프라인 (Workflow 탭)
> txt2img → img2img → inpaint 등 여러 단계를 자동 연결하여 실행

**예시 흐름**:
```
txt2img (기본 생성) → img2img + ControlNet (포즈 보정) → inpaint (얼굴 수정)
```

**구현 계획**:
- [x] Phase 1: 이미지 전달 메커니즘 ✅
  - `usePipelineImage.js` composable (싱글톤 패턴)
  - 히스토리 패널 "Send to" 버튼 (📤, 🖌️)
  - 탭 자동 전환 + 이미지 자동 로드

- [ ] Phase 2: 파이프라인 데이터 구조
  - `usePipeline.js` composable 생성
  - 스텝 순차 실행 로직
  - 탭 자동 전환 (`setActiveTab`)
  - 생성 완료 감지 → 다음 스텝 트리거

- [ ] Phase 3: WorkflowView UI
  - 스텝 추가/제거/순서 변경
  - 각 스텝별 설정 (프롬프트, 파라미터, ControlNet 등)
  - 파이프라인 저장/불러오기
  - 실행 버튼 및 진행 상황 표시

**현재 구조 참고**:
- `workflow` 탭 placeholder 이미 존재 (App.vue)
- 각 뷰는 `initImage` ref 사용
- 뷰 간 이미지 전달 메커니즘 필요

## Backlog
- [ ]

## Notes
- Use `[x]` for completed tasks
- Use `[ ]` for pending tasks
- Add dates when completing tasks for reference
- Keep this file updated across Claude Code sessions
- 완료된 작업은 TODO_COMPLETED.md로 이동하여 토큰 절약

---
Last updated: 2026-01-05 (파이프라인 Phase 1 완료)
