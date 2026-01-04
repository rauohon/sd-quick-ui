# TODO - SD Vue UI

## Recently Completed
- [x] **img2img 히스토리 패널 리팩토링** (2026-01-04)
  - useHistory, useVirtualScroll 컴포저블 적용 (txt2img와 동일)
  - 인라인 함수 ~150줄 제거, 중복 코드 정리
  - 레이아웃 통일: grid 레이아웃, 입력/출력 이미지 상하 분할
  - 히스토리 패널 접힘 기능 적용
- [x] **img2img 고도화 완료** (2026-01-04)
  - 슬롯 시스템: txt2img와 독립적인 3개 슬롯, IndexedDB 분리 저장
  - 업스케일: /sdapi/v1/extra-single-image API, 업스케일 후 사이즈 올바르게 저장
  - ADetailer: 4개 디테일러 지원, txt2img UI 재사용
  - 북마크/프리셋: txt2img와 데이터 공유, 슬롯 버튼 옆 🔖/⚙️ 버튼 배치
- [x] 24. img2img UI 리팩토링 - txt2img 스타일 통일 (2026-01-04)
  - 3-컬럼 그리드 레이아웃 (설정 : 프롬프트 : 이미지 = 1fr : 1.2fr : 2fr)
  - 설정 패널: AdvancedSettingsPanel 스타일 적용
    - 헤더: ◀/▶ 토글 버튼 + 타이틀 + API 상태
    - 시스템 설정 섹션: 언어, 테마, 크기 자동 보정 (접기/펼치기)
    - 푸터: SD Quick UI + 재연결 버튼
  - 프롬프트 패널: PromptPanel 스타일 적용
    - 헤더: 타이틀 + Generate 버튼 (그라데이션)
    - 프로그레스 영역: 진행바 + 퍼센트 표시
    - 생성 컨트롤: Interrupt/Skip 버튼
    - 슬롯 섹션, 프롬프트 섹션 분리
  - 패널 접힘 시 그리드 동적 변경 (48px 1fr 1.5fr)
  - ADetailer UI 추가 (4개 디테일러, 순서 변경, 프롬프트 모달)
  - LanguageSwitcher 컴포넌트 추가
- [x] 23. img2img 고도화 - 슬롯, 업스케일, 히스토리 패널 (2026-01-04)
  - 슬롯 시스템 구현 (txt2img와 독립적인 3개 슬롯, IndexedDB 분리 저장)
  - 업스케일 기능 추가 (/sdapi/v1/extra-single-image API 사용)
  - 업스케일 후 히스토리에 올바른 사이즈 저장 (512x512 → 1024x1024)
  - 히스토리 패널 완전 구현 (HistoryImageItem, HistoryManagerModal 연동)
  - 즐겨찾기/삭제/파라미터 로드/비교 모달 정상 동작
  - 탭 위치 localStorage 저장 (새로고침 시 유지)
- [x] 22. img2img 기본 기능 구현 (2026-01-04)
  - Tab navigation 구조 추가 (txt2img, img2img, inpaint, workflow)
  - Img2ImgView.vue 생성 (txt2img 패턴 기반)
  - ImageUploadPanel.vue 컴포넌트 (파일 업로드, 드래그앤드롭, 히스토리 선택)
  - useImg2imgGeneration.js 컴포저블 (init_images, denoising_strength 지원)
  - Mock API img2img 엔드포인트 추가
  - 히스토리 통합 관리 (타입 배지로 구분: i2i)
  - i18n 지원 (ko/en)
- [x] 21. History Manager filter and bug fixes (2026-01-03)
  - Added filter dropdown (All / Favorites Only / Interrupted)
  - Filter by interrupted images to easily select and delete skipped/interrupted generations
  - Fixed totalImageCount not updating after batch delete
  - Extended mock API generation time to 10 seconds for testing
- [x] 20. Generation duration tracking (2026-01-03)
  - Record generation start time and calculate duration when complete
  - Save duration (in milliseconds) to IndexedDB with image data
  - Display duration in HistoryDetailModal and HistoryManagerModal
  - Added formatDuration utility function (e.g., "1분 23초", "45초")
  - Added i18n keys: history.duration (ko: "소요 시간", en: "Duration")
