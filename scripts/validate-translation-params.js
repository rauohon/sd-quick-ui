#!/usr/bin/env node

/**
 * Validates that dynamic parameters in translation calls match placeholders in translation strings
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Import translation files dynamically
const koModule = await import('../src/i18n/locales/ko.js')
const koTranslations = koModule.default

/**
 * Get translation value by key path
 */
function getTranslationValue(translations, keyPath) {
  const parts = keyPath.split('.')
  let value = translations

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part]
    } else {
      return null
    }
  }

  return typeof value === 'string' ? value : null
}

/**
 * Extract placeholders from translation string
 * Example: "Added {name} with {count}" => ['name', 'count']
 */
function extractPlaceholders(text) {
  const placeholders = []
  const regex = /\{(\w+)\}/g
  let match

  while ((match = regex.exec(text)) !== null) {
    placeholders.push(match[1])
  }

  return placeholders
}

/**
 * Find translation calls with parameters in file content
 * Returns array of { key, params: [], line, code }
 */
function findTranslationCallsWithParams(content) {
  const calls = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // Match t('key', { param: value }) or $t('key', { param: value })
    // This is a simplified regex - may not catch all edge cases
    const regex = /\$?t\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{([^}]+)\}/g
    let match

    while ((match = regex.exec(line)) !== null) {
      const key = match[1]
      const paramsStr = match[2]

      // Extract parameter names from object literal
      // Handles both "key: value" and ES6 shorthand "{ key }"
      const paramNames = []

      // Match "key:" pattern (standard)
      const standardRegex = /(\w+)\s*:/g
      let paramMatch
      while ((paramMatch = standardRegex.exec(paramsStr)) !== null) {
        paramNames.push(paramMatch[1])
      }

      // Match standalone identifiers (ES6 shorthand like { label, count })
      if (paramNames.length === 0) {
        const shorthandRegex = /\b(\w+)\b/g
        while ((paramMatch = shorthandRegex.exec(paramsStr)) !== null) {
          paramNames.push(paramMatch[1])
        }
      }

      calls.push({
        key,
        params: paramNames,
        line: lineNum,
        code: line.trim()
      })
    }
  }

  return calls
}

/**
 * Recursively find all .vue files
 */
function findVueFiles(dir) {
  const files = []
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findVueFiles(fullPath))
    } else if (item.endsWith('.vue')) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Main validation
 */
function validateTranslationParams() {
  console.log('━'.repeat(60))
  console.log('🔍 동적 파라미터 검증')
  console.log('━'.repeat(60))
  console.log()

  const srcDir = path.join(projectRoot, 'src')
  const vueFiles = findVueFiles(srcDir)

  const issues = []
  let totalChecks = 0
  let filesWithParams = 0

  for (const file of vueFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const calls = findTranslationCallsWithParams(content)

    if (calls.length === 0) continue

    filesWithParams++
    const relativePath = path.relative(projectRoot, file)
    const fileIssues = []

    for (const call of calls) {
      totalChecks++
      const translationValue = getTranslationValue(koTranslations, call.key)

      if (!translationValue) {
        fileIssues.push({
          line: call.line,
          key: call.key,
          issue: 'Translation key not found',
          code: call.code
        })
        continue
      }

      const placeholders = extractPlaceholders(translationValue)

      // Check if all used params have placeholders
      const missingPlaceholders = call.params.filter(p => !placeholders.includes(p))
      const unusedPlaceholders = placeholders.filter(p => !call.params.includes(p))

      if (missingPlaceholders.length > 0 || unusedPlaceholders.length > 0) {
        fileIssues.push({
          line: call.line,
          key: call.key,
          usedParams: call.params,
          definedPlaceholders: placeholders,
          missingPlaceholders,
          unusedPlaceholders,
          translation: translationValue,
          code: call.code
        })
      }
    }

    if (fileIssues.length > 0) {
      issues.push({
        file: relativePath,
        issues: fileIssues
      })
    }
  }

  console.log(`📊 동적 파라미터를 사용하는 파일: ${filesWithParams}개`)
  console.log(`📊 검사한 번역 호출: ${totalChecks}개`)
  console.log()

  if (issues.length > 0) {
    console.log('━'.repeat(60))
    console.log('⚠️  파라미터 불일치 발견')
    console.log('━'.repeat(60))
    console.log()

    for (const fileIssue of issues) {
      console.log(`📄 ${fileIssue.file}`)
      console.log()

      for (const issue of fileIssue.issues) {
        console.log(`  Line ${issue.line}: ${issue.key}`)
        console.log(`  Code: ${issue.code}`)

        if (issue.issue) {
          console.log(`  ❌ ${issue.issue}`)
        } else {
          console.log(`  번역: "${issue.translation}"`)
          console.log(`  사용된 파라미터: [${issue.usedParams.join(', ')}]`)
          console.log(`  정의된 플레이스홀더: [${issue.definedPlaceholders.join(', ')}]`)

          if (issue.missingPlaceholders.length > 0) {
            console.log(`  ❌ 누락된 플레이스홀더: [${issue.missingPlaceholders.join(', ')}]`)
          }

          if (issue.unusedPlaceholders.length > 0) {
            console.log(`  ⚠️  사용되지 않는 플레이스홀더: [${issue.unusedPlaceholders.join(', ')}]`)
          }
        }

        console.log()
      }
    }

    console.log(`총 ${issues.reduce((sum, f) => sum + f.issues.length, 0)}개의 불일치가 발견되었습니다.`)
    console.log()
    console.log('━'.repeat(60))
    console.log('❌ 검증 실패')
    console.log('━'.repeat(60))
    process.exit(1)
  }

  console.log('━'.repeat(60))
  console.log('✅ 모든 동적 파라미터가 올바르게 일치합니다!')
  console.log('━'.repeat(60))
  console.log()
}

validateTranslationParams()
