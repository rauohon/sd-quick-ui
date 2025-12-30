export default {
  // 공통 액션 및 상태
  common: {
    // Actions
    generate: '생성',
    save: '저장',
    load: '불러오기',
    delete: '삭제',
    cancel: '취소',
    close: '닫기',
    edit: '수정',
    confirm: '확인',
    apply: '적용',
    reset: '초기화',
    copy: '복사',
    refresh: '새로고침',

    // States
    generating: '생성 중...',
    loading: '로딩 중...',
    saving: '저장 중...',
    deleting: '삭제 중...',
    processing: '처리 중...',

    // Common labels
    name: '이름',
    description: '설명',
    search: '검색',
    filter: '필터',
    sort: '정렬',
    all: '전체',
    none: '없음',
    yes: '예',
    no: '아니오'
  },

  // 프롬프트 관련
  prompt: {
    title: '프롬프트',
    positive: '포지티브 프롬프트',
    negative: '네거티브 프롬프트',
    placeholder: '프롬프트를 입력하세요...',
    negativePlaceholder: '네거티브 프롬프트를 입력하세요...',

    infiniteMode: '무한 생성 모드',
    infiniteModeOn: '무한 생성 모드 켜기',
    infiniteModeOff: '무한 생성 모드 끄기',

    // Prompt slots (for Phase 3 - will be filled later)
    slots: '프롬프트 슬롯',
    slotEmpty: '빈 슬롯',
    addSlot: '슬롯 추가'
  },

  // LoRA
  lora: {
    title: 'LoRA 선택',
    search: '검색',
    weight: '가중치',
    addToPrompt: '프롬프트에 추가',
    noLorasFound: 'LoRA를 찾을 수 없습니다',
    refreshing: 'LoRA 목록 새로고침 중...',
    refreshed: 'LoRA 목록이 갱신되었습니다'
  },

  // 북마크
  bookmark: {
    title: '북마크',
    add: '북마크 추가',
    name: '북마크 이름',
    saved: '북마크가 저장되었습니다',
    deleted: '북마크가 삭제되었습니다',
    deleteConfirm: '이 북마크를 삭제하시겠습니까?',
    loadConfirm: '이 북마크를 불러오시겠습니까?',
    noBookmarks: '저장된 북마크가 없습니다'
  },

  // 히스토리
  history: {
    title: '히스토리',
    clear: '전체 삭제',
    clearConfirm: '모든 히스토리를 삭제하시겠습니까?',
    deleteSelected: '선택 삭제',
    noImages: '생성된 이미지가 없습니다',

    // Time labels
    today: '오늘',
    yesterday: '어제',

    // Actions
    useSeed: '시드 사용',
    copyParams: '파라미터 복사',
    paramsCopied: '파라미터가 복사되었습니다',
    download: '다운로드',
    sendToImg2Img: 'img2img로 보내기'
  },

  // 큐
  queue: {
    title: '큐 관리',
    add: '큐에 추가',
    clear: '큐 비우기',
    start: '시작',
    stop: '정지',
    pause: '일시정지',
    resume: '재개',

    status: {
      pending: '대기 중',
      running: '실행 중',
      completed: '완료',
      failed: '실패',
      paused: '일시정지'
    },

    empty: '큐가 비어있습니다',
    itemsInQueue: '{count}개 항목 대기 중'
  },

  // 프리셋
  preset: {
    title: '프리셋',
    save: '프리셋 저장',
    load: '프리셋 불러오기',
    delete: '프리셋 삭제',
    name: '프리셋 이름',
    saved: '프리셋이 저장되었습니다',
    deleted: '프리셋이 삭제되었습니다',
    loadConfirm: '이 프리셋을 불러오시겠습니까?',
    deleteConfirm: '이 프리셋을 삭제하시겠습니까?',
    noPresets: '저장된 프리셋이 없습니다'
  },

  // 설정
  settings: {
    title: '설정',
    language: '언어',
    general: '일반',
    advanced: '고급',
    appearance: '외관',
    apiUrl: 'API URL',
    theme: '테마',
    autoSave: '자동 저장',
    notifications: '알림',
    reset: '설정 초기화',
    resetConfirm: '모든 설정을 초기화하시겠습니까?'
  },

  // 메시지
  message: {
    success: {
      saved: '저장되었습니다',
      deleted: '삭제되었습니다',
      copied: '복사되었습니다',
      generated: '생성이 완료되었습니다',
      loaded: '불러왔습니다',
      applied: '적용되었습니다'
    },
    error: {
      saveFailed: '저장에 실패했습니다',
      deleteFailed: '삭제에 실패했습니다',
      loadFailed: '불러오기에 실패했습니다',
      networkError: '네트워크 오류가 발생했습니다',
      apiError: 'API 오류가 발생했습니다',
      unknown: '알 수 없는 오류가 발생했습니다'
    },
    warning: {
      unsavedChanges: '저장하지 않은 변경사항이 있습니다',
      confirmLeave: '페이지를 떠나시겠습니까?'
    }
  },

  // 검증
  validation: {
    required: '{field}을(를) 입력해주세요',
    invalidFormat: '{field}의 형식이 올바르지 않습니다',
    tooShort: '{field}이(가) 너무 짧습니다',
    tooLong: '{field}이(가) 너무 깁니다',
    invalidValue: '유효하지 않은 값입니다'
  },

  // 알림
  notification: {
    unsupported: '이 브라우저는 알림을 지원하지 않습니다',
    permissionDenied: '알림 권한이 거부되었습니다',
    generationComplete: '이미지 생성이 완료되었습니다',
    enable: '알림 활성화',
    disable: '알림 비활성화'
  },

  // PNG Info
  pngInfo: {
    title: 'PNG 정보',
    analyze: '이미지 분석',
    noInfo: 'PNG 정보가 없습니다',
    analyzing: '분석 중...',
    failed: 'PNG Info 분석 실패',
    sendToTxt2Img: 'txt2img로 보내기',
    sendToImg2Img: 'img2img로 보내기'
  },

  // API 상태
  api: {
    connecting: 'API 연결 중...',
    connected: 'API 연결됨',
    disconnected: 'API 연결 끊김',
    error: 'API 오류',
    checkConnection: '연결 확인',
    retrying: '재연결 중...'
  },

  // 시간 표현
  time: {
    justNow: '방금',
    minutesAgo: '{n}분 전',
    hoursAgo: '{n}시간 전',
    daysAgo: '{n}일 전',
    weeksAgo: '{n}주 전',
    monthsAgo: '{n}개월 전',
    yearsAgo: '{n}년 전',
    remaining: '{time} 남음'
  },

  // 버튼
  button: {
    generate: '생성',
    interrupt: '중단',
    skip: '건너뛰기',
    extras: '부가 기능',
    pngInfo: 'PNG 정보',
    checkpoint: '체크포인트',
    settings: '설정'
  }

  // Phase 3에서 extracted-texts.json을 기반으로 실제 텍스트로 채워질 예정
}
