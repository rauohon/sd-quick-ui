<template>
  <div class="form-group">
    <label>
      {{ label }}
      <span class="weight-hint">(Ctrl+↑/↓: 가중치 조정)</span>
      <span v-if="isGenerating && isChanged" class="generating-indicator" title="수정됨 - 다음 생성에 반영됩니다">
        <span class="spinner"></span>
      </span>
    </label>
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :class="isNegative ? 'negative-textarea' : 'prompt-textarea'"
      @keydown="handleKeydown"
    ></textarea>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  isChanged: {
    type: Boolean,
    default: false
  },
  isNegative: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const textareaRef = ref(null)

// Handle keydown events
function handleKeydown(event) {
  // Ctrl + ArrowUp or Ctrl + ArrowDown
  if (event.ctrlKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    event.preventDefault()
    const increase = event.key === 'ArrowUp'
    adjustWeight(increase)
  }
}

// Weight formatting helper
function formatWeight(weight) {
  const rounded = Math.round(weight * 10) / 10
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)
}

// Find text to adjust (selection or word at cursor)
function findTextToAdjust(text, start, end) {
  let targetStart = start
  let targetEnd = end
  let selectedText = ''

  // If there's a selection, use it
  if (start !== end) {
    return { targetStart, targetEnd, selectedText: text.substring(start, end) }
  }

  const before = text.substring(0, start)
  const after = text.substring(start)

  // Check if we're inside angle brackets (LoRA tags)
  const loraMatch = before.match(/<[^<>]*$/)
  if (loraMatch) {
    const openAngle = before.lastIndexOf('<')
    const closeAngle = text.indexOf('>', start)
    if (closeAngle !== -1) {
      targetStart = openAngle
      targetEnd = closeAngle + 1
      selectedText = text.substring(targetStart, targetEnd)
      return { targetStart, targetEnd, selectedText }
    }
  }

  // Check if we're inside parentheses with weight
  const weightMatch = before.match(/\([^()]*$/)
  if (weightMatch) {
    const openParen = before.lastIndexOf('(')
    const closeParen = text.indexOf(')', start)
    if (closeParen !== -1) {
      targetStart = openParen
      targetEnd = closeParen + 1
      selectedText = text.substring(targetStart, targetEnd)
      return { targetStart, targetEnd, selectedText }
    }
  }

  // Find word boundaries
  const wordBoundaryBefore = before.match(/[,\s()\[\]<>]*([^,\s()\[\]<>]+)$/)
  if (wordBoundaryBefore) {
    targetStart = start - wordBoundaryBefore[1].length
  }

  const wordBoundaryAfter = after.match(/^([^,\s()\[\]<>]+)/)
  if (wordBoundaryAfter) {
    targetEnd = start + wordBoundaryAfter[1].length
  }

  selectedText = text.substring(targetStart, targetEnd).trim()
  return { targetStart, targetEnd, selectedText }
}

// Calculate new weight for text
function calculateNewWeight(selectedText, increase) {
  // Parse LoRA/LyCORIS tag: <lora:name:0.8>
  const loraPattern = /^<(lora|lyco|hypernet):(.+?):([\d.]+)>$/i
  const loraMatch = selectedText.match(loraPattern)

  if (loraMatch) {
    const tagType = loraMatch[1]
    const modelName = loraMatch[2]
    let weight = parseFloat(loraMatch[3])
    weight = increase ? weight + 0.1 : weight - 0.1
    weight = Math.max(0.0, Math.min(2.0, weight))
    weight = Math.round(weight * 10) / 10
    return `<${tagType}:${modelName}:${formatWeight(weight)}>`
  }

  // Parse normal weight: (text:1.1)
  const weightPattern = /^\((.+?):([\d.]+)\)$/
  const match = selectedText.match(weightPattern)

  if (match) {
    const content = match[1]
    let weight = parseFloat(match[2])
    weight = increase ? weight + 0.1 : weight - 0.1
    weight = Math.max(0.1, Math.min(2.0, weight))
    weight = Math.round(weight * 10) / 10

    // Remove parentheses if weight is 1.0
    if (Math.abs(weight - 1.0) < 0.01) {
      return content
    }
    return `(${content}:${formatWeight(weight)})`
  }

  // No existing weight, add it
  const weight = increase ? 1.1 : 0.9
  return `(${selectedText}:${formatWeight(weight)})`
}

// Main weight adjustment function
function adjustWeight(increase) {
  const textarea = textareaRef.value
  if (!textarea) return

  const text = props.modelValue
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  const { targetStart, targetEnd, selectedText } = findTextToAdjust(text, start, end)
  if (!selectedText) return

  const newText = calculateNewWeight(selectedText, increase)
  const newFullText = text.substring(0, targetStart) + newText + text.substring(targetEnd)

  emit('update:modelValue', newFullText)

  // Select the changed text
  setTimeout(() => {
    textarea.setSelectionRange(targetStart, targetStart + newText.length)
    textarea.focus()
  }, 0)
}
</script>

<style scoped>
.weight-hint {
  margin-left: 8px;
  font-size: 11px;
  color: #888;
  font-weight: normal;
}

.generating-indicator {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-size: 11px;
}

.spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
