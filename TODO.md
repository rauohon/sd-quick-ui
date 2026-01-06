# TODO - SD Vue UI

> 완료된 작업은 TODO_COMPLETED.md 참조

## In Progress

(없음)

---

## Recently Completed

(없음 - TODO_COMPLETED.md 참조)

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

- [x] Phase 2: 파이프라인 실행 엔진 & UI ✅
  - `usePipeline.js` composable (데이터 구조, 실행 로직)
  - 뷰별 `setOnComplete` 콜백, `setViewReady` 상태
  - Workflow 탭 UI (템플릿, 스텝 표시, 실행 컨트롤)

- [ ] Phase 3: 고급 기능 (선택사항)
  - 스텝별 설정 오버라이드 (프롬프트, 파라미터)
  - 파이프라인 저장/불러오기
  - 커스텀 스텝 추가/제거

## Backlog

(없음)

## Notes
- Use `[x]` for completed tasks
- Use `[ ]` for pending tasks
- Add dates when completing tasks for reference
- Keep this file updated across Claude Code sessions
- 완료된 작업은 TODO_COMPLETED.md로 이동하여 토큰 절약

---
Last updated: 2026-01-06 (모든 생성 탭 백그라운드 생성 완료)
