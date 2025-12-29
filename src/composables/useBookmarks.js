import { ref } from 'vue'

const BOOKMARKS_KEY = 'sd-prompt-bookmarks'

// Bookmark structure:
// {
//   id: string (timestamp),
//   name: string,
//   prompt: string,
//   negativePrompt: string,
//   createdAt: string,
// }

export function useBookmarks() {
  const bookmarks = ref([])

  // Load bookmarks from localStorage
  function loadBookmarks() {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY)
      if (saved) {
        bookmarks.value = JSON.parse(saved)
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

  return {
    bookmarks,
    loadBookmarks,
    saveBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    getBookmark,
    searchBookmarks,
  }
}
