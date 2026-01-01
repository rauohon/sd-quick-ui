import { ref } from 'vue'
import { logError } from './useErrorHandler'

const PRESETS_KEY = 'sd-generation-presets'

// Preset structure:
// {
//   id: string (timestamp),
//   name: string,
//   description: string,
//   createdAt: string,
//   params: {
//     steps, cfgScale, samplerName, scheduler,
//     width, height, batchCount, batchSize, seed,
//     hrUpscaler, hrSteps, denoisingStrength, hrUpscale,
//     adetailers
//   }
// }

export function usePresets() {
  const presets = ref([])

  // Load presets from localStorage
  function loadPresets() {
    try {
      const saved = localStorage.getItem(PRESETS_KEY)
      if (saved) {
        presets.value = JSON.parse(saved)
      }
    } catch (error) {
      logError(error, 'loadPresets')
    }
  }

  // Save presets to localStorage
  function savePresets() {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.value))
    } catch (error) {
      logError(error, 'savePresets')
    }
  }

  // Add new preset
  function addPreset(name, description, params) {
    const preset = {
      id: Date.now().toString(),
      name: name.trim() || `프리셋 ${presets.value.length + 1}`,
      description: description?.trim() || '',
      createdAt: new Date().toLocaleString('ko-KR'),
      params: JSON.parse(JSON.stringify(params)) // Deep clone
    }

    presets.value.unshift(preset)
    savePresets()
    return preset
  }

  // Update preset
  function updatePreset(id, updates) {
    const index = presets.value.findIndex(p => p.id === id)
    if (index !== -1) {
      presets.value[index] = {
        ...presets.value[index],
        ...updates,
      }
      savePresets()
    }
  }

  // Delete preset
  function deletePreset(id) {
    presets.value = presets.value.filter(p => p.id !== id)
    savePresets()
  }

  // Get preset by ID
  function getPreset(id) {
    return presets.value.find(p => p.id === id)
  }

  // Search presets
  function searchPresets(query) {
    if (!query) return presets.value

    const lowerQuery = query.toLowerCase()
    return presets.value.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    )
  }

  return {
    presets,
    loadPresets,
    savePresets,
    addPreset,
    updatePreset,
    deletePreset,
    getPreset,
    searchPresets,
  }
}
