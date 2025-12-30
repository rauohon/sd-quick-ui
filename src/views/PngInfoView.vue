<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const API_URL = 'http://127.0.0.1:7860'

// Props
const props = defineProps({
  showToast: Function,
})

// Emit
const emit = defineEmits(['loadPrompt', 'switchTab'])

// PNG Info state
const pngInfoFile = ref(null)
const pngInfoResult = ref(null)

/**
 * Handle file input change
 */
function handleFileChange(event) {
  const file = event.target.files[0]
  if (file && file.type === 'image/png') {
    pngInfoFile.value = file
  } else {
    props.showToast(t('pngInfo.pngOnly'), 'error')
  }
}

/**
 * Analyze PNG info using WebUI API
 */
async function analyzePngInfo() {
  if (!pngInfoFile.value) {
    props.showToast(t('pngInfo.selectPngFile'), 'error')
    return
  }

  const file = pngInfoFile.value
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const base64 = e.target.result.split(',')[1]

      const response = await fetch(`${API_URL}/sdapi/v1/png-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64
        })
      })

      if (!response.ok) {
        throw new Error(t('pngInfo.apiError', { status: response.status }))
      }

      const data = await response.json()
      pngInfoResult.value = data
    } catch (error) {
      console.error(t('pngInfo.failed') + ':', error)

      let message = t('pngInfo.failed')
      if (error.message.includes('Failed to fetch')) {
        message = t('pngInfo.connectionError')
      } else {
        message = t('pngInfo.failedWithMessage', { error: error.message })
      }

      props.showToast(message, 'error')
    }
  }

  reader.readAsDataURL(file)
}

/**
 * Load prompt from PNG info parameters
 */
function loadPromptFromInfo(info) {
  if (info.parameters) {
    emit('loadPrompt', info.parameters)
    emit('switchTab', 'txt2img')
    props.showToast(t('pngInfo.promptLoaded'), 'success')
  }
}
</script>

<template>
  <div class="tab-content">
    <div class="pnginfo-container">
      <div class="upload-section">
        <label for="png-upload" class="upload-label">
          {{ $t('pngInfo.selectFile') }}
        </label>
        <input
          id="png-upload"
          type="file"
          accept="image/png"
          @change="handleFileChange"
          class="file-input"
        >

        <button
          class="analyze-btn"
          @click="analyzePngInfo"
          :disabled="!pngInfoFile"
        >
          {{ $t('pngInfo.analyzeButton') }}
        </button>
      </div>

      <div v-if="pngInfoResult" class="pnginfo-result">
        <h3>{{ $t('pngInfo.title') }}</h3>

        <div v-if="pngInfoResult.info" class="info-section">
          <h4>Generation Info</h4>
          <pre>{{ pngInfoResult.info }}</pre>
        </div>

        <div v-if="pngInfoResult.parameters" class="params-section">
          <h4>Parameters</h4>
          <div class="params-grid">
            <div v-for="(value, key) in pngInfoResult.parameters" :key="key" class="param-item">
              <strong>{{ key }}:</strong> {{ value }}
            </div>
          </div>

          <button class="load-btn" @click="loadPromptFromInfo(pngInfoResult)">
            {{ $t('pngInfo.loadPrompt') }}
          </button>
        </div>

        <div v-else class="no-info">
          {{ $t('pngInfo.noGenerationInfo') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.pnginfo-container {
  max-width: 800px;
  margin: 0 auto;
}

.upload-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  text-align: center;
}

.upload-label {
  display: inline-block;
  padding: 12px 30px;
  background: #667eea;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.upload-label:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.file-input {
  display: block;
  margin: 16px auto;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  max-width: 400px;
}

.analyze-btn {
  padding: 12px 30px;
  background: #764ba2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
  transition: all 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background: #653a8d;
  transform: translateY(-1px);
}

.analyze-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pnginfo-result {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.pnginfo-result h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.pnginfo-result h4 {
  margin: 16px 0 12px 0;
  color: #667eea;
  font-size: 16px;
}

.info-section {
  margin-bottom: 24px;
}

.info-section pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 13px;
  line-height: 1.6;
}

.params-section {
  margin-top: 20px;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.params-grid .param-item {
  background: #f9f9f9;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
}

.params-grid .param-item strong {
  color: #667eea;
  margin-right: 6px;
}

.load-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.2s;
  margin-top: 12px;
}

.load-btn:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.no-info {
  padding: 30px;
  text-align: center;
  color: #999;
  font-style: italic;
}
</style>
