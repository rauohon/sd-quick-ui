/**
 * Mock API 응답 데이터
 * VITE_MOCK_API=true일 때 실제 WebUI API 대신 사용
 */

/**
 * Canvas로 Mock 이미지 생성
 * 512x512 랜덤 컬러 그라디언트
 */
function generateMockImage() {
  // Canvas 생성
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // 랜덤 그라디언트 색상
  const colors = [
    ['#667eea', '#764ba2'], // 보라-핑크
    ['#f093fb', '#f5576c'], // 핑크-레드
    ['#4facfe', '#00f2fe'], // 파랑-시안
    ['#43e97b', '#38f9d7'], // 초록-청록
    ['#fa709a', '#fee140'], // 핑크-노랑
    ['#30cfd0', '#330867'], // 시안-남색
  ]
  const [color1, color2] = colors[Math.floor(Math.random() * colors.length)]

  // 그라디언트 생성
  const gradient = ctx.createLinearGradient(0, 0, 512, 512)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)

  // "MOCK" 텍스트 추가
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = 'bold 80px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('MOCK', 256, 256)

  // Base64로 변환 (prefix 제거)
  const dataUrl = canvas.toDataURL('image/png')
  return dataUrl.split(',')[1] // "data:image/png;base64," 제거
}

// Mock 진행 상태
let mockProgress = 0
let mockProgressInterval = null
let mockGenerating = false

/**
 * Mock 진행 상태 시뮬레이션 시작
 */
export function startMockProgress() {
  mockGenerating = true
  mockProgress = 0

  if (mockProgressInterval) {
    clearInterval(mockProgressInterval)
  }

  mockProgressInterval = setInterval(() => {
    if (mockProgress < 1.0) {
      mockProgress += 0.02
    } else {
      mockProgress = 1.0
      clearInterval(mockProgressInterval)
      mockProgressInterval = null

      // 완료 후 약간의 지연 후 초기화
      setTimeout(() => {
        mockGenerating = false
        mockProgress = 0
      }, 500)
    }
  }, 200) // 200ms마다 2% 증가 (약 10초 소요)
}

/**
 * Mock 진행 상태 중단
 */
export function stopMockProgress() {
  if (mockProgressInterval) {
    clearInterval(mockProgressInterval)
    mockProgressInterval = null
  }
  mockGenerating = false
  mockProgress = 0
}

/**
 * Mock API 응답 데이터
 */
