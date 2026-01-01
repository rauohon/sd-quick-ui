/**
 * API 클라이언트
 * Mock 모드를 지원하는 fetch 래퍼
 */
import { getMockResponse } from './mockData'

// Mock 모드 체크
const IS_MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true'

// API Base URL
const API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:7860' : ''

// Mock 모드 지연 시간 (ms) - 실제 API처럼 느리게 동작
const MOCK_DELAY = 100

/**
 * 지연 유틸리티 함수
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * API 호출 (Mock 지원)
 * @param {string} endpoint - API 엔드포인트 (예: '/sdapi/v1/txt2img')
 * @param {Object} options - fetch options
 * @returns {Promise<Response>}
 */
export async function apiCall(endpoint, options = {}) {
  const method = options.method || 'GET'
  const url = `${API_BASE_URL}${endpoint}`

  // Mock 모드인 경우
  if (IS_MOCK_MODE) {
    console.log(`[Mock API] ${method} ${endpoint}`)

    // Mock 지연 추가 (실제 API처럼 동작)
    await sleep(MOCK_DELAY)

    // Request body 파싱 (POST인 경우)
    let body = null
    if (options.body) {
      try {
        body = JSON.parse(options.body)
      } catch (e) {
        body = options.body
      }
    }

    // Mock 응답 가져오기
    const mockResponse = getMockResponse(method, endpoint, body)

    // Response 객체처럼 동작하는 Mock Response 반환
    return {
      ok: mockResponse.status >= 200 && mockResponse.status < 300,
      status: mockResponse.status,
      statusText: mockResponse.status === 200 ? 'OK' : 'Error',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => mockResponse.data,
      text: async () => JSON.stringify(mockResponse.data),
      blob: async () => new Blob([JSON.stringify(mockResponse.data)], { type: 'application/json' }),
      arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(mockResponse.data)).buffer,
      clone: function() { return this },
      body: null,
      bodyUsed: false,
      url: endpoint,
      type: 'basic',
      redirected: false
    }
  }

  // 실제 API 호출
  return fetch(url, options)
}

/**
 * GET 요청 헬퍼
 * @param {string} endpoint - API 엔드포인트
 * @returns {Promise<Response>}
 */
export async function get(endpoint) {
  return apiCall(endpoint, { method: 'GET' })
}

/**
 * POST 요청 헬퍼
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} data - 요청 본문
 * @returns {Promise<Response>}
 */
export async function post(endpoint, data = {}) {
  return apiCall(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}

/**
 * Mock 모드 여부 반환
 */
export function isMockMode() {
  return IS_MOCK_MODE
}

/**
 * API Base URL 반환
 */
export function getApiBaseUrl() {
  return API_BASE_URL
}
