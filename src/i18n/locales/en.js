export default {
  // Common actions and states
  common: {
    // Actions
    generate: 'Generate',
    save: 'Save',
    load: 'Load',
    delete: 'Delete',
    cancel: 'Cancel',
    close: 'Close',
    edit: 'Edit',
    confirm: 'Confirm',
    apply: 'Apply',
    reset: 'Reset',
    copy: 'Copy',
    refresh: 'Refresh',

    // States
    generating: 'Generating...',
    loading: 'Loading...',
    saving: 'Saving...',
    deleting: 'Deleting...',
    processing: 'Processing...',

    // Common labels
    name: 'Name',
    description: 'Description',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',

    // Confirm dialog
    deleteImage: 'Delete Image',
    deleteImageConfirm: 'Delete this image?',
    deleteHistory: 'Delete History',
    deleteHistoryConfirm: 'Delete history?',
    deleteHistoryWithFavorites: 'Delete history?\n\n{count} favorites will be kept.',
    batchDelete: 'Batch Delete Images',
    batchDeleteConfirm: 'Delete {count} images?',
    noSelectedImages: 'No images selected'
  },

  // Prompt related
  prompt: {
    title: 'Prompt',
    positive: 'Positive Prompt',
    negative: 'Negative Prompt',
    placeholder: 'Enter prompt...',
    negativePlaceholder: 'Enter negative prompt...',
    required: 'Please enter prompt!',

    infiniteMode: 'Infinite Generation Mode',
    infiniteModeOn: 'Enable Infinite Mode',
    infiniteModeOff: 'Disable Infinite Mode',
    infiniteModeTooltip: 'Ctrl+↑/↓: Adjust weight',

    // Prompt slots
    slots: 'Prompt Slots',
    slotEmpty: 'Empty Slot',
    addSlot: 'Add Slot',
    slotClickToSelect: 'Slot {i}: Click to select (auto-saved)',
    slotSaved: 'Slot saved',
    slotLoaded: 'Slot loaded',
    slotDeleted: 'Slot deleted'
  },

  // LoRA
  lora: {
    title: 'Select LoRA',
    search: 'Search',
    weight: 'Weight',
    addToPrompt: 'Add to Prompt',
    noLorasFound: 'No LoRAs found',
    refreshing: 'Refreshing LoRA list...',
    refreshed: 'LoRA list refreshed',
    refreshFailed: 'Failed to refresh LoRA list',
    loadFailed: 'Failed to load LoRA list'
  },

  // Bookmark
  bookmark: {
    title: 'Bookmarks',
    promptBookmarks: '🔖 Prompt Bookmarks',
    add: 'Add Bookmark',
    addNew: '➕ New Bookmark',
    addFirst: '➕ Create First Bookmark',
    name: 'Bookmark Name',
    nameRequired: 'Bookmark Name *',
    namePlaceholder: 'e.g., Photo Style',
    saved: 'Bookmark saved',
    updated: 'Bookmark updated',
    deleted: 'Bookmark deleted',
    added: 'Bookmark added',
    applied: '"{name}" applied',
    deleteTitle: 'Delete Bookmark',
    deleteConfirm: 'Delete this bookmark?',
    deleteConfirmWithName: 'Delete "{name}" bookmark?',
    loadConfirm: 'Load this bookmark?',
    noBookmarks: 'No saved bookmarks',
    noSearchResults: 'No search results',
    searchPlaceholder: '🔍 Search bookmarks...',
    bookmarks: 'bookmarks',
    selected: 'Selected:',
    applyPrompt: '✅ Apply Prompt',
    newBookmark: 'New Bookmark',
    editBookmark: 'Edit Bookmark',
    promptPlaceholder: 'Enter prompt...',
    negativePrompt: 'Negative Prompt',
    negativePromptPlaceholder: 'Enter negative prompt...',
    none: '(none)',
    nameRequiredError: 'Please enter bookmark name'
  },

  // History
  history: {
    title: 'History',
    manage: 'History Manager',
    clear: 'Clear All',
    clearConfirm: 'Delete all history?',
    clearNonFavorites: 'Clear Non-Favorites',
    deleteSelected: 'Delete Selected',
    deleteConfirm: 'Delete {count} images?',
    noImages: 'No generated images',
    noSearchResults: 'No search results',

    // Search and filter
    searchPlaceholder: 'Search prompts, parameters...',
    sortNewest: 'Newest',
    sortOldest: 'Oldest',
    sortFavorite: 'Favorites',

    // Selection
    selectedCount: '{count} selected',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    selectImage: 'Select an image',

    // Compare
    compare: 'Compare',
    compareTooltip: 'Compare selected images with current image',
    compareMode: 'Compare Mode',
    selectCompareImage: 'Select image to compare',
    imageCompare: 'Image Comparison',
    currentImage: 'Current Image',
    compareImage: 'Compare Image',
    closeCompare: 'Close Compare',
    previous: 'Previous',
    next: 'Next',

    // Details
    detailsTitle: 'Details',
    generatedAt: 'Generated At',
    status: 'Status',
    interrupted: 'Interrupted Image',
    parameters: 'Parameters',
    loadParams: 'Load Parameters',
    unknown: 'Unknown',

    // Favorites
    addFavorite: 'Add to Favorites',
    removeFavorite: 'Remove from Favorites',
    favoriteAdded: '⭐ Added to favorites',
    favoriteRemoved: '☆ Removed from favorites',
    favoriteUpdateFailed: 'Failed to update favorite',

    // Time labels
    today: 'Today',
    yesterday: 'Yesterday',

    // Actions
    useSeed: 'Use Seed',
    copyParams: 'Copy Parameters',
    paramsCopied: 'Parameters copied',
    download: 'Download',
    downloadStarted: '💾 Download started',
    downloadMultiple: '{count} images downloaded',
    downloadComplete: '{count} images downloaded',
    sendToImg2Img: 'Send to img2img',

    // Messages
    imageDeleted: '🗑️ Image deleted',
    imagesDeleted: '🗑️ {count} images deleted',
    deletedWithProtected: '✅ {deletedCount} deleted ({favoriteCount} favorites protected)',
    deletedCount: '✅ {count} images deleted',
    favoriteToggled: 'Favorite toggled',
    batchDeleteFailed: 'Batch delete failed',
    batchDownloadFailed: 'Batch download failed',

    // Migration
    migrating: 'Migrating {count} images...',
    migrationComplete: 'Image migration complete',
    migrationFailed: 'Image migration failed (skipped)',

    // Errors
    deleteFailed: 'Failed to delete image',
    downloadFailed: 'Batch download failed',
    loadFailed: 'Failed to load image'
  },

  // Queue
  queue: {
    title: 'Queue',
    add: 'Add to Queue',
    clear: 'Clear Queue',
    clearCompleted: 'Clear Completed',
    clearAll: 'Clear All',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    retry: 'Retry',
    retryFailed: 'Retry Failed Items',

    status: {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      paused: 'Paused'
    },

    empty: 'Queue is empty',
    itemsInQueue: '{count} items in queue',

    // Messages
    added: 'Added to queue',
    removed: 'Removed from queue',
    updated: 'Updated',
    completedRemoved: 'Completed items removed',
    allRemoved: 'All items removed',
    retrying: 'Retrying failed items',
    itemFailed: 'Queue item failed: {id}'
  },

  // Preset
  preset: {
    title: 'Presets',
    save: 'Save Preset',
    load: 'Load Preset',
    delete: 'Delete Preset',
    name: 'Preset Name',
    saved: 'Preset saved',
    updated: 'Preset updated',
    deleted: 'Preset deleted',
    loaded: 'Preset loaded',
    loadConfirm: 'Load this preset?',
    deleteConfirm: 'Delete this preset?',
    noPresets: 'No saved presets'
  },

  // Settings
  settings: {
    title: 'Settings',
    language: 'Language',
    general: 'General',
    advanced: 'Advanced',
    appearance: 'Appearance',
    apiUrl: 'API URL',
    theme: 'Theme',
    autoSave: 'Auto Save',
    notifications: 'Notifications',
    reset: 'Reset Settings',
    resetConfirm: 'Reset all settings?'
  },

  // Messages
  message: {
    success: {
      saved: 'Saved successfully',
      deleted: 'Deleted successfully',
      copied: 'Copied to clipboard',
      generated: 'Generation completed',
      generationComplete: 'Image generation completed',
      loaded: 'Loaded successfully',
      applied: 'Applied successfully',
      completed: 'Completed',
      interrupted: 'Generation interrupted',
      skipped: 'Skipped',

      // LoRA
      loraRefreshed: 'LoRA list refreshed',

      // Model
      modelLoaded: 'Model list loaded',

      // Migration/DB
      migrationComplete: 'Data migrated to IndexedDB',
      indexedDBInitialized: 'IndexedDB initialized',
      storageCleared: 'localStorage cleared',
      allImagesCleared: 'All images cleared'
    },
    error: {
      saveFailed: 'Failed to save',
      deleteFailed: 'Failed to delete',
      loadFailed: 'Failed to load',
      networkError: 'Network error occurred',
      apiError: 'API error occurred',
      apiErrorWithStatus: 'API error: {status}',
      unknown: 'Unknown error occurred',

      // Generation errors
      generationFailed: 'Image generation failed',
      generationFailedMessage: 'Image generation failed: {error}',
      interruptFailed: 'Failed to interrupt',
      interruptMessage: 'Interrupt requested (API response: {error})',
      skipFailed: 'Failed to skip',
      progressFailed: 'Failed to get progress',
      maxErrorsReached: 'Infinite mode auto-stopped after {count} consecutive errors',

      // LoRA errors
      loraRefreshFailed: 'Failed to refresh LoRA list',
      loraLoadFailed: 'Failed to load LoRA list',

      // Model errors
      modelLoadFailed: 'Failed to load model list',
      modelChangeFailed: 'Failed to change model',

      // API connection errors
      authRequired: 'Authentication required',
      accessDenied: 'Access denied',
      serverError: 'Server error ({status})',
      serverInternalError: 'WebUI server internal error',
      noResponse: 'WebUI is not responding. Please try again later.',
      connectionFailed: 'Cannot connect to WebUI. Please check if WebUI is running and --api flag is set.',
      apiResponseError: 'API response error',

      // Storage errors
      storageFull: 'Storage full: localStorage cleared',
      indexedDBOpenFailed: 'Failed to open IndexedDB',
      indexedDBSaveFailed: 'Failed to save to IndexedDB (ignored)',
      indexedDBLoadFailed: 'Failed to load from IndexedDB',
      localStorageSaveFailed: 'Failed to save to localStorage',
      localStorageLoadFailed: 'Failed to load from localStorage',
      localStorageClearFailed: 'Failed to clear localStorage',
      historySaveFailed: 'Failed to save history',
      historyMinSaveFailed: 'Failed to save minimal history',

      // Migration errors
      migrationFailed: 'Migration failed',
      migrationFailedContinue: 'Data migration failed (continuing)',

      // Image errors
      imageLoadFailed: 'Failed to load image',
      imageCompressFailed: 'Image compression failed, using original',

      // Slot errors
      slotLoadFailed: 'Failed to load slot'
    },
    warning: {
      unsavedChanges: 'You have unsaved changes',
      confirmLeave: 'Are you sure you want to leave?',
      migrationFailedContinue: '⚠️ Data migration failed (continuing)'
    }
  },

  // Validation
  validation: {
    required: 'Please enter {field}',
    invalidFormat: 'Invalid {field} format',
    tooShort: '{field} is too short',
    tooLong: '{field} is too long',
    invalidValue: 'Invalid value'
  },

  // Notification
  notification: {
    unsupported: 'This browser does not support notifications',
    permissionDenied: 'Notification permission denied',
    generationComplete: 'Image generation completed',
    enable: 'Enable Notifications',
    disable: 'Disable Notifications'
  },

  // PNG Info
  pngInfo: {
    title: 'PNG Info',
    analyze: 'Analyze Image',
    noInfo: 'No PNG info available',
    analyzing: 'Analyzing...',
    failed: 'Failed to analyze PNG info',
    failedWithMessage: 'Failed to analyze PNG info: {error}',
    sendToTxt2Img: 'Send to txt2img',
    sendToImg2Img: 'Send to img2img',
    selectPngFile: 'Please select a PNG file!',
    pngOnly: 'PNG files only!'
  },

  // API status
  api: {
    connecting: 'Connecting to API...',
    connected: 'API Connected',
    connectionSuccess: 'API connection successful',
    connectionFailed: 'API connection failed',
    disconnected: 'API Disconnected',
    notConnected: 'API not connected',
    error: 'API Error',
    checkConnection: 'Reconnect API',
    retrying: 'Reconnecting...'
  },

  // Time expressions
  time: {
    justNow: 'Just now',
    minutesAgo: '{n} minutes ago',
    hoursAgo: '{n} hours ago',
    daysAgo: '{n} days ago',
    weeksAgo: '{n} weeks ago',
    monthsAgo: '{n} months ago',
    yearsAgo: '{n} years ago',
    remaining: '{time} remaining',
    secondsRemaining: '{eta}s remaining',
    imageGenerated: '{size} image generated'
  },

  // Image Generation
  generation: {
    resuming: 'Resuming...',
    ongoingDetected: '🔄 Detected ongoing generation',
    processing: 'Processing...',
    preparing: 'Preparing...',
    interrupted: 'Generation interrupted',
    skipCurrent: 'Skipping current image',
    skipFailed: 'Skip failed',
    interruptFailed: 'Interrupt failed',
    interruptComplete: 'Interrupt requested (API response: {error})',
    imageCount: 'Image {current}/{total}',
    step: 'Step {current}/{total}',
    progressFetchFailed: 'Failed to fetch progress',
    parametersCorrected: '⚙️ Parameters auto-corrected: {corrections}',
    autoDeleted: '💾 {count} old images auto-deleted due to 200 image limit (favorites excluded)'
  },

  // Infinite Mode
  infiniteMode: {
    started: 'Infinite mode started',
    interrupted: 'Infinite mode interrupted (total {count} images generated)',
    stopped: 'Infinite mode stopped (total {count} images generated)',
    stoppedCurrent: '⏸️ Infinite mode disabled - will stop after current image completes (total {count} images)',
    alreadyRunning: '⚠️ Infinite mode is already running',
    waitingCurrent: '⚠️ Infinite mode will start after current generation completes',
    waitTimeout: '⚠️ Wait timeout exceeded. Infinite mode start cancelled.',
    generationTimeout: '⚠️ Generation timeout (10 min). Infinite mode stopped.',
    autoStopped: '⚠️ Infinite mode auto-stopped after {count} consecutive errors'
  },

  // Buttons
  button: {
    generate: 'Generate',
    interrupt: 'Interrupt',
    skip: 'Skip',
    extras: 'Extras',
    pngInfo: 'PNG Info',
    checkpoint: 'Checkpoint',
    settings: 'Settings'
  }
}
