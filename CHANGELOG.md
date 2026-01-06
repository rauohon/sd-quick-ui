# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Infinite Mode Indicator Bug**: Fixed generating-indicator not updating correctly during infinite mode
  - Issue 1: Indicator stayed visible even after prompt changes were applied
  - Issue 2: Indicator appeared immediately when starting infinite mode without any changes
  - Root cause: Infinite mode loop captured parameters once at start and reused them for all generations
  - Solution: Each generation now fetches the latest parameters from View via callback, ensuring `lastUsedParams` is correctly updated
