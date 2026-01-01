import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Drag and Drop composable
 * 전역 드래그 앤 드롭 기능 제공 (PNG 파일 지원)
 *
 * @param {Function} onDrop - 파일 드롭 시 호출될 콜백 함수 (file, errorMessage)
 * @returns {Object} 드래그 상태 및 함수들
 */
export function useDragAndDrop(onDrop) {
  const isDragging = ref(false)
  let dragCounter = 0 // 중첩된 드래그 이벤트 카운터

  /**
   * 드래그 진입 핸들러
   */
  function handleDragEnter(e) {
    e.preventDefault()
    e.stopPropagation()

    dragCounter++

    // 파일이 포함된 드래그인지 확인
    if (e.dataTransfer.types.includes('Files')) {
      isDragging.value = true
    }
  }

  /**
   * 드래그 오버 핸들러
   */
  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()

    // 드롭 가능하다는 표시
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  /**
   * 드래그 나가기 핸들러
   */
  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()

    dragCounter--

    // 모든 중첩된 드래그가 끝났을 때만 isDragging을 false로
    if (dragCounter === 0) {
      isDragging.value = false
    }
  }

  /**
   * 드롭 핸들러
   */
  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()

    isDragging.value = false
    dragCounter = 0

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) {
      return
    }

    // 첫 번째 파일만 처리
    const file = files[0]

    // PNG 파일 검증
    if (!file.type.startsWith('image/')) {
      onDrop?.(null, 'Only image files are supported')
      return
    }

    if (!file.name.toLowerCase().endsWith('.png')) {
      onDrop?.(null, 'Only PNG files are supported')
      return
    }

    // 파일 크기 검증 (최대 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      onDrop?.(null, 'File is too large (max 50MB)')
      return
    }

    // 콜백 호출
    onDrop?.(file, null)
  }

  /**
   * 이벤트 리스너 등록
   */
  onMounted(() => {
    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
  })

  /**
   * 이벤트 리스너 제거
   */
  onUnmounted(() => {
    window.removeEventListener('dragenter', handleDragEnter)
    window.removeEventListener('dragover', handleDragOver)
    window.removeEventListener('dragleave', handleDragLeave)
    window.removeEventListener('drop', handleDrop)
  })

  return {
    isDragging
  }
}
