export interface CompressOptions {
  maxSide?: number
  quality?: number
}

/**
 * Redimensiona e recomprime uma foto. Tenta WebP; se o navegador não gerar WebP
 * (Safari antigo gera PNG no lugar), usa JPEG.
 */
export async function compressImage(
  file: Blob,
  { maxSide = 1080, quality = 0.8 }: CompressOptions = {},
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  const webp = await toBlob('image/webp')
  if (webp && webp.type === 'image/webp') return webp.size < file.size ? webp : file
  const jpeg = await toBlob('image/jpeg')
  if (!jpeg) throw new Error('Não foi possível comprimir a imagem')
  return jpeg.size < file.size ? jpeg : file
}

/** Duração de um vídeo em segundos (lê só os metadados). */
export function videoDuration(file: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Vídeo inválido'))
    }
    video.src = url
  })
}
