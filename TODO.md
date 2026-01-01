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

## In Progress
- [ ]

## Planned

### Performance Optimization
- [ ] 3. Image loading optimization
  - Virtual scrolling for history panel (200 images can be heavy)
  - Lazy loading for off-screen images
  - Optimize thumbnail quality/size (current: WebP 0.9)
  - Consider progressive loading for large images

### Code Quality
- [ ] 4. Error handling consolidation
  - Create global error handler composable
  - Standardize error messages and toast patterns
  - Replace scattered try/catch blocks
  - Add error boundary for critical failures
- [ ] 5. Component refactoring
  - Split Txt2ImgView.vue (800+ lines is too large)
  - Extract repeated logic into composables
  - Improve component hierarchy and data flow
  - Reduce prop drilling

## Backlog
- [ ]

## Notes
- Use `[x]` for completed tasks
- Use `[ ]` for pending tasks
- Add dates when completing tasks for reference
- Keep this file updated across Claude Code sessions

---
Last updated: 2026-01-01
