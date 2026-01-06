# COMPLETED - SD Vue UI

> 완료된 작업 기록. TODO.md에서 분리하여 토큰 절약.

## 2026-01-06

### 탭 이동 시에도 이미지 생성 유지 (txt2img, img2img, inpaint)
- `useGenerationEngine.js` composable 생성 (App.vue 레벨)
- App.vue에서 provide/inject로 엔진 공유
- 모든 생성 뷰에서 inject로 엔진 사용
- 탭 전환 시 경고 다이얼로그 제거
- inpaint: 탭 전환 시 initImage/mask 상태 저장 및 복원
- MaskCanvas에 `loadMask` 함수 추가

## 2026-01-05

### 파이프라인 Phase 2: 실행 엔진 & UI
- `usePipeline.js` composable (데이터 구조 & 실행 엔진)
- 각 뷰에 `setOnComplete` 콜백 추가
- Workflow 탭 UI (템플릿 선택, 스텝 표시, 실행/중지/초기화)

### 파이프라인 Phase 1: 이미지 전달 메커니즘
- `usePipelineImage.js` composable (싱글톤 패턴)
- 히스토리 패널에 "Send to" 버튼 추가
- 탭 자동 전환 + 이미지 자동 로드

### ControlNet 연동 구현
- API: `useControlNet.js` (모델/모듈 조회, 프리프로세서 미리보기)
- UI: `ControlNetPanel.vue`, `ControlNetManager.vue`
- 빠른 프리셋: OpenPose, Canny, Depth, Lineart, Tile

### Img2ImgView / InpaintView 리팩토링
- 4,616줄 → 2,303줄 (50% 절감)
- 공통 스타일, composables, 컴포넌트 추출

### Inpaint/Outpainting 기능 구현 완료
- 1단계: 기본 구조 생성 (InpaintView, useInpaintGeneration)
- 2단계: 마스크 캔버스 컴포넌트 (MaskCanvas, 브러시/지우개, Undo/Redo)
- 3단계: 이미지 입력 기능 강화 (드래그앤드롭, 클립보드, 줌/패닝)
- 4단계: Inpaint 설정 UI (Mask Blur, Masked Content, Inpaint Area)
- 5단계: Outpainting 기능 (확장 UI, 자동 마스킹, 8배수 검증)
- 6단계: API 연동 (Generate, Mock API 개선, 결과 표시)
- 7단계: UI/UX 완성 (키보드 단축키 B/E/[/]/Ctrl+I)
- 8단계: 스킵 (Soft inpainting - 선택 기능)

## 2026-01-04

### img2img 히스토리 패널 리팩토링
- useHistory, useVirtualScroll 컴포저블 적용
- 인라인 함수 ~150줄 제거, 중복 코드 정리
- 레이아웃 통일: grid 레이아웃, 입력/출력 이미지 상하 분할

### img2img 고도화 완료
- 슬롯 시스템: txt2img와 독립적인 3개 슬롯, IndexedDB 분리 저장
- 업스케일: /sdapi/v1/extra-single-image API
- ADetailer: 4개 디테일러 지원
- 북마크/프리셋: txt2img와 데이터 공유

### img2img UI 리팩토링
- 3-컬럼 그리드 레이아웃 (설정 : 프롬프트 : 이미지)
- 설정 패널: AdvancedSettingsPanel 스타일 적용
- 프롬프트 패널: PromptPanel 스타일 적용
- ADetailer UI 추가

### img2img 기본 기능 구현
- Tab navigation 구조 추가 (txt2img, img2img, inpaint, workflow)
- Img2ImgView.vue 생성, ImageUploadPanel.vue 컴포넌트
- useImg2imgGeneration.js 컴포저블
- Mock API img2img 엔드포인트 추가

## 2026-01-03

### History Manager filter and bug fixes
- Filter dropdown (All / Favorites Only / Interrupted)
- Fixed totalImageCount not updating after batch delete

### Generation duration tracking
- Record generation start time and calculate duration
- Display duration in HistoryDetailModal and HistoryManagerModal

## 2026-01-02

### Bookmark update: Show bookmark name in notification
### Resizable prompt/image panel (280px ~ 700px)
### ADetailer reorder buttons (▲/▼)
### Keep previous image during generation start
### Bookmark actions: Add dismiss button
### Batch generation: Save all images from batch

## 2026-01-01

### Keyboard shortcuts
- Ctrl/Cmd+Enter: Generate image
- ESC: Close modals
- Ctrl/Cmd+1/2/3: Switch slots
- Ctrl/Cmd+/: Focus prompt

### Drag & Drop for PNG files
### Dark mode (light/dark/system)
### Virtual scroll for history panels
### Lazy loading for images
### Thumbnail optimization (200px, 0.6 quality)
### Error handling consolidation

### Component refactoring
- Txt2ImgView.vue: 1397 → 1168 lines (-16%)
- App.vue: 1703 → 430 lines (-75%)
- AdvancedSettingsPanel.vue: 931 → 873 lines (-6%)
- QueueManager.vue: 1064 → 1027 lines (-3%)
- LoraSelector.vue: 879 → 728 lines (-17%)
- History components: 날짜 유틸 통합

## 2025-12-31

### Bookmarks: Enhance bookmark manager
- Import/export functionality
- Auto-link generated images as thumbnails
- Card grid layout (180px cards)
- Thumbnail picker modal

### Preset: Fix display issues
### Queue: Increase Add/Edit dialog size
### Queue: Add focus + highlight effect
### Collapsible System Settings section
### Bookmarks: Add position selector (Replace/Prepend/Append)
### Aspect Ratio fixes
### Width/Height 8-multiple validation

---
Last updated: 2026-01-06
