/**
 * Generation result processing composable
 * Centralized logic for processing generated images
 */

import { MAX_IMAGES } from '../config/constants'
import { notifyCompletion } from '../utils/notification'

/**
 * Create generation result processing functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.t - i18n translation function
 * @param {Function} options.showToast - Toast notification function
 * @param {Function} options.saveImage - IndexedDB save function
 * @param {Function} options.onError - Error handler callback (optional)
 * @returns {Object} Result processing methods
 */
export function useGenerationResult({ t, showToast, saveImage, onError }) {
  /**
   * Parse generation info from API response
   * @param {string} infoString - JSON string from data.info
   * @param {number} defaultSeed - Default seed from usedParams
   * @returns {Object} Parsed info with seeds and prompts
   */
  function parseGenerationInfo(infoString, defaultSeed) {
    let actualSeed = defaultSeed
    let allSeeds = []
    let allPrompts = []
    let allNegativePrompts = []

    try {
      const info = JSON.parse(infoString)
      if (info.seed !== undefined) actualSeed = info.seed
      if (info.all_seeds) allSeeds = info.all_seeds
      if (info.all_prompts) allPrompts = info.all_prompts
      if (info.all_negative_prompts) allNegativePrompts = info.all_negative_prompts
    } catch (e) {
      // Failed to parse info - use defaults
    }

    return { actualSeed, allSeeds, allPrompts, allNegativePrompts }
  }

  /**
   * Process generated images from API response
   * @param {Object} options - Processing options
   * @param {Object} options.data - API response data (images, info)
   * @param {Object} options.usedParams - Parameters used for generation
   * @param {number} options.expectedImageCount - Expected number of images (batchSize * batchCount)
   * @param {number|null} options.generationDuration - Generation duration in ms
   * @param {boolean} options.wasInterrupted - Whether generation was interrupted
   * @param {string} options.imageType - Image type (IMAGE_TYPES value, optional)
   * @param {string} options.viewType - View type for engine (optional)
   * @param {Function} options.onBookmarkLink - Callback for bookmark thumbnail linking (optional)
   * @returns {Promise<Object>} { newImages, totalDeletedCount }
   */
  async function processGeneratedImages({
    data,
    usedParams,
    expectedImageCount,
    generationDuration,
    wasInterrupted,
    imageType,
    viewType,
    onBookmarkLink
  }) {
    const { actualSeed, allSeeds, allPrompts, allNegativePrompts } = parseGenerationInfo(
      data.info,
      usedParams.seed
    )

    const newImages = []
    let totalDeletedCount = 0

    // Only process actual generated images (exclude ControlNet detected_maps)
    const actualImageCount = Math.min(expectedImageCount, data.images.length)

    for (let i = 0; i < actualImageCount; i++) {
      const imageSeed = allSeeds[i] !== undefined ? allSeeds[i] : actualSeed

      const paramsWithActualSeed = {
        ...usedParams,
        seed: imageSeed,
        actual_seed: imageSeed,
        prompt: allPrompts[i] || usedParams.prompt,
        negative_prompt: allNegativePrompts[i] || usedParams.negative_prompt
      }

      const newImage = {
        image: `data:image/png;base64,${data.images[i]}`,
        info: data.info,
        params: paramsWithActualSeed,
        timestamp: new Date().toISOString(),
        duration: generationDuration,
        favorite: false,
        interrupted: wasInterrupted
      }

      // Add optional type fields
      if (imageType) {
        newImage.type = imageType
      }
      if (viewType) {
        newImage.viewType = viewType
      }

      // Save to IndexedDB
      try {
        const result = await saveImage(newImage)
        newImage.id = result.id

        // Auto-link thumbnail if bookmark was applied (only for first image)
        if (i === 0 && onBookmarkLink) {
          try {
            onBookmarkLink(result.id)
          } catch (error) {
            onError?.(error, { context: 'autoLinkThumbnail', silent: true })
          }
        }

        if (result.deletedCount > 0) {
          totalDeletedCount += result.deletedCount
        }
      } catch (error) {
        onError?.(error, { context: 'saveImage', silent: true })
      }

      newImages.push(newImage)
    }

    return { newImages, totalDeletedCount }
  }

  /**
   * Update state after processing images
   * @param {Object} options - Update options
   * @param {Array} options.newImages - Newly generated images
   * @param {number} options.totalDeletedCount - Count of auto-deleted images
   * @param {import('vue').Ref} options.generatedImages - Ref to generated images array
   * @param {import('vue').Ref} options.currentImage - Ref to current preview image
   * @param {import('vue').Ref} options.lastUsedParams - Ref to last used params
   * @param {Function} options.setFinalImageReceived - Function to mark final image received
   */
  function updateStateAfterGeneration({
    newImages,
    totalDeletedCount,
    generatedImages,
    currentImage,
    lastUsedParams,
    setFinalImageReceived
  }) {
    // Show notification for auto-deleted images
    if (totalDeletedCount > 0) {
      showToast(t('generation.autoDeleted', { count: totalDeletedCount }), 'info')
    }

    // Add all images to memory (newest first)
    const combined = [...newImages, ...generatedImages.value]
    generatedImages.value = combined.slice(0, MAX_IMAGES)

    // Set final image (first image as preview)
    setFinalImageReceived(true)
    currentImage.value = generatedImages.value[0].image
    lastUsedParams.value = newImages[0].params
  }

  /**
   * Send completion notification
   * @param {Object} options - Notification options
   * @param {Array} options.newImages - Newly generated images
   * @param {number} options.imageCount - Total image count from API
   * @param {string} options.notificationType - Notification type setting
   * @param {number} options.notificationVolume - Notification volume
   */
  function sendCompletionNotification({
    newImages,
    imageCount,
    notificationType,
    notificationVolume
  }) {
    if (!newImages[0].interrupted && notificationType) {
      notifyCompletion(notificationType, {
        volume: notificationVolume || 0.5,
        imageInfo: {
          size: `${newImages[0].params.width}x${newImages[0].params.height}`,
          count: imageCount
        }
      })
    }
  }

  /**
   * Call pipeline callback if exists
   * @param {Array} newImages - Newly generated images
   * @param {import('vue').Ref} generatedImages - Ref to generated images
   * @param {import('vue').Ref} onCompleteCallback - Ref to callback function
   */
  function callPipelineCallback(newImages, generatedImages, onCompleteCallback) {
    if (!newImages[0].interrupted && onCompleteCallback?.value) {
      onCompleteCallback.value(generatedImages.value[0].image)
    }
  }

  return {
    parseGenerationInfo,
    processGeneratedImages,
    updateStateAfterGeneration,
    sendCompletionNotification,
    callPipelineCallback
  }
}
