/**
 * Mock API 응답 데이터
 * VITE_MOCK_API=true일 때 실제 WebUI API 대신 사용
 */

/**
 * Canvas로 Mock 이미지 생성
 * 요청된 크기의 랜덤 컬러 그라디언트 + MOCK 텍스트 + 생성 시간
 * @param {number} width - 이미지 너비 (기본값: 512)
 * @param {number} height - 이미지 높이 (기본값: 512)
 */
function generateMockImage(width = 512, height = 512) {
  // Canvas 생성
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
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
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // "MOCK" 텍스트 추가 (크기에 맞게 조정)
  const fontSize = Math.min(width, height) * 0.22
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = `bold ${fontSize}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('MOCK', width / 2, height * 0.25)

  // 생성 시간 추가
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const timeFontSize = Math.min(width, height) * 0.12
  ctx.font = `bold ${timeFontSize}px Arial`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillText(timeStr, width / 2, height * 0.45)

  // 이미지 크기 표시
  const sizeFontSize = Math.min(width, height) * 0.08
  ctx.font = `${sizeFontSize}px Arial`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.fillText(`${width} × ${height}`, width / 2, height * 0.62)

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
      const width = body.width || 512
      const height = body.height || 512
      const images = Array(totalImages).fill(null).map(() => generateMockImage(width, height))

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

  // POST /sdapi/v1/img2img
  'POST:/sdapi/v1/img2img': {
    status: 200,
    data: (body) => {
      const batchSize = body.batch_size || 1
      const nIter = body.n_iter || 1
      const totalImages = batchSize * nIter
      const width = body.width || 512
      const height = body.height || 512
      const images = Array(totalImages).fill(null).map(() => generateMockImage(width, height))

      const baseSeed = body.seed === -1 ? Math.floor(Math.random() * 4294967295) : body.seed
      const allSeeds = Array(totalImages).fill(null).map((_, i) => baseSeed + i)

      return {
        images,
        parameters: body,
        info: JSON.stringify({
          prompt: body.prompt || '',
          all_prompts: Array(totalImages).fill(body.prompt || ''),
          negative_prompt: body.negative_prompt || '',
          all_negative_prompts: Array(totalImages).fill(body.negative_prompt || ''),
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
          denoising_strength: body.denoising_strength || 0.75,
          extra_generation_params: {},
          index_of_first_image: 0,
          infotexts: Array(totalImages).fill(`${body.prompt}\nNegative prompt: ${body.negative_prompt}\nSteps: ${body.steps}, Sampler: ${body.sampler_name}, CFG scale: ${body.cfg_scale}, Seed: ${body.seed}, Size: ${body.width}x${body.height}, Denoising strength: ${body.denoising_strength}`),
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
  },

  // POST /sdapi/v1/extra-single-image (Upscale)
  'POST:/sdapi/v1/extra-single-image': {
    status: 200,
    data: (body) => {
      // Mock: 그냥 입력 이미지를 그대로 반환 (실제로는 업스케일됨)
      return {
        image: body.image || generateMockImage(),
        html_info: `Upscaled with ${body.upscaler_1 || 'Unknown'} x${body.upscaling_resize || 2}`
      }
    }
  },

  // ===== ControlNet Mock API =====

  // GET /controlnet/model_list
  'GET:/controlnet/model_list': {
    status: 200,
    data: {
      model_list: [
        'control_v11p_sd15_openpose_fp16 [73c2b67d]',
        'control_v11p_sd15_canny_fp16 [b18e0966]',
        'control_v11f1p_sd15_depth_fp16 [4b72d323]',
        'control_v11p_sd15_lineart_fp16 [5c23b17d]',
        'control_v11p_sd15_softedge_fp16 [f616a34f]'
      ]
    }
  },

  // GET /controlnet/module_list
  'GET:/controlnet/module_list': {
    status: 200,
    data: {
      module_list: [
        'none', 'canny', 'depth', 'depth_anything', 'depth_anything_v2',
        'openpose', 'openpose_full', 'openpose_face', 'openpose_hand',
        'lineart', 'lineart_anime', 'lineart_coarse',
        'softedge_pidinet', 'softedge_hed', 'softedge_teed',
        'tile_resample', 'tile_colorfix',
        'reference_only', 'reference_adain', 'reference_adain+attn',
        'ip-adapter_clip_sd15', 'ip-adapter_face_id',
        'inpaint', 'inpaint_only'
      ],
      module_detail: {
        'none': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'canny': {
          model_free: false,
          sliders: [
            { name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 },
            { name: 'Low Threshold', value: 100, min: 1, max: 255, step: 1 },
            { name: 'High Threshold', value: 200, min: 1, max: 255, step: 1 }
          ]
        },
        'depth': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'depth_anything': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'depth_anything_v2': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'openpose': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'openpose_full': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'openpose_face': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'openpose_hand': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'lineart': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'lineart_anime': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'lineart_coarse': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'softedge_pidinet': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'softedge_hed': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'softedge_teed': {
          model_free: false,
          sliders: [
            { name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 },
            { name: 'Safe Steps', value: 2, min: 0, max: 10, step: 1 }
          ]
        },
        'tile_resample': {
          model_free: false,
          sliders: [
            { name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 },
            { name: 'Down Sampling Rate', value: 1.0, min: 1.0, max: 8.0, step: 0.01 }
          ]
        },
        'tile_colorfix': {
          model_free: false,
          sliders: [
            { name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 },
            { name: 'Variation', value: 8.0, min: 3.0, max: 32.0, step: 1.0 }
          ]
        },
        'reference_only': {
          model_free: true,
          sliders: [
            { name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 },
            { name: 'Style Fidelity', value: 0.5, min: 0.0, max: 1.0, step: 0.01 }
          ]
        },
        'reference_adain': {
          model_free: true,
          sliders: [
            { name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 },
            { name: 'Style Fidelity', value: 0.5, min: 0.0, max: 1.0, step: 0.01 }
          ]
        },
        'reference_adain+attn': {
          model_free: true,
          sliders: [
            { name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 },
            { name: 'Style Fidelity', value: 0.5, min: 0.0, max: 1.0, step: 0.01 }
          ]
        },
        'ip-adapter_clip_sd15': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'ip-adapter_face_id': { model_free: false, sliders: [{ name: 'Resolution', value: 512, min: 64, max: 2048, step: 8 }] },
        'inpaint': { model_free: false, sliders: [] },
        'inpaint_only': { model_free: false, sliders: [] }
      }
    }
  },

  // POST /controlnet/detect (프리프로세서 미리보기)
  'POST:/controlnet/detect': {
    status: 200,
    data: () => {
      // Mock: 처리된 이미지 시뮬레이션 (흑백 엣지 느낌의 그라디언트)
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')

      // 검정 배경
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 512, 512)

      // 흰색 라인 패턴 (엣지/포즈 느낌)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2

      // 랜덤 라인들
      for (let i = 0; i < 20; i++) {
        ctx.beginPath()
        ctx.moveTo(Math.random() * 512, Math.random() * 512)
        ctx.lineTo(Math.random() * 512, Math.random() * 512)
        ctx.stroke()
      }

      // 중앙에 사람 모양 (스틱 피규어)
      ctx.lineWidth = 3
      // 머리
      ctx.beginPath()
      ctx.arc(256, 100, 30, 0, Math.PI * 2)
      ctx.stroke()
      // 몸통
      ctx.beginPath()
      ctx.moveTo(256, 130)
      ctx.lineTo(256, 280)
      ctx.stroke()
      // 팔
      ctx.beginPath()
      ctx.moveTo(256, 180)
      ctx.lineTo(180, 240)
      ctx.moveTo(256, 180)
      ctx.lineTo(332, 240)
      ctx.stroke()
      // 다리
      ctx.beginPath()
      ctx.moveTo(256, 280)
      ctx.lineTo(200, 400)
      ctx.moveTo(256, 280)
      ctx.lineTo(312, 400)
      ctx.stroke()

      // "MOCK DETECT" 텍스트
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('MOCK DETECT', 256, 480)

      const dataUrl = canvas.toDataURL('image/png')
      return {
        images: [dataUrl.split(',')[1]],
        info: 'Mock preprocessor detection'
      }
    }
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
