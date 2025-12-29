/**
 * 알림 관련 유틸리티 함수
 */
import { NOTIFICATION_TYPES } from '../config/constants'

/**
 * 브라우저 알림 권한 요청
 * @returns {Promise<boolean>} 권한 허용 여부
 */
export async function requestNotificationPermission() {
  // 브라우저가 Notification API를 지원하지 않으면 false
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다')
    return false
  }

  // 이미 권한이 허용되어 있으면 true
  if (Notification.permission === 'granted') {
    return true
  }

  // 권한이 거부되어 있으면 false
  if (Notification.permission === 'denied') {
    console.warn('알림 권한이 거부되었습니다')
    return false
  }

  // 권한 요청
  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('알림 권한 요청 실패:', error)
    return false
  }
}

/**
 * 브라우저 알림 표시
 * @param {string} title 알림 제목
 * @param {string} body 알림 본문
 * @param {string} icon 알림 아이콘 경로 (선택)
 */
export function showBrowserNotification(title, body, icon = null) {
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('알림 권한이 허용되지 않았습니다')
    return
  }

  try {
    const options = {
      body,
      icon: icon || undefined,
      badge: icon || undefined,
      tag: 'sd-generation-complete', // 같은 태그의 알림은 대체됨
      requireInteraction: false, // 자동으로 사라짐
      silent: false
    }

    const notification = new Notification(title, options)

    // 알림 클릭 시 창 포커스
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // 5초 후 자동 닫기
    setTimeout(() => {
      notification.close()
    }, 5000)
  } catch (error) {
    console.error('브라우저 알림 표시 실패:', error)
  }
}

/**
 * 알림음 재생 (Web Audio API 사용)
 * @param {number} volume 볼륨 (0.0 ~ 1.0)
 */
export function playNotificationSound(volume = 0.5) {
  try {
    // AudioContext 생성
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // 간단한 beep 소리 생성 (440Hz A음, 200ms)
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // 주파수 설정 (440Hz A음 + 880Hz A음 오버톤으로 더 풍부한 소리)
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1)

    // 볼륨 설정 (페이드 인/아웃)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01) // 페이드 인
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2) // 페이드 아웃

    // 재생
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)

    // 정리 (메모리 누수 방지)
    oscillator.onended = () => {
      oscillator.disconnect()
      gainNode.disconnect()
      audioContext.close()
    }
  } catch (error) {
    console.error('알림음 재생 실패:', error)
  }
}

/**
 * 생성 완료 알림 실행
 * @param {string} type 알림 타입 ('none' | 'sound' | 'browser' | 'both')
 * @param {object} options 옵션 { volume, imageInfo }
 */
export async function notifyCompletion(type, options = {}) {
  const { volume = 0.5, imageInfo = {} } = options

  // 'none'이면 알림 스킵
  if (type === NOTIFICATION_TYPES.NONE) {
    return
  }

  // 소리 알림
  if (type === NOTIFICATION_TYPES.SOUND || type === NOTIFICATION_TYPES.BOTH) {
    playNotificationSound(volume)
  }

  // 브라우저 알림
  if (type === NOTIFICATION_TYPES.BROWSER || type === NOTIFICATION_TYPES.BOTH) {
    const hasPermission = await requestNotificationPermission()

    if (hasPermission) {
      const title = '🎨 이미지 생성 완료!'
      const body = imageInfo.size
        ? `${imageInfo.size} 이미지가 생성되었습니다`
        : '이미지 생성이 완료되었습니다'

      showBrowserNotification(title, body)
    } else {
      console.warn('브라우저 알림 권한이 없어 소리만 재생합니다')
    }
  }
}
