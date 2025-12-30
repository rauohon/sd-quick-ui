import { cloneADetailers } from '../utils/adetailer'

/**
 * 샘플 이미지 생성 composable
 * 테스트용 샘플 이미지를 생성하고 히스토리에 추가
 *
 * @param {Object} refs - 필요한 ref 객체들
 * @param {Ref} refs.generatedImages - 생성된 이미지 목록
 * @param {Ref} refs.currentImage - 현재 이미지
 * @param {Ref} refs.lastUsedParams - 마지막 사용 파라미터
 * @param {Ref} refs.adetailers - ADetailer 설정
 * @param {Object} indexedDB - IndexedDB composable
 * @returns {Object} 샘플 이미지 생성 함수
 */
export function useSampleImage(refs, indexedDB) {
  const { generatedImages, currentImage, lastUsedParams, adetailers } = refs

  /**
   * 샘플 이미지 추가
   */
  async function addSampleImage() {
    // Create a simple colored canvas as sample image
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    // Random gradient
    const gradient = ctx.createLinearGradient(0, 0, 512, 512)
    gradient.addColorStop(0, `hsl(${Math.random() * 360}, 70%, 60%)`)
    gradient.addColorStop(1, `hsl(${Math.random() * 360}, 70%, 40%)`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)

    // Add text
    ctx.fillStyle = 'white'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Sample Image', 256, 256)
    ctx.font = '16px Arial'
    ctx.fillText(new Date().toLocaleTimeString(), 256, 300)

    const imageData = canvas.toDataURL('image/png')

    const sampleParams = {
      prompt: 'Sample prompt for testing',
      negative_prompt: 'sample negative',
      steps: Math.floor(Math.random() * 50) + 20,
      sampler_name: 'Euler a',
      scheduler: 'Automatic',
      width: 512,
      height: 512,
      cfg_scale: Math.floor(Math.random() * 10) + 5,
      seed: Math.floor(Math.random() * 1000000),
      batch_size: 1,
      batch_count: 1,
      hr_upscaler: 'Latent',
      hr_steps: 10,
      denoising_strength: 0.7,
      hr_scale: 2,
      adetailers: cloneADetailers(adetailers.value),
    }

    const newImage = {
      image: imageData,
      info: 'Sample image info',
      params: sampleParams,
      timestamp: new Date().toISOString(),
      favorite: false,
      interrupted: false
    }

    // Save to IndexedDB first to get ID
    try {
      const result = await indexedDB.saveImage(newImage)
      newImage.id = result.id
    } catch (error) {
      console.error('샘플 이미지 IndexedDB 저장 실패:', error)
    }

    generatedImages.value.unshift(newImage)
    currentImage.value = imageData
    lastUsedParams.value = sampleParams
  }

  return {
    addSampleImage
  }
}
