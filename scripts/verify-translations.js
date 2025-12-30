import ko from '../src/i18n/locales/ko.js'
import en from '../src/i18n/locales/en.js'

// 객체의 모든 키를 재귀적으로 추출
function getAllKeys(obj, prefix = '') {
  const keys = []

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

// 키 추출
const koKeys = getAllKeys(ko.default || ko).sort()
const enKeys = getAllKeys(en.default || en).sort()

console.log('━'.repeat(60))
console.log('📊 번역 키 검증')
console.log('━'.repeat(60))
console.log(`\n한국어 (ko.js): ${koKeys.length}개 키`)
console.log(`영어 (en.js): ${enKeys.length}개 키`)

// 차이점 찾기
const koSet = new Set(koKeys)
const enSet = new Set(enKeys)

const onlyInKo = koKeys.filter(k => !enSet.has(k))
const onlyInEn = enKeys.filter(k => !koSet.has(k))

console.log('\n' + '━'.repeat(60))

if (onlyInKo.length === 0 && onlyInEn.length === 0) {
  console.log('✅ 모든 키가 일치합니다!')
} else {
  if (onlyInKo.length > 0) {
    console.log(`\n❌ 한국어에만 있는 키 (${onlyInKo.length}개):`)
    onlyInKo.forEach(k => console.log(`   - ${k}`))
  }

  if (onlyInEn.length > 0) {
    console.log(`\n❌ 영어에만 있는 키 (${onlyInEn.length}개):`)
    onlyInEn.forEach(k => console.log(`   - ${k}`))
  }
}

console.log('\n' + '━'.repeat(60))

// 파라미터 플레이스홀더 검증
console.log('\n🔍 파라미터 플레이스홀더 검증')
console.log('━'.repeat(60))

const paramRegex = /\{([^}]+)\}/g

let mismatchCount = 0

koKeys.forEach(key => {
  const koValue = key.split('.').reduce((obj, k) => obj?.[k], ko.default || ko)
  const enValue = key.split('.').reduce((obj, k) => obj?.[k], en.default || en)

  if (typeof koValue === 'string' && typeof enValue === 'string') {
    const koParams = [...koValue.matchAll(paramRegex)].map(m => m[1]).sort()
    const enParams = [...enValue.matchAll(paramRegex)].map(m => m[1]).sort()

    if (JSON.stringify(koParams) !== JSON.stringify(enParams)) {
      console.log(`\n⚠️ ${key}:`)
      console.log(`   KO: ${koValue}`)
      console.log(`   EN: ${enValue}`)
      console.log(`   파라미터 불일치: [${koParams}] vs [${enParams}]`)
      mismatchCount++
    }
  }
})

if (mismatchCount === 0) {
  console.log('\n✅ 모든 파라미터 플레이스홀더가 일치합니다!')
} else {
  console.log(`\n⚠️ ${mismatchCount}개의 불일치 발견`)
}

console.log('\n' + '━'.repeat(60))

// 최종 결과
if (onlyInKo.length === 0 && onlyInEn.length === 0 && mismatchCount === 0) {
  console.log('\n🎉 검증 완료: 모든 번역 파일이 정상입니다!')
  process.exit(0)
} else {
  console.log('\n⚠️ 일부 문제가 발견되었습니다. 위 내용을 확인해주세요.')
  process.exit(1)
}
