const fs = require('fs');

const content = fs.readFileSync('src/components/LoraSelector.vue', 'utf8');

// Add loading directive after img tag
const oldImg = `            <img
              v-if="getThumbnailUrl(lora)"
              :src="getThumbnailUrl(lora)"
              :alt="lora.name"
              @error="handleImageError"
            >`;

const newImg = `            <img
              v-if="getThumbnailUrl(lora)"
              :data-src="getThumbnailUrl(lora)"
              :alt="lora.name"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f5f5f5' width='200' height='200'/%3E%3C/svg%3E"
              class="lora-image"
              loading="lazy"
              @error="handleImageError"
            >`;

const newContent = content.replace(oldImg, newImg);

fs.writeFileSync('src/components/LoraSelector.vue', newContent, 'utf8');
console.log('Added lazy loading to images');
