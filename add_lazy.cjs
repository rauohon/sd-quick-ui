const fs = require('fs');

const content = fs.readFileSync('src/components/LoraSelector.vue', 'utf8');

// Use native browser lazy loading
const oldImg = `            <img
              v-if="getThumbnailUrl(lora)"
              :data-src="getThumbnailUrl(lora)"
              :alt="lora.name"
              @error="handleImageError"
            >`;

const newImg = `            <img
              v-if="getThumbnailUrl(lora)"
              :src="getThumbnailUrl(lora)"
              :alt="lora.name"
              loading="lazy"
              class="lora-image"
              @error="handleImageError"
            >`;

const newContent = content.replace(oldImg, newImg);

fs.writeFileSync('src/components/LoraSelector.vue', newContent, 'utf8');
console.log('Added lazy loading');
