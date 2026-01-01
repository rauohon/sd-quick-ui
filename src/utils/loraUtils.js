/**
 * LoRA 유틸리티 함수들
 * LoRA 메타데이터 파싱 및 처리
 */

/**
 * Extract category from LoRA path
 * @param {Object} lora - LoRA object with path property
 * @returns {string} Category name or 'root'
 */
export function getCategory(lora) {
  const path = lora.path.replace(/\\/g, '/')

  if (path.includes('models/Lora/')) {
    const parts = path.split('models/Lora/')[1].split('/')
    if (parts.length > 1) {
      return parts[0]
    }
  }

  return 'root'
}

/**
 * Get SD version from metadata
 * @param {Object} lora - LoRA object with metadata
 * @returns {string|null} SD version string or null
 */
export function getSdVersion(lora) {
  const baseModel = lora.metadata?.ss_base_model_version || ''
  if (baseModel.startsWith('sdxl')) return 'SDXL'
  if (baseModel === 'sd_v2') return 'SD2.0'
  if (baseModel === 'sd_v1') return 'SD1.5'
  return null
}

/**
 * Get training resolution from metadata
 * @param {Object} lora - LoRA object with metadata
 * @returns {string|null} Resolution string (e.g., "512x512") or null
 */
export function getResolution(lora) {
  const resolution = lora.metadata?.ss_resolution || lora.metadata?.['modelspec.resolution']
  if (!resolution) return null
  return resolution.replace(/[()]/g, '').replace(', ', 'x')
}

/**
 * Get trigger words from LoRA
 * Prioritizes Civitai trained words, falls back to metadata tags
 * @param {Object} lora - LoRA object with civitaiWords or metadata
 * @returns {string[]} Array of trigger words (max 5)
 */
export function getTriggerWords(lora) {
  // Prioritize Civitai trained words
  if (lora.civitaiWords && lora.civitaiWords.length > 0) {
    return lora.civitaiWords.slice(0, 5)
  }

  // Fallback to metadata tags
  const tagFreq = lora.metadata?.ss_tag_frequency
  if (!tagFreq) return []

  const words = []
  for (const category in tagFreq) {
    for (const tag in tagFreq[category]) {
      if (tag && tag !== 'None' && !tag.match(/^\d+_/)) {
        words.push(tag)
      }
    }
  }
  return words.slice(0, 3)
}

/**
 * Get thumbnail URL for LoRA
 * @param {Object} lora - LoRA object with preview_url
 * @param {string} apiUrl - Base API URL
 * @returns {string|null} Full thumbnail URL or null
 */
export function getThumbnailUrl(lora, apiUrl) {
  if (lora.preview_url) {
    return `${apiUrl}${lora.preview_url}`
  }
  return null
}
