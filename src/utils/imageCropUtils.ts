/**
 * Utility helpers for Admin Image Cropping and File conversions.
 */

/**
 * Fetches an image URL and converts it into a standard File object for cropping
 */
export const convertUrlToFile = async (
  url: string,
  filename = 'image_to_crop.jpg'
): Promise<File> => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status} when fetching image`);
    const blob = await res.blob();
    return new File([blob], filename, {
      type: blob.type || 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('[imageCropUtils] Direct fetch failed, falling back to Canvas draw:', err);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob returned null'));
              return;
            }
            resolve(
              new File([blob], filename, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
            );
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = (e) => reject(new Error('Failed to load image for re-cropping'));
      img.src = url;
    });
  }
};
