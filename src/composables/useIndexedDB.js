/**
 * IndexedDB 관리 composable
 */
import {
  MAX_IMAGES,
  IMAGE_COMPRESSION_QUALITY,
  THUMBNAIL_COMPRESSION_QUALITY,
  THUMBNAIL_MAX_SIZE
} from '../config/constants'

const DB_NAME = 'sd-image-history'
const DB_VERSION = 1
const STORE_IMAGES = 'images'
const STORE_SLOTS = 'slots'

let db = null

/**
 * Base64 이미지를 WebP로 압축
 */
async function compressToWebP(base64Image, quality = IMAGE_COMPRESSION_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      // WebP로 변환 (90% 품질)
      const webpImage = canvas.toDataURL('image/webp', quality)

      // 압축 효과 로그
      const originalSize = (base64Image.length * 0.75 / 1024).toFixed(1) // KB
      const compressedSize = (webpImage.length * 0.75 / 1024).toFixed(1) // KB
      const reduction = ((1 - webpImage.length / base64Image.length) * 100).toFixed(1)
      console.log(`이미지 압축: ${originalSize}KB → ${compressedSize}KB (${reduction}% 절감)`)

      resolve(webpImage)
    }

    img.onerror = () => {
      reject(new Error('이미지 로드 실패'))
    }

    img.src = base64Image
  })
}

/**
 * Base64 이미지를 썸네일로 변환 (리사이즈 + 압축)
 */
async function generateThumbnail(base64Image, maxSize = THUMBNAIL_MAX_SIZE, quality = THUMBNAIL_COMPRESSION_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      // Calculate thumbnail dimensions (maintain aspect ratio)
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxSize) {
          height = Math.round(height * maxSize / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round(width * maxSize / height)
          height = maxSize
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // WebP로 변환 (저품질)
      const thumbnail = canvas.toDataURL('image/webp', quality)

      // 썸네일 크기 로그
      const thumbSize = (thumbnail.length * 0.75 / 1024).toFixed(1) // KB
      console.log(`썸네일 생성: ${width}x${height}, ${thumbSize}KB`)

      resolve(thumbnail)
    }

    img.onerror = () => {
      reject(new Error('썸네일 생성 실패'))
    }

    img.src = base64Image
  })
}

/**
 * IndexedDB 초기화
 */
async function initDB() {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB 열기 실패:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      console.log('IndexedDB 초기화 완료')
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // images store: 생성된 이미지 저장
      if (!database.objectStoreNames.contains(STORE_IMAGES)) {
        const imageStore = database.createObjectStore(STORE_IMAGES, {
          keyPath: 'id',
          autoIncrement: true
        })
        // 인덱스 생성 (검색/필터링용)
        imageStore.createIndex('timestamp', 'timestamp', { unique: false })
        imageStore.createIndex('favorite', 'favorite', { unique: false })
        console.log('images store 생성 완료')
      }

      // slots store: 프롬프트 슬롯 저장
      if (!database.objectStoreNames.contains(STORE_SLOTS)) {
        database.createObjectStore(STORE_SLOTS, { keyPath: 'id' })
        console.log('slots store 생성 완료')
      }
    }
  })
}

/**
 * 이미지 저장 (WebP 압축 + 썸네일 생성)
 * @returns {Promise<{id: number, deletedCount: number}>} - 생성된 ID와 삭제된 이미지 수
 */
