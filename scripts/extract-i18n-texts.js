import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')

// 한글 텍스트 패턴
const patterns = {
  // Vue 템플릿 내 텍스트: <tag>텍스트</tag>
  templateText: /<[^>]*>([^<]*[가-힣][^<]*)</g,

  // 문자열 리터럴: '텍스트' 또는 "텍스트" 또는 `텍스트`
  stringLiteral: /['"`]([^'"`]*[가-힣][^'"`]*)['"`]/g,

  // 속성값: placeholder="텍스트"
  attributeValue: /(?:title|placeholder|label|alt|aria-label)=["']([^"']*[가-힣][^"']*)["']/g,
}

const results = new Map()
const stats = {
  totalFiles: 0,
  filesWithKorean: 0,
  totalMatches: 0,
  uniqueTexts: new Set(),
}

/**
 * 파일에서 한글 텍스트 추출
 */
function extractFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relative = path.relative(srcDir, filePath)
  const matches = []

  // 1. 템플릿 내 텍스트 추출
  let match
  let tempContent = content
  while ((match = patterns.templateText.exec(tempContent)) !== null) {
    const text = match[1].trim()
    // 빈 문자열, 변수({{}}), 너무 짧은 텍스트 제외
    if (text && !text.includes('{{') && !text.includes('}}') && text.length > 1) {
      matches.push({
        type: 'template',
        text: text,
        line: getLineNumber(content, match.index)
      })
      stats.uniqueTexts.add(text)
    }
  }

  // 2. 문자열 리터럴 추출
  tempContent = content
  while ((match = patterns.stringLiteral.exec(tempContent)) !== null) {
    const text = match[1].trim()
    if (text && text.length > 1 && !isExcluded(text)) {
      matches.push({
        type: 'string',
        text: text,
        line: getLineNumber(content, match.index)
      })
      stats.uniqueTexts.add(text)
    }
  }

  // 3. 속성값 추출
  tempContent = content
  while ((match = patterns.attributeValue.exec(tempContent)) !== null) {
    const text = match[1].trim()
    if (text && text.length > 1) {
      matches.push({
        type: 'attribute',
        text: text,
        line: getLineNumber(content, match.index)
      })
      stats.uniqueTexts.add(text)
    }
  }

  if (matches.length > 0) {
    results.set(relative, matches)
    stats.filesWithKorean++
    stats.totalMatches += matches.length
  }
}

/**
 * 라인 번호 계산
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length
}

/**
 * 제외할 텍스트 패턴
 */
function isExcluded(text) {
  const excludePatterns = [
    /^[a-zA-Z0-9_-]+$/, // 영어/숫자만 (변수명 등)
    /^\s*$/, // 빈 문자열
    /^http/, // URL
    /^\.\//, // 경로
    /^@/, // 특수 문자로 시작
  ]

  return excludePatterns.some(pattern => pattern.test(text))
}

/**
 * 디렉토리 스캔
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // node_modules, .git 등 제외
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        scanDirectory(filePath)
      }
    } else if (file.endsWith('.vue') || file.endsWith('.js')) {
      stats.totalFiles++
      extractFromFile(filePath)
    }
  })
}

/**
 * 카테고리별로 텍스트 분류
 */
function categorizeTexts() {
  const categories = {
    common: [], // 공통 액션
    prompt: [],
    lora: [],
    bookmark: [],
    history: [],
    queue: [],
    preset: [],
    settings: [],
    message: [],
    validation: [],
    notification: [],
    other: []
  }

  results.forEach((matches, file) => {
    let category = 'other'

    // 파일명으로 카테고리 판단
    if (file.includes('Prompt')) category = 'prompt'
    else if (file.includes('Lora')) category = 'lora'
    else if (file.includes('Bookmark')) category = 'bookmark'
    else if (file.includes('History')) category = 'history'
    else if (file.includes('Queue')) category = 'queue'
    else if (file.includes('Preset')) category = 'preset'
    else if (file.includes('Settings') || file.includes('Advanced')) category = 'settings'
    else if (file.includes('notification')) category = 'notification'

    matches.forEach(m => {
      // 메시지 유형 판단
      if (m.text.includes('성공') || m.text.includes('완료') || m.text.includes('되었습니다')) {
        categories.message.push({ ...m, file, subCategory: 'success' })
      } else if (m.text.includes('실패') || m.text.includes('오류') || m.text.includes('에러')) {
        categories.message.push({ ...m, file, subCategory: 'error' })
      } else if (m.text.includes('입력해주세요') || m.text.includes('필수')) {
        categories.validation.push({ ...m, file })
      }
      // 공통 액션
      else if (['생성', '저장', '삭제', '취소', '확인', '닫기', '수정'].includes(m.text)) {
        categories.common.push({ ...m, file })
      }
      // 카테고리별
      else {
        categories[category].push({ ...m, file })
      }
    })
  })

  return categories
}

/**
 * 메인 실행
 */
console.log('🔍 Scanning for Korean texts in src/...\n')
console.log('━'.repeat(60))

scanDirectory(srcDir)

console.log('\n📊 Scan Results\n')
console.log('━'.repeat(60))
console.log(`Total files scanned:       ${stats.totalFiles}`)
console.log(`Files with Korean text:    ${stats.filesWithKorean}`)
console.log(`Total text occurrences:    ${stats.totalMatches}`)
console.log(`Unique texts found:        ${stats.uniqueTexts.size}`)
console.log('━'.repeat(60))

// 카테고리별 분류
const categories = categorizeTexts()

console.log('\n📂 Texts by Category\n')
console.log('━'.repeat(60))
Object.entries(categories).forEach(([cat, texts]) => {
  if (texts.length > 0) {
    console.log(`${cat.padEnd(15)} : ${texts.length} texts`)
  }
})
console.log('━'.repeat(60))

// 파일별 결과 (상위 10개)
console.log('\n📁 Top 10 Files by Text Count\n')
console.log('━'.repeat(60))
const fileStats = Array.from(results.entries())
  .map(([file, matches]) => ({ file, count: matches.length }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 10)

fileStats.forEach((stat, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${stat.file.padEnd(40)} (${stat.count} texts)`)
})
console.log('━'.repeat(60))

// 샘플 텍스트 (각 카테고리에서 5개씩)
console.log('\n📝 Sample Texts by Category\n')
Object.entries(categories).forEach(([cat, texts]) => {
  if (texts.length > 0) {
    console.log(`\n${cat.toUpperCase()}:`)
    console.log('─'.repeat(60))
    texts.slice(0, 5).forEach((t, i) => {
      console.log(`  ${i + 1}. "${t.text}"`)
      console.log(`     └─ ${t.file}:${t.line}`)
    })
    if (texts.length > 5) {
      console.log(`     ... and ${texts.length - 5} more`)
    }
  }
})

// JSON 저장
const output = {
  metadata: {
    scannedAt: new Date().toISOString(),
    totalFiles: stats.totalFiles,
    filesWithKorean: stats.filesWithKorean,
    totalMatches: stats.totalMatches,
    uniqueTexts: stats.uniqueTexts.size,
  },
  files: Object.fromEntries(results),
  uniqueTexts: Array.from(stats.uniqueTexts).sort(),
  categories: categories,
}

const outputPath = path.join(__dirname, '../docs/extracted-texts.json')
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

console.log('\n✅ Results saved to docs/extracted-texts.json')
console.log('\n💡 Next steps:')
console.log('   1. Review extracted-texts.json')
console.log('   2. Create translation keys from unique texts')
console.log('   3. Set up Vue I18n infrastructure')
console.log('')
