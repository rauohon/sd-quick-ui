# TODO - SD Vue UI

> 완료된 작업은 TODO_COMPLETED.md 참조

## In Progress

### ControlNet 연동 구현

> **목표**: txt2img, img2img, inpaint 뷰에서 ControlNet 사용 가능하게 구현

#### Phase 1: API 레이어 구축 ✅
- [x] `src/composables/useControlNet.js` 생성
  - [x] `fetchModels()` - GET /controlnet/model_list
  - [x] `fetchModules()` - GET /controlnet/module_list (프리프로세서 + 슬라이더 정보)
  - [x] `detectPreprocess()` - POST /controlnet/detect (프리프로세서 미리보기)
  - [x] ControlNet 유닛 상태 관리 (최대 3개 유닛)
  - [x] 기본값 및 상수 정의 (`src/config/constants.js`에 추가)
  - [x] Mock API 지원 (`src/api/mockData.js`에 추가)

#### Phase 2: UI 컴포넌트 개발 ✅
- [x] `src/components/ControlNetPanel.vue` 생성
  - [x] 유닛 탭 (Unit 0, 1, 2)
  - [x] Enable 토글
  - [x] 컨트롤 이미지 업로드 (드래그앤드롭, 클립보드)
  - [x] 모델 선택 드롭다운
  - [x] 프리프로세서(Module) 선택 드롭다운 (카테고리별 그룹핑)
  - [x] 동적 슬라이더 (프리프로세서별 설정)
  - [x] Weight 슬라이더 (0-2)
  - [x] Guidance Start/End 슬라이더 (0-1)
  - [x] Control Mode 선택
  - [x] Resize Mode 선택
  - [x] Pixel Perfect 옵션
  - [x] 프리프로세서 미리보기 버튼 + 결과 표시
  - [x] i18n 번역 (ko.js, en.js)

#### Phase 3: 생성 로직 통합
- [ ] `useImageGeneration.js` 수정
  - [ ] `alwayson_scripts.controlnet` 파라미터 구성
  - [ ] 이미지 Base64 인코딩 처리
  - [ ] 다중 유닛 지원
- [ ] img2img, inpaint API 호출에도 ControlNet 적용

#### Phase 4: 뷰 통합
- [ ] `Txt2ImgView.vue`에 ControlNetPanel 추가
  - [ ] AdvancedSettingsPanel 내부 또는 별도 섹션
- [ ] `Img2ImgView.vue`에 ControlNetPanel 추가
- [ ] `InpaintView.vue`에 ControlNetPanel 추가

#### Phase 5: 슬롯 & 프리셋 연동
- [ ] 슬롯 저장 시 ControlNet 설정 포함
- [ ] 프리셋 저장 시 ControlNet 설정 포함 (선택적)
- [ ] PNG Info에서 ControlNet 파라미터 파싱 (있을 경우)

#### Phase 6: i18n & 테스트
- [ ] 번역 키 추가 (`en.js`, `ko.js`)
- [ ] Mock API 지원 (`src/mocks/controlnetMock.js`)
- [ ] 수동 테스트 및 버그 수정

#### 기술 참고사항
```javascript
// ControlNet API 요청 예시
{
  "alwayson_scripts": {
    "controlnet": {
      "args": [{
        "enabled": true,
        "module": "openpose",        // 프리프로세서
        "model": "control_v11p_sd15_openpose_fp16 [73c2b67d]",
        "image": "base64...",        // 컨트롤 이미지
        "weight": 1.0,
        "resize_mode": 1,            // 0=Resize, 1=Crop, 2=Fill
        "control_mode": 0,           // 0=Balanced, 1=My prompt, 2=ControlNet
        "guidance_start": 0.0,
        "guidance_end": 1.0,
        "processor_res": 512,        // 프리프로세서 해상도
        "threshold_a": 100,          // 프리프로세서별 파라미터
        "threshold_b": 200
      }]
    }
  }
}
```

**사용 가능한 프리프로세서**: openpose, canny, depth, lineart, softedge, ip-adapter, reference, tile, inpaint 등 60+종
**설치된 모델**: control_v11p_sd15_openpose_fp16

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
Last updated: 2026-01-05 (ControlNet Phase 2 완료)
