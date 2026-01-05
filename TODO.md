# TODO - SD Vue UI

> 완료된 작업은 TODO_COMPLETED.md 참조

## In Progress

(없음)

---

## Recently Completed

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

### ControlNet 연동
- [ ] ControlNet 모델 목록 로드
- [ ] 프리프로세서 선택
- [ ] 컨트롤 이미지 업로드
- [ ] weight, guidance 설정

### Workflow 저장 기능
- [ ] 전체 생성 설정을 JSON으로 저장/불러오기
- [ ] 워크플로우 목록 관리
- [ ] 가져오기/내보내기

## Backlog
- [ ]

## Notes
- Use `[x]` for completed tasks
- Use `[ ]` for pending tasks
- Add dates when completing tasks for reference
- Keep this file updated across Claude Code sessions
- 완료된 작업은 TODO_COMPLETED.md로 이동하여 토큰 절약

---
Last updated: 2026-01-05
