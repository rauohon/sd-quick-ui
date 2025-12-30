# TODO - SD Vue UI

## Recently Completed
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

## In Progress
- [ ]

## Planned

### UI/UX Improvements
- [ ] 1. Add collapsible panel-footer to Advanced Settings panel for system settings (language, etc.)
  - If many settings: consider modal or replace image area
  - If few settings: collapsible footer panel
- [ ] 2. Bookmarks: Add position selector for applying bookmarks
  - Options: Replace current, Insert at beginning, Append at end
- [ ] 6. Aspect Ratio: Only trigger change on user selection
  - Prevent automatic calculation from triggering change events
  - Fix conflict with value changes
- [ ] 7. Fix swap button switching to Custom aspect ratio (likely related to #6)
- [ ] 8. Width/Height: Calculate relative value immediately on change
  - Only when Aspect Ratio is not "Custom"
  - Use lazy event to prevent service errors during generation
- [ ] 9. Width/Height: Add confirmation for 8-multiple rounding
  - Show confirmation dialog with rounded value
  - Add "Don't ask again" checkbox
  - If checked, auto-accept without validation

## Backlog
- [ ]

## Notes
- Use `[x]` for completed tasks
- Use `[ ]` for pending tasks
- Add dates when completing tasks for reference
- Keep this file updated across Claude Code sessions

---
Last updated: 2025-12-31