- [x] 19. Bookmark update: Show bookmark name in notification (2026-01-02)
  - Display bookmark name in yellow modification notice (e.g., "My Prompt" 북마크 - 프롬프트가 수정됨)
  - Show bookmark name in toast message when updated (e.g., "My Prompt" 북마크가 업데이트되었습니다)
  - Updated i18n keys: promptModified, bookmarkUpdated (with {name} parameter)
- [x] 18. Resizable prompt/image panel (2026-01-02)
  - Added draggable resizer between prompt panel and image area
  - Created useResizer composable for resize logic
  - Width range: 280px ~ 700px
  - Saves width to localStorage for persistence
  - Works correctly when other panels are collapsed
- [x] 17. ADetailer reorder buttons (2026-01-02)
  - Added ▲/▼ buttons to change ADetailer order
  - Buttons disabled at boundaries (first/last) and during generation
  - Wrapped each ADetailer in ad-section div for proper styling
- [x] 16. Keep previous image during generation start (2026-01-02)
  - Removed currentImage reset when generation starts
  - Previous image stays visible until progress returns current_image
  - Smoother UX without blank screen between generations
- [x] 15. Bookmark actions: Add dismiss button (2026-01-02)
  - Added X button to close bookmark modification notice
  - Keeps current prompt as-is, just dismisses the notification
  - Removed unnecessary "revert" feature (user already modified intentionally)
  - Added handleDismissBookmarkNotice to useBookmarkTracking composable
  - Added i18n key: dismissTooltip (ko/en)
- [x] 14. Batch generation: Save all images from batch (2026-01-02)
  - Fixed batch generation only saving first image (now saves batch_size × n_iter images)
  - Each image stores individual seed from all_seeds array
  - Each image stores actual prompt from all_prompts (for Dynamic Prompts support)
  - Updated Mock API to return correct number of images
  - Added watch to update totalImageCount when images are added
- [x] 10. Bookmarks: Enhance bookmark manager with advanced features (2025-12-31)
  - Added import/export functionality (JSON format with merge strategy)
  - Auto-link generated images as thumbnails with manual override option
  - Show update/save-as-new buttons when prompts are modified after applying bookmark
  - Replaced list view with card grid layout (180px cards, LoRA Selector style)
  - Enlarged modal dialogs (800px width, larger textarea inputs: 8 rows/6 rows)
  - Added thumbnail picker modal for selecting images from history
  - Thumbnail placeholders show bookmark name initials when no image
  - Added 17 new i18n translation keys (ko/en)
- [x] 3. Preset: Fix display issues (2025-12-31)
  - Fixed undefined bug in preset summary display
  - Enhanced summary to show batch, hires fix, and ADetailer info
  - Added expandable details view for all preset parameters
  - Added save preview to show what values will be saved when creating preset
- [x] 4. Queue: Increase Add/Edit dialog size to 500x900 (2025-12-31)
  - Increased Add/Edit dialog modal to 500x900
  - Added responsive max-width/max-height for small screens
  - Proportionally increased textarea sizes (positive: 18 rows, negative: 6 rows)
  - Maintained 3:1 ratio for positive/negative prompt inputs
- [x] 5. Queue: Add focus + highlight effect when new item is added (2025-12-31)
  - Automatically scrolls to newly added item
  - Green highlight animation with pulse effect
  - Highlight fades after 2.5 seconds
- [x] 1. Add collapsible panel-footer to Advanced Settings panel for system settings (2025-12-31)
  - Added collapsible System Settings section above footer
  - Moved LanguageSwitcher from header to System Settings section
  - Smooth expand/collapse animation (3:1 transition)
  - Light background styling for better visibility
  - i18n support for System Settings labels
