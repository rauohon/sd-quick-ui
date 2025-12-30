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
    no: '아니오',

    // Confirm dialog
    deleteImage: '이미지 삭제',
    deleteImageConfirm: '이 이미지를 삭제하시겠습니까?',
    deleteHistory: '히스토리 삭제',
    deleteHistoryConfirm: '히스토리를 삭제하시겠습니까?',
    deleteHistoryWithFavorites: '히스토리를 삭제하시겠습니까?\n\n즐겨찾기 {count}개는 유지됩니다.',
    batchDelete: '이미지 일괄 삭제',
    batchDeleteConfirm: '{count}개의 이미지를 삭제하시겠습니까?',
    noSelectedImages: '선택된 이미지가 없습니다'
  },

  // 프롬프트 관련
  prompt: {
    title: '프롬프트',
    positive: '포지티브 프롬프트',
    negative: '네거티브 프롬프트',
    placeholder: '프롬프트를 입력하세요...',
    negativePlaceholder: '네거티브 프롬프트를 입력하세요...',
    required: '프롬프트를 입력해주세요!',

    infiniteMode: '무한 생성 모드',
    infiniteModeOn: '무한 생성 모드 켜기',
    infiniteModeOff: '무한 생성 모드 끄기',
    infiniteModeTooltip: 'Ctrl+↑/↓: 가중치 조정',

    // Prompt slots
    slots: '프롬프트 슬롯',
    slotEmpty: '빈 슬롯',
    addSlot: '슬롯 추가',
    slotClickToSelect: 'Slot {i}: 클릭하여 선택 (자동 저장됨)',
    slotSaved: '슬롯이 저장되었습니다',
    slotLoaded: '슬롯을 불러왔습니다',
    slotDeleted: '슬롯이 삭제되었습니다'
  },

  // LoRA
  lora: {
    title: 'LoRA 선택',
    search: '검색',
    weight: '가중치',
    addToPrompt: '프롬프트에 추가',
    noLorasFound: 'LoRA를 찾을 수 없습니다',
    refreshing: 'LoRA 목록 새로고침 중...',
    refreshed: 'LoRA 목록이 갱신되었습니다',
    refreshFailed: 'LoRA 목록 갱신 실패',
    loadFailed: 'LoRA 목록을 불러오지 못했습니다'
  },

  // 북마크
  bookmark: {
    title: '북마크',
    promptBookmarks: '🔖 프롬프트 북마크',
    add: '북마크 추가',
    addNew: '➕ 새 북마크',
    addFirst: '➕ 첫 북마크 만들기',
    name: '북마크 이름',
    nameRequired: '북마크 이름 *',
    namePlaceholder: '예: 사진 스타일',
    saved: '북마크가 저장되었습니다',
    updated: '북마크가 수정되었습니다',
    deleted: '북마크가 삭제되었습니다',
    added: '북마크가 추가되었습니다',
    applied: '"{name}" 적용됨',
    deleteTitle: '북마크 삭제',
    deleteConfirm: '이 북마크를 삭제하시겠습니까?',
    deleteConfirmWithName: '"{name}" 북마크를 삭제하시겠습니까?',
    loadConfirm: '이 북마크를 불러오시겠습니까?',
    noBookmarks: '저장된 북마크가 없습니다',
    noSearchResults: '검색 결과가 없습니다',
    searchPlaceholder: '🔍 북마크 검색...',
    bookmarks: '북마크',
    selected: '선택:',
    applyPrompt: '✅ 프롬프트 적용',
    newBookmark: '새 북마크',
    editBookmark: '북마크 수정',
    promptPlaceholder: '프롬프트 입력...',
    negativePrompt: '네거티브 프롬프트',
    negativePromptPlaceholder: '네거티브 프롬프트 입력...',
    none: '(없음)',
    nameRequiredError: '북마크 이름을 입력해주세요'
  },

  // 히스토리
  history: {
    title: '히스토리',
    manage: '히스토리 관리',
    clear: '전체 삭제',
    clearConfirm: '모든 히스토리를 삭제하시겠습니까?',
    clearNonFavorites: '즐겨찾기 제외 삭제',
    deleteSelected: '선택 삭제',
    deleteConfirm: '{count}개의 이미지를 삭제하시겠습니까?',
    noImages: '생성된 이미지가 없습니다',
    noSearchResults: '검색 결과가 없습니다',

    // Search and filter
    searchPlaceholder: '프롬프트, 파라미터 검색...',
    sortNewest: '최신순',
    sortOldest: '오래된순',
    sortFavorite: '즐겨찾기',

    // Selection
    selectedCount: '{count}개 선택됨',
    selectAll: '전체 선택',
    deselectAll: '선택 해제',
    selectImage: '이미지를 선택하세요',

    // Compare
    compare: '비교',
    compareTooltip: '선택한 이미지들과 현재 이미지 비교',
    compareMode: '비교 모드',
    selectCompareImage: '비교할 이미지 선택',
    imageCompare: '이미지 비교',
    currentImage: '현재 이미지',
    compareImage: '비교 이미지',
    closeCompare: '비교 종료',
    previous: '이전',
    next: '다음',

    // Details
    detailsTitle: '상세 정보',
    generatedAt: '생성 시간',
    status: '상태',
    interrupted: '중단된 이미지',
    parameters: '파라미터',
    loadParams: '파라미터 적용',
    unknown: '알 수 없음',

    // Favorites
    addFavorite: '즐겨찾기',
    removeFavorite: '즐겨찾기 해제',
    favoriteAdded: '⭐ 즐겨찾기에 추가되었습니다',
    favoriteRemoved: '☆ 즐겨찾기가 해제되었습니다',
    favoriteUpdateFailed: '즐겨찾기 업데이트 실패',

    // Time labels
    today: '오늘',
    yesterday: '어제',

    // Actions
    useSeed: '시드 사용',
    copyParams: '파라미터 복사',
    paramsCopied: '파라미터가 복사되었습니다',
    download: '다운로드',
    downloadStarted: '💾 이미지 다운로드 시작',
    downloadMultiple: '{count}개 이미지 다운로드 완료',
    downloadComplete: '{count}개 이미지 다운로드 완료',
    sendToImg2Img: 'img2img로 보내기',

    // Messages
    imageDeleted: '🗑️ 이미지가 삭제되었습니다',
    imagesDeleted: '🗑️ {count}개 이미지가 삭제되었습니다',
    deletedWithProtected: '✅ {deletedCount}개 삭제 완료 (즐겨찾기 {favoriteCount}개 보호됨)',
    deletedCount: '✅ {count}개 이미지 삭제 완료',
    favoriteToggled: '즐겨찾기가 토글되었습니다',
    batchDeleteFailed: '일괄 삭제 실패',
    batchDownloadFailed: '일괄 다운로드 실패',

    // Migration
    migrating: '{count}개 이미지 마이그레이션 중...',
    migrationComplete: '이미지 마이그레이션 완료',
    migrationFailed: '이미지 마이그레이션 실패 (스킵)',

    // Errors
    deleteFailed: '이미지 삭제 실패',
    downloadFailed: '일괄 다운로드 실패',
    loadFailed: '이미지 로드 실패'
  },

  // 큐
  queue: {
    title: '큐 관리',
    add: '큐에 추가',
    clear: '큐 비우기',
    clearCompleted: '완료된 항목 제거',
    clearAll: '모든 항목 제거',
    start: '시작',
    stop: '정지',
    pause: '일시정지',
    resume: '재개',
    retry: '재시도',
    retryFailed: '실패한 항목 재시도',

    status: {
      pending: '대기 중',
      running: '실행 중',
      completed: '완료',
      failed: '실패',
      paused: '일시정지'
    },

    empty: '큐가 비어있습니다',
    itemsInQueue: '{count}개 항목 대기 중',

    // Messages
    added: '큐에 추가되었습니다',
    removed: '큐에서 제거되었습니다',
    updated: '수정되었습니다',
    completedRemoved: '완료된 항목이 제거되었습니다',
    allRemoved: '모든 항목이 제거되었습니다',
    retrying: '실패한 항목을 재시도합니다',
    itemFailed: '큐 아이템 실패: {id}'
  },

  // 프리셋
  preset: {
    title: '프리셋',
    manager: '⚙️ Preset Manager',
    save: '프리셋 저장',
    load: '프리셋 불러오기',
    delete: '프리셋 삭제',
    name: '프리셋 이름',
    nameRequired: '프리셋 이름 *',
    namePlaceholder: '예: High Quality Portrait',
    descriptionOptional: '설명 (선택)',
    descriptionPlaceholder: '예: 고품질 인물 사진용 설정',
    saved: '프리셋이 저장되었습니다',
    updated: '프리셋이 수정되었습니다',
    deleted: '프리셋이 삭제되었습니다',
    loaded: '프리셋을 불러왔습니다',
    loadConfirm: '이 프리셋을 불러오시겠습니까?',
    deleteConfirm: '이 프리셋을 삭제하시겠습니까?',
    deleteConfirmWithName: '프리셋 "{name}"을(를) 삭제하시겠습니까?',
    noPresets: '저장된 프리셋이 없습니다',
    noSettings: '저장할 설정이 없습니다',
    nameRequiredError: '프리셋 이름을 입력하세요',
    savedWithName: '프리셋 "{name}" 저장됨',
    appliedWithName: '프리셋 "{name}" 적용됨',
    newPreset: '새 프리셋 저장',
    editPreset: '프리셋 수정',
    addFirst: '➕ 첫 프리셋 저장하기',
    addNew: '➕ New',
    searchPlaceholder: '🔍 Search presets...',
    presets: 'presets',
    noSearchResults: '검색 결과가 없습니다',
    applyTooltip: 'Apply preset',
    saveCurrentTooltip: 'Save current settings as preset'
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
      generationComplete: '이미지 생성이 완료되었습니다',
      loaded: '불러왔습니다',
      applied: '적용되었습니다',
      completed: '완료',
      interrupted: '생성이 중단되었습니다',
      skipped: '건너뛰기 완료',

      // LoRA
      loraRefreshed: 'LoRA 목록이 갱신되었습니다',

      // Model
      modelLoaded: '모델 목록 로드 완료',

      // Migration/DB
      migrationComplete: '데이터가 IndexedDB로 마이그레이션되었습니다',
      indexedDBInitialized: 'IndexedDB 초기화 완료',
      storageCleared: 'localStorage 정리 완료',
      allImagesCleared: '모든 이미지 삭제 완료'
    },
    error: {
      saveFailed: '저장에 실패했습니다',
      deleteFailed: '삭제에 실패했습니다',
      loadFailed: '불러오기에 실패했습니다',
      networkError: '네트워크 오류가 발생했습니다',
      apiError: 'API 오류가 발생했습니다',
      apiErrorWithStatus: 'API 에러: {status}',
      unknown: '알 수 없는 오류가 발생했습니다',

      // Generation errors
      generationFailed: '이미지 생성 실패',
      generationFailedMessage: '이미지 생성 실패: {error}',
      interruptFailed: '중단 실패',
      interruptMessage: '중단 요청 완료 (API 응답: {error})',
      skipFailed: '스킵 실패',
      progressFailed: '진행상황 조회 실패',
      maxErrorsReached: '연속 {count}회 에러 발생으로 무한 생성 모드가 자동 중단되었습니다',

      // LoRA errors
      loraRefreshFailed: 'LoRA 목록 갱신 실패',
      loraLoadFailed: 'LoRA 목록을 불러오지 못했습니다',

      // Model errors
      modelLoadFailed: '모델 목록 로드 실패',
      modelChangeFailed: '모델 변경 실패',

      // API connection errors
      authRequired: '인증이 필요합니다',
      accessDenied: '접근이 거부되었습니다',
      serverError: '서버 오류 ({status})',
      serverInternalError: 'WebUI 서버 내부 오류가 발생했습니다',
      noResponse: 'WebUI가 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
      connectionFailed: 'WebUI에 연결할 수 없습니다. WebUI가 실행 중인지, --api 플래그가 설정되었는지 확인해주세요.',
      apiResponseError: 'API 응답 오류',

      // Storage errors
      storageFull: '저장 공간 부족: localStorage가 초기화되었습니다',
      indexedDBOpenFailed: 'IndexedDB 열기 실패',
      indexedDBSaveFailed: 'IndexedDB 저장 실패 (무시)',
      indexedDBLoadFailed: 'IndexedDB 로드 실패',
      localStorageSaveFailed: 'localStorage 저장 실패',
      localStorageLoadFailed: 'localStorage 로드 실패',
      localStorageClearFailed: 'localStorage 클리어 실패',
      historySaveFailed: '히스토리 저장에 실패했습니다',
      historyMinSaveFailed: '히스토리 최소 저장도 실패',

      // Migration errors
      migrationFailed: '마이그레이션 실패',
      migrationFailedContinue: '데이터 마이그레이션 실패 (계속 진행)',

      // Image errors
      imageLoadFailed: '이미지 로드 실패',
      imageCompressFailed: '이미지 압축 실패, 원본 이미지 사용',

      // Slot errors
      slotLoadFailed: '슬롯 로드 실패'
    },
    warning: {
      unsavedChanges: '저장하지 않은 변경사항이 있습니다',
      confirmLeave: '페이지를 떠나시겠습니까?',
      migrationFailedContinue: '⚠️ 데이터 마이그레이션 실패 (계속 진행)'
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
    failedWithMessage: 'PNG Info 분석 실패: {error}',
    sendToTxt2Img: 'txt2img로 보내기',
    sendToImg2Img: 'img2img로 보내기',
    selectPngFile: 'PNG 파일을 선택해주세요!',
    pngOnly: 'PNG 파일만 선택해주세요!'
  },

  // API 상태
  api: {
    connecting: 'API 연결 확인 중...',
    connected: 'API 연결됨',
    connectionSuccess: 'API 연결 성공',
    connectionFailed: 'API 연결 실패',
    disconnected: 'API 연결 끊김',
    notConnected: 'API가 연결되지 않았습니다',
    error: 'API 에러',
    checkConnection: 'API 재연결',
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
    remaining: '{time} 남음',
    secondsRemaining: '{eta}초 남음',
    imageGenerated: '{size} 이미지가 생성되었습니다'
  },

  // 이미지 생성
  generation: {
    resuming: '이어서 진행 중...',
    ongoingDetected: '🔄 진행 중인 생성 작업을 감지했습니다',
    processing: '처리 중...',
    preparing: '준비 중...',
    interrupted: '생성이 중단되었습니다',
    skipCurrent: '현재 이미지를 스킵합니다',
    skipFailed: '스킵 실패',
    interruptFailed: '중단 실패',
    interruptComplete: '중단 요청 완료 (API 응답: {error})',
    imageCount: '이미지 {current}/{total}',
    step: 'Step {current}/{total}',
    progressFetchFailed: '진행상황 조회 실패',
    parametersCorrected: '⚙️ 파라미터 자동 보정됨: {corrections}',
    autoDeleted: '💾 200장 초과로 오래된 이미지 {count}장이 자동 삭제되었습니다 (즐겨찾기 제외)'
  },

  // 무한 생성 모드
  infiniteMode: {
    started: '무한 생성 모드 시작',
    interrupted: '무한 생성 모드가 중단되었습니다 (총 {count}장 생성)',
    stopped: '무한 생성 모드 중단 (총 {count}장 생성)',
    stoppedCurrent: '⏸️ 무한모드 해제 - 현재 이미지 완성 후 중단됩니다 (총 {count}장 생성)',
    alreadyRunning: '⚠️ 무한 모드가 이미 실행 중입니다',
    waitingCurrent: '⚠️ 현재 생성이 완료된 후 무한 모드가 시작됩니다',
    waitTimeout: '⚠️ 기존 생성 대기 시간 초과. 무한 모드 시작 취소.',
    generationTimeout: '⚠️ 생성 시간 초과 (10분). 무한 모드 중단됨.',
    autoStopped: '⚠️ 연속 {count}회 에러 발생으로 무한 생성 모드가 자동 중단되었습니다'
  },

  // 고급 설정 패널
  advancedPanel: {
    title: '고급 설정',
    foldPanel: '패널 접기',
    unfoldPanel: '패널 펼치기',
    selectModel: '선택하세요...',
    seedVariation: 'Seed 변동',
    seedVariationTooltip: '무한 모드에서 seed ± 이 범위 내에서 랜덤 생성',
    reconnect: '🔄 재연결',
    checking: '확인 중...'
  },

  // 프롬프트 패널
  promptPanel: {
    title: '프롬프트',
    infiniteModeOn: '무한 생성 모드 켜기',
    infiniteModeOff: '무한 생성 모드 끄기 (클릭)',
    apiNotConnected: 'API가 연결되지 않았습니다',
    generating: '생성 중...',
    apiConnectionRequired: '⚠️ API 연결 필요',
    generate: '🚀 생성',
    infiniteStatus: '🔄 무한모드: {count}장 생성됨',
    interruptImmediately: '⏹️ 즉시 중단',
    interruptImmediatelyTooltip: '현재 생성 중인 이미지도 즉시 중단',
    disableInfiniteMode: '⏸️ 무한모드 해제',
    disableInfiniteModeTooltip: '현재 이미지 완성 후 무한모드만 해제',
    interrupt: '⏹️ 중단',
    interruptTooltip: '현재 생성 완전 중단',
    skip: '⏭️ 스킵',
    skipNextInfinite: '현재 이미지 건너뛰고 다음 생성',
    skipNextBatch: '현재 이미지 건너뛰고 다음 (배치 {batchSize}개 중)'
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
