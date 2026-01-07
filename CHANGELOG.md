# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
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
- **Infinite Mode Indicator Bug**: Fixed generating-indicator not updating correctly during infinite mode
  - Issue 1: Indicator stayed visible even after prompt changes were applied
  - Issue 2: Indicator appeared immediately when starting infinite mode without any changes
  - Root cause: Infinite mode loop captured parameters once at start and reused them for all generations
  - Solution: Each generation now fetches the latest parameters from View via callback, ensuring `lastUsedParams` is correctly updated
