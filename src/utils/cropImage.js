function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

/**
 * Crop an image to the given pixel area and return a Blob.
 * @param {string} imageSrc - Object URL or remote URL
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop
 * @param {{ mimeType?: string, quality?: number }} [options]
 * @returns {Promise<Blob>}
 */
export async function getCroppedImageBlob(
  imageSrc,
  pixelCrop,
  { mimeType = 'image/jpeg', quality = 0.92 } = {},
) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context.')
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create cropped image.'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}
