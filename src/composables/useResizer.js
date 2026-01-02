import { ref, onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'sd-prompt-panel-width'
const DEFAULT_WIDTH = 420
const MIN_WIDTH = 280
const MAX_WIDTH = 700

export function useResizer() {
  const promptPanelWidth = ref(DEFAULT_WIDTH)
  const isResizing = ref(false)

  // Load saved width from localStorage
  function loadWidth() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const width = parseInt(saved, 10)
        if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
          promptPanelWidth.value = width
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Save width to localStorage
  function saveWidth() {
    try {
      localStorage.setItem(STORAGE_KEY, promptPanelWidth.value.toString())
    } catch (e) {
      // Ignore errors
    }
  }

  // Handle mouse down on resizer
  function startResize(event) {
    event.preventDefault()
    isResizing.value = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // Handle mouse move during resize
  function handleMouseMove(event) {
    if (!isResizing.value) return

    // Get the prompt panel element (3rd child of container)
    const container = document.querySelector('.container')
    if (!container) return

    const promptPanel = container.children[2] // 3rd element (0-indexed)
    if (!promptPanel) return

    const promptPanelRect = promptPanel.getBoundingClientRect()
    // Calculate new width: mouse position - prompt panel's left edge
    const newWidth = event.clientX - promptPanelRect.left

    // Clamp to min/max
    promptPanelWidth.value = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
  }

  // Handle mouse up - stop resize
  function stopResize() {
    if (isResizing.value) {
      isResizing.value = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      saveWidth()
    }
  }

  // Initialize
  onMounted(() => {
    loadWidth()
  })

  // Cleanup
  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResize)
  })

  return {
    promptPanelWidth,
    isResizing,
    startResize,
    MIN_WIDTH,
    MAX_WIDTH,
    DEFAULT_WIDTH
  }
}