- [x] 2. Bookmarks: Add position selector for applying bookmarks (2025-12-31)
  - Added radio button group in BookmarkManager with 3 modes
  - Replace mode: Completely replaces current prompt (default)
  - Prepend mode: Inserts bookmark prompt at beginning
  - Append mode: Adds bookmark prompt at end
  - Session-only state (resets to "replace" on page refresh)
  - Updated Txt2ImgView to handle all 3 apply modes
  - Added i18n support for mode labels (en/ko)
- [x] 6. Aspect Ratio: Only trigger change on user selection (2025-12-31)
  - Fixed select box not updating when aspect ratio selected
  - Added selectedAspectRatioIndex update in applyAspectRatio function
  - Prevented automatic calculation conflicts with debounce
- [x] 7. Fix swap button switching to Custom aspect ratio (2025-12-31)
  - Swap button correctly maintains aspect ratio selection
  - Already working correctly in useAspectRatio.js
- [x] 8. Width/Height: Calculate relative value immediately on change (2025-12-31)
  - Added 300ms debounce to width/height inputs
  - Prevents service errors during generation
  - Automatic calculation when aspect ratio is selected
- [x] 9. Width/Height: Add confirmation for 8-multiple validation (2025-12-31)
  - Added confirmation dialog when width/height is not 8-multiple
  - Shows original value and corrected value (8-multiple)
  - Clear button labels: "보정" (Apply Correction) vs "유지" (Keep Original)
  - "Don't ask again" checkbox remembers user's choice (either auto-correct OR keep original)
  - Auto-correction toggle in System Settings (can change preference anytime)
  - localStorage persistence for user preference
  - Works on both cancel and confirm with checkbox checked
  - 300ms debounce before validation
  - Toast notification mentions System Settings availability
  - i18n support (en/ko)
- [x] 1. Keyboard shortcuts (2026-01-01)
  - Ctrl/Cmd+Enter: Generate image (works in textareas too)
  - ESC: Close any open modal (LoRA, Prompt, Bookmark, Preset, Queue, ADetailer)
  - Ctrl/Cmd+1/2/3: Switch to slot 1/2/3
  - Ctrl/Cmd+/: Focus prompt input
  - Created useKeyboardShortcuts composable for centralized shortcut management
  - Platform-aware (Cmd on Mac, Ctrl on Windows/Linux)
  - Smart context detection (ignores shortcuts when typing, except Ctrl+Enter)
  - Integrated with existing modal system and slot management
  - Added i18n translation keys (ko/en)
  - Exposed focus method from PromptTextarea component
- [x] 2. Drag & Drop for PNG files (2026-01-01)
  - Created useDragAndDrop composable for global drag & drop handling
  - Visual drop zone overlay with fade-in animation when dragging files
  - PNG file validation (image type, .png extension, max 50MB)
  - Integrated with existing PngInfo extraction and preview modal
  - Drag counter for nested element handling
  - Full-screen blue overlay with 📁 icon and instructional text
  - i18n support for drop zone messages (ko/en)
- [x] 3. Dark mode (2026-01-01)
  - Created useDarkMode composable for theme management (light/dark/system)
  - Added CSS custom properties for theming (--color-bg-*, --color-text-*, --color-border-*)
  - Theme toggle in System Settings with 3 options (Light/Dark/System)
  - Persist theme preference in localStorage
  - System theme follows OS preference with matchMedia listener
  - Updated all components to use CSS variables (21 files modified)
  - Fixed LoraSelector to respect VITE_MOCK_API environment variable
  - i18n support for theme settings (ko/en)
- [x] 4. Virtual scroll for history panels (2026-01-01)
  - Created useVirtualScroll composable for grid-based virtual scrolling
  - Only renders visible items + buffer rows (reduces DOM nodes from 200+ to ~12)
  - Applied to HistoryPanel (fixed 3-column grid)
  - Applied to HistoryManagerModal (dynamic auto-fill columns)
  - Added dynamic column calculation based on container width
  - ResizeObserver for responsive column updates
- [x] 5. Lazy loading for images (2026-01-01)
  - Created LazyImage.vue component with Intersection Observer
  - Shimmer animation placeholder while loading
  - Fade-in effect when image loads
  - Applied to HistoryImageItem, HistoryManagerModal, BookmarkManager, LoraSelector
