import { ref } from 'vue'

const BOOKMARKS_KEY = 'sd-prompt-bookmarks'

// Bookmark structure:
// {
//   id: string (timestamp),
//   name: string,
//   prompt: string,
//   negativePrompt: string,
//   createdAt: string,
//   thumbnailId: number | null,  // IndexedDB image ID reference
//   updatedAt: string | null,    // Last updated timestamp
// }

export function useBookmarks() {
  const bookmarks = ref([])

  // Load bookmarks from localStorage
  function loadBookmarks() {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY)
      if (saved) {
        const loadedBookmarks = JSON.parse(saved)

        // Migration: Add new fields to old bookmarks
        bookmarks.value = loadedBookmarks.map(bookmark => ({
          ...bookmark,
          thumbnailId: bookmark.thumbnailId ?? null,
          updatedAt: bookmark.updatedAt ?? null
        }))

        // Save migrated data if needed
        if (loadedBookmarks.some(b => b.thumbnailId === undefined)) {
          saveBookmarks()
        }
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    }
  }

  // Save bookmarks to localStorage
  function saveBookmarks() {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks.value))
    } catch (error) {
      console.error('Failed to save bookmarks:', error)
    }
  }

  // Add new bookmark
  function addBookmark(name, prompt, negativePrompt) {
    const bookmark = {
      id: Date.now().toString(),
      name: name.trim() || `북마크 ${bookmarks.value.length + 1}`,
      prompt: prompt || '',
      negativePrompt: negativePrompt || '',
      createdAt: new Date().toLocaleString('ko-KR'),
      thumbnailId: null,
      updatedAt: null,
    }

    bookmarks.value.unshift(bookmark)
    saveBookmarks()
    return bookmark
  }

  // Update bookmark
  function updateBookmark(id, updates) {
    const index = bookmarks.value.findIndex(b => b.id === id)
    if (index !== -1) {
      bookmarks.value[index] = {
        ...bookmarks.value[index],
        ...updates,
      }
      saveBookmarks()
    }
  }

  // Delete bookmark
  function deleteBookmark(id) {
    bookmarks.value = bookmarks.value.filter(b => b.id !== id)
    saveBookmarks()
  }

  // Get bookmark by ID
  function getBookmark(id) {
    return bookmarks.value.find(b => b.id === id)
  }

  // Search bookmarks
  function searchBookmarks(query) {
    if (!query) return bookmarks.value

    const lowerQuery = query.toLowerCase()
    return bookmarks.value.filter(b =>
      b.name.toLowerCase().includes(lowerQuery) ||
      b.prompt.toLowerCase().includes(lowerQuery) ||
      b.negativePrompt.toLowerCase().includes(lowerQuery)
    )
  }

  // Export bookmarks to JSON file
  function exportBookmarks() {
    if (bookmarks.value.length === 0) {
      return { success: false, message: 'No bookmarks to export' }
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      bookmarks: bookmarks.value.map(b => ({
        name: b.name,
        prompt: b.prompt,
        negativePrompt: b.negativePrompt,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
        // Note: thumbnailId is NOT exported (image IDs are local)
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bookmarks_${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    return { success: true, count: bookmarks.value.length }
  }

  // Import bookmarks from JSON file (merge strategy)
  async function importBookmarks(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result)

          // Validate structure
          if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
            throw new Error('Invalid bookmark file format')
          }

          // Merge with existing bookmarks
          const imported = importData.bookmarks.map(b => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: b.name || 'Imported Bookmark',
            prompt: b.prompt || '',
            negativePrompt: b.negativePrompt || '',
            createdAt: b.createdAt || new Date().toLocaleString('ko-KR'),
            updatedAt: b.updatedAt || null,
            thumbnailId: null  // Imported bookmarks have no thumbnails
          }))

          // Add to beginning of list
          bookmarks.value = [...imported, ...bookmarks.value]
          saveBookmarks()

          resolve({ success: true, count: imported.length })
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  // Set thumbnail for bookmark
  function setBookmarkThumbnail(bookmarkId, imageId) {
    const bookmark = bookmarks.value.find(b => b.id === bookmarkId)
    if (bookmark) {
      bookmark.thumbnailId = imageId
      bookmark.updatedAt = new Date().toLocaleString('ko-KR')
      saveBookmarks()
      return true
    }
    return false
  }

  // Get thumbnail URL for bookmark
  async function getBookmarkThumbnail(bookmarkId, indexedDB) {
    const bookmark = bookmarks.value.find(b => b.id === bookmarkId)
    if (!bookmark || !bookmark.thumbnailId) {
      return null
    }

    // Fetch image from IndexedDB
    try {
      const images = await indexedDB.getRecentImages(200)  // Get all images
      const image = images.find(img => img.id === bookmark.thumbnailId)
      return image ? image.image : null
    } catch (error) {
      console.error('Failed to load bookmark thumbnail:', error)
      return null
    }
  }

  // Update existing bookmark content (for "Update Bookmark" button)
  function updateBookmarkContent(id, prompt, negativePrompt) {
    const bookmark = bookmarks.value.find(b => b.id === id)
    if (bookmark) {
      bookmark.prompt = prompt
      bookmark.negativePrompt = negativePrompt
      bookmark.updatedAt = new Date().toLocaleString('ko-KR')
      saveBookmarks()
      return true
    }
    return false
  }

  return {
    bookmarks,
    loadBookmarks,
    saveBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    getBookmark,
    searchBookmarks,
    exportBookmarks,
    importBookmarks,
    setBookmarkThumbnail,
    getBookmarkThumbnail,
    updateBookmarkContent,
  }
}
