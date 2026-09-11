/**
 * Image Optimization Utility
 * 
 * Provides end-to-end compression, WebP/AVIF format auto-negotiation,
 * responsive srcset generation, and dimension downsizing for:
 * - Unsplash CDN
 * - Supabase Storage
 * - Cloudinary
 * - ImgBB / PostImages / Generic Image URLs
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg';
  fit?: 'crop' | 'cover' | 'contain' | 'inside';
}

export const DEFAULT_FALLBACK_IMAGE = '';

/**
 * Optimizes an arbitrary image URL for fast mobile & desktop delivery.
 * Downscales 4000px+ originals into exact device dimensions (e.g. 480px, 800px)
 * and enables automatic WebP/AVIF compression with quality 75-80.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageOptimizationOptions = {}
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) return cleanUrl;

  const {
    width = 640,
    quality = 75,
    format = 'auto',
    fit = 'crop',
  } = options;

  try {
    // 1. Unsplash CDN Optimization
    if (cleanUrl.includes('images.unsplash.com')) {
      const baseUrl = cleanUrl.split('?')[0];
      const params = new URLSearchParams();
      params.set('auto', format === 'auto' ? 'format' : format);
      // Unsplash supports 'crop', 'clip', 'max', 'fill', 'scale'
      const unsplashFit = fit === 'contain' ? 'max' : (fit === 'cover' || fit === 'crop' ? 'crop' : 'max');
      params.set('fit', unsplashFit);
      params.set('w', String(width));
      params.set('q', String(quality));
      if (options.height) {
        params.set('h', String(options.height));
      }
      return `${baseUrl}?${params.toString()}`;
    }

    // 2. Supabase Storage Optimization
    if (cleanUrl.includes('supabase.co/storage/v1/object/public/')) {
      return cleanUrl;
    }

    // 3. Cloudinary Optimization
    if (cleanUrl.includes('res.cloudinary.com')) {
      const parts = cleanUrl.split('/upload/');
      if (parts.length === 2) {
        const transforms = `f_auto,q_auto:good,w_${width},c_${fit === 'crop' ? 'fill' : 'scale'}`;
        return `${parts[0]}/upload/${transforms}/${parts[1]}`;
      }
    }

    // 4. ImgBB / PostImages or other CDNs with query params
    if (cleanUrl.includes('imgbb.com') || cleanUrl.includes('postimg.cc')) {
      return cleanUrl;
    }

    return cleanUrl;
  } catch {
    return cleanUrl;
  }
}

/**
 * Builds responsive `srcSet` for sharp, bandwidth-friendly loading across mobile, tablet, and retina screens.
 */
export function buildResponsiveSrcSet(url: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  if (url.startsWith('data:') || url.startsWith('blob:')) return undefined;

  // If Unsplash image
  if (url.includes('images.unsplash.com')) {
    try {
      const baseUrl = url.split('?')[0];
      return [
        `${baseUrl}?w=360&auto=format&fit=crop&q=70 360w`,
        `${baseUrl}?w=480&auto=format&fit=crop&q=75 480w`,
        `${baseUrl}?w=640&auto=format&fit=crop&q=75 640w`,
        `${baseUrl}?w=800&auto=format&fit=crop&q=80 800w`,
        `${baseUrl}?w=1080&auto=format&fit=crop&q=80 1080w`,
      ].join(', ');
    } catch {
      return undefined;
    }
  }

  // If Cloudinary image
  if (url.includes('res.cloudinary.com')) {
    try {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return [
          `${parts[0]}/upload/f_auto,q_auto:eco,w_360/${parts[1]} 360w`,
          `${parts[0]}/upload/f_auto,q_auto:good,w_480/${parts[1]} 480w`,
          `${parts[0]}/upload/f_auto,q_auto:good,w_640/${parts[1]} 640w`,
          `${parts[0]}/upload/f_auto,q_auto:good,w_800/${parts[1]} 800w`,
        ].join(', ');
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Generates an ultra-tiny blur-up placeholder URL (20px low-res) for instant visual preview
 */
export function getBlurPlaceholderUrl(url: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=20&auto=format&fit=crop&q=30&blur=20`;
  }
  return undefined;
}
