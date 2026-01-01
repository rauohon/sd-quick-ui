import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

/**
 * Virtual scroll composable for grid layouts
 * Only renders visible items + buffer for smooth scrolling
 *
 * @param {Object} options
 * @param {Ref<Array>} options.items - All items array
 * @param {Ref<HTMLElement>} options.containerRef - Scroll container element ref
 * @param {number} options.itemHeight - Height of each item (including gap)
 * @param {number} options.columns - Number of columns in grid (default: 3)
 * @param {number} options.buffer - Number of extra rows to render above/below viewport (default: 2)
 * @param {number} options.gap - Gap between items (default: 16)
 */
export function useVirtualScroll(options) {
  const {
    items,
    containerRef,
    itemHeight = 120,
    columns = 3,
    buffer = 2,
    gap = 16
  } = options

  // Scroll state
  const scrollTop = ref(0)
  const containerHeight = ref(0)

  // Calculate row height (item height + gap)
  const rowHeight = computed(() => itemHeight + gap)

  // Total number of rows
  const totalRows = computed(() => Math.ceil(items.value.length / columns))

  // Total height of all items (for scroll container)
  const totalHeight = computed(() => {
    if (totalRows.value === 0) return 0
    return totalRows.value * rowHeight.value - gap // Remove last gap
  })

  // First visible row index
  const startRow = computed(() => {
    const row = Math.floor(scrollTop.value / rowHeight.value)
    return Math.max(0, row - buffer)
  })

  // Last visible row index
  const endRow = computed(() => {
    const visibleRows = Math.ceil(containerHeight.value / rowHeight.value)
    const row = Math.floor(scrollTop.value / rowHeight.value) + visibleRows
    return Math.min(totalRows.value - 1, row + buffer)
  })

  // Start index in items array
  const startIndex = computed(() => startRow.value * columns)

  // End index in items array
  const endIndex = computed(() => Math.min(
    items.value.length,
    (endRow.value + 1) * columns
  ))

  // Visible items (only these are rendered)
  const visibleItems = computed(() => {
    if (items.value.length === 0) return []
    return items.value.slice(startIndex.value, endIndex.value).map((item, index) => ({
      ...item,
      _virtualIndex: startIndex.value + index
    }))
  })

  // Offset for positioning visible items
  const offsetY = computed(() => startRow.value * rowHeight.value)

  // Handle scroll event
  function handleScroll(event) {
    scrollTop.value = event.target.scrollTop
  }

  // Update container height on resize
  function updateContainerHeight() {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight
    }
  }

  // ResizeObserver for container
  let resizeObserver = null

  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll)
      updateContainerHeight()

      // Watch for container resize
      resizeObserver = new ResizeObserver(updateContainerHeight)
      resizeObserver.observe(containerRef.value)
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })

  // Re-initialize when container ref changes
  watch(containerRef, (newContainer, oldContainer) => {
    if (oldContainer) {
      oldContainer.removeEventListener('scroll', handleScroll)
    }
    if (newContainer) {
      newContainer.addEventListener('scroll', handleScroll)
      updateContainerHeight()

      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      resizeObserver = new ResizeObserver(updateContainerHeight)
      resizeObserver.observe(newContainer)
    }
  })

  // Reset scroll when items change significantly
  watch(() => items.value.length, (newLen, oldLen) => {
    // If items were cleared or significantly reduced, reset scroll
    if (newLen < oldLen / 2) {
      scrollTop.value = 0
      if (containerRef.value) {
        containerRef.value.scrollTop = 0
      }
    }
  })

  // Scroll to specific item
  function scrollToItem(index) {
    if (!containerRef.value) return
    const row = Math.floor(index / columns)
    containerRef.value.scrollTop = row * rowHeight.value
  }

  // Scroll to top
  function scrollToTop() {
    if (!containerRef.value) return
    containerRef.value.scrollTop = 0
  }

  return {
    // Data
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,

    // Methods
    scrollToItem,
    scrollToTop,

    // For debugging
    _debug: computed(() => ({
      scrollTop: scrollTop.value,
      containerHeight: containerHeight.value,
      totalRows: totalRows.value,
      startRow: startRow.value,
      endRow: endRow.value,
      visibleCount: visibleItems.value.length,
      totalCount: items.value.length
    }))
  }
}