async function saveImage(imageData) {
  try {
    // WebP로 압축 (실패 시 원본 사용)
    let finalImage
    let thumbnail = null

    try {
      // 원본 이미지 압축
      finalImage = await compressToWebP(imageData.image, IMAGE_COMPRESSION_QUALITY)

      // 썸네일 생성 (원본 기준으로 생성하여 품질 저하 방지)
      thumbnail = await generateThumbnail(imageData.image, THUMBNAIL_MAX_SIZE, THUMBNAIL_COMPRESSION_QUALITY)
    } catch (compressionError) {
      console.warn('⚠️ 이미지 압축 실패, 원본 이미지 사용:', compressionError.message)
      finalImage = imageData.image // Fallback to original
      // 썸네일도 시도
      try {
        thumbnail = await generateThumbnail(imageData.image, THUMBNAIL_MAX_SIZE, THUMBNAIL_COMPRESSION_QUALITY)
      } catch {
        thumbnail = null // 썸네일 없이 진행
      }
    }

    const database = await initDB()
    const transaction = database.transaction([STORE_IMAGES], 'readwrite')
    const store = transaction.objectStore(STORE_IMAGES)

    const record = {
      image: finalImage,  // 압축된 이미지 또는 원본 사용
      thumbnail: thumbnail, // 썸네일 (그리드 표시용)
      info: imageData.info,
      params: imageData.params,
      timestamp: imageData.timestamp || new Date().toISOString(),
      favorite: imageData.favorite || false,
      interrupted: imageData.interrupted || false // 스킵/중단 여부
    }

    return new Promise(async (resolve, reject) => {
      const request = store.add(record)

      request.onsuccess = async () => {
        const newId = request.result
        let deletedCount = 0

        // 200장 초과 시 오래된 이미지 삭제
        const count = await getImageCount()
        if (count > MAX_IMAGES) {
          deletedCount = count - MAX_IMAGES
          console.log(`${count}장 초과, 오래된 ${deletedCount}장 삭제 중...`)
          await deleteOldestImages(deletedCount)
        }

        resolve({ id: newId, deletedCount }) // ID와 삭제된 수 반환
      }

      request.onerror = () => {
        console.error('이미지 저장 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('saveImage 실패:', error)
    throw error
  }
}

/**
 * 최근 이미지 N개 로드 (페이징)
 */
async function getRecentImages(limit = 50, offset = 0) {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_IMAGES], 'readonly')
    const store = transaction.objectStore(STORE_IMAGES)
    const index = store.index('timestamp')

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev') // 최신순
      const results = []
      let skipped = 0
      let counted = 0

      request.onsuccess = (event) => {
        const cursor = event.target.result

        if (cursor) {
          // offset만큼 스킵
          if (skipped < offset) {
            skipped++
            cursor.continue()
            return
          }

          // limit만큼 수집
          if (counted < limit) {
            const data = cursor.value
            results.push({
              id: data.id,
              image: data.image,
              thumbnail: data.thumbnail || data.image, // 썸네일 없으면 원본 사용 (이전 데이터 호환)
              info: data.info,
              params: data.params,
              timestamp: data.timestamp,
              favorite: data.favorite,
              interrupted: data.interrupted || false
            })
            counted++
            cursor.continue()
          } else {
            resolve(results)
          }
        } else {
          // 커서 끝
          resolve(results)
        }
      }

      request.onerror = () => {
        console.error('이미지 로드 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('getRecentImages 실패:', error)
    return []
  }
}

/**
 * 전체 이미지 개수 조회
 */
async function getImageCount() {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_IMAGES], 'readonly')
    const store = transaction.objectStore(STORE_IMAGES)

    return new Promise((resolve, reject) => {
      const request = store.count()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        console.error('이미지 개수 조회 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('getImageCount 실패:', error)
    return 0
  }
}

/**
 * 이미지 삭제
 */
async function deleteImage(id) {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_IMAGES], 'readwrite')
    const store = transaction.objectStore(STORE_IMAGES)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('이미지 삭제 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('deleteImage 실패:', error)
    throw error
  }
}

/**
 * 오래된 이미지 N개 삭제 (즐겨찾기 제외)
 */
async function deleteOldestImages(count) {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_IMAGES], 'readwrite')
    const store = transaction.objectStore(STORE_IMAGES)
    const index = store.index('timestamp')

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'next') // 오래된 순서
      const toDelete = []
      let deleted = 0

      request.onsuccess = (event) => {
        const cursor = event.target.result

        if (cursor && deleted < count) {
          const data = cursor.value

          // 즐겨찾기는 삭제하지 않음
          if (!data.favorite) {
            toDelete.push(data.id)
            deleted++
          }

          cursor.continue()
        } else {
          // 삭제 실행
          toDelete.forEach(id => {
            store.delete(id)
          })

          console.log(`오래된 ${toDelete.length}장 삭제 완료`)
          resolve()
        }
      }

      request.onerror = () => {
        console.error('오래된 이미지 삭제 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('deleteOldestImages 실패:', error)
    throw error
  }
}