- [x] 6. Thumbnail optimization (2026-01-01)
  - Separate thumbnail storage (200px, 0.6 quality) from full image (0.9 quality)
  - generateThumbnail function with resize + compression
  - Grid views use thumbnail, detail views use full image
  - Backwards compatible with existing data (fallback to full image)
- [x] 7. Error handling consolidation (2026-01-01)
  - Created useErrorHandler composable with category-based handlers
  - Categories: network, storage, validation, generation, file, general
  - Added logError function for composables without toast dependencies
  - Migrated 10+ composables and 2 components
  - Fixed confirm dialog bug: showConfirm returns {confirmed, dontAskAgain}
  - Changed if(!confirmed) to if(!result?.confirmed) in useHistory.js (4 locations)
- [x] 8. Txt2ImgView.vue refactoring (2026-01-01)
  - Phase 1: Moved constants to constants.js (ASPECT_RATIOS, ADETAILER_*, SLOT_COUNT, etc.)
  - Phase 2: Created usePanelVisibility composable (5 panel states + localStorage persistence)
  - Phase 3: Created useGenerationState composable (20+ generation params + computed + helpers)
  - Phase 4: Created useBookmarkTracking composable (bookmark apply/update/save handlers)
  - Auto-save watchers: Documented and kept in place (20+ refs dependency)
  - UI: Moved bookmark update actions between positive/negative prompts
  - Final: Txt2ImgView.vue 1397 → 1168 lines (-229 lines, 16% reduction)
- [x] 9. App.vue CSS refactoring (2026-01-01)
  - Moved 1270+ lines of global CSS from App.vue to style.css
  - App.vue: 1703 → 430 lines (-75%)
  - Scoped styles remain in App.vue (modal, toast components)
  - Global component styles now in style.css for better maintainability
- [x] 10. AdvancedSettingsPanel.vue refactoring (2026-01-01)
  - Unified updateWidth/updateHeight into single updateDimension function
  - Removed ~60 lines of duplicate code
  - Fixed horizontal scroll issue (padding 12px → 10px)
  - AdvancedSettingsPanel.vue: 931 → 873 lines (-6%)
- [x] 11. QueueManager.vue refactoring (2026-01-01)
  - Unified Add/Edit dialogs into single dialog with mode
  - Fixed useQueue singleton bug (queue state not shared between components)
  - QueueManager.vue: 1064 → 1027 lines (-3%)
- [x] 12. LoraSelector.vue refactoring (2026-01-01)
  - Created useCivitaiCache.js composable (Civitai API 캐시 관리)
  - Created loraUtils.js (LoRA 메타데이터 유틸 함수)
  - LoraSelector.vue: 879 → 728 lines (-17%)
- [x] 13. History 컴포넌트 날짜 유틸 통합 (2026-01-01)
  - Created dateUtils.js (formatTimestamp, formatFullTimestamp)
  - 3개 컴포넌트에서 중복 코드 제거: HistoryImageItem, HistoryDetailModal, HistoryManagerModal
  - HistoryImageItem.vue: 110 → 79 lines (-28%)
  - HistoryDetailModal.vue: 691 → 656 lines (-5%)
  - HistoryManagerModal.vue: 1352 → 1319 lines (-2%)
  - Added documentation comments to PresetManager.vue, HistoryManagerModal.vue

## In Progress
- [ ] Inpaint/Outpainting 기능 구현 (5단계 완료)

### Inpaint 4단계 완료 ✅ (2026-01-05)
- [x] 4.1 마스크 설정 UI
  - Mask Blur, Masked Content, Inpaint Area
  - Only Masked Padding (조건부 표시)
- [x] 4.2 기본 생성 파라미터
  - Checkpoint, Sampler, Scheduler 추가
  - Width/Height, Denoising, Seed, Steps, CFG, Batch
