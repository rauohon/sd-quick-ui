import { ref, onMounted, onUnmounted } from 'vue'

const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/**
 * 이미지 업로드 관리 composable
 * 파일 업로드, 드래그앤드롭, 클립보드 붙여넣기 처리
 *
 * @param {Object} imageRefs - { initImage, initImageWidth, initImageHeight, initImageFormat }
 * @param {Object} callbacks - { showToast, confirmReplace }
 * @param {Function} t - i18n 번역 함수
 * @returns {Object} 이미지 업로드 관련 상태와 함수들
 */
export function useImageUpload(imageRefs, callbacks, t) {
  const { initImage, initImageWidth, initImageHeight, initImageFormat } = imageRefs
  const { showToast, confirmReplace } = callbacks

  // 드래그앤드롭 상태
  const isDragging = ref(false)
  const dragCounter = ref(0)

  /**
   * 파일 입력 핸들러
   */
  function handleFileUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    loadImageFile(file)
    // input 초기화 (같은 파일 다시 선택 가능)
    event.target.value = ''
  }

  /**
   * 이미지 파일 로드
   */
  async function loadImageFile(file) {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      showToast(t('inpaint.invalidFileType'), 'error')
      return
    }

    // 기존 이미지가 있으면 확인
    if (initImage.value && confirmReplace) {
      const confirmed = await confirmReplace()
      if (!confirmed) return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      initImage.value = e.target.result
      initImageFormat.value = file.type.split('/')[1]?.toUpperCase() || 'Unknown'

      const img = new Image()
      img.onload = () => {
        initImageWidth.value = img.width
        initImageHeight.value = img.height
        showToast(t('inpaint.imageLoaded'), 'success')
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  /**
   * 드래그 진입
   */
  function handleDragEnter(e) {
    e.preventDefault()
    dragCounter.value++
    isDragging.value = true
  }

  /**
   * 드래그 이탈
   */
  function handleDragLeave(e) {
    e.preventDefault()
    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragging.value = false
    }
  }

  /**
   * 드래그 오버
   */
  function handleDragOver(e) {
    e.preventDefault()
  }

  /**
   * 드롭
   */
  function handleDrop(e) {
    e.preventDefault()
    isDragging.value = false
    dragCounter.value = 0

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      loadImageFile(files[0])
    }
  }

  /**
   * 클립보드 붙여넣기 핸들러
   */
  async function handlePaste(e) {
    // 입력 요소에서는 무시
    const target = e.target
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return
    }

    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await loadImageFromClipboard(file)
        }
        return
      }
    }
  }

  /**
   * 클립보드에서 이미지 로드
   */
  async function loadImageFromClipboard(file) {
    // 기존 이미지가 있으면 확인
    if (initImage.value && confirmReplace) {
      const confirmed = await confirmReplace()
      if (!confirmed) return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      initImage.value = e.target.result
      initImageFormat.value = file.type.split('/')[1]?.toUpperCase() || 'PNG'

      const img = new Image()
      img.onload = () => {
        initImageWidth.value = img.width
        initImageHeight.value = img.height
        showToast(t('inpaint.imagePasted'), 'success')
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  /**
   * 클립보드 이벤트 리스너 등록
   */
  function registerPasteListener() {
    window.addEventListener('paste', handlePaste)
  }

  /**
   * 클립보드 이벤트 리스너 해제
   */
  function unregisterPasteListener() {
    window.removeEventListener('paste', handlePaste)
  }

  return {
    // 상태
    isDragging,

    // 함수
    handleFileUpload,
    loadImageFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    registerPasteListener,
    unregisterPasteListener
  }
}
