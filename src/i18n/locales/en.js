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
    done: 'Done',
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
    noSearchResults: 'No search results',
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
    noSelectedImages: 'No images selected',

    // Settings
    ok: 'OK',
    dontAskAgain: "Don't ask again"
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

    // Weight adjustment
    weightHint: '(Ctrl+↑/↓: Adjust weight)',
    changedDuringGeneration: 'Modified - will apply to next generation',

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
    loadFailed: 'Failed to load LoRA list',
    addedToPrompt: 'Added to prompt: {name}'
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
    nameRequiredError: 'Please enter bookmark name',
    applyMode: 'Apply Mode',
    applyModeReplace: 'Replace prompt',
    applyModePrepend: 'Prepend to prompt',
    applyModeAppend: 'Append to prompt',
    // Import/Export
    import: 'Import Bookmarks',
    export: 'Export Bookmarks',
    exported: 'Exported {count} bookmarks',
    imported: 'Imported {count} bookmarks',
    importFailed: 'Failed to import bookmarks',
    noBookmarksToExport: 'No bookmarks to export',
    // Thumbnail
    setThumbnail: 'Set Thumbnail',
    selectThumbnail: 'Select Thumbnail',
    selectThumbnailHint: 'Select an image from history',
    thumbnailSet: 'Thumbnail has been set',
    // Update/Save
    promptModified: 'Prompt modified after applying bookmark',
    updateBookmark: 'Update Bookmark',
    updateTooltip: 'Overwrite existing bookmark with current prompt',
    saveAsNew: 'Save as New',
    saveAsNewTooltip: 'Save current prompt as a new bookmark',
    bookmarkUpdated: 'Bookmark has been updated',
    savedAsNew: 'Saved as new bookmark'
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
    selectedCountShort: '{count} selected',
    selectAll: 'Select All',
    selectAllShort: 'All',
    deselectAll: 'Deselect All',
    deselectAllShort: 'None',
    selectImage: 'Select an image',
    downloadSelected: '💾 Download',
    downloadSelectedTooltip: 'Download selected images',
    cancelSelectionMode: 'Exit selection mode',
    batchSelect: '📦 Select',
    batchSelectTooltip: 'Batch download',

    // Compare
    compare: 'Compare',
    compareTooltip: 'Compare selected images with current image',
    compareMode: 'Compare Mode',
    selectCompareImage: 'Select image to compare',
    imageCompare: 'Image Comparison',
    currentImage: 'Current Image',
    compareImage: 'Compare Image',
    latestGenerated: 'Latest Generated',
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

    // Panel controls
    foldContent: 'Fold content',
    unfoldContent: 'Unfold content',
    hidePanel: 'Hide panel',
    showPanel: 'Show panel',
    showAllImages: 'Show all',
    showFavoritesOnly: 'Show favorites only',

    // Empty states
    noFavorites: 'No favorite images',
    addTestSample: 'Add test sample',
    addSample: '+ Add sample',

    // Load more
    loadMore: 'Load More',
    loadMoreTooltip: 'Load 50 more images',
    noMoreImages: 'No more images to load',
    loadedMore: '✅ Loaded {count} more images',
    loadMoreFailed: 'Failed to load more images',

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
    itemFailed: 'Queue item failed: {id}',

    // Dialogs
    addToQueue: 'Add to Queue',
    editItem: 'Edit Queue Item',
    promptRequired: 'Prompt *',
    negativePrompt: 'Negative Prompt',
    batchCount: 'Batch Count',
    addFirstItem: '➕ Add First Item',
    clearAllTitle: 'Clear All Items',
    clearAllConfirm: 'Delete all items in the queue?',

    // Errors
    promptRequiredError: 'Please enter a prompt',
    noSettings: 'No generation settings available'
  },

  // Preset
  preset: {
    title: 'Presets',
    manager: '⚙️ Preset Manager',
    save: 'Save Preset',
    load: 'Load Preset',
    delete: 'Delete Preset',
    name: 'Preset Name',
    nameRequired: 'Preset Name *',
    namePlaceholder: 'e.g., High Quality Portrait',
    descriptionOptional: 'Description (Optional)',
    descriptionPlaceholder: 'e.g., Settings for high-quality portrait photos',
    saved: 'Preset saved',
    updated: 'Preset updated',
    deleted: 'Preset deleted',
    loaded: 'Preset loaded',
    loadConfirm: 'Load this preset?',
    deleteConfirm: 'Delete this preset?',
    deleteConfirmWithName: 'Delete preset "{name}"?',
    noPresets: 'No saved presets',
    noSettings: 'No settings to save',
    nameRequiredError: 'Please enter preset name',
    savedWithName: 'Preset "{name}" saved',
    appliedWithName: 'Preset "{name}" applied',
    newPreset: 'New Preset',
    editPreset: 'Edit Preset',
    addFirst: '➕ Save First Preset',
    addNew: '➕ New',
    searchPlaceholder: '🔍 Search presets...',
    presets: 'presets',
    noSearchResults: 'No search results',
    applyTooltip: 'Apply preset',
    saveCurrentTooltip: 'Save current settings as preset'
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

  // Theme
  theme: {
    title: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'Follow System'
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
    pngOnly: 'PNG files only!',
    selectFile: '📁 Select PNG File',
    analyzeButton: '🔍 Analyze',
    loadPrompt: '⬅️ Load Prompt',
    promptLoaded: 'Prompt loaded successfully!',
    noGenerationInfo: 'This image has no generation information.',
    apiError: 'API error: {status}',
    connectionError: 'Cannot connect to WebUI. Please check if WebUI is running.'
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

  // Advanced Panel
  advancedPanel: {
    title: 'Advanced Settings',
    foldPanel: 'Fold panel',
    unfoldPanel: 'Unfold panel',
    selectModel: 'Please select...',
    seedVariation: 'Seed Variation',
    seedVariationTooltip: 'Random generation within seed ± this range in infinite mode',
    reconnect: '🔄 Reconnect',
    checking: 'Checking...'
  },

  // Prompt Panel
  promptPanel: {
    title: 'Prompt',
    infiniteModeOn: 'Enable infinite generation mode',
    infiniteModeOff: 'Disable infinite generation mode (click)',
    apiNotConnected: 'API is not connected',
    generating: 'Generating...',
    apiConnectionRequired: '⚠️ API Connection Required',
    generate: '🚀 Generate',
    infiniteStatus: '🔄 Infinite mode: {count} images generated',
    interruptImmediately: '⏹️ Interrupt Now',
    interruptImmediatelyTooltip: 'Immediately interrupt current generating image',
    disableInfiniteMode: '⏸️ Disable Infinite',
    disableInfiniteModeTooltip: 'Disable infinite mode after completing current image',
    interrupt: '⏹️ Interrupt',
    interruptTooltip: 'Completely interrupt current generation',
    skip: '⏭️ Skip',
    skipNextInfinite: 'Skip current image and generate next',
    skipNextBatch: 'Skip current image and go to next (batch of {batchSize})'
  },

  // Params Panel
  paramsPanel: {
    title: 'Parameters',
    editPrompts: '✏️ Edit',
    editPromptsWithContent: '✏️ Edit ●',
    promptSlots: 'Prompt Slots:'
  },

  // Last generation settings
  lastParams: {
    title: 'Last Generation Settings',
    basic: 'Basic',
    random: 'Random',
    input: 'Input'
  },

  // ADetailer
  adetailer: {
    modalTitle: '✏️ ADetailer {label} - Prompt',
    hint: '💡 If ADetailer prompts are empty, main prompts will be used.'
  },

  // Image Preview
  imagePreview: {
    title: 'Image (PNG Info)',
    noImagePlaceholder: 'Image will be displayed here'
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
  },

  // System Settings
  systemSettings: {
    title: 'System Settings',
    expand: 'Expand system settings',
    collapse: 'Collapse system settings'
  },

  // Dimension Validation
  dimensionValidation: {
    title: 'Auto-correct Dimensions',
    widthMessage: 'Width {original} will be corrected to {corrected} (multiple of 8). Continue?\n\nYou can change this setting later in System Settings.',
    heightMessage: 'Height {original} will be corrected to {corrected} (multiple of 8). Continue?\n\nYou can change this setting later in System Settings.',
    applyCorrection: 'Apply Correction',
    keepOriginal: 'Keep Original',
    autoCorrect: 'Auto-correct to 8-multiple',
    settingsHint: 'You can change this setting in System Settings'
  },

  // Keyboard Shortcuts
  keyboardShortcuts: {
    generateImage: 'Generate Image',
    closeModal: 'Close Modal',
    switchSlot: 'Switch to Slot {slot}',
    focusPrompt: 'Focus Prompt'
  },

  // Drag and Drop
  dragDrop: {
    dropHere: 'Drop PNG file here',
    pngOnly: 'Only PNG images are supported'
  }
}