- [x] 4.3 UI 개선
  - 섹션 구분 타이틀 추가 (INPAINT 설정, 생성 파라미터)
  - 슬라이더 → 숫자 입력 변경 (Denoising, Mask Blur, Padding)
  - 프롬프트 패널 헤더 높이 통일 (Inpaint, img2img)

### Inpaint 3단계 완료 ✅ (2026-01-05)
- [x] 3.1 드래그앤드롭 강화
  - 캔버스 영역에 직접 드래그앤드롭
  - 드롭 시 시각적 피드백 (파란색 오버레이, 펄스 애니메이션)
  - 파일 타입 검증 (PNG, JPG, WebP)
- [x] 3.2 클립보드 붙여넣기 (Ctrl+V)
  - 스크린샷 직접 붙여넣기 지원
  - 입력 필드 외 영역에서만 동작
- [x] 3.3 이미지 정보 표시
  - 이미지 크기, 파일 크기, 포맷 상시 표시
  - 이미지 정보 바 UI
- [x] 3.4 이미지 관리 기능
  - 이미지 제거 버튼 (X)
  - 이미지 교체 시 마스크 초기화 확인 다이얼로그
- [x] 3.5 캔버스 뷰 조작
  - 줌 인/아웃 (마우스 휠, +/- 버튼)
  - 패닝 (스페이스바 + 드래그)
  - Fit to Screen 버튼
  - 현재 줌 레벨 표시 (%)
- [x] 3.6 i18n 키 추가
  - bookmark.manager 누락 수정
  - inpaint.fit 키 추가

### Inpaint 2단계 완료 ✅ (2026-01-04)
- [x] MaskCanvas.vue 컴포넌트 생성
  - HTML5 Canvas 기반 마스크 그리기
  - 이미지 레이어 + 마스크 레이어 분리
  - 반투명 빨간색 오버레이
- [x] 브러시/지우개 도구 구현
  - 브러시 크기 조절 (1~200px)
  - 원형 브러시 커서 표시 (점선)
- [x] 마스크 편집 기능
  - 채우기/지우기/반전
- [x] Undo/Redo (최대 20단계, Ctrl+Z/Y)
- [x] 마스크 → Base64 변환 (흑백 PNG)
- [x] InpaintView에 MaskCanvas 연동

### Inpaint 1단계 완료 ✅ (2026-01-04)
- [x] InpaintView.vue 기본 구조 생성
  - img2img 패턴 기반 3-컬럼 레이아웃 (280px / 300px / 1fr)
  - 설정 패널 / 프롬프트 패널 / 캔버스+히스토리 영역
  - App.vue에서 inpaint 탭 연결
- [x] useInpaintGeneration.js 컴포저블 생성
  - useImg2imgGeneration.js 기반
  - mask 파라미터 추가 (base64)
  - inpaint 전용 파라미터 (mask_blur, inpainting_fill 등)
- [x] i18n 키 추가 (ko.js, en.js)
  - inpaint 관련 라벨, 툴팁, 메시지
- [x] constants.js에 Inpaint 상수 추가
  - INPAINT_PARAM_RANGES, INPAINT_FILL_OPTIONS, INPAINT_AREA_OPTIONS
- [x] img2img, inpaint 레이아웃 너비 통일
  - txt2img와 동일한 고정 너비 (280px / 300px / 1fr)

### img2img 히스토리 패널 리팩토링 ✅ (2026-01-04)
- [x] 1. useHistory 컴포저블 적용
  - 인라인 히스토리 로직 제거
  - useHistory 컴포저블 import 및 연동
- [x] 2. Virtual Scroll 적용
  - useVirtualScroll 컴포저블 적용
  - historyPanelRef 연결
- [x] 3. 중복 코드 정리
  - toggleImageFavorite, deleteImage 등 인라인 함수 제거
  - useHistory에서 제공하는 함수 사용
- [x] 4. 레이아웃 txt2img와 통일
  - image-area: grid 레이아웃 (1fr 420px)
  - 이미지 컬럼: 입력 이미지(상단) + 출력 이미지(하단) 상하 분할
  - 히스토리 패널 접힘 기능 동일하게 적용

