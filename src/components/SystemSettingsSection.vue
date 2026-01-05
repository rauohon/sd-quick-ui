<template>
  <div class="system-settings-section">
    <div class="system-settings-header" @click="isExpanded = !isExpanded">
      <span class="system-settings-title">⚙️ {{ t('systemSettings.title') }}</span>
      <span class="toggle-icon">{{ isExpanded ? '▲' : '▼' }}</span>
    </div>

    <transition name="expand">
      <div v-if="isExpanded" class="system-settings-content">
        <!-- Notification -->
        <div class="setting-group">
          <label class="setting-label">{{ t('notification.title') }}</label>
          <select
            :value="notificationType"
            @change="$emit('update:notificationType', Number($event.target.value))"
            :disabled="isGenerating"
            class="notification-select"
          >
            <option :value="0">🔇 {{ t('notification.none') }}</option>
            <option :value="1">🔔 {{ t('notification.sound') }}</option>
            <option :value="2">📬 {{ t('notification.browser') }}</option>
            <option :value="3">🔔📬 {{ t('notification.both') }}</option>
          </select>
        </div>

        <!-- Volume (if sound enabled) -->
        <div v-if="notificationType === 1 || notificationType === 3" class="setting-group">
          <label class="setting-label">{{ t('notification.volume') }}</label>
          <div class="volume-control">
            <input
              type="range"
              :value="notificationVolume"
              @input="$emit('update:notificationVolume', Number($event.target.value))"
              min="0"
              max="1"
              step="0.1"
              :disabled="isGenerating"
            />
            <span class="volume-value">{{ Math.round(notificationVolume * 100) }}%</span>
          </div>
        </div>

        <div class="setting-divider"></div>

        <!-- Language -->
        <div class="setting-group">
          <label class="setting-label">{{ t('settings.language') }}</label>
          <LanguageSwitcher />
        </div>

        <!-- Theme -->
        <div class="setting-group">
          <label class="setting-label">{{ t('theme.title') }}</label>
          <div class="theme-toggle">
            <button
              class="theme-btn"
              :class="{ active: !isDark }"
              @click="toggleTheme"
              :title="t('theme.light')"
            >
              ☀️ {{ t('theme.light') }}
            </button>
            <button
              class="theme-btn"
              :class="{ active: isDark }"
              @click="toggleTheme"
              :title="t('theme.dark')"
            >
              🌙 {{ t('theme.dark') }}
            </button>
          </div>
        </div>

        <!-- Auto-correct dimensions -->
        <div class="setting-group">
          <label class="setting-label checkbox-label">
            <input
              type="checkbox"
              v-model="autoCorrectDimensions"
              @change="saveAutoCorrectSetting"
            >
            <span>{{ t('dimensionValidation.autoCorrect') }}</span>
          </label>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './LanguageSwitcher.vue'

const { t } = useI18n()

const props = defineProps({
  isDark: {
    type: Boolean,
    default: false
  },
  toggleTheme: {
    type: Function,
    required: true
  },
  notificationType: {
    type: Number,
    default: 0
  },
  notificationVolume: {
    type: Number,
    default: 0.5
  },
  isGenerating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:autoCorrect', 'update:notificationType', 'update:notificationVolume'])

// State
const isExpanded = ref(false)
const autoCorrectDimensions = ref(false)

// localStorage key
const STORAGE_KEY = 'sd-auto-correct-dimensions'

// Get current auto-correct setting (can be called from parent)
function getAutoCorrectSetting() {
  return autoCorrectDimensions.value
}

// Save auto-correct setting to localStorage
function saveAutoCorrectSetting() {
  localStorage.setItem(STORAGE_KEY, String(autoCorrectDimensions.value))
  emit('update:autoCorrect', autoCorrectDimensions.value)
}

// Load auto-correct setting from localStorage on mount
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'true') {
    autoCorrectDimensions.value = true
  } else if (saved === 'false') {
    autoCorrectDimensions.value = false
  }
  // Emit initial value
  emit('update:autoCorrect', autoCorrectDimensions.value)
})

// Expose for parent access
defineExpose({
  getAutoCorrectSetting
})
</script>

<style scoped>
.system-settings-section {
  border-top: 1px solid var(--color-border-primary);
  padding: 8px 12px;
  background: var(--color-bg-secondary);
}

.system-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 4px 0;
  user-select: none;
}

.system-settings-header:hover {
  opacity: 0.8;
}

.system-settings-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.toggle-icon {
  font-size: 10px;
  color: var(--color-text-secondary);
}

.system-settings-content {
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--color-text-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.notification-select {
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  width: 100%;
}

.notification-select option {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.notification-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-control input[type="range"] {
  flex: 1;
  height: 4px;
  cursor: pointer;
}

.volume-value {
  font-size: 11px;
  color: var(--color-text-secondary);
  min-width: 35px;
  text-align: right;
}

.setting-divider {
  border-top: 1px solid var(--color-border-primary);
  margin: 4px 0;
}

.theme-toggle {
  display: flex;
  gap: 4px;
}

.theme-btn {
  flex: 1;
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid var(--color-border-primary);
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:hover {
  background: var(--color-bg-tertiary);
}

.theme-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 350px;
}

/* LanguageSwitcher override */
:deep(.language-switcher .lang-btn) {
  padding: 6px 8px;
  font-size: 12px;
}

:deep(.language-switcher .lang-btn:hover) {
  background: var(--color-bg-tertiary);
}

:deep(.language-switcher .lang-btn.active) {
  background: var(--color-primary);
}
</style>
