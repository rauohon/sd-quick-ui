/**
 * ADetailer 관련 유틸리티 함수
 */

/**
 * ADetailer 객체 배열을 깊은 복사
 * JSON.parse(JSON.stringify())보다 빠름
 * @param {Array} ads - ADetailer 객체 배열
 * @returns {Array} - 복사된 ADetailer 배열
 */
export function cloneADetailers(ads) {
  return ads.map(ad => ({
    enable: ad.enable,
    model: ad.model,
    prompt: ad.prompt,
    negativePrompt: ad.negativePrompt,
    confidence: ad.confidence,
    dilateErode: ad.dilateErode,
    inpaintDenoising: ad.inpaintDenoising,
    inpaintOnlyMasked: ad.inpaintOnlyMasked,
    useSeparateSteps: ad.useSeparateSteps,
    steps: ad.steps
  }))
}