/**
 * 모든 이미지 삭제
 */
async function clearAllImages() {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_IMAGES], 'readwrite')
    const store = transaction.objectStore(STORE_IMAGES)

    return new Promise((resolve, reject) => {
      const request = store.clear()

      request.onsuccess = () => {
        console.log('모든 이미지 삭제 완료')
        resolve()
      }

      request.onerror = () => {
        console.error('이미지 전체 삭제 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('clearAllImages 실패:', error)
    throw error
  }
}

/**
 * 즐겨찾기 제외하고 모든 이미지 삭제
 */
async function clearNonFavoriteImages() {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_IMAGES], 'readwrite')
    const store = transaction.objectStore(STORE_IMAGES)

    return new Promise((resolve, reject) => {
      const request = store.openCursor()
      const deletedIds = []

      request.onsuccess = (event) => {
        const cursor = event.target.result

        if (cursor) {
          const data = cursor.value

          // 즐겨찾기가 아닌 것만 삭제
          if (!data.favorite) {
            cursor.delete()
            deletedIds.push(data.id)
          }

          cursor.continue()
        } else {
          // 커서 끝
          console.log(`즐겨찾기 제외 ${deletedIds.length}개 이미지 삭제 완료`)
          resolve(deletedIds.length)
        }
      }

      request.onerror = () => {
        console.error('이미지 삭제 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('clearNonFavoriteImages 실패:', error)
    throw error
  }
}

/**
 * 슬롯 저장
 */
async function saveSlots(slots) {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_SLOTS], 'readwrite')
    const store = transaction.objectStore(STORE_SLOTS)

    return new Promise((resolve, reject) => {
      const request = store.put({ id: 'slots', data: slots })

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('슬롯 저장 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('saveSlots 실패:', error)
    throw error
  }
}

/**
 * 슬롯 로드
 */
async function loadSlots() {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_SLOTS], 'readonly')
    const store = transaction.objectStore(STORE_SLOTS)

    return new Promise((resolve, reject) => {
      const request = store.get('slots')

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data)
        } else {
          resolve([null, null, null]) // 기본값
        }
      }

      request.onerror = () => {
        console.error('슬롯 로드 실패:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('loadSlots 실패:', error)
    return [null, null, null]
  }
}

/**
 * 즐겨찾기 토글
 */
async function toggleFavorite(id) {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_IMAGES], 'readwrite')
    const store = transaction.objectStore(STORE_IMAGES)

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const data = getRequest.result
        if (data) {
          data.favorite = !data.favorite
          const updateRequest = store.put(data)

          updateRequest.onsuccess = () => {
            resolve(data.favorite)
          }

          updateRequest.onerror = () => {
            console.error('즐겨찾기 업데이트 실패:', updateRequest.error)
            reject(updateRequest.error)
          }
        } else {
          reject(new Error('이미지를 찾을 수 없습니다'))
        }
      }

      getRequest.onerror = () => {
        console.error('이미지 조회 실패:', getRequest.error)
        reject(getRequest.error)
      }
    })
  } catch (error) {
    console.error('toggleFavorite 실패:', error)
    throw error
  }
}

export function useIndexedDB() {
  return {
    initDB,
    saveImage,
    getRecentImages,
    getImageCount,
    deleteImage,
    clearAllImages,
    clearNonFavoriteImages,
    saveSlots,
    loadSlots,
    toggleFavorite
  }
}
