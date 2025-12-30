import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// extracted-texts.json 로드
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/extracted-texts.json'), 'utf-8'))

// 유용한 텍스트 필터링 함수
function isUseful(text) {
  return text.length < 200 &&
    !text.includes('\n') &&
    !text.includes('function') &&
    !text.includes('=>') &&
    !text.includes('const ') &&
    !text.includes('import ') &&
    !text.includes('export ') &&
    !text.includes('background:') &&
    !text.includes('border:')
}

// 텍스트에서 키 이름 생성 (간단한 버전)
function generateKeyName(text, index) {
  // 특수문자 제거 및 camelCase 변환
  let key = text
    .replace(/[${}\[\]().,!?;:'"/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 4) // 최대 4단어
    .map((word, i) => {
      if (i === 0) return word.toLowerCase()
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join('')

  // 키가 비어있거나 숫자로 시작하면 인덱스 사용
  if (!key || /^\d/.test(key)) {
    key = `text${index}`
  }

  return key
}

// 카테고리별 번역 키 생성
const priorityCategories = [
  'common',
  'message',
  'history',
  'prompt',
  'bookmark',
  'queue',
  'preset',
  'settings',
  'notification',
  'lora',
  'validation'
]

const translations = {}

priorityCategories.forEach(category => {
  const categoryTexts = data.categories[category] || []

  // 유용한 텍스트만 필터링
  const useful = categoryTexts
    .filter(item => isUseful(item.text))
    .map(item => item.text)

  // 중복 제거
  const unique = [...new Set(useful)]

  if (unique.length === 0) return

  translations[category] = {}

  unique.forEach((text, index) => {
    const key = generateKeyName(text, index)
    translations[category][key] = text
  })

  console.log(`${category}: ${unique.length}개 키 생성`)
})

// 결과 저장 (검토용)
const output = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalCategories: Object.keys(translations).length,
    totalKeys: Object.values(translations).reduce((sum, cat) => sum + Object.keys(cat).length, 0)
  },
  translations
}

fs.writeFileSync(
  path.join(__dirname, '../docs/translation-keys-draft.json'),
  JSON.stringify(output, null, 2),
  'utf-8'
)

console.log('\n━'.repeat(40))
console.log(`\n총 ${output.metadata.totalCategories}개 카테고리`)
console.log(`총 ${output.metadata.totalKeys}개 번역 키 생성`)
console.log('\n결과: docs/translation-keys-draft.json')
console.log('\n다음 단계: 수동으로 키 이름 검토 및 정리')
