import fs from 'fs'

const data = JSON.parse(fs.readFileSync('docs/extracted-texts.json', 'utf-8'))

// 유용한 텍스트 필터링
const useful = data.uniqueTexts.filter(t =>
  t.length < 50 &&
  !t.includes('\n') &&
  !t.includes('function') &&
  !t.includes('=>') &&
  !t.includes('const ')
)

console.log(`\n📊 텍스트 분석 결과\n`)
console.log(`전체 고유 텍스트: ${data.uniqueTexts.length}개`)
console.log(`유용한 텍스트: ${useful.length}개\n`)

console.log("━".repeat(60))
console.log("샘플 텍스트 (처음 40개):\n")
useful.slice(0, 40).forEach((text, i) => {
  console.log(`${(i+1).toString().padStart(2)}. ${text}`)
})

console.log("\n" + "━".repeat(60))
console.log("카테고리별 분포:\n")
Object.entries(data.categories).forEach(([cat, texts]) => {
  const useful_in_cat = texts.filter(t =>
    t.text.length < 50 &&
    !t.text.includes('\n')
  ).length
  console.log(`${cat.padEnd(15)} : ${texts.length}개 (유용: ${useful_in_cat}개)`)
})
