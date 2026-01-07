import { ref, computed } from 'vue'
import { promptCategories as defaultCategories } from '../data/promptsData.js'
import { logError } from './useErrorHandler'

const STORAGE_KEY = 'sd-easy-prompts-data'

// Singleton state
const userData = ref({
  categories: {},           // User-added categories
  modifiedCategories: {},   // Modified default categories
  deletedCategories: [],    // Deleted default category keys
  modifiedPrompts: {},      // Modified default prompts (keyed by original text)
  deletedPrompts: []        // Deleted default prompt texts
})

const isLoaded = ref(false)

export function useEasyPrompts() {
  // Load user data from localStorage
  function loadUserData() {
    if (isLoaded.value) return

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        userData.value = {
          categories: parsed.categories || {},
          modifiedCategories: parsed.modifiedCategories || {},
          deletedCategories: parsed.deletedCategories || [],
          modifiedPrompts: parsed.modifiedPrompts || {},
          deletedPrompts: parsed.deletedPrompts || []
        }
      }
      isLoaded.value = true
    } catch (error) {
      logError(error, 'loadEasyPromptsData')
    }
  }

  // Save user data to localStorage
  function saveUserData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData.value))
    } catch (error) {
      logError(error, 'saveEasyPromptsData')
    }
  }

  // Get merged categories (default + user modifications)
  const mergedCategories = computed(() => {
    loadUserData()

    const result = {}

    // Process default categories
    Object.entries(defaultCategories).forEach(([key, category]) => {
      // Skip deleted categories
      if (userData.value.deletedCategories.includes(key)) return

      // Apply modifications if any
      const modifications = userData.value.modifiedCategories[key] || {}

      // Filter and modify prompts
      const prompts = category.prompts
        .filter(p => !userData.value.deletedPrompts.includes(p.text))
        .map(p => {
          const modified = userData.value.modifiedPrompts[p.text]
          if (modified) {
            return { ...p, ...modified, isModified: true, originalText: p.text }
          }
          return { ...p, isDefault: true }
        })

      result[key] = {
        ...category,
        ...modifications,
        prompts,
        isDefault: true
      }
    })

    // Add user categories
    Object.entries(userData.value.categories).forEach(([key, category]) => {
      result[key] = {
        ...category,
        isCustom: true
      }
    })

    return result
  })

  // Get all subcategories for a category
  function getSubcategories(categoryKey) {
    const category = mergedCategories.value[categoryKey]
    if (!category) return []

    const subcats = new Set()
    category.prompts.forEach(p => {
      if (p.subcategory) {
        subcats.add(p.subcategory)
      }
    })
    return Array.from(subcats)
  }

  // ===== Category CRUD =====

  function addCategory(name, icon) {
    const id = `custom-${Date.now()}`
    userData.value.categories[id] = {
      name,
      icon: icon || '📁',
      prompts: [],
      isCustom: true
    }
    saveUserData()
    return id
  }

  function updateCategory(key, updates) {
    if (userData.value.categories[key]) {
      // User category
      userData.value.categories[key] = {
        ...userData.value.categories[key],
        ...updates
      }
    } else if (defaultCategories[key]) {
      // Default category - store modification
      userData.value.modifiedCategories[key] = {
        ...(userData.value.modifiedCategories[key] || {}),
        ...updates
      }
    }
    saveUserData()
  }

  function deleteCategory(key) {
    if (userData.value.categories[key]) {
      // User category - delete completely
      delete userData.value.categories[key]
    } else if (defaultCategories[key]) {
      // Default category - mark as deleted
      if (!userData.value.deletedCategories.includes(key)) {
        userData.value.deletedCategories.push(key)
      }
    }
    saveUserData()
  }

  function restoreCategory(key) {
    userData.value.deletedCategories = userData.value.deletedCategories.filter(k => k !== key)
    delete userData.value.modifiedCategories[key]
    saveUserData()
  }

  // ===== Prompt CRUD =====

  function addPrompt(categoryKey, prompt) {
    const newPrompt = {
      id: `prompt-${Date.now()}`,
      label: prompt.label,
      text: prompt.text,
      subcategory: prompt.subcategory || '',
      isCustom: true
    }

    let actualCategoryKey = categoryKey

    if (userData.value.categories[categoryKey]) {
      // Add to user category (at the beginning)
      userData.value.categories[categoryKey].prompts.unshift(newPrompt)
      actualCategoryKey = categoryKey
    } else if (defaultCategories[categoryKey]) {
      // Create a pseudo user category to store added prompts
      const customKey = `${categoryKey}-custom`
      if (!userData.value.categories[customKey]) {
        userData.value.categories[customKey] = {
          name: `${defaultCategories[categoryKey].name} (Custom)`,
          icon: defaultCategories[categoryKey].icon,
          prompts: [],
          isCustom: true,
          parentCategory: categoryKey
        }
      }
      userData.value.categories[customKey].prompts.unshift(newPrompt)
      actualCategoryKey = customKey
    }

    saveUserData()
    return { ...newPrompt, categoryKey: actualCategoryKey }
  }

  function updatePrompt(categoryKey, promptIdentifier, updates) {
    // Check if it's a custom prompt (has id)
    if (promptIdentifier.id && promptIdentifier.isCustom) {
      // Find in user categories
      for (const [key, category] of Object.entries(userData.value.categories)) {
        const index = category.prompts.findIndex(p => p.id === promptIdentifier.id)
        if (index !== -1) {
          userData.value.categories[key].prompts[index] = {
            ...userData.value.categories[key].prompts[index],
            ...updates
          }
          break
        }
      }
    } else {
      // Default prompt - store modification by original text
      const originalText = promptIdentifier.originalText || promptIdentifier.text
      userData.value.modifiedPrompts[originalText] = {
        ...(userData.value.modifiedPrompts[originalText] || {}),
        label: updates.label,
        text: updates.text,
        subcategory: updates.subcategory
      }
    }
    saveUserData()
  }

  function deletePrompt(categoryKey, promptIdentifier) {
    // Check if it's a custom prompt
    if (promptIdentifier.id && promptIdentifier.isCustom) {
      // Find and delete from user categories
      for (const [key, category] of Object.entries(userData.value.categories)) {
        const index = category.prompts.findIndex(p => p.id === promptIdentifier.id)
        if (index !== -1) {
          userData.value.categories[key].prompts.splice(index, 1)
          break
        }
      }
    } else {
      // Default prompt - mark as deleted
      const originalText = promptIdentifier.originalText || promptIdentifier.text
      if (!userData.value.deletedPrompts.includes(originalText)) {
        userData.value.deletedPrompts.push(originalText)
      }
      // Also remove any modifications
      delete userData.value.modifiedPrompts[originalText]
    }
    saveUserData()
  }

  function restorePrompt(originalText) {
    userData.value.deletedPrompts = userData.value.deletedPrompts.filter(t => t !== originalText)
    delete userData.value.modifiedPrompts[originalText]
    saveUserData()
  }

  // ===== Export/Import =====

  function exportData() {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: userData.value
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `easy-prompts-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    return { success: true }
  }

  async function importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result)

          if (!importData.data) {
            throw new Error('Invalid file format')
          }

          // Merge with existing data
          const imported = importData.data

          // Get imported category keys for highlighting
          const importedCategoryKeys = Object.keys(imported.categories || {})
          let firstPromptId = null
          let firstCategoryKey = null

          // Find first category with prompts
          for (const key of importedCategoryKeys) {
            const cat = imported.categories[key]
            if (cat.prompts && cat.prompts.length > 0) {
              firstCategoryKey = key
              firstPromptId = cat.prompts[0].id
              break
            }
          }

          // Merge categories
          userData.value.categories = {
            ...userData.value.categories,
            ...imported.categories
          }

          // Merge modifications
          userData.value.modifiedCategories = {
            ...userData.value.modifiedCategories,
            ...imported.modifiedCategories
          }

          userData.value.modifiedPrompts = {
            ...userData.value.modifiedPrompts,
            ...imported.modifiedPrompts
          }

          // Merge deletions (union)
          userData.value.deletedCategories = [...new Set([
            ...userData.value.deletedCategories,
            ...(imported.deletedCategories || [])
          ])]

          userData.value.deletedPrompts = [...new Set([
            ...userData.value.deletedPrompts,
            ...(imported.deletedPrompts || [])
          ])]

          saveUserData()
          resolve({
            success: true,
            importedCategoryKeys,
            firstCategoryKey,
            firstPromptId
          })
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  // Reset all user data
  function resetAllData() {
    userData.value = {
      categories: {},
      modifiedCategories: {},
      deletedCategories: [],
      modifiedPrompts: {},
      deletedPrompts: []
    }
    saveUserData()
  }

  return {
    // State
    mergedCategories,
    userData,

    // Load
    loadUserData,

    // Category operations
    getSubcategories,
    addCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,

    // Prompt operations
    addPrompt,
    updatePrompt,
    deletePrompt,
    restorePrompt,

    // Import/Export
    exportData,
    importData,
    resetAllData
  }
}