## Planned

### Inpaint/Outpainting 구현

#### 1단계: 기본 구조 생성 ✅
- [x] 1.1 InpaintView.vue 생성
  - img2img 패턴 기반 3-컬럼 레이아웃 (280px / 300px / 1fr)
  - 설정 패널 / 프롬프트 패널 / 캔버스+히스토리 영역
  - App.vue에서 inpaint 탭 연결
- [x] 1.2 useInpaintGeneration.js 컴포저블 생성
  - useImg2imgGeneration.js 기반
  - mask 파라미터 추가 (base64)
  - inpaint 전용 파라미터 (mask_blur, inpainting_fill 등)
- [x] 1.3 i18n 키 추가 (ko.js, en.js)
  - inpaint 관련 라벨, 툴팁, 메시지
- [x] 1.4 constants.js에 Inpaint 상수 추가

#### 2단계: 마스크 캔버스 컴포넌트 ✅
- [x] 2.1 MaskCanvas.vue 컴포넌트 생성
  - HTML5 Canvas 기반 마스크 그리기
  - 이미지 레이어 + 마스크 레이어 분리
  - 마스크 색상: 반투명 빨간색 오버레이
- [x] 2.2 브러시 도구 구현
  - 브러시 크기 조절 (1~200px)
  - 원형 브러시 커서 표시 (점선)
- [x] 2.3 지우개 도구 구현
  - 마스크 영역 지우기
  - 브러시와 동일한 크기 설정 공유
- [x] 2.4 마스크 편집 기능
  - 마스크 전체 채우기 (Fill All)
  - 마스크 전체 지우기 (Clear All)
  - 마스크 반전 (Invert Mask)
- [x] 2.5 Undo/Redo 기능
  - 마스크 히스토리 스택 (최대 20단계)
  - Ctrl+Z / Ctrl+Y 단축키
- [x] 2.6 마스크 → Base64 변환 (흑백 PNG)

#### 3단계: 이미지 입력 기능 강화 ✅
> 기본 기능(파일 업로드, 히스토리 선택)은 1단계에서 구현됨. 3단계는 고급 기능 추가.

- [x] 3.1 드래그앤드롭 강화
  - 캔버스 영역에 직접 드래그앤드롭
  - 드롭 시 시각적 피드백 (오버레이, 테두리 하이라이트)
  - 파일 타입 검증 (PNG, JPG, WebP만 허용)
  - 에러 메시지 표시 (지원하지 않는 형식)

- [x] 3.2 클립보드 붙여넣기
  - Ctrl+V로 클립보드 이미지 붙여넣기
  - 스크린샷 직접 붙여넣기 지원
  - 붙여넣기 성공/실패 토스트 알림

- [x] 3.3 이미지 정보 표시
  - 이미지 크기 (width x height) 상시 표시
  - 파일 크기 표시 (KB/MB)
  - 이미지 포맷 표시

- [x] 3.4 이미지 관리 기능
  - 이미지 제거 버튼 (X 버튼)
  - 이미지 교체 시 마스크 초기화 확인 다이얼로그

- [x] 3.5 캔버스 뷰 조작
  - 줌 인/아웃 (마우스 휠 또는 +/- 버튼)
  - 패닝 (스페이스바 + 드래그)
  - Fit to Screen 버튼
  - 현재 줌 레벨 표시

- [x] 3.6 i18n 키 추가
  - 드래그앤드롭 관련 메시지
  - 클립보드 관련 메시지
  - 이미지 정보 라벨
  - bookmark.manager 누락 수정

#### 4단계: Inpaint 설정 UI ✅
- [x] 4.1 마스크 설정
  - Mask blur (0~64px): 마스크 경계 블러
  - Masked content (original/fill/latent noise/latent nothing)
  - Inpaint area (Whole picture / Only masked)
- [x] 4.2 Only masked 설정
  - Only masked padding (0~256px)
  - 고해상도 inpaint를 위한 패딩
- [x] 4.3 기본 생성 파라미터
  - img2img와 동일: steps, CFG, sampler, scheduler, seed 등
  - Denoising strength
