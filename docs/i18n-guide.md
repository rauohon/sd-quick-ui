# i18n Developer Guide

## Overview

This project uses **Vue I18n 9.x** for internationalization with support for Korean (ko) and English (en) languages. All UI text is externalized to translation files for easy localization.

## Quick Start

### Using Translations in Components

#### 1. Template Usage

```vue
<template>
  <!-- Simple translation -->
  <h1>{{ $t('common.title') }}</h1>

  <!-- With dynamic parameters -->
  <p>{{ $t('lora.addedToPrompt', { name: loraName }) }}</p>

  <!-- In attributes -->
  <button :title="$t('common.cancel')">Cancel</button>
</template>
```

#### 2. Script Usage (Composition API)

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

function showMessage() {
  // Simple translation
  props.showToast(t('common.success'), 'success')

  // With dynamic parameters
  props.showToast(t('lora.addedToPrompt', { name: lora.name }), 'success')
}
</script>
```

## Translation File Structure

Translation files are located in `src/i18n/locales/`:
- `ko.js` - Korean translations (422 keys)
- `en.js` - English translations (422 keys)

### File Format

```javascript
export default {
  common: {
    cancel: 'Cancel',
    apply: 'Apply',
    // ...
  },
  prompt: {
    positive: 'Prompt',
    negative: 'Negative Prompt',
    // ...
  },
  // ... more sections
}
```

### Current Translation Sections

- `common` - Common UI elements (buttons, actions, states)
- `prompt` - Prompt-related text
- `promptPanel` - Prompt panel specific
- `lora` - LoRA selector
- `bookmark` - Bookmark manager
- `history` - History panel
- `queue` - Queue manager
- `preset` - Preset manager
- `settings` - Settings panel
- `advancedSettings` - Advanced settings
- `params` - Generation parameters
- `imagePreview` - Image preview panel
- `lastParams` - Last generation settings
- `adetailer` - ADetailer settings
- `pngInfo` - PNG info viewer
- `message` - Toast messages
- `validation` - Form validation
- `notification` - Browser notifications
- `api` - API status messages
- `time` - Time-related text
- `generation` - Generation status
- `infiniteMode` - Infinite mode
- `button` - Button labels

## Adding New Translations

### Step 1: Add Keys to Translation Files

Add the same key to both `ko.js` and `en.js`:

```javascript
// src/i18n/locales/ko.js
export default {
  // ...existing keys
  mySection: {
    newKey: '새로운 한국어 텍스트',
    withParam: '{count}개의 항목'
  }
}
```

```javascript
// src/i18n/locales/en.js
export default {
  // ...existing keys
  mySection: {
    newKey: 'New English text',
    withParam: '{count} items'
  }
}
```

### Step 2: Use in Components

```vue
<template>
  <p>{{ $t('mySection.newKey') }}</p>
  <p>{{ $t('mySection.withParam', { count: 5 }) }}</p>
</template>
```

### Step 3: Validate

Run validation scripts to ensure consistency:

```bash
npm run test:i18n
```

## Dynamic Parameters

Use `{paramName}` placeholders in translation strings:

```javascript
// Translation file
export default {
  message: {
    itemsSelected: '{count} items selected',
    greeting: 'Hello, {name}!'
  }
}
```

```vue
<!-- Component usage -->
<template>
  <p>{{ $t('message.itemsSelected', { count: selectedItems.length }) }}</p>
  <p>{{ $t('message.greeting', { name: userName }) }}</p>
</template>
```

**Important**: Parameter names must match exactly between translation strings and component usage. The validation script will catch mismatches.

## Language Switching

Users can switch languages using the `LanguageSwitcher` component (globe icon in UI). The selected language is persisted to `localStorage`.

```javascript
// Accessing current locale
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
console.log(locale.value) // 'ko' or 'en'

