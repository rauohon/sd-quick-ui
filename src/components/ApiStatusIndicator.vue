<template>
  <div class="api-status">
    <span
      class="status-indicator"
      :class="{
        'connected': connected && !checking,
        'disconnected': !connected && !checking,
        'checking': checking
      }"
      :title="checking ? 'API 연결 확인 중...' : connected ? 'API 연결됨' : 'API 연결 끊김'"
      @click="$emit('check')"
    >
      {{ checking ? '⏳' : connected ? '🟢' : '🔴' }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  connected: {
    type: Boolean,
    default: false
  },
  checking: {
    type: Boolean,
    default: false
  }
})

defineEmits(['check'])
</script>

<style scoped>
.api-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  font-size: 16px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s;
}

.status-indicator:hover {
  transform: scale(1.2);
}

.status-indicator.checking {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
