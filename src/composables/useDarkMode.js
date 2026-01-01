import { ref, watch, onMounted } from 'vue'

/**
 * Dark mode composable
 * 다크 모드 관리 (시스템 테마 감지 + localStorage 저장)
 *
 * @returns {Object} 다크 모드 상태 및 토글 함수
 */
export function useDarkMode() {
  const isDark = ref(false)
  const STORAGE_KEY = 'sd-theme'

  /**
   * 시스템 다크 모드 선호도 감지
   */
  function getSystemTheme() {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  /**
   * localStorage에서 테마 설정 로드
   */
  function loadTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY)

    if (savedTheme !== null) {
      // 사용자가 명시적으로 설정한 경우
      isDark.value = savedTheme === 'dark'
    } else {
      // 저장된 설정이 없으면 시스템 테마 사용
      isDark.value = getSystemTheme()
    }

    applyTheme()
  }

  /**
   * 테마 적용 (DOM에 data-theme 속성 설정)
   */
  function applyTheme() {
    if (typeof document === 'undefined') return

    if (isDark.value) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  /**
   * 테마 토글
   */
  function toggleTheme() {
    isDark.value = !isDark.value
  }

  /**
   * 테마 직접 설정
   * @param {boolean} dark - true면 다크 모드, false면 라이트 모드
   */
  function setTheme(dark) {
    isDark.value = dark
  }

  // isDark 변경 감지하여 localStorage에 저장 및 테마 적용
  watch(isDark, (newValue) => {
    localStorage.setItem(STORAGE_KEY, newValue ? 'dark' : 'light')
    applyTheme()
  })

  // 시스템 테마 변경 감지
  onMounted(() => {
    loadTheme()

    // 시스템 테마 변경 이벤트 리스너
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e) => {
      // 사용자가 명시적으로 테마를 설정하지 않은 경우에만 시스템 테마 따라가기
      const savedTheme = localStorage.getItem(STORAGE_KEY)
      if (savedTheme === null) {
        isDark.value = e.matches
      }
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else {
        mediaQuery.removeListener(handleSystemThemeChange)
      }
    }
  })

  return {
    isDark,
    toggleTheme,
    setTheme
  }
}
