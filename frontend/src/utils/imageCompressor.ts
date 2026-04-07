/**
 * 图片压缩工具
 */

export interface CompressOptions {
  maxWidth?: number      // 最大宽度
  maxHeight?: number     // 最大高度
  quality?: number       // 质量 (0-1)
  maxWidthKB?: number    // 最大文件大小 (KB)
}

/**
 * 压缩图片
 */
export const compressImage = (
  file: File,
  options: CompressOptions = {}
): Promise<{ blob: Blob; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      maxWidthKB = 500,
    } = options

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        // 计算缩放比例
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        // 创建 Canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)

        // 压缩
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'))
              return
            }

            // 如果文件还是太大，递归压缩
            if (maxWidthKB && blob.size > maxWidthKB * 1024 && quality > 0.5) {
              compressImage(file, {
                ...options,
                quality: quality - 0.1,
              }).then(resolve).catch(reject)
            } else {
              resolve({ blob, width, height })
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Image load failed'))
    }
    reader.onerror = () => reject(new Error('File read failed'))
  })
}

/**
 * 生成缩略图
 */
export const generateThumbnail = (
  file: File,
  size: number = 200
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        // 计算缩放比例
        let width = img.width
        let height = img.height

        if (width > height) {
          height = Math.floor(height * (size / width))
          width = size
        } else {
          width = Math.floor(width * (size / height))
          height = size
        }

        // 创建 Canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)

        // 生成缩略图
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Thumbnail generation failed'))
              return
            }
            resolve(blob)
          },
          'image/jpeg',
          0.7
        )
      }
      img.onerror = () => reject(new Error('Image load failed'))
    }
    reader.onerror = () => reject(new Error('File read failed'))
  })
}

/**
 * 压缩并上传
 */
export const compressAndUpload = async (
  file: File,
  uploadFn: (file: File) => Promise<any>,
  options?: CompressOptions
) => {
  // 压缩图片
  const { blob, width, height } = await compressImage(file, options)

  // 创建新的 File 对象
  const compressedFile = new File([blob], file.name, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })

  console.log(`📦 图片压缩：${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`)
  console.log(`📐 尺寸：${width}x${height}`)

  // 上传
  return uploadFn(compressedFile)
}
