# TODO - SD Vue UI

## Recently Completed
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

## In Progress
- [ ]

## Planned

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
  - useQueue.js: 싱글톤 패턴 적용 (버그 수정)
  - Created 3 new composables + constants extraction

## Backlog
- [ ]

## Notes
- Use `[x]` for completed tasks
- Use `[ ]` for pending tasks
- Add dates when completing tasks for reference
- Keep this file updated across Claude Code sessions

---
Last updated: 2026-01-01
