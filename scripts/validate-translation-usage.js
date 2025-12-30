#!/usr/bin/env node

/**
 * Validates that all translation keys used in Vue components exist in translation files
 * Also checks for unused translation keys
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Import translation files dynamically
const koModule = await import('../src/i18n/locales/ko.js')
const enModule = await import('../src/i18n/locales/en.js')

const koTranslations = koModule.default
const enTranslations = enModule.default

/**
 * Get all nested keys from translation object
 */
function getAllKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      keys.push(...getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

/**
 * Find all translation key usages in a file
 */
function findTranslationKeys(content) {
  const keys = []

  // Match $t('key') or $t("key") in templates
  const templateMatches = content.matchAll(/\$t\(['"]([\w.]+)['"]/g)
  for (const match of templateMatches) {
    keys.push(match[1])
  }

  // Match t('key') or t("key") in script
  const scriptMatches = content.matchAll(/\bt\(['"]([\w.]+)['"]/g)
  for (const match of scriptMatches) {
    keys.push(match[1])
  }

  return [...new Set(keys)] // Remove duplicates
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
function validateTranslationUsage() {
  console.log('━'.repeat(60))
  console.log('🔍 번역 키 사용 검증')
  console.log('━'.repeat(60))
  console.log()

  const koKeys = getAllKeys(koTranslations)
  const enKeys = getAllKeys(enTranslations)
  const allDefinedKeys = new Set(koKeys)

  console.log(`📊 정의된 번역 키: ${koKeys.length}개`)
  console.log()

  // Find all Vue files
  const srcDir = path.join(projectRoot, 'src')
  const vueFiles = findVueFiles(srcDir)

  console.log(`📁 검사할 파일: ${vueFiles.length}개`)
  console.log()

  const usedKeys = new Set()
  const missingKeys = []
  const fileIssues = []

  // Check each file
  for (const file of vueFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const keys = findTranslationKeys(content)

    if (keys.length > 0) {
      const relativePath = path.relative(projectRoot, file)
      const fileMissingKeys = []

      for (const key of keys) {
        usedKeys.add(key)

        if (!allDefinedKeys.has(key)) {
          fileMissingKeys.push(key)
          missingKeys.push({ file: relativePath, key })
        }
      }

      if (fileMissingKeys.length > 0) {
        fileIssues.push({
          file: relativePath,
          keys: fileMissingKeys
        })
      }
    }
  }

  console.log(`✅ 사용 중인 번역 키: ${usedKeys.size}개`)
  console.log()

  // Report missing keys
  if (missingKeys.length > 0) {
    console.log('━'.repeat(60))
    console.log('❌ 누락된 번역 키')
    console.log('━'.repeat(60))
    console.log()

    for (const issue of fileIssues) {
      console.log(`📄 ${issue.file}`)
      for (const key of issue.keys) {
        console.log(`   ❌ ${key}`)
      }
      console.log()
    }

    console.log(`총 ${missingKeys.length}개의 누락된 키가 발견되었습니다.`)
    console.log()
  }

  // Report unused keys
  const unusedKeys = koKeys.filter(key => !usedKeys.has(key))

  if (unusedKeys.length > 0) {
    console.log('━'.repeat(60))
    console.log('⚠️  사용되지 않는 번역 키')
    console.log('━'.repeat(60))
    console.log()

    // Group by section
    const sections = {}
    for (const key of unusedKeys) {
      const section = key.split('.')[0]
      if (!sections[section]) {
        sections[section] = []
      }
      sections[section].push(key)
    }

    for (const [section, keys] of Object.entries(sections)) {
      console.log(`📦 ${section}: ${keys.length}개`)
      for (const key of keys.slice(0, 5)) {
        console.log(`   • ${key}`)
      }
      if (keys.length > 5) {
        console.log(`   ... 외 ${keys.length - 5}개`)
      }
      console.log()
    }

    console.log(`총 ${unusedKeys.length}개의 미사용 키가 있습니다.`)
    console.log(`(이는 정상일 수 있습니다 - 향후 사용을 위해 정의된 키일 수 있습니다)`)
    console.log()
  }

  // Summary
  console.log('━'.repeat(60))
  if (missingKeys.length === 0) {
    console.log('✅ 모든 번역 키가 정상적으로 정의되어 있습니다!')
  } else {
    console.log('❌ 검증 실패: 누락된 번역 키가 있습니다.')
    process.exit(1)
  }
  console.log('━'.repeat(60))
  console.log()
}

validateTranslationUsage()
