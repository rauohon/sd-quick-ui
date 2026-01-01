<template>
  <div class="lazy-image-container" :class="{ 'is-loaded': isLoaded }">
    <!-- Placeholder skeleton -->
    <div v-if="!isLoaded" class="lazy-placeholder">
      <div class="skeleton-shimmer"></div>
    </div>
    <!-- Actual image -->
    <img
      ref="imgRef"
      :src="isInView ? src : undefined"
      :alt="alt"
      :loading="loading"
      class="lazy-image"
      :class="{ 'fade-in': isLoaded }"
      @load="onLoad"
      @error="onError"
    >
    <!-- Error state -->
    <div v-if="hasError" class="lazy-error">
      <span>⚠️</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  loading: {
    type: String,
    default: 'lazy'
  },
  rootMargin: {
    type: String,
    default: '100px'
  }
})

const imgRef = ref(null)
const isInView = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)

let observer = null

function onLoad() {
  isLoaded.value = true
  hasError.value = false
}

function onError() {
  hasError.value = true
  isLoaded.value = true
}

onMounted(() => {
  if (!imgRef.value?.parentElement) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isInView.value = true
          // Once in view, stop observing
          observer?.disconnect()
        }
      })
    },
    {
      rootMargin: props.rootMargin,
      threshold: 0
    }
  )

  observer.observe(imgRef.value.parentElement)
})

onUnmounted(() => {
  observer?.disconnect()
})

// Reset state when src changes
watch(() => props.src, () => {
  isLoaded.value = false
  hasError.value = false
  // If already in view, the new image will load automatically
})
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-bg-tertiary, #f5f5f5);
}

.lazy-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary, #f0f0f0);
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary, #f0f0f0) 0%,
    var(--color-bg-elevated, #e0e0e0) 50%,
    var(--color-bg-tertiary, #f0f0f0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image.fade-in {
  opacity: 1;
}

.lazy-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary, #f5f5f5);
  color: var(--color-text-tertiary, #999);
  font-size: 24px;
}

/* Hide placeholder when loaded */
.lazy-image-container.is-loaded .lazy-placeholder {
  display: none;
}
</style>
