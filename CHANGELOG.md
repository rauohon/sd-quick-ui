# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **LoRA Custom Metadata**: Edit and manage custom metadata for LoRAs that lack Civitai information
  - New metadata editing modal with fields for display name, thumbnail URL, trigger words, memo, and default weight
  - Quick edit button (✏️) on LoRA cards for direct metadata access
  - Image filter buttons (All/With Image/No Image) to filter LoRAs by thumbnail status
  - Custom metadata takes priority over Civitai/WebUI data
  - Data persisted in localStorage (`lora_custom_metadata`)
  - New composable `useLoraCustomMetadata.js` with singleton pattern for shared state
  - LazyImage component now emits load/error events for status tracking

- **Prompt Collector**: New feature in Easy Prompts for flexible prompt composition
  - Textarea at the bottom of PromptSelector panel for collecting prompts
  - Green `+` button on prompt card hover overlay to add prompts to collector
  - Prompts are added with comma + newline formatting for easy editing
  - Copy to clipboard button for pasting collected prompts anywhere
  - Clear button to reset the collector
  - Freely editable textarea allows reordering and customizing before copying

- **Easy Prompts Enhancement**: Major improvements to PromptSelector component
  - Subcategory filtering UI - select a category to see subcategory tabs for further filtering
  - Prompt CRUD operations - add, edit, and delete prompts (both default and user-added)
  - Category management - add new custom categories, edit/delete existing ones
  - Import/Export functionality - backup and restore user prompt data as JSON
  - Hover overlay on prompt cards with edit/delete buttons
  - Highlight animation for newly added/imported prompts
  - New composable `useEasyPrompts.js` for prompt data management
  - User data persisted in localStorage (`sd-easy-prompts-data`)

### Fixed
- **Interrupt Button Behavior**: Improved generation interrupt to wait for actual API completion
  - Issue: Clicking interrupt button immediately reset UI regardless of actual API state
  - Solution: Now polls progress API after interrupt request and waits until job actually stops
  - Shows "Interrupting..." status while waiting for API to complete the interruption
  - Maximum wait time of 10 seconds before force cleanup

- **Dynamic Prompt Change Detection**: Fixed spinner showing incorrectly when using dynamic prompt syntax
  - Issue: Spinner appeared even without prompt changes when using `{a|b|c}` dynamic syntax
  - Root cause: API returns resolved prompts (e.g., "a") instead of original syntax, causing false change detection
  - Solution: Store raw prompts in `pendingUsedParams` and preserve them through generation lifecycle
  - Added `resolved_prompt` field to preserve both raw and resolved prompts for combination display

- **Infinite Mode Indicator Bug**: Fixed generating-indicator not updating correctly during infinite mode
  - Issue 1: Indicator stayed visible even after prompt changes were applied
  - Issue 2: Indicator appeared immediately when starting infinite mode without any changes
  - Root cause: Infinite mode loop captured parameters once at start and reused them for all generations
  - Solution: Each generation now fetches the latest parameters from View via callback, ensuring `lastUsedParams` is correctly updated
