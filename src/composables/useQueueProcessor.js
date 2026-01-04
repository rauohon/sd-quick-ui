import { ref } from 'vue'
import {
  MAX_QUEUE_CONSECUTIVE_ERRORS,
  QUEUE_ITEM_TIMEOUT,
  QUEUE_SUCCESS_DELAY,
  QUEUE_FAILURE_DELAY
} from '../config/constants'
import { logError } from './useErrorHandler'

/**
 * 큐 실행 로직 composable
 * 큐 아이템을 순차적으로 처리하고 에러 핸들링
 *
 * @param {Object} queueSystem - useQueue composable
 * @param {Object} imageGeneration - useImageGeneration composable
 * @param {Object} paramsApplication - useParamsApplication composable
 * @param {Function} showToast - Toast 메시지 표시 함수
 * @returns {Object} 큐 실행 관련 함수들
 */
export function useQueueProcessor(queueSystem, imageGeneration, paramsApplication, showToast) {
  const {
    queue,
    isRunning,
    isPaused,
    currentIndex,
    updateQueueItem,
    saveQueue
  } = queueSystem

  const {
    isGenerating,
    generateImage,
    interruptGeneration
  } = imageGeneration

  const {
    applyParams
  } = paramsApplication

  // Queue processor state
  const queueConsecutiveErrors = ref(0)
  const queueSuccessCount = ref(0)
  const queueFailedCount = ref(0)
  let queueProcessorTimeout = null

  /**
   * 다음 대기 중인 큐 아이템 찾기
   */
  function findNextPendingQueueItem() {
    return queue.value.find(item => item.status === 'pending')
  }

  /**
   * 큐 아이템의 파라미터를 현재 설정에 적용 (프롬프트 제외)
   * 프롬프트는 generateImage에 직접 전달하여 UI를 변경하지 않음
   */
  function applyQueueItemParams(item) {
    if (!item || !item.params) {
      return
    }

    // Apply parameters WITHOUT prompts (prompts are passed directly to generateImage)
    // UI의 프롬프트는 변경하지 않음
    applyParams({
      ...item.params,
      batch_count: item.batchCount || 1
    }, { includePrompts: false })
  }

  /**
   * 큐 아이템으로 이미지 생성
   */
  async function generateQueueItem(item) {
    if (!item) {
      return false
    }

    try {
      // Mark as generating
      updateQueueItem(item.id, { status: 'generating' })

      // Apply item parameters (excluding prompts)
      applyQueueItemParams(item)

      // Generate image with timeout, passing prompts as overrides
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('큐 아이템 타임아웃')), QUEUE_ITEM_TIMEOUT)
      )

      await Promise.race([
        generateImage({
          prompt: item.prompt,
          negativePrompt: item.negativePrompt
        }),
        timeoutPromise
      ])

      // Success
      updateQueueItem(item.id, {
        status: 'completed',
        error: null,
        result: {
          timestamp: new Date().toISOString()
        }
      })

      queueSuccessCount.value++
      queueConsecutiveErrors.value = 0

      return true

    } catch (error) {
      // Failure
      logError(error, `generateQueueItem:${item.id}`)

      updateQueueItem(item.id, {
        status: 'failed',
        error: error.message || '생성 실패'
      })

      queueFailedCount.value++
      queueConsecutiveErrors.value++

      return false
    }
  }

  /**
   * 큐 처리 메인 루프
   */
  async function processQueue() {
    // Not running, skip
    if (!isRunning.value) {
      return
    }

    // Already generating, schedule retry
    if (isGenerating.value) {
      scheduleNextProcess(2000)
      return
    }

    // Paused
    if (isPaused.value) {
      scheduleNextProcess(2000)
      return
    }

    // Find next pending item
    const nextItem = findNextPendingQueueItem()

    if (!nextItem) {
      // No more items, stop queue
      stopQueue()
      showToast?.(
        `큐 처리 완료 (성공: ${queueSuccessCount.value}, 실패: ${queueFailedCount.value})`,
        'success'
      )
      return
    }

    // Check consecutive errors
    if (queueConsecutiveErrors.value >= MAX_QUEUE_CONSECUTIVE_ERRORS) {
      stopQueue()
      showToast?.(
        `연속 에러가 ${MAX_QUEUE_CONSECUTIVE_ERRORS}회 발생하여 큐가 중단되었습니다`,
        'error'
      )
      return
    }

    // Generate item
    const success = await generateQueueItem(nextItem)

    // Wait before next item, then continue
    if (isRunning.value) {
      const delay = success ? QUEUE_SUCCESS_DELAY : QUEUE_FAILURE_DELAY
      scheduleNextProcess(delay)
    }
  }

  /**
   * 다음 processQueue 호출 예약
   */
  function scheduleNextProcess(delay) {
    if (!isRunning.value) return

    if (queueProcessorTimeout) {
      clearTimeout(queueProcessorTimeout)
    }
    queueProcessorTimeout = setTimeout(() => {
      processQueue()
    }, delay)
  }

  /**
   * 큐 시작
   */
  function startQueue() {
    if (isRunning.value) {
      // Already running, just resume
      isPaused.value = false
      showToast?.('큐가 재개되었습니다', 'info')
      return
    }

    // Check if there are pending items
    const hasPendingItems = queue.value.some(item => item.status === 'pending')
    if (!hasPendingItems) {
      showToast?.('대기 중인 큐 아이템이 없습니다', 'warning')
      return
    }

    // Check if already generating
    if (isGenerating.value) {
      showToast?.('이미 생성 중입니다', 'warning')
      return
    }

    // Reset counters
    queueSuccessCount.value = 0
    queueFailedCount.value = 0
    queueConsecutiveErrors.value = 0

    // Start queue
    isRunning.value = true
    isPaused.value = false
    saveQueue()

    showToast?.('큐 처리를 시작합니다', 'info')

    // Process first item immediately
    processQueue()
  }

  /**
   * 큐 일시정지
   */
  function pauseQueue() {
    if (!isRunning.value) {
      return
    }

    isPaused.value = true
    saveQueue()

    showToast?.('큐가 일시정지되었습니다', 'info')
  }

  /**
   * 큐 중단
   */
  function stopQueue() {
    // Stop processor first
    if (queueProcessorTimeout) {
      clearTimeout(queueProcessorTimeout)
      queueProcessorTimeout = null
    }

    // 현재 생성 중이면 중단
    if (isGenerating.value) {
      interruptGeneration()
    }

    if (!isRunning.value) {
      return
    }

    // Reset state
    isRunning.value = false
    isPaused.value = false
    currentIndex.value = -1
    saveQueue()

    showToast?.('큐가 중단되었습니다', 'info')
  }

  return {
    // State
    queueConsecutiveErrors,
    queueSuccessCount,
    queueFailedCount,

    // Functions
    startQueue,
    pauseQueue,
    stopQueue,
    processQueue,
    findNextPendingQueueItem,
    applyQueueItemParams,
    generateQueueItem
  }
}