- [x] 4.4 UI 개선
  - 섹션 구분 타이틀, 슬라이더→숫자입력, 헤더 높이 통일

#### 5단계: Outpainting 기능 (상세)

##### 5.1 확장 컨트롤 UI ✅ (2026-01-05)
- [x] 확장 방향별 픽셀 입력 (상/하/좌/우 개별 입력)
- [x] 프리셋 버튼: 64 / 128 / 256 / 512
- [x] "확장 적용" 버튼
- [x] 확장 미리보기 (원본→확장 크기 표시)
- [x] 확장 취소/리셋 기능
- [x] i18n 키 추가 (outpaint 관련 15개 키)

##### 5.2 MaskCanvas 확장 지원 ✅ (2026-01-05)
- [x] 캔버스 크기 ≠ 이미지 크기 분리
  - imageWidth/Height (원본) vs canvasWidth/Height (computed, 확장 포함)
  - imageOffset 상태 관리 {x, y} - 원본 이미지의 캔버스 내 위치
- [x] 확장 영역 시각화
  - 체크무늬 패턴으로 확장 영역 표시
  - 파란색 점선으로 원본 이미지 경계 표시
- [x] 확장 영역 자동 마스킹
  - 확장 적용 시 확장 영역 자동으로 빨간색 마스크 채움
  - 기존 마스크 보존하며 새 위치로 이동
- [x] 확장 리셋 시 마스크 초기화
- [x] 브러시/지우개가 확장 영역에서도 동작
- [x] 줌/패닝 시 확장 영역 포함

##### 5.3 확장 이미지 생성 ✅ (2026-01-05)
- [x] 새 캔버스 생성 (원본 + 확장 크기)
- [x] 확장 영역 채우기 옵션 UI
  - fill: 단색 채우기 (검정/회색/흰색 선택)
  - noise: 랜덤 노이즈
- [x] generateExpandedImage() 함수 구현
  - 원본 이미지를 올바른 offset 위치에 배치
  - 확장된 이미지 → Base64 변환
- [x] i18n 키 추가 (expandFill, fillSolid, fillNoise)

##### 5.4 확장 마스크 생성 ✅ (2026-01-05)
- [x] 확장 영역 자동 마스킹 (5.2에서 autoMaskExpansionArea() 구현)
- [x] 수동 마스크와 OR 연산 병합
  - 확장 영역: 자동 마스크 + 수동 마스크
  - 원본 영역: 수동 마스크만 적용
- [x] getMaskBase64() 함수 추가 - API 전송용 흑백 마스크 반환
- [x] getExpandedMask() 함수 개선

##### 5.5 상태 관리 ✅ (2026-01-05)
- [x] 확장 전/후 상태 분리
  - initImage: 원본 이미지 (확장 전)
  - generateExpandedImage(): 확장된 이미지 (API 전송용)
  - expandTop/Bottom/Left/Right: 확장 오프셋
- [x] resetExpansionState() 함수 추가 (내부용)
- [x] 확장 리셋 시 원본으로 복귀
- [x] 이미지 교체 시 확장 상태 초기화 + 확인 다이얼로그
- [x] 이미지 제거 시 확장 상태 초기화 + 확인 다이얼로그

##### 5.6 테스트 및 8배수 검증 ✅ (2026-01-05)
- [x] 한 방향만 확장 (예: 오른쪽 256px)
- [x] 여러 방향 동시 확장 (예: 상하좌우 128px씩)
- [x] 확장 후 추가 수동 마스킹
- [x] 확장 취소 후 재확장
- [x] 8의 배수 검증
  - 자동 보정 활성화: 확장값 자동 보정 + 토스트
  - 자동 보정 비활성화: 경고 토스트 + 그대로 적용
- [x] SystemSettingsSection 컴포넌트 분리
  - 언어/테마/8배수 자동보정 설정 통합
  - txt2img, img2img, inpaint 모든 탭에서 공유

