import { ref } from 'vue'
import { logError } from './useErrorHandler'

const API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:7860' : ''

/**
 * PNG Info 처리 composable
 * PNG 메타데이터 읽기, 파싱, 적용 기능 제공
 *
 * @param {Function} showToast - 토스트 메시지 표시 함수
 * @param {Function} applyParams - 파라미터 적용 함수
 * @returns {Object} PNG Info 관련 상태와 함수들
 */
export function usePngInfo(showToast, applyParams) {
  // State
  const isLoadingPngInfo = ref(false)
  const showPngInfoPreview = ref(false)
  const previewedPngInfo = ref(null)

  /**
   * PNG Info drag-drop handler
   * @param {File} file - 업로드된 파일
   * @param {string} errorMessage - 에러 메시지
   */
  async function handleLoadPngInfo(file, errorMessage) {
    if (errorMessage) {
      showToast?.(errorMessage, 'error')
      return
    }
    if (file) {
      await loadPngInfo(file)
    }
  }

  /**
   * PNG 파일에서 메타데이터 로드
   * @param {File} file - PNG 파일
   */
  async function loadPngInfo(file) {
    isLoadingPngInfo.value = true

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64Data = await base64Promise
      const base64Image = base64Data.split(',')[1]

      // Call WebUI API to read PNG info
      const response = await fetch(`${API_BASE_URL}/sdapi/v1/png-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: `data:image/png;base64,${base64Image}` })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.info) {
        // Parse info string and show preview
        const parsedInfo = parsePngInfo(data.info)
        previewedPngInfo.value = parsedInfo
        showPngInfoPreview.value = true
        showToast?.('PNG metadata loaded. Review and apply.', 'success')
      } else {
        showToast?.('No metadata found in image', 'warning')
      }
    } catch (error) {
      logError(error, 'loadPngInfo')
      showToast?.('Failed to read image metadata', 'error')
    } finally {
      isLoadingPngInfo.value = false
    }
  }

  /**
   * PNG info 문자열을 파싱하여 구조화된 데이터 반환
   * @param {string} infoString - PNG 메타데이터 문자열
   * @returns {Object} 파싱된 파라미터 객체
   */
  function parsePngInfo(infoString) {
    const lines = infoString.split('\n')

    let promptLines = []
    let negativeLines = []
    let paramsLine = ''
    let mode = 'prompt' // 'prompt', 'negative', 'params'

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('Negative prompt:')) {
        // Switch to negative mode and capture the rest of this line
        mode = 'negative'
        const negativeText = line.replace('Negative prompt:', '').trim()
        if (negativeText) {
          negativeLines.push(negativeText)
        }
      } else if (line.includes('Steps:')) {
        // This is the parameters line
        mode = 'params'
        paramsLine = line
      } else {
        // Add to current mode
        const trimmedLine = line.trim()
        if (trimmedLine) {
          if (mode === 'prompt') {
            promptLines.push(trimmedLine)
          } else if (mode === 'negative') {
            negativeLines.push(trimmedLine)
          }
        }
      }
    }

    // Prepare result object
    const result = {
      prompt: promptLines.join('\n').trim(),
      negativePrompt: negativeLines.join('\n').trim(),
      steps: 20,
      cfgScale: 7,
      samplerName: 'Euler a',
      scheduler: 'Automatic',
      width: 512,
      height: 512,
      seed: -1,
      hrUpscale: 2,
      hrUpscaler: 'Latent',
      hrSteps: 10,
      denoisingStrength: 0.7,
    }

    // Parse parameters
    if (paramsLine) {
      const params = paramsLine.split(',').map(p => p.trim())

      params.forEach(param => {
        const [key, value] = param.split(':').map(s => s.trim())

        switch (key) {
          case 'Steps':
            result.steps = parseInt(value) || 20
            break
          case 'Sampler':
            result.samplerName = value || 'Euler a'
            break
          case 'Schedule type':
          case 'Scheduler':
            result.scheduler = value || 'Automatic'
            break
          case 'CFG scale':
            result.cfgScale = parseFloat(value) || 7
            break
          case 'Size':
            const [w, h] = value.split('x').map(s => parseInt(s.trim()))
            result.width = w || 512
            result.height = h || 512
            break
          case 'Seed':
            result.seed = parseInt(value) || -1
            break
          case 'Hires upscale':
            result.hrUpscale = parseFloat(value) || 2
            break
          case 'Hires upscaler':
            result.hrUpscaler = value || 'Latent'
            break
          case 'Hires steps':
            result.hrSteps = parseInt(value) || 10
            break
          case 'Denoising strength':
            result.denoisingStrength = parseFloat(value) || 0.7
            break
        }
      })
    }

    return result
  }

  /**
   * PNG info를 현재 설정에 적용
   */
  function applyPngInfoToSettings() {
    if (!previewedPngInfo.value) return

    applyParams(previewedPngInfo.value, {
      includePrompts: true,
      showSuccessToast: true,
      successMessage: 'PNG metadata applied to settings'
    })

    previewedPngInfo.value = null
  }

  /**
   * PNG info 미리보기 취소
   */
  function cancelPngInfo() {
    previewedPngInfo.value = null
  }

  return {
    // State
    isLoadingPngInfo,
    showPngInfoPreview,
    previewedPngInfo,

    // Functions
    handleLoadPngInfo,
    loadPngInfo,
    parsePngInfo,
    applyPngInfo: applyPngInfoToSettings,
    cancelPngInfo
  }
}
