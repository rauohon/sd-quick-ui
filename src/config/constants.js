/**
 * 애플리케이션 전역 상수 설정
 */

// ===== 이미지 저장 관련 =====
export const MAX_IMAGES = 200 // IndexedDB에 저장할 최대 이미지 수
export const INITIAL_LOAD_COUNT = 50 // 앱 시작 시 로드할 이미지 수
export const LOAD_MORE_COUNT = 50 // "더보기" 클릭 시 추가 로드할 이미지 수
export const IMAGE_COMPRESSION_QUALITY = 0.9 // WebP 압축 품질 (0-1)
export const THUMBNAIL_COMPRESSION_QUALITY = 0.6 // 썸네일 압축 품질 (0-1)
export const THUMBNAIL_MAX_SIZE = 200 // 썸네일 최대 크기 (px)

// ===== 에러 처리 관련 =====
export const MAX_CONSECUTIVE_ERRORS = 3 // 연속 에러 허용 횟수 (무한 모드)
export const MAX_QUEUE_CONSECUTIVE_ERRORS = 3 // 연속 에러 허용 횟수 (큐 모드)

// ===== 타임아웃 설정 (ms) =====
export const GENERATION_TIMEOUT = 600000 // 이미지 생성 타임아웃 (10분)
export const QUEUE_ITEM_TIMEOUT = 600000 // 큐 항목 생성 타임아웃 (10분)
export const INFINITE_MODE_INITIAL_WAIT = 600000 // 무한 모드 초기 대기 타임아웃 (10분)

// ===== Debounce 시간 (ms) =====
export const DEBOUNCE_TEXT_INPUT = 1000 // 텍스트 입력 debounce (프롬프트 등)
export const DEBOUNCE_NUMBER_INPUT = 500 // 숫자 입력 debounce (steps, cfg 등)
export const SLOT_SAVE_FEEDBACK_INTERVAL = 10000 // 슬롯 저장 피드백 최소 간격 (10초)

// ===== Progress 폴링 관련 =====
export const PROGRESS_POLL_INTERVAL = 500 // Progress 폴링 간격 (ms)
export const MAX_IDLE_COUNT = 6 // Idle 카운트 최대값 (6 * 500ms = 3초)

// ===== API 관련 =====
export const API_CHECK_THROTTLE = 3000 // API 상태 체크 throttle (3초)
export const API_TIMEOUT = 5000 // API 요청 타임아웃 (5초)

// ===== 큐 처리 관련 =====
export const QUEUE_SUCCESS_DELAY = 1000 // 큐 성공 후 대기 시간 (1초)
export const QUEUE_FAILURE_DELAY = 3000 // 큐 실패 후 대기 시간 (3초)

// ===== LocalStorage 관련 =====
export const MAX_HISTORY_SIZE = 15 // 히스토리 최대 크기
export const MAX_STORAGE_SIZE_MB = 4 // localStorage 최대 크기 (MB)

// ===== Seed 관련 =====
export const SEED_MAX = 4294967295 // 2^32 - 1

// ===== 슬롯 관련 =====
export const SLOT_COUNT = 3

// ===== ADetailer 관련 =====
export const ADETAILER_COUNT = 4
export const ADETAILER_LABELS = ['1st', '2nd', '3rd', '4th']
export const ADETAILER_MODELS = [
  'face_yolov8n.pt',
  'face_yolov8s.pt',
  'hand_yolov8n.pt',
  'person_yolov8n-seg.pt',
  'breasts_seg.pt',
  'mediapipe_face_full',
  'mediapipe_face_short',
  'mediapipe_face_mesh'
]

export const DEFAULT_ADETAILER = {
  enable: false,
  model: 'face_yolov8n.pt',
  prompt: '',
  negativePrompt: '',
  confidence: 0.3,
  dilateErode: 4,
  inpaintDenoising: 0.4,
  inpaintOnlyMasked: true,
  useSeparateSteps: false,
  steps: 28,
}

// ADetailer 프리셋 생성 헬퍼
export const createADetailerPreset = (model = 'face_yolov8n.pt') => ({
  ...DEFAULT_ADETAILER,
  model
})

// ===== Aspect Ratio 관련 =====
export const ASPECT_RATIOS = [
  { label: '1:1', ratio: [1, 1] },
  { label: '3:2', ratio: [3, 2] },
  { label: '2:3', ratio: [2, 3] },
  { label: '4:3', ratio: [4, 3] },
  { label: '3:4', ratio: [3, 4] },
  { label: '16:9', ratio: [16, 9] },
  { label: '9:16', ratio: [9, 16] },
  { label: '21:9', ratio: [21, 9] },
  { label: '9:21', ratio: [9, 21] },
]

// ===== 파라미터 검증 범위 =====
export const PARAM_RANGES = {
  width: { min: 64, max: 2048, default: 512, step: 64 },
  height: { min: 64, max: 2048, default: 512, step: 64 },
  steps: { min: 1, max: 150, default: 20 },
  cfgScale: { min: 1, max: 30, default: 7 },
  hrSteps: { min: 0, max: 150, default: 10 },
  denoisingStrength: { min: 0, max: 1, default: 0.7 },
  hrUpscale: { min: 1, max: 4, default: 2 },
  batchCount: { min: 1, max: 100, default: 1 },
  batchSize: { min: 1, max: 8, default: 1 },
  adConfidence: { min: 0, max: 1, default: 0.3 },
  adDilateErode: { min: -128, max: 128, default: 4 },
  adInpaintDenoising: { min: 0, max: 1, default: 0.4 },
  adSteps: { min: 1, max: 150, default: 28 }
}

// ===== Toast 알림 시간 (ms) =====
export const TOAST_DURATION = {
  success: 2000,
  info: 3000,
  warning: 5000,
  error: 8000
}

// ===== 알림 설정 =====
export const NOTIFICATION_TYPES = {
  NONE: 'none',
  SOUND: 'sound',
  BROWSER: 'browser',
  BOTH: 'both'
}

export const DEFAULT_NOTIFICATION_VOLUME = 0.5 // 0.0 ~ 1.0

// ===== 이미지 타입 =====
export const IMAGE_TYPES = {
  TXT2IMG: 'txt2img',
  IMG2IMG: 'img2img'
}

// ===== img2img 관련 =====
export const IMG2IMG_PARAM_RANGES = {
  denoisingStrength: { min: 0, max: 1, default: 0.75, step: 0.01 }
}

// 지원하는 이미지 포맷
export const SUPPORTED_IMAGE_FORMATS = ['image/png', 'image/jpeg', 'image/webp']
