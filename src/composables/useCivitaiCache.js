import { logError } from './useErrorHandler'

const CIVITAI_API_URL = 'https://civitai.com/api/v1'
const CIVITAI_CACHE_KEY = 'civitai_trigger_cache'
const CIVITAI_CACHE_DAYS = 7 // 캐시 유효기간 (일)

/**
 * Civitai API 캐시 관리 composable
 * LoRA의 트리거 워드를 Civitai API에서 가져오고 캐시
 */
export function useCivitaiCache() {
  /**
   * Get cached Civitai data from localStorage
   * @param {string} hash - LoRA hash
   * @returns {string[]|null} Cached trigger words or null
   */
  function getCache(hash) {
    try {
      const cacheStr = localStorage.getItem(CIVITAI_CACHE_KEY)
      if (!cacheStr) return null

      const cache = JSON.parse(cacheStr)
      const cached = cache[hash]

      if (!cached) return null

      // Check if cache is expired (older than CIVITAI_CACHE_DAYS)
      const cacheAge = Date.now() - cached.timestamp
      const maxAge = CIVITAI_CACHE_DAYS * 24 * 60 * 60 * 1000

      if (cacheAge > maxAge) {
        // Cache expired, remove it
        delete cache[hash]
        localStorage.setItem(CIVITAI_CACHE_KEY, JSON.stringify(cache))
        return null
      }

      return cached.words
    } catch (error) {
      logError(error, 'getCivitaiCache')
      return null
    }
  }

  /**
   * Save Civitai data to localStorage cache
   * @param {string} hash - LoRA hash
   * @param {string[]} words - Trigger words to cache
   */
  function setCache(hash, words) {
    try {
      const cacheStr = localStorage.getItem(CIVITAI_CACHE_KEY)
      const cache = cacheStr ? JSON.parse(cacheStr) : {}

      cache[hash] = {
        words,
        timestamp: Date.now()
      }

      localStorage.setItem(CIVITAI_CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      logError(error, 'setCivitaiCache')
    }
  }

  /**
   * Fetch trigger words from Civitai by hash
   * @param {Object} lora - LoRA object with hash property
   * @returns {Promise<string[]|null>} Trigger words or null
   */
  async function fetchTriggerWords(lora) {
    if (!lora.hash) {
      return null
    }

    // Check cache first
    const cached = getCache(lora.hash)
    if (cached !== null) {
      console.log(`Civitai cache hit for ${lora.name}`)
      return cached
    }

    // Cache miss, fetch from API
    try {
      const response = await fetch(`${CIVITAI_API_URL}/model-versions/by-hash/${lora.hash}`)
      if (!response.ok) {
        console.log(`Civitai lookup failed for ${lora.name}: ${response.status}`)
        return null
      }

      const data = await response.json()
      const words = data.trainedWords || []

      // Save to cache
      setCache(lora.hash, words)
      console.log(`Civitai cache saved for ${lora.name}`)

      return words
    } catch (error) {
      logError(error, `fetchCivitaiTriggerWords:${lora.name}`)
      return null
    }
  }

  return {
    getCache,
    setCache,
    fetchTriggerWords
  }
}
