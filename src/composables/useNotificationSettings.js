import { ref, watch } from 'vue'
import { NOTIFICATION_TYPES, DEFAULT_NOTIFICATION_VOLUME } from '../config/constants'

// Singleton state - shared across all components
const savedType = localStorage.getItem('sd-notification-type')
const savedVolume = localStorage.getItem('sd-notification-volume')

const notificationType = ref(savedType !== null ? Number(savedType) : NOTIFICATION_TYPES.NONE)
const notificationVolume = ref(savedVolume !== null ? Number(savedVolume) : DEFAULT_NOTIFICATION_VOLUME)

// Auto-save to localStorage
watch(notificationType, (value) => {
  localStorage.setItem('sd-notification-type', String(value))
})

watch(notificationVolume, (value) => {
  localStorage.setItem('sd-notification-volume', String(value))
})

/**
 * Global notification settings composable (singleton)
 * Shared across all tabs (txt2img, img2img, inpaint)
 */
export function useNotificationSettings() {
  return {
    notificationType,
    notificationVolume
  }
}
