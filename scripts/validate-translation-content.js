import ko from '../src/i18n/locales/ko.js'
import en from '../src/i18n/locales/en.js'

console.log('━'.repeat(60))
console.log('🔍 번역 내용 품질 검증')
console.log('━'.repeat(60))

let issues = []

// 모든 값을 재귀적으로 가져오기
function getAllValues(obj, path = []) {
  const results = []

  for (const key in obj) {
    const currentPath = [...path, key]
    const value = obj[key]

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      results.push(...getAllValues(value, currentPath))
    } else if (typeof value === 'string') {
      results.push({
        path: currentPath.join('.'),
        value: value
      })
    }
  }

  return results
}

const koValues = getAllValues(ko.default || ko)
const enValues = getAllValues(en.default || en)

console.log(`\n📊 통계:`)
console.log(`   한국어 번역: ${koValues.length}개`)
console.log(`   영어 번역: ${enValues.length}개`)

// 1. 빈 문자열 체크
console.log('\n━'.repeat(60))
console.log('1️⃣ 빈 문자열 체크')

const emptyKo = koValues.filter(v => v.value.trim() === '')
const emptyEn = enValues.filter(v => v.value.trim() === '')

if (emptyKo.length > 0) {
  console.log(`\n❌ 한국어에 빈 문자열 ${emptyKo.length}개 발견:`)
  emptyKo.forEach(v => console.log(`   - ${v.path}`))
  issues.push(`한국어 빈 문자열 ${emptyKo.length}개`)
}

if (emptyEn.length > 0) {
  console.log(`\n❌ 영어에 빈 문자열 ${emptyEn.length}개 발견:`)
  emptyEn.forEach(v => console.log(`   - ${v.path}`))
  issues.push(`영어 빈 문자열 ${emptyEn.length}개`)
}

if (emptyKo.length === 0 && emptyEn.length === 0) {
  console.log('✅ 빈 문자열 없음')
}

// 2. 같은 값 체크 (번역 안된 것)
console.log('\n━'.repeat(60))
console.log('2️⃣ 번역되지 않은 텍스트 체크 (한국어=영어)')

const sameValues = koValues.filter(ko => {
  const en = enValues.find(e => e.path === ko.path)
  return en && ko.value === en.value && /[가-힣]/.test(ko.value)
})

if (sameValues.length > 0) {
  console.log(`\n⚠️ 번역되지 않은 텍스트 ${sameValues.length}개 발견:`)
  sameValues.slice(0, 10).forEach(v => {
    console.log(`   - ${v.path}: "${v.value}"`)
  })
  if (sameValues.length > 10) {
    console.log(`   ... 외 ${sameValues.length - 10}개`)
  }
  issues.push(`번역 안된 텍스트 ${sameValues.length}개`)
} else {
  console.log('✅ 모든 텍스트가 번역되었습니다')
}

// 3. 파라미터 문법 체크
console.log('\n━'.repeat(60))
console.log('3️⃣ 파라미터 플레이스홀더 문법 체크')

const paramPattern = /\{([^}]+)\}/g
let invalidParams = []

koValues.forEach(ko => {
  const en = enValues.find(e => e.path === ko.path)
  if (!en) return

  const koParams = [...ko.value.matchAll(paramPattern)]
  const enParams = [...en.value.matchAll(paramPattern)]

  // 파라미터 이름 검증 (알파벳, 숫자, 언더스코어만)
  koParams.forEach(match => {
    if (!/^[a-zA-Z0-9_]+$/.test(match[1])) {
      invalidParams.push({
        path: ko.path,
        lang: 'ko',
        param: match[1],
        value: ko.value
      })
    }
  })

  enParams.forEach(match => {
    if (!/^[a-zA-Z0-9_]+$/.test(match[1])) {
      invalidParams.push({
        path: en.path,
        lang: 'en',
        param: match[1],
        value: en.value
      })
    }
  })
})

if (invalidParams.length > 0) {
  console.log(`\n⚠️ 잘못된 파라미터 ${invalidParams.length}개:`)
  invalidParams.forEach(p => {
    console.log(`   - ${p.path} (${p.lang}): {${p.param}}`)
  })
  issues.push(`잘못된 파라미터 ${invalidParams.length}개`)
} else {
  console.log('✅ 모든 파라미터 문법이 올바릅니다')
}

// 4. 샘플 번역 미리보기
console.log('\n━'.repeat(60))
console.log('4️⃣ 샘플 번역 미리보기 (랜덤 10개)')

const sampleSize = Math.min(10, koValues.length)
const samples = []
for (let i = 0; i < sampleSize; i++) {
  const idx = Math.floor(Math.random() * koValues.length)
  samples.push(koValues[idx])
}

samples.forEach(ko => {
  const en = enValues.find(e => e.path === ko.path)
  console.log(`\n   ${ko.path}:`)
  console.log(`   KO: "${ko.value}"`)
  console.log(`   EN: "${en ? en.value : 'NOT FOUND'}"`)
})

// 5. 특수문자 체크
console.log('\n━'.repeat(60))
console.log('5️⃣ 의심스러운 특수문자 체크')

const suspiciousChars = koValues.filter(v =>
  v.value.includes('undefined') ||
  v.value.includes('null') ||
  v.value.includes('NaN') ||
  v.value.includes('[object Object]')
)

if (suspiciousChars.length > 0) {
  console.log(`\n⚠️ 의심스러운 문자열 ${suspiciousChars.length}개:`)
  suspiciousChars.forEach(v => {
    console.log(`   - ${v.path}: "${v.value}"`)
  })
  issues.push(`의심스러운 문자열 ${suspiciousChars.length}개`)
} else {
  console.log('✅ 의심스러운 문자열 없음')
}

// 최종 결과
console.log('\n' + '━'.repeat(60))
console.log('📊 최종 검증 결과')
console.log('━'.repeat(60))

if (issues.length === 0) {
  console.log('\n🎉 모든 검증 통과! 번역 파일이 완벽합니다.')
  console.log('\n✅ 커밋해도 안전합니다.')
  process.exit(0)
} else {
  console.log(`\n⚠️ ${issues.length}개의 이슈 발견:`)
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`)
  })
  console.log('\n⚠️ 위 이슈들을 확인 후 커밋하세요.')
  process.exit(1)
}