export const mockResponses = {
  // GET /sdapi/v1/sd-models
  'GET:/sdapi/v1/sd-models': {
    status: 200,
    data: [
      {
        title: 'v1-5-pruned-emaonly.safetensors [6ce0161689]',
        model_name: 'v1-5-pruned-emaonly',
        hash: '6ce0161689',
        sha256: '6ce0161689b3853acaa03779ec93eafe75a02f4ced659bee03f50797806fa2fa',
        filename: 'C:\\stable-diffusion-webui\\models\\Stable-diffusion\\v1-5-pruned-emaonly.safetensors',
        config: null
      },
      {
        title: 'dreamshaper_8.safetensors [879db523c3]',
        model_name: 'dreamshaper_8',
        hash: '879db523c3',
        sha256: '879db523c3b515694d4b52e7f17c038dbf9f07e92b86fb5c38a047ac76d97e95',
        filename: 'C:\\stable-diffusion-webui\\models\\Stable-diffusion\\dreamshaper_8.safetensors',
        config: null
      },
      {
        title: 'realisticVisionV51_v51VAE.safetensors [15012c538f]',
        model_name: 'realisticVisionV51_v51VAE',
        hash: '15012c538f',
        sha256: '15012c538f503ce2ebfc2c8547b268c75f0bc248d23e6e1d76e4c94af11e06b3',
        filename: 'C:\\stable-diffusion-webui\\models\\Stable-diffusion\\realisticVisionV51_v51VAE.safetensors',
        config: null
      }
    ]
  },

  // GET /sdapi/v1/samplers
  'GET:/sdapi/v1/samplers': {
    status: 200,
    data: [
      { name: 'Euler', aliases: ['k_euler'] },
      { name: 'Euler a', aliases: ['k_euler_a', 'k_euler_ancestral'] },
      { name: 'Heun', aliases: [] },
      { name: 'DPM++ 2M', aliases: [] },
      { name: 'DPM++ 2M Karras', aliases: [] },
      { name: 'DPM++ 2M SDE', aliases: [] },
      { name: 'DPM++ 2M SDE Karras', aliases: [] },
      { name: 'DPM++ SDE', aliases: [] },
      { name: 'DPM++ SDE Karras', aliases: [] },
      { name: 'DPM fast', aliases: [] },
      { name: 'DPM adaptive', aliases: [] },
      { name: 'LMS', aliases: ['k_lms'] },
      { name: 'LMS Karras', aliases: ['k_lms_ka'] },
      { name: 'DDIM', aliases: [] },
      { name: 'PLMS', aliases: [] },
      { name: 'UniPC', aliases: [] }
    ]
  },

  // GET /sdapi/v1/schedulers
  'GET:/sdapi/v1/schedulers': {
    status: 200,
    data: [
      { name: 'Automatic', label: 'Automatic' },
      { name: 'Uniform', label: 'Uniform' },
      { name: 'Karras', label: 'Karras' },
      { name: 'Exponential', label: 'Exponential' },
      { name: 'Polyexponential', label: 'Polyexponential' },
      { name: 'SGM Uniform', label: 'SGM Uniform' }
    ]
  },

  // GET /sdapi/v1/upscalers
  'GET:/sdapi/v1/upscalers': {
    status: 200,
    data: [
      { name: 'None', model_name: null, model_path: null, model_url: null, scale: 1 },
      { name: 'Lanczos', model_name: null, model_path: null, model_url: null, scale: 4 },
      { name: 'Nearest', model_name: null, model_path: null, model_url: null, scale: 4 },
      { name: 'ESRGAN_4x', model_name: 'ESRGAN_4x', model_path: 'C:\\stable-diffusion-webui\\models\\ESRGAN\\ESRGAN_4x.pth', model_url: null, scale: 4 },
      { name: 'R-ESRGAN 4x+', model_name: 'RealESRGAN_x4plus', model_path: 'C:\\stable-diffusion-webui\\models\\RealESRGAN\\RealESRGAN_x4plus.pth', model_url: null, scale: 4 },
      { name: 'R-ESRGAN 4x+ Anime6B', model_name: 'RealESRGAN_x4plus_anime_6B', model_path: 'C:\\stable-diffusion-webui\\models\\RealESRGAN\\RealESRGAN_x4plus_anime_6B.pth', model_url: null, scale: 4 }
    ]
  },

  // GET /sdapi/v1/progress
  'GET:/sdapi/v1/progress': {
    status: 200,
    data: () => ({
      progress: mockProgress,
      eta_relative: mockProgress < 1.0 ? (1.0 - mockProgress) * 4 : 0,
      state: {
        skipped: false,
        interrupted: false,
        job: mockGenerating ? 'txt2img' : '',
        job_count: mockGenerating ? 1 : 0,
        job_timestamp: mockGenerating ? new Date().toISOString() : null,
        job_no: mockGenerating ? 0 : 0,
        sampling_step: mockGenerating ? Math.floor(mockProgress * 20) : 0,
        sampling_steps: 20
      },
      current_image: mockProgress > 0.3 ? generateMockImage() : null,
      textinfo: null
    })
  },

  // POST /sdapi/v1/txt2img
  'POST:/sdapi/v1/txt2img': {
    status: 200,
    data: (body) => {
      // Note: startMockProgress() is called in client.js before the delay
      // so that progress polling works during generation

      const batchSize = body.batch_size || 1
      const nIter = body.n_iter || 1
      const totalImages = batchSize * nIter
      const images = Array(totalImages).fill(null).map(() => generateMockImage())

      // Generate seeds for each image (WebUI increments seed for each image)
      const baseSeed = body.seed === -1 ? Math.floor(Math.random() * 4294967295) : body.seed
      const allSeeds = Array(totalImages).fill(null).map((_, i) => baseSeed + i)

      return {
        images,
        parameters: body,
        info: JSON.stringify({
          prompt: body.prompt,
          all_prompts: Array(totalImages).fill(body.prompt),
          negative_prompt: body.negative_prompt,
          all_negative_prompts: Array(totalImages).fill(body.negative_prompt),
          seed: baseSeed,
          all_seeds: allSeeds,
          subseed: -1,
          all_subseeds: Array(totalImages).fill(-1),
          subseed_strength: 0,
          width: body.width,
          height: body.height,
          sampler_name: body.sampler_name,
          cfg_scale: body.cfg_scale,
          steps: body.steps,
          batch_size: batchSize,
          restore_faces: body.restore_faces || false,
          face_restoration_model: null,
          sd_model_hash: '6ce0161689',
          seed_resize_from_w: -1,
          seed_resize_from_h: -1,
          denoising_strength: body.denoising_strength || null,
          extra_generation_params: {},
          index_of_first_image: 0,
          infotexts: Array(totalImages).fill(`${body.prompt}\nNegative prompt: ${body.negative_prompt}\nSteps: ${body.steps}, Sampler: ${body.sampler_name}, CFG scale: ${body.cfg_scale}, Seed: ${body.seed}, Size: ${body.width}x${body.height}`),
          styles: [],
          job_timestamp: new Date().toISOString(),
          clip_skip: 1,
          is_using_inpainting_conditioning: false
        })
      }
    }
  },

  // POST /sdapi/v1/interrupt
  'POST:/sdapi/v1/interrupt': {
    status: 200,
    data: () => {
      stopMockProgress()
      return {}
    }
  },

  // POST /sdapi/v1/skip
  'POST:/sdapi/v1/skip': {
    status: 200,
    data: {}
  },

  // POST /sdapi/v1/options
  'POST:/sdapi/v1/options': {
    status: 200,
    data: {}
  }
}

/**
 * Mock API 응답 가져오기
 * @param {string} method - HTTP 메서드
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} body - 요청 본문 (POST인 경우)
 * @returns {Object} { status, data }
 */
export function getMockResponse(method, endpoint, body = null) {
  const key = `${method}:${endpoint}`
  const response = mockResponses[key]

  if (!response) {
    return {
      status: 404,
      data: { error: 'Mock endpoint not found' }
    }
  }

  // data가 함수인 경우 실행
  const data = typeof response.data === 'function'
    ? response.data(body)
    : response.data

  return {
    status: response.status,
    data
  }
}
