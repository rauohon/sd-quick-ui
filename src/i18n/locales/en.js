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
    no: 'No'
  },

  // Prompt related
  prompt: {
    title: 'Prompt',
    positive: 'Positive Prompt',
    negative: 'Negative Prompt',
    placeholder: 'Enter prompt...',
    negativePlaceholder: 'Enter negative prompt...',

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
    add: 'Add Bookmark',
    name: 'Bookmark Name',
    saved: 'Bookmark saved',
    updated: 'Bookmark updated',
    deleted: 'Bookmark deleted',
    added: 'Bookmark added',
    deleteConfirm: 'Delete this bookmark?',
    loadConfirm: 'Load this bookmark?',
    noBookmarks: 'No saved bookmarks'
  },

  // History
  history: {
    title: 'History',
    clear: 'Clear All',
    clearConfirm: 'Delete all history?',
    clearNonFavorites: 'Clear Non-Favorites',
    deleteSelected: 'Delete Selected',
    deleteConfirm: 'Delete {count} images?',
    noImages: 'No generated images',

    // Time labels
    today: 'Today',
    yesterday: 'Yesterday',

    // Actions
    useSeed: 'Use Seed',
    copyParams: 'Copy Parameters',
    paramsCopied: 'Parameters copied',
    download: 'Download',
    downloadMultiple: '{count} images downloaded',
    sendToImg2Img: 'Send to img2img',

    // Messages
    imageDeleted: 'Image deleted',
    imagesDeleted: '{count} images deleted',
    deletedWithProtected: '{deletedCount} deleted ({favoriteCount} favorites protected)',
    favoriteToggled: 'Favorite toggled',
    favoriteRemoved: 'Favorite removed',

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
      accessDenied: 'Access denied',
      serverError: 'Server error ({status})',
      serverInternalError: 'WebUI server internal error',
      noResponse: 'WebUI is not responding. Please try again later.',
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
      confirmLeave: 'Are you sure you want to leave?'
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
