<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="isVisible" class="confirm-overlay" @click="handleCancel">
        <Transition name="confirm-scale">
          <div v-if="isVisible" class="confirm-dialog" @click.stop>
            <div class="confirm-header">
              <span class="confirm-icon">⚠️</span>
              <h3 class="confirm-title">{{ title }}</h3>
            </div>

            <div class="confirm-body">
              <p class="confirm-message">{{ message }}</p>
            </div>

            <div class="confirm-actions">
              <button
                class="confirm-btn confirm-btn-cancel"
                @click="handleCancel"
                ref="cancelBtn"
              >
                {{ cancelText }}
              </button>
              <button
                class="confirm-btn confirm-btn-confirm"
                @click="handleConfirm"
                ref="confirmBtn"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '확인'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: '확인'
  },
  cancelText: {
    type: String,
    default: '취소'
  },
  onConfirm: {
    type: Function,
    required: true
  },
  onCancel: {
    type: Function,
    default: () => {}
  }
})

const isVisible = ref(false)
const confirmBtn = ref(null)
const cancelBtn = ref(null)

function handleConfirm() {
  isVisible.value = false
  setTimeout(() => {
    props.onConfirm()
  }, 150)
}

function handleCancel() {
  isVisible.value = false
  setTimeout(() => {
    props.onCancel()
  }, 150)
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 'Enter') {
    handleConfirm()
  }
}

onMounted(() => {
  isVisible.value = true
  document.addEventListener('keydown', handleKeydown)

  // Focus confirm button by default
  setTimeout(() => {
    confirmBtn.value?.focus()
  }, 100)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  min-width: 320px;
  max-width: 480px;
  overflow: hidden;
}

.confirm-header {
  padding: 20px 24px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.confirm-icon {
  font-size: 24px;
  line-height: 1;
}

.confirm-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.confirm-body {
  padding: 20px 24px;
}

.confirm-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
  white-space: pre-wrap;
}

.confirm-actions {
  padding: 16px 24px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.confirm-btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.confirm-btn-cancel:hover {
  background: #e5e7eb;
}

.confirm-btn-cancel:active {
  background: #d1d5db;
}

.confirm-btn-confirm {
  background: #ef4444;
  color: white;
}

.confirm-btn-confirm:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.confirm-btn-confirm:active {
  background: #b91c1c;
  transform: translateY(0);
}

.confirm-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Animations */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.15s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-scale-enter-active,
.confirm-scale-leave-active {
  transition: all 0.15s ease;
}

.confirm-scale-enter-from,
.confirm-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