// Changing locale programmatically
locale.value = 'en'
```

## Validation Scripts

### 1. Verify Translations (`npm run i18n:verify`)

Checks that:
- Korean and English files have the same number of keys
- All parameter placeholders match between ko/en

### 2. Validate Usage (`npm run i18n:validate-usage`)

Checks that:
- All translation keys used in components exist in translation files
- Reports unused translation keys (informational only)

Current status: **204/422 keys used** (48% usage rate)

### 3. Validate Parameters (`npm run i18n:validate-params`)

Checks that:
- Dynamic parameters in component usage match placeholders in translation strings
- Supports both standard `{ key: value }` and ES6 shorthand `{ key }`

Current status: **22 dynamic calls validated**

### 4. Run All Validations

```bash
npm run test:i18n
```

This runs all three validation scripts in sequence and exits with error if any validation fails.

## Best Practices

### 1. Key Naming Convention

Use descriptive, hierarchical keys:
- ✅ `prompt.positive` - Clear section and purpose
- ✅ `history.clearConfirm` - Action and intent
- ❌ `text1` - Not descriptive
- ❌ `positivePrompt` - Missing section

### 2. Key Reuse

Reuse common keys across components:
- `common.cancel`, `common.apply`, `common.close`
- `common.done`, `common.confirm`, `common.delete`
- Reduces duplication and improves consistency

### 3. Dynamic Parameters

Use clear, semantic parameter names:
- ✅ `{ name, count, status }`
- ❌ `{ param1, x, val }`

### 4. Avoid Hardcoded Text

Always use translation keys, never hardcode UI text:

```vue
<!-- ❌ Bad -->
<button>Cancel</button>

<!-- ✅ Good -->
<button>{{ $t('common.cancel') }}</button>
```

### 5. Validation Before Commit

Always run validations before committing translation changes:

```bash
npm run test:i18n
```

## Common Patterns

### Toast Messages

```javascript
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Success message
props.showToast(t('lora.refreshed'), 'success')

// Error message
props.showToast(t('lora.loadFailed'), 'error')

// With parameters
props.showToast(t('lora.addedToPrompt', { name: lora.name }), 'success')
```

### Conditional Text

```vue
<template>
  <button :title="isExpanded ? $t('history.hidePanel') : $t('history.showPanel')">
    {{ isExpanded ? '▼' : '▲' }}
  </button>
</template>
```

### Default Props with i18n

```javascript
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  title: { type: String, default: null }
})

const { t } = useI18n()

// Use computed to provide i18n fallback
const displayTitle = computed(() => props.title || t('common.confirm'))
```

## Troubleshooting

### Missing Translation Warning

If you see `[intlify] Not found 'key.name' key in 'en' locale messages.`:

1. Check that the key exists in both `ko.js` and `en.js`
2. Verify the key path is correct (case-sensitive)
3. Run `npm run i18n:validate-usage` to find all missing keys

### Parameter Mismatch Error

If dynamic parameters don't work:

1. Check parameter names match exactly: `{count}` in translation, `{ count }` in code
2. Run `npm run i18n:validate-params` to find mismatches
3. Ensure you're passing an object as the second argument: `t('key', { param })`

### Key Count Mismatch

If ko.js and en.js have different key counts:

1. Run `npm run i18n:verify` to see the difference
2. Compare the two files to find missing keys
3. Add the missing keys to match

## File Structure

```
sd-vue-ui/
├── src/
│   ├── i18n/
│   │   ├── index.js           # i18n configuration
│   │   └── locales/
│   │       ├── ko.js          # Korean translations (422 keys)
│   │       └── en.js          # English translations (422 keys)
│   └── components/
│       └── LanguageSwitcher.vue  # Language switcher UI
├── scripts/
│   ├── verify-translations.js         # Key count & placeholder validation
│   ├── validate-translation-usage.js  # Usage validation
│   └── validate-translation-params.js # Parameter validation
└── package.json               # npm scripts for validation
```

## Statistics

- **Total Translation Keys**: 422 (ko/en)
- **Keys in Active Use**: 204 (48%)
- **Components Using i18n**: 25 Vue files
- **Dynamic Parameter Calls**: 22
- **Supported Languages**: Korean (ko), English (en)
- **Validation Scripts**: 3 automated scripts

## Adding a New Language

To add support for a new language (e.g., Japanese):

1. Create `src/i18n/locales/ja.js` by copying `en.js`
2. Translate all 422 keys to Japanese
3. Update `src/i18n/index.js` to import and register the new locale
4. Update `LanguageSwitcher.vue` to include Japanese option
5. Update validation scripts to check the new locale
6. Run `npm run test:i18n` to verify

## Resources

- [Vue I18n Documentation](https://vue-i18n.intlify.dev/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- Project Translation Files: `src/i18n/locales/`
- Validation Scripts: `scripts/`