#### 6단계: API 연동
- [ ] 6.1 마스크 → Base64 변환
  - Canvas에서 마스크 레이어만 추출
  - 흑백 이미지로 변환 (흰색=마스크 영역)
  - Base64 인코딩
- [ ] 6.2 /sdapi/v1/img2img 호출
  - init_images: 원본 이미지
  - mask: 마스크 이미지 (base64)
  - mask_blur, inpainting_fill, inpaint_full_res 등
- [ ] 6.3 Mock API 지원
  - mockData.js에 inpaint 응답 추가

#### 7단계: UI/UX 완성
- [ ] 7.1 툴바 UI
  - 브러시/지우개 토글
  - 브러시 크기 슬라이더
  - Undo/Redo 버튼
  - 마스크 채우기/지우기/반전 버튼
- [ ] 7.2 캔버스 조작
  - 줌 인/아웃 (마우스 휠)
  - 패닝 (스페이스바 + 드래그)
  - Fit to screen 버튼
- [ ] 7.3 키보드 단축키
  - B: 브러시 도구
  - E: 지우개 도구
  - [/]: 브러시 크기 감소/증가
  - Ctrl+Z/Y: Undo/Redo
  - Ctrl+I: 마스크 반전
- [ ] 7.4 슬롯/북마크/프리셋 연동
  - inpaint 전용 슬롯 (IndexedDB 분리)
  - 북마크/프리셋 공유 (txt2img, img2img와 동일)
- [ ] 7.5 히스토리 통합
  - 생성된 이미지 히스토리에 저장
  - 타입 배지: "inp" 표시

#### 8단계: 고급 기능 (선택)
- [ ] 8.1 마스크 저장/불러오기
  - 마스크를 PNG로 저장
  - 저장된 마스크 불러오기
- [ ] 8.2 Soft inpainting 지원
  - Schedule bias, Preservation strength 등
  - WebUI의 soft inpainting 확장 연동

---

### ControlNet 연동
- [ ] 6. ControlNet 연동
  - ControlNet 모델 목록 로드
  - 프리프로세서 선택
  - 컨트롤 이미지 업로드
  - weight, guidance 설정
- [ ] 7. Workflow 저장 기능
  - 전체 생성 설정을 JSON으로 저장/불러오기
  - 워크플로우 목록 관리
  - 가져오기/내보내기

### Performance Optimization
- [x] 3. Image loading optimization ✅ Completed (2026-01-01)
  - ~~Virtual scrolling for history panel (200 images can be heavy)~~ ✅ Done
  - ~~Lazy loading for off-screen images~~ ✅ Done
  - ~~Optimize thumbnail quality/size (current: WebP 0.9)~~ ✅ Done
  - Consider progressive loading for large images (optional, low priority)

### Code Quality
- [x] 4. Error handling consolidation ✅ Completed (2026-01-01)
- [x] 5. Component refactoring ✅ Completed (2026-01-01)
  - Txt2ImgView.vue: 1397 → 1168 lines (-16%)
  - App.vue: 1703 → 430 lines (-75%, CSS → style.css)
  - AdvancedSettingsPanel.vue: 931 → 873 lines (-6%, 중복 제거)
  - QueueManager.vue: 1064 → 1027 lines (-3%, 다이얼로그 통합)
  - LoraSelector.vue: 879 → 728 lines (-17%, 로직 분리)
  - HistoryImageItem.vue: 110 → 79 lines (-28%, 날짜 유틸 분리)
  - HistoryDetailModal.vue: 691 → 656 lines (-5%, 날짜 유틸 분리)
  - HistoryManagerModal.vue: 1352 → 1319 lines (-2%, 날짜 유틸 분리)
  - useQueue.js: 싱글톤 패턴 적용 (버그 수정)
  - Created useCivitaiCache.js, loraUtils.js, dateUtils.js
  - Created 3 new composables + constants extraction

## Backlog
- [ ]

## Notes
- Use `[x]` for completed tasks
- Use `[ ]` for pending tasks
- Add dates when completing tasks for reference
- Keep this file updated across Claude Code sessions

---
Last updated: 2026-01-05
