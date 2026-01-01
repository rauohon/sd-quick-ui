import { ref } from 'vue'
import { logError } from './useErrorHandler'

const QUEUE_KEY = 'sd-generation-queue'

// Queue item structure:
// {
//   id: string (timestamp),
//   prompt: string,
//   negativePrompt: string,
//   params: { ... },
//   batchCount: number,
//   status: 'pending' | 'generating' | 'completed' | 'failed',
//   error: string | null,
//   result: { images: [], timestamp } | null,
//   createdAt: string,
// }

// Singleton state - shared across all useQueue() calls
const queue = ref([])
const isRunning = ref(false)
const isPaused = ref(false)
const currentIndex = ref(-1)

export function useQueue() {

  // Load queue from localStorage
  function loadQueue() {
    try {
      const saved = localStorage.getItem(QUEUE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        queue.value = data.queue || []
        // Don't restore running state
        isRunning.value = false
        isPaused.value = false
        currentIndex.value = -1
      }
    } catch (error) {
      logError(error, 'loadQueue')
    }
  }

  // Save queue to localStorage
  function saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify({
        queue: queue.value,
      }))
    } catch (error) {
      logError(error, 'saveQueue')
    }
  }

  // Add item to queue
  function addToQueue(prompt, negativePrompt, params, batchCount = 1) {
    const item = {
      id: Date.now().toString(),
      prompt: prompt || '',
      negativePrompt: negativePrompt || '',
      params: JSON.parse(JSON.stringify(params)), // Deep clone
      batchCount: batchCount,
      status: 'pending',
      error: null,
      result: null,
      createdAt: new Date().toLocaleString('ko-KR'),
    }

    queue.value.push(item)
    saveQueue()
    return item
  }

  // Remove item from queue
  function removeFromQueue(id) {
    queue.value = queue.value.filter(item => item.id !== id)
    saveQueue()
  }

  // Update queue item
  function updateQueueItem(id, updates) {
    const index = queue.value.findIndex(item => item.id === id)
    if (index !== -1) {
      queue.value[index] = {
        ...queue.value[index],
        ...updates,
      }
      saveQueue()
    }
  }

  // Move item up
  function moveUp(id) {
    const index = queue.value.findIndex(item => item.id === id)
    if (index > 0) {
      const temp = queue.value[index]
      queue.value[index] = queue.value[index - 1]
      queue.value[index - 1] = temp
      saveQueue()
    }
  }

  // Move item down
  function moveDown(id) {
    const index = queue.value.findIndex(item => item.id === id)
    if (index < queue.value.length - 1 && index !== -1) {
      const temp = queue.value[index]
      queue.value[index] = queue.value[index + 1]
      queue.value[index + 1] = temp
      saveQueue()
    }
  }

  // Clear completed items
  function clearCompleted() {
    queue.value = queue.value.filter(item => item.status !== 'completed')
    saveQueue()
  }

  // Clear all items
  function clearAll() {
    queue.value = []
    currentIndex.value = -1
    isRunning.value = false
    isPaused.value = false
    saveQueue()
  }

  // Reset failed items
  function resetFailed() {
    queue.value.forEach(item => {
      if (item.status === 'failed') {
        item.status = 'pending'
        item.error = null
      }
    })
    saveQueue()
  }

  // Get queue statistics
  function getStats() {
    const total = queue.value.length
    const pending = queue.value.filter(item => item.status === 'pending').length
    const generating = queue.value.filter(item => item.status === 'generating').length
    const completed = queue.value.filter(item => item.status === 'completed').length
    const failed = queue.value.filter(item => item.status === 'failed').length

    return { total, pending, generating, completed, failed }
  }

  return {
    queue,
    isRunning,
    isPaused,
    currentIndex,
    loadQueue,
    saveQueue,
    addToQueue,
    removeFromQueue,
    updateQueueItem,
    moveUp,
    moveDown,
    clearCompleted,
    clearAll,
    resetFailed,
    getStats,
  }
}
