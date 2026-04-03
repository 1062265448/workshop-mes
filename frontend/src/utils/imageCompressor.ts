/**
 * 图片压缩工具
 */

export interface CompressOptions {
  maxWidth?: number      // 最大宽度
  maxHeight?: number     // 最大高度
  quality?: number       // 质量 (0.1-1.0)
  maxWidthForUpload?: number  // 上传用图片最大宽度
}

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的 Blob
 */
export const compressImage = async (
  file: File,
  options: CompressOptions = {}
): Promise<{
  blob: Blob
  width: number
  height: number
}> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    maxWidthForUpload = 800,
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 计算缩放比例
        let width = img.width
        let height = img.height
        
        // 如果图片超过最大尺寸，按比例缩放
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        // 创建 canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 canvas 上下文'))
          return
        }
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 压缩并导出
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width, height })
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          file.type || 'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 生成缩略图
 * @param file 原始图片文件
 * @param size 缩略图尺寸（默认 200x200）
 * @returns 缩略图 Blob
 */
export const generateThumbnail = async (
  file: File,
  size: number = 200
): Promise<{
  blob: Blob
  width: number
  height: number
}> => {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
  })
}

/**
 * 压缩图片用于上传
 * @param file 原始图片文件
 * @returns 压缩后的 Blob
 */
export const compressForUpload = async (file: File): Promise<Blob> => {
  const { blob } = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
  })
  return blob
}
