/**
 * 날짜/시간 포맷팅 유틸리티 함수들
 * History 관련 컴포넌트에서 공통으로 사용
 */

/**
 * Format timestamp to short time (HH:MM)
 * @param {string|Date} timestamp - ISO string or Date object
 * @returns {string} Formatted time string (e.g., "15:30")
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '--:--'

  try {
    // Try parsing as ISO format (new format)
    const date = new Date(timestamp)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  } catch (e) {
    // Fallback to old format parsing
  }

  // Fallback: extract time from old format "2025. 12. 28. 오후 3:30:45"
  try {
    const parts = timestamp.split(' ')
    if (parts.length >= 5) {
      const period = parts[4] // 오전/오후
      const time = parts[5] // 3:30:45
      if (time) {
        const timeParts = time.split(':')
        return `${period} ${timeParts[0]}:${timeParts[1]}`
      }
    }
  } catch (e) {
    // Ignore
  }

  return timestamp
}

/**
 * Format timestamp to full date and time
 * @param {string|Date} timestamp - ISO string or Date object
 * @param {string} fallbackText - Text to show when timestamp is invalid (default: 'Unknown')
 * @returns {string} Formatted date time string (e.g., "2025. 12. 28. 15:30:45")
 */
export function formatFullTimestamp(timestamp, fallbackText = 'Unknown') {
  if (!timestamp) return fallbackText

  try {
    const date = new Date(timestamp)
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  } catch (e) {
    // Fallback
  }

  return timestamp
}
