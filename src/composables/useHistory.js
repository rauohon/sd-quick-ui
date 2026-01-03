import { ref, computed, watch } from 'vue'
import { cloneADetailers } from '../utils/adetailer'
import { useSampleImage } from './useSampleImage'
import { useErrorHandler } from './useErrorHandler'

// JSZip is loaded via CDN in index.html
const JSZip = window.JSZip

/**
 * 히스토리 관리 composable
 * 이미지 히스토리의 CRUD, 배치 작업, 마이그레이션 기능 제공
 *
 * @param {Object} refs - 필요한 refs 객체
 * @param {Object} composables - indexedDB, localStorage composables
 * @param {Object} callbacks - showToast, showConfirm 콜백
 * @param {Object} constants - INITIAL_LOAD_COUNT 등 상수
 * @param {Function} t - i18n translation function
 * @returns {Object} 히스토리 관련 상태와 함수들
 */
export function useHistory(refs, composables, callbacks, constants, t) {
  const {
    generatedImages,
    currentImage,
    lastUsedParams,
    adetailers,
    slots,
    activeSlot,
    prompt,
    negativePrompt,
    steps,
    width,
    height,
    cfgScale,
    seed
  } = refs

  const { indexedDB, localStorage, slotManagement } = composables
  const { showToast, showConfirm } = callbacks
  const { INITIAL_LOAD_COUNT, LOAD_MORE_COUNT, SLOT_COUNT } = constants

  // Initialize error handler
  const { storage, file, general } = useErrorHandler({ showToast, t })

  // Initialize SampleImage composable
  const sampleImageRefs = { generatedImages, currentImage, lastUsedParams, adetailers }
  const { addSampleImage } = useSampleImage(sampleImageRefs, indexedDB)

  // State
  const showFavoriteOnly = ref(false)
  const isSelectionMode = ref(false)
  const selectedImages = ref(new Set())
  const showHistoryDetail = ref(false)
  const selectedHistoryItem = ref(null)
  const totalImageCount = ref(0) // IndexedDB에 저장된 전체 이미지 수

  // Computed
  const filteredImages = computed(() => {
    if (showFavoriteOnly.value) {
      return generatedImages.value.filter(img => img.favorite)
    }
    return generatedImages.value
  })

  // Watch for generatedImages changes to update totalImageCount
  watch(() => generatedImages.value.length, async (newLength, oldLength) => {
    if (newLength > oldLength) {
      // Images added - update count from IndexedDB
      totalImageCount.value = await indexedDB.getImageCount()
    }
  })

  /**
   * 즐겨찾기 토글
   */
  async function toggleImageFavorite(item, index) {
    // Toggle in memory first for instant feedback
    item.favorite = !item.favorite
    const isFavorite = item.favorite

    try {
      // Update IndexedDB
      if (item.id) {
        await indexedDB.toggleFavorite(item.id)
        showToast?.(
          isFavorite ? t('history.favoriteAdded') : t('history.favoriteRemoved'),
          'success'
        )
      }
    } catch (error) {
      // Revert on error
      item.favorite = !item.favorite
      storage(error, {
        context: 'toggleImageFavorite',
        i18nKey: 'history.favoriteUpdateFailed'
      })
    }
  }

  /**
   * 단일 이미지 삭제
   */
  async function deleteImage(item, index) {
    const result = await showConfirm?.({
      title: t('common.deleteImage'),
      message: t('common.deleteImageConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    })

    if (!result?.confirmed) {
      return
    }

    try {
      // Delete from IndexedDB
      if (item.id) {
        await indexedDB.deleteImage(item.id)
      }

      // Remove from memory
      const itemIndex = generatedImages.value.findIndex(img => img.id === item.id)
      if (itemIndex !== -1) {
        generatedImages.value.splice(itemIndex, 1)
      }

      // Update total count
      totalImageCount.value = await indexedDB.getImageCount()

      showToast?.(t('history.imageDeleted'), 'success')
    } catch (error) {
      storage(error, {
        context: 'deleteImage',
        i18nKey: 'history.deleteFailed'
      })
    }
  }

  /**
   * 히스토리 삭제 (즐겨찾기 제외)
   */
  async function clearHistory() {
    const favoriteCount = generatedImages.value.filter(img => img.favorite).length

    let confirmMessage = t('common.deleteHistoryConfirm')
    if (favoriteCount > 0) {
      confirmMessage = t('common.deleteHistoryWithFavorites', { count: favoriteCount })
    }

    const result = await showConfirm?.({
      title: t('common.deleteHistory'),
      message: confirmMessage,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    })

    if (!result?.confirmed) {
      return
    }

    try {
      // Clear IndexedDB (즐겨찾기 제외)
      const deletedCount = await indexedDB.clearNonFavoriteImages()

      // Clear memory (즐겨찾기 제외)
      const favoriteImages = generatedImages.value.filter(img => img.favorite)
      generatedImages.value = favoriteImages

      // Update total count
      totalImageCount.value = await indexedDB.getImageCount()

      // 즐겨찾기가 없으면 현재 이미지도 클리어
      if (favoriteImages.length === 0) {
        currentImage.value = ''
        lastUsedParams.value = null
      }

      if (favoriteCount > 0) {
        showToast?.(t('history.deletedWithProtected', { deletedCount, favoriteCount }), 'success')
      } else {
        showToast?.(t('history.deletedCount', { count: deletedCount }), 'success')
      }
    } catch (error) {
      storage(error, {
        context: 'clearHistory',
        i18nKey: 'history.deleteFailed'
      })
    }
  }

  /**
   * 더 많은 이미지 로드
   */
  async function loadMoreImages() {
    const currentCount = generatedImages.value.length

    if (currentCount >= totalImageCount.value) {
      showToast?.(t('history.noMoreImages'), 'info')
      return
    }

    try {
      const loadCount = Math.min(currentCount + LOAD_MORE_COUNT, totalImageCount.value)
      const history = await indexedDB.getRecentImages(loadCount)
      generatedImages.value = history
      console.log(`추가 로드: ${history.length}/${totalImageCount.value}개 이미지`)
      showToast?.(t('history.loadedMore', { count: history.length - currentCount }), 'success')
    } catch (error) {
      storage(error, {
        context: 'loadMoreImages',
        i18nKey: 'history.loadMoreFailed'
      })
    }
  }

  /**
   * 히스토리 상세 모달 열기
   */
  function openHistoryDetail(item) {
    selectedHistoryItem.value = item
    showHistoryDetail.value = true
  }

  /**
   * 히스토리 관리 모달 열기
   */
  function openHistoryManager() {
    selectedHistoryItem.value = null
    showHistoryDetail.value = true
  }

  /**
   * 히스토리 모달 닫기
   */
  function closeHistoryDetail() {
    showHistoryDetail.value = false
    selectedHistoryItem.value = null
  }

  /**
   * 히스토리 모달에서 삭제
   */
  async function handleHistoryDelete(item) {
    const result = await showConfirm?.({
      title: t('common.deleteImage'),
      message: t('common.deleteImageConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    })

    if (!result?.confirmed) {
      return
    }

    await deleteImage(item)

    // Close modal if no more images
    if (generatedImages.value.length === 0) {
      closeHistoryDetail()
    }
  }

  /**
   * 단일 이미지 다운로드
   */
  function handleHistoryDownload(item) {
    const link = document.createElement('a')
    link.href = item.image
    link.download = `sd-image-${item.timestamp || Date.now()}.png`
    link.click()
    showToast?.(t('history.downloadStarted'), 'success')
  }

  /**
   * 여러 이미지 다운로드 (ZIP)
   */
  async function handleHistoryDownloadMultiple(items) {
    if (items.length === 0) {
      showToast?.(t('common.noSelectedImages'), 'warning')
      return
    }

    try {
      const zip = new JSZip()
      const folder = zip.folder('images')

      // Add images to ZIP
      for (const item of items) {
        const response = await fetch(item.image)
        const blob = await response.blob()
        const timestamp = item.timestamp || Date.now()
        const filename = `image_${timestamp}.png`
        folder.file(filename, blob)
      }

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `sd-images-${Date.now()}.zip`
      link.click()

      showToast?.(t('history.downloadComplete', { count: items.length }), 'success')
    } catch (error) {
      file(error, {
        context: 'handleHistoryDownloadMultiple',
        i18nKey: 'history.batchDownloadFailed'
      })
    }
  }

  /**
   * 여러 이미지 삭제
   */
  async function handleHistoryDeleteMultiple(items) {
    const result = await showConfirm?.({
      title: t('common.batchDelete'),
      message: t('common.batchDeleteConfirm', { count: items.length }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    })

    if (!result?.confirmed) {
      return
    }

    try {
      // Delete from IndexedDB
      for (const item of items) {
        if (item.id) {
          await indexedDB.deleteImage(item.id)
        }
      }

      // Remove from memory
      const itemIds = new Set(items.map(item => item.id))
      generatedImages.value = generatedImages.value.filter(img => !itemIds.has(img.id))

      // Update total count
      totalImageCount.value = await indexedDB.getImageCount()

      showToast?.(t('history.imagesDeleted', { count: items.length }), 'success')
    } catch (error) {
      storage(error, {
        context: 'handleHistoryDeleteMultiple',
        i18nKey: 'history.batchDeleteFailed'
      })
    }
  }

  /**
   * 선택 모드 토글
   */
  function toggleSelectionMode() {
    isSelectionMode.value = !isSelectionMode.value
    if (!isSelectionMode.value) {
      selectedImages.value.clear()
    }
  }

  /**
   * 이미지 선택 토글
   */
  function toggleImageSelection(imageId) {
    if (selectedImages.value.has(imageId)) {
      selectedImages.value.delete(imageId)
    } else {
      selectedImages.value.add(imageId)
    }
  }

  /**
   * 전체 선택
   */
  function selectAllImages() {
    generatedImages.value.forEach(img => {
      if (img.id) {
        selectedImages.value.add(img.id)
      }
    })
  }

  /**
   * 선택 해제
   */
  function deselectAllImages() {
    selectedImages.value.clear()
  }

  /**
   * 선택된 이미지 다운로드
   */
  async function downloadSelectedImages() {
    if (selectedImages.value.size === 0) {
      showToast?.(t('common.noSelectedImages'), 'warning')
      return
    }

    try {
      const zip = new JSZip()
      const folder = zip.folder('images')

      // Add selected images to ZIP
      for (const imageId of selectedImages.value) {
        const image = generatedImages.value.find(img => img.id === imageId)
        if (!image) continue

        // Fetch image data
        const response = await fetch(image.image)
        const blob = await response.blob()

        // Generate filename from timestamp or use index
        const timestamp = image.timestamp || Date.now()
        const filename = `image_${timestamp}.png`

        folder.file(filename, blob)
      }

      // Generate ZIP file
      const content = await zip.generateAsync({ type: 'blob' })

      // Download ZIP
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `images_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast?.(t('history.downloadComplete', { count: selectedImages.value.size }), 'success')

      // Exit selection mode and clear selections
      isSelectionMode.value = false
      selectedImages.value.clear()
    } catch (error) {
      file(error, {
        context: 'downloadSelectedImages',
        i18nKey: 'history.batchDownloadFailed'
      })
    }
  }

  /**
   * 즐겨찾기 필터 토글
   */
  function toggleFavoriteFilter() {
    showFavoriteOnly.value = !showFavoriteOnly.value
  }

  /**
   * 데이터 로드 (마이그레이션 포함)
   */
  async function loadData() {
    // One-time migration from localStorage to IndexedDB
    const migrated = window.localStorage.getItem('sd-migrated-to-indexeddb')
    if (!migrated) {
      console.log('localStorage → IndexedDB 마이그레이션 시작...')

      try {
        // Migrate history
        const oldHistory = localStorage.loadFromLocalStorage()
        if (oldHistory.length > 0) {
          console.log(`${oldHistory.length}개 이미지 마이그레이션 중...`)
          for (const image of oldHistory) {
            try {
              await indexedDB.saveImage(image)
            } catch (e) {
              console.warn('이미지 마이그레이션 실패 (스킵):', e)
            }
          }
          console.log('이미지 마이그레이션 완료')
        }

        // Migrate slots
        const oldSlots = localStorage.loadSlots()
        if (oldSlots.some(slot => slot !== null)) {
          await indexedDB.saveSlots(oldSlots)
          console.log('슬롯 마이그레이션 완료')
        }

        // Mark as migrated
        window.localStorage.setItem('sd-migrated-to-indexeddb', 'true')

        // Clear old localStorage data
        window.localStorage.removeItem('sd-history')
        console.log('localStorage 정리 완료')

        showToast?.(t('message.success.migrationComplete'), 'success')
      } catch (error) {
        general(error, {
          context: 'loadData:migration',
          i18nKey: 'message.warning.migrationFailedContinue',
          toastType: 'warning'
        })
      }
    }

    // Load history from IndexedDB
    try {
      // Get total image count first
      totalImageCount.value = await indexedDB.getImageCount()

      const history = await indexedDB.getRecentImages(INITIAL_LOAD_COUNT) // 최근 N장 로드 (메모리 최적화)
      if (history.length > 0) {
        generatedImages.value = history
        currentImage.value = history[0].image
        lastUsedParams.value = history[0].params
        console.log(`IndexedDB에서 ${history.length}/${totalImageCount.value}개 이미지 로드 완료`)
      }
    } catch (error) {
      storage(error, { context: 'loadData:history', silent: true })
    }

    // Load slots from IndexedDB
    try {
      const loadedSlots = await indexedDB.loadSlots()
      slots.value = loadedSlots
    } catch (error) {
      storage(error, { context: 'loadData:slots', silent: true })
      // Fallback to localStorage
      const loadedSlots = localStorage.loadSlots()
      slots.value = loadedSlots
    }

    // Load active slot
    const savedActiveSlot = window.localStorage.getItem('sd-active-slot')
    if (savedActiveSlot !== null) {
      const slotIndex = parseInt(savedActiveSlot)
      if (slotIndex >= 0 && slotIndex < SLOT_COUNT) {
        activeSlot.value = slotIndex
        const slotData = slots.value[slotIndex]
        if (slotData) {
          slotManagement.applySettings(slotData)
        }
      }
    }

    // Check for pending prompt load from PNG Info
    const pendingLoad = sessionStorage.getItem('pending-prompt-load')
    if (pendingLoad) {
      try {
        const params = JSON.parse(pendingLoad)
        prompt.value = params.prompt || ''
        negativePrompt.value = params.negative_prompt || ''
        steps.value = params.steps || 20
        width.value = params.width || 512
        height.value = params.height || 512
        cfgScale.value = params.cfg_scale || 7
        seed.value = params.seed || -1
        sessionStorage.removeItem('pending-prompt-load')
      } catch (error) {
        general(error, { context: 'loadData:pendingPrompt', silent: true })
      }
    }
  }

  return {
    // State
    showFavoriteOnly,
    isSelectionMode,
    selectedImages,
    showHistoryDetail,
    selectedHistoryItem,
    totalImageCount,

    // Computed
    filteredImages,

    // Functions - CRUD
    toggleImageFavorite,
    deleteImage,
    clearHistory,
    loadMoreImages,

    // Functions - Modal
    openHistoryDetail,
    openHistoryManager,
    closeHistoryDetail,
    handleHistoryDelete,

    // Functions - Download
    handleHistoryDownload,
    handleHistoryDownloadMultiple,

    // Functions - Batch Delete
    handleHistoryDeleteMultiple,

    // Functions - Selection Mode
    toggleSelectionMode,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages,
    downloadSelectedImages,

    // Functions - Filter
    toggleFavoriteFilter,

    // Functions - Sample
    addSampleImage,

    // Functions - Data Loading
    loadData
  }
}
