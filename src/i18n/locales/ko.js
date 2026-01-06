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
    done: '완료',
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
    noSearchResults: '검색 결과가 없습니다',
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
    noSelectedImages: '선택된 이미지가 없습니다',

    // Settings
    ok: '확인',
    dontAskAgain: '다시 묻지 않기'
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

    // Weight adjustment
    weightHint: '(Ctrl+↑/↓: 가중치 조정)',
    changedDuringGeneration: '수정됨 - 다음 생성에 반영됩니다',

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
    loadFailed: 'LoRA 목록을 불러오지 못했습니다',
    addedToPrompt: '프롬프트에 추가됨: {name}'
  },

  // 북마크
  bookmark: {
    title: '북마크',
    manager: '🔖 북마크 관리자',
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
    nameRequiredError: '북마크 이름을 입력해주세요',
    applyMode: '적용 모드',
    applyModeReplace: '프롬프트 바꾸기',
    applyModePrepend: '프롬프트 앞에 삽입',
    applyModeAppend: '프롬프트 뒤에 추가',
    // Import/Export
    import: '북마크 가져오기',
    export: '북마크 내보내기',
    exported: '{count}개의 북마크를 내보냈습니다',
    imported: '{count}개의 북마크를 가져왔습니다',
    importFailed: '북마크 가져오기 실패',
    noBookmarksToExport: '내보낼 북마크가 없습니다',
    // Thumbnail
    setThumbnail: '썸네일 설정',
    selectThumbnail: '썸네일 선택',
    selectThumbnailHint: '히스토리에서 이미지를 선택하세요',
    thumbnailSet: '썸네일이 설정되었습니다',
    // Update/Save
    promptModified: '"{name}" 북마크 - 프롬프트가 수정됨',
    updateBookmark: '북마크 업데이트',
    updateTooltip: '현재 프롬프트로 기존 북마크 덮어쓰기',
    saveAsNew: '새 북마크로 저장',
    saveAsNewTooltip: '현재 프롬프트를 새 북마크로 저장',
    bookmarkUpdated: '"{name}" 북마크가 업데이트되었습니다',
    savedAsNew: '새 북마크로 저장되었습니다',
    dismissTooltip: '무시하고 닫기'
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
    filterAll: '전체',
    filterFavorites: '즐겨찾기만',
    filterInterrupted: '중단된 이미지',

    // Selection
    selectedCount: '{count}개 선택됨',
    selectedCountShort: '{count}개 선택',
    selectAll: '전체 선택',
    selectAllShort: '전체',
    deselectAll: '선택 해제',
    deselectAllShort: '해제',
    selectImage: '이미지를 선택하세요',
    downloadSelected: '💾 다운',
    downloadSelectedTooltip: '선택된 이미지 다운로드',
    cancelSelectionMode: '선택 모드 종료',
    batchSelect: '📦 선택',
    batchSelectTooltip: '일괄 다운로드',

    // Compare
    compare: '비교',
    compareTooltip: '선택한 이미지들과 현재 이미지 비교',
    compareMode: '비교 모드',
    selectCompareImage: '비교할 이미지 선택',
    imageCompare: '이미지 비교',
    currentImage: '현재 이미지',
    compareImage: '비교 이미지',
    latestGenerated: '최근 생성',
    closeCompare: '비교 종료',
    previous: '이전',
    next: '다음',

    // Details
    detailsTitle: '상세 정보',
    generatedAt: '생성 시간',
    duration: '소요 시간',
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

    // Panel controls
    foldContent: '내용 접기',
    unfoldContent: '내용 펼치기',
    hidePanel: '패널 숨기기',
    showPanel: '패널 보이기',
    showAllImages: '전체 보기',
    showFavoritesOnly: '즐겨찾기만 보기',

    // Empty states
    noFavorites: '즐겨찾기한 이미지가 없습니다',
    addTestSample: '테스트용 샘플 추가',
    addSample: '+ 샘플 추가',

    // Load more
    loadMore: '더보기',
    loadMoreTooltip: '추가 이미지 로드 (50개)',
    noMoreImages: '더 이상 로드할 이미지가 없습니다',
    loadedMore: '✅ {count}개 이미지 추가 로드',
    loadMoreFailed: '이미지 추가 로드에 실패했습니다',

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
    itemFailed: '큐 아이템 실패: {id}',
    combinationsAdded: '{count}개 조합이 큐에 추가되었습니다',

    // Dialogs
    addToQueue: '큐에 추가',
    editItem: '큐 항목 수정',
    promptRequired: '프롬프트 *',
    negativePrompt: '네거티브 프롬프트',
    batchCount: '생성 횟수',
    addFirstItem: '➕ 첫 항목 추가하기',
    clearAllTitle: '모든 항목 삭제',
    clearAllConfirm: '큐의 모든 항목을 삭제하시겠습니까?',

    // Errors
    promptRequiredError: '프롬프트를 입력하세요',
    noSettings: '생성 설정이 없습니다'
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

  // 테마
  theme: {
    title: '테마',
    light: '라이트',
    dark: '다크',
    system: '시스템 설정 따르기'
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
    invalidValue: '유효하지 않은 값입니다',
    paramCorrected: '{param}: {from} → {to} (범위: {min}~{max})'
  },

  // 알림
  notification: {
    title: '알림',
    none: '없음',
    sound: '소리',
    browser: '브라우저',
    both: '둘 다',
    volume: '볼륨',
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
    pngOnly: 'PNG 파일만 선택해주세요!',
    selectFile: '📁 PNG 파일 선택',
    analyzeButton: '🔍 분석하기',
    loadPrompt: '⬅️ 프롬프트 불러오기',
    promptLoaded: '프롬프트를 불러왔습니다!',
    noGenerationInfo: '이 이미지에는 generation 정보가 없습니다.',
    apiError: 'API 에러: {status}',
    connectionError: 'WebUI에 연결할 수 없습니다. WebUI가 실행 중인지 확인해주세요.'
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
    skipNextBatch: '현재 이미지 건너뛰고 다음 (배치 {batchSize}개 중)',

    // Combination mode
    combinationMode: '조합',
    combinationCount: '({count})'
  },

  // 파라미터 패널
  paramsPanel: {
    title: '파라미터',
    editPrompts: '✏️ 편집',
    editPromptsWithContent: '✏️ 편집 ●',
    promptSlots: '프롬프트 슬롯:'
  },

  // 마지막 생성 설정
  lastParams: {
    title: '마지막 생성 설정',
    basic: '기본',
    random: '랜덤',
    input: '입력'
  },

  // ADetailer
  adetailer: {
    modalTitle: '✏️ ADetailer {label} - Prompt',
    hint: '💡 ADetailer 프롬프트를 비워두면 메인 프롬프트가 사용됩니다.'
  },

  // 이미지 프리뷰
  imagePreview: {
    title: '이미지 (PNG Info)',
    noImagePlaceholder: '이미지가 여기에 표시됩니다',
    usedPrompt: '조합 결과'
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
  },

  // 시스템 설정
  systemSettings: {
    title: '시스템 설정',
    expand: '시스템 설정 펼치기',
    collapse: '시스템 설정 접기'
  },

  // 크기 자동 보정
  dimensionValidation: {
    title: '크기 자동 보정',
    widthMessage: '가로 {original}을(를) {corrected}(8의 배수)로 자동 보정하시겠습니까?\n\n나중에 시스템 설정에서 변경할 수 있습니다.',
    heightMessage: '세로 {original}을(를) {corrected}(8의 배수)로 자동 보정하시겠습니까?\n\n나중에 시스템 설정에서 변경할 수 있습니다.',
    applyCorrection: '보정',
    keepOriginal: '유지',
    autoCorrect: '8의 배수로 자동 보정',
    settingsHint: '설정을 변경하려면 시스템 설정을 확인하세요'
  },

  // 키보드 단축키
  keyboardShortcuts: {
    generateImage: '이미지 생성',
    closeModal: '모달 닫기',
    switchSlot: '슬롯 {slot} 전환',
    focusPrompt: '프롬프트에 포커스'
  },

  // 드래그 앤 드롭
  dragDrop: {
    dropHere: 'PNG 파일을 여기에 놓으세요',
    pngOnly: 'PNG 이미지만 지원됩니다'
  },

  // 탭 네비게이션
  tabs: {
    txt2img: 'txt2img',
    img2img: 'img2img',
    inpaint: 'Inpaint',
    workflow: 'Workflow',
    comingSoon: '준비 중입니다',
    switchWarningTitle: '이미지 생성 중',
    switchWarningMessage: '이미지 생성 중입니다. 탭을 이동하면 생성 결과가 히스토리에 저장되지 않습니다.',
    switchAnyway: '이동하기'
  },

  // 파이프라인
  pipeline: {
    title: '파이프라인',
    description: '여러 단계를 자동으로 연결하여 이미지를 생성합니다.',
    quickStart: '빠른 시작',
    steps: '스텝',
    start: '실행',
    running: '실행 중...',
    stop: '중지',
    clear: '초기화',
    empty: '위의 템플릿을 선택하여 파이프라인을 시작하세요.'
  },

  // 워크플로
  workflow: {
    settings: '설정',
    systemStatus: '시스템 상태',
    connected: '연결됨',
    disconnected: '연결 안됨',
    model: '모델',
    noModel: '모델 없음',
    templates: '템플릿',
    savedWorkflows: '저장된 워크플로',
    noSavedWorkflows: '저장된 워크플로가 없습니다',
    pipelineSteps: '파이프라인 스텝',
    stepsCount: '개',
    usingDefaults: '기본값 사용',
    hasOverrides: '오버라이드 설정됨',
    edit: '편집',
    moveUp: '위로 이동',
    moveDown: '아래로 이동',
    remove: '삭제',
    noSteps: '스텝이 없습니다',
    selectTemplate: '템플릿을 선택하거나 스텝을 추가하세요',
    addStep: '스텝 추가',
    start: '실행',
    running: '실행 중...',
    stop: '중지',
    clear: '초기화',
    results: '결과',
    runningStep: '실행 중 스텝',
    waiting: '대기 중',
    generating: '생성 중...',
    noResults: '아직 결과가 없습니다',

    // Step override
    editStep: '스텝 설정 편집',
    overrideSettings: '오버라이드 설정',
    overrideDescription: '워크플로우 실행 시 이 스텝에만 적용되는 설정입니다. 각 탭의 원래 설정은 변경되지 않습니다. 비워두면 해당 탭의 현재 값이 사용됩니다.',
    promptOverride: '프롬프트',
    negativeOverride: '네거티브 프롬프트',
    stepsOverride: 'Steps',
    cfgOverride: 'CFG Scale',
    denoisingOverride: 'Denoising Strength',
    maskBlurOverride: 'Mask Blur',
    inpaintAreaOverride: 'Inpaint Area',
    inpaintAreaWholePicture: '전체',
    inpaintAreaOnlyMasked: '마스크 영역만',
    clearOverrides: '오버라이드 초기화',
    saveOverrides: '저장',

    // Default prompts
    defaultPrompts: '기본 프롬프트',
    defaultPromptsDescription: '모든 스텝에서 사용될 기본 프롬프트입니다. 스텝별 오버라이드로 재정의할 수 있습니다.',
    defaultPositive: '기본 포지티브 프롬프트',
    defaultNegative: '기본 네거티브 프롬프트',

    // Live preview
    livePreview: '실시간 미리보기',
    noPreview: '미리보기 없음',

    // Save/Load workflows
    saveWorkflow: '워크플로 저장',
    saveWorkflowAs: '다른 이름으로 저장',
    workflowName: '워크플로 이름',
    workflowNamePlaceholder: '워크플로 이름을 입력하세요',
    workflowSaved: '워크플로가 저장되었습니다',
    workflowLoaded: '워크플로를 불러왔습니다',
    workflowDeleted: '워크플로가 삭제되었습니다',
    deleteWorkflow: '워크플로 삭제',
    deleteWorkflowConfirm: '이 워크플로를 삭제하시겠습니까?',
    loadWorkflow: '불러오기',
    overwriteWorkflow: '기존 워크플로를 덮어쓰시겠습니까?',
    workflowSteps: '{count}개 스텝'
  },

  // img2img
  img2img: {
    title: 'img2img',
    uploadImage: '이미지 업로드',
    selectFile: '📁 파일 선택',
    selectFromHistory: '📋 히스토리에서',
    dropImageHere: '이미지를 여기에 드롭하세요',
    dragDropHint: '또는 드래그 앤 드롭',
    denoisingStrength: 'Denoising',
    denoisingHint: '0: 원본 유지 / 1: 완전히 새로 생성',
    noImageSelected: '이미지를 먼저 선택해주세요',
    imageSize: '{width} × {height}',
    removeImage: '이미지 제거',
    inputImage: '입력 이미지',
    selectImage: '이미지 선택',
    imageRequired: '⚠️ 입력 이미지 필요',
    unsupportedFormat: '지원하지 않는 이미지 형식입니다',
    loadFailed: '이미지 로드 실패',
    // 업스케일
    enableUpscale: '업스케일 (Hires Fix)',
    upscaler: 'Upscaler',
    upscaleScale: '배율',
    upscaleHint: '출력 크기: {width} × {height}',
    upscaling: '업스케일 중...',
    upscaleComplete: '업스케일 완료',
    upscaleFailed: '업스케일 실패',
    // Pipeline
    imageReceived: '이미지 전달: {from} → img2img'
  },

  // Inpaint
  inpaint: {
    title: 'Inpaint',
    // 도구
    tools: '도구',
    brush: '브러시',
    eraser: '지우개',
    brushSize: '브러시 크기',
    // 마스크 편집
    mask: '마스크',
    fillMask: '마스크 채우기',
    clearMask: '마스크 지우기',
    invertMask: '마스크 반전',
    undo: '실행 취소',
    redo: '다시 실행',
    // 마스크 설정
    maskSettings: '마스크 설정',
    inpaintSettings: 'INPAINT 설정',
    generationParams: '생성 파라미터',
    maskBlur: '마스크 블러',
    maskedContent: '마스크 영역 채우기',
    maskedContentOriginal: '원본',
    maskedContentFill: '단색 채우기',
    maskedContentLatentNoise: 'Latent Noise',
    maskedContentLatentNothing: 'Latent Nothing',
    inpaintArea: 'Inpaint 영역',
    inpaintAreaWholePicture: '전체 이미지',
    inpaintAreaOnlyMasked: '마스크 영역만',
    onlyMaskedPadding: '마스크 패딩',
    // 캔버스
    canvas: '캔버스',
    zoomIn: '확대',
    zoomOut: '축소',
    fitToScreen: '화면에 맞추기',
    fit: '맞춤',
    resetView: '뷰 초기화',
    // 메시지
    noImageSelected: '이미지를 먼저 선택해주세요',
    noMaskDrawn: '마스크를 그려주세요',
    maskRequired: '⚠️ 마스크 필요',
    imageRequired: '⚠️ 입력 이미지 필요',
    uploadImageFirst: '이미지를 먼저 업로드해주세요',
    // 드래그앤드롭
    dropImageHere: '이미지를 여기에 놓으세요',
    invalidFileType: '지원하지 않는 파일 형식입니다 (PNG, JPG, WebP만 가능)',
    imageLoaded: '이미지가 로드되었습니다',
    // 클립보드
    pasteImage: '이미지 붙여넣기 (Ctrl+V)',
    imagePasted: '클립보드에서 이미지를 붙여넣었습니다',
    noImageInClipboard: '클립보드에 이미지가 없습니다',
    // 이미지 관리
    removeImage: '이미지 제거',
    replaceImage: '이미지 교체',
    confirmMaskReset: '이미지를 교체하면 현재 마스크가 초기화됩니다. 계속하시겠습니까?',
    confirmImageRemove: '이미지를 제거하면 현재 마스크와 확장 설정이 초기화됩니다. 계속하시겠습니까?',
    imageRemoved: '이미지가 제거되었습니다',
    // 줌/뷰
    zoom: '줌',
    zoomLevel: '줌 레벨',
    pan: '이동',
    fitToWindow: '창에 맞추기',
    actualSize: '실제 크기 (100%)',
    // Outpaint (확장)
    outpaint: 'Outpaint',
    expand: '캔버스 확장',
    expandTop: '위',
    expandBottom: '아래',
    expandLeft: '왼쪽',
    expandRight: '오른쪽',
    expandPixels: 'px',
    expandPreset: '프리셋',
    applyExpansion: '확장 적용',
    resetExpansion: '확장 리셋',
    expansionApplied: '캔버스가 확장되었습니다',
    expansionReset: '확장이 초기화되었습니다',
    expansionCorrected: '8의 배수로 보정됨: {width} × {height}',
    expansionNot8Multiple: '확장 크기 {size}은(는) 8의 배수가 아닙니다',
    noExpansion: '확장할 크기를 입력해주세요',
    expandAll: '모두',
    expandPreview: '확장 미리보기',
    // 확장 채우기 옵션
    expandFill: '채우기',
    fillSolid: '단색',
    fillNoise: '노이즈',
    // 생성 관련
    preparingOutpaint: 'Outpaint 이미지 준비 중...',
    preparationFailed: '이미지 준비에 실패했습니다',
    // Pipeline
    imageReceived: '이미지 전달: {from} → inpaint'
  },

  // ControlNet
  controlnet: {
    title: 'ControlNet',
    enable: '활성화',
    enabled: '활성화됨',
    reset: '리셋',
    model: '모델',
    preprocessor: '프리프로세서',
    weight: 'Weight',
    guidance: 'Guidance',
    controlMode: 'Control Mode',
    resizeMode: 'Resize Mode',
    dropImage: '이미지를 드래그하거나 붙여넣기',
    selectFile: '파일 선택',
    preprocessResult: '전처리 결과',
    useAsInput: '입력으로 사용',
    imageLoaded: '이미지가 로드되었습니다',
    loadFailed: 'ControlNet 데이터 로드 실패',
    invalidFileType: '지원하지 않는 파일 형식입니다',
    selectModuleFirst: '먼저 프리프로세서를 선택하세요',
    preprocessDone: '전처리가 완료되었습니다',
    preprocessFailed: '전처리에 실패했습니다',
    // Manager panel
    quickPresets: '빠른 프리셋',
    presetApplied: '프리셋 적용됨',
    advancedSettings: '고급 설정',
    runPreprocess: '전처리 실행',
    disabled: '비활성화',
    noImage: '이미지 없음',
    selectPreprocessor: '프리프로세서 선택',
    noUnitsEnabled: 'ControlNet 유닛이 활성화되지 않음',
    unitsEnabled: '개 유닛 활성화됨',
    modelNotFound: '{preset}에 맞는 모델이 없습니다. 모델을 직접 선택해주세요.',
    prompt: '프롬프트',
    promptHint: '선택사항',
    promptPlaceholder: '비워두면 메인 프롬프트 사용',
    // Intensity presets
    intensity: '강도',
    weak: '약함',
    normal: '보통',
    strong: '강함',
    intensityApplied: '강도가 적용되었습니다',
    noIntensityPreset: '이 모듈에는 강도 프리셋이 없습니다',
    // Module descriptions
    moduleDesc: {
      openpose: '자세를 얼마나 정확히 따를지 조절',
      depth: '입체감/볼륨을 얼마나 유지할지 조절',
      canny: '외곽선을 얼마나 따를지 조절',
      lineart: '선화를 얼마나 따를지 조절',
      tile: '디테일을 얼마나 유지할지 조절'
    },
    // Intensity descriptions
    intensityDesc: {
      weak: '약함: 프롬프트 자유도 높음, 참조 이미지 영향 적음',
      normal: '보통: 균형 잡힌 설정',
      strong: '강함: 참조 이미지를 강하게 따름'
    },
    intensityHint: '약함: 프롬프트 자유도 ↑ · 강함: 참조 이미지 영향 ↑',
    // Image transform
    resetTransform: '변환 초기화'
  }
}
