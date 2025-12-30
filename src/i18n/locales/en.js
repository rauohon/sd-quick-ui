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

    // Prompt slots (for Phase 3 - will be filled later)
    slots: 'Prompt Slots',
    slotEmpty: 'Empty Slot',
    addSlot: 'Add Slot'
  },

  // LoRA
  lora: {
    title: 'Select LoRA',
    search: 'Search',
    weight: 'Weight',
    addToPrompt: 'Add to Prompt',
    noLorasFound: 'No LoRAs found',
    refreshing: 'Refreshing LoRA list...',
    refreshed: 'LoRA list refreshed'
  },

  // Bookmark
  bookmark: {
    title: 'Bookmarks',
    add: 'Add Bookmark',
    name: 'Bookmark Name',
    saved: 'Bookmark saved',
    deleted: 'Bookmark deleted',
    deleteConfirm: 'Delete this bookmark?',
    loadConfirm: 'Load this bookmark?',
    noBookmarks: 'No saved bookmarks'
  },

  // History
  history: {
    title: 'History',
    clear: 'Clear All',
    clearConfirm: 'Delete all history?',
    deleteSelected: 'Delete Selected',
    noImages: 'No generated images',

    // Time labels
    today: 'Today',
    yesterday: 'Yesterday',

    // Actions
    useSeed: 'Use Seed',
    copyParams: 'Copy Parameters',
    paramsCopied: 'Parameters copied',
    download: 'Download',
    sendToImg2Img: 'Send to img2img'
  },

  // Queue
  queue: {
    title: 'Queue',
    add: 'Add to Queue',
    clear: 'Clear Queue',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',

    status: {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      paused: 'Paused'
    },

    empty: 'Queue is empty',
    itemsInQueue: '{count} items in queue'
  },

  // Preset
  preset: {
    title: 'Presets',
    save: 'Save Preset',
    load: 'Load Preset',
    delete: 'Delete Preset',
    name: 'Preset Name',
    saved: 'Preset saved',
    deleted: 'Preset deleted',
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
      loaded: 'Loaded successfully',
      applied: 'Applied successfully'
    },
    error: {
      saveFailed: 'Failed to save',
      deleteFailed: 'Failed to delete',
      loadFailed: 'Failed to load',
      networkError: 'Network error occurred',
      apiError: 'API error occurred',
      unknown: 'Unknown error occurred'
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
    sendToTxt2Img: 'Send to txt2img',
    sendToImg2Img: 'Send to img2img'
  },

  // API status
  api: {
    connecting: 'Connecting to API...',
    connected: 'API Connected',
    disconnected: 'API Disconnected',
    error: 'API Error',
    checkConnection: 'Check Connection',
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
    remaining: '{time} remaining'
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

  // Will be filled with actual texts from extracted-texts.json in Phase 3
}
