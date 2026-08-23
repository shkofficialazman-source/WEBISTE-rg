/**
 * High-Performance Client-Side Comic Art Filter
 * Transforms any portrait or car photo into a retro Hot Wheels mainline
 * comic-book / manga card backdrop with ink outlines, cel-shading, halftone dots & speed lines.
 */

export async function generateComicArtFilter(imageSource: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D context not supported');
        }

        // Target high-res but performant dimensions (e.g. 800px max)
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // 1. Draw base image with saturated, high contrast settings
        ctx.filter = 'contrast(135%) saturate(145%) brightness(105%)';
        ctx.drawImage(img, 0, 0, width, height);
        ctx.filter = 'none';

        // 2. Extract pixel data for Posterization & Comic Edge Inking
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const width4 = width * 4;

        // Grayscale buffer for edge detection
        const gray = new Float32Array(width * height);
        for (let i = 0, g = 0; i < data.length; i += 4, g++) {
          gray[g] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // 3. Cel-Shading Posterization (Quantize RGB levels)
        const levels = 6;
        const step = 255 / (levels - 1);
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Warm Hot Wheels tint boost (reds & golds)
          r = Math.min(255, r * 1.08);
          g = Math.min(255, g * 1.02);

          data[i] = Math.round(r / step) * step;
          data[i + 1] = Math.round(g / step) * step;
          data[i + 2] = Math.round(b / step) * step;
        }

        // 4. Sobel Edge Detection for Bold Black Comic Outlines
        const edgeCanvas = document.createElement('canvas');
        edgeCanvas.width = width;
        edgeCanvas.height = height;
        const edgeCtx = edgeCanvas.getContext('2d');

        if (edgeCtx) {
          const edgeImgData = edgeCtx.createImageData(width, height);
          const edgeData = edgeImgData.data;

          const threshold = 32;

          for (let y = 1; y < height - 1; y++) {
            const yIndex = y * width;
            for (let x = 1; x < width - 1; x++) {
              const idx = yIndex + x;

              // Sobel horizontal & vertical kernels
              const gx =
                -1 * gray[idx - width - 1] +
                1 * gray[idx - width + 1] +
                -2 * gray[idx - 1] +
                2 * gray[idx + 1] +
                -1 * gray[idx + width - 1] +
                1 * gray[idx + width + 1];

              const gy =
                -1 * gray[idx - width - 1] +
                -2 * gray[idx - width] +
                -1 * gray[idx - width + 1] +
                1 * gray[idx + width - 1] +
                2 * gray[idx + width] +
                1 * gray[idx + width + 1];

              const magnitude = Math.sqrt(gx * gx + gy * gy);
              const pIdx = idx * 4;

              if (magnitude > threshold) {
                // Black ink line with variable opacity based on edge strength
                const alpha = Math.min(240, Math.round(magnitude * 2.2));
                edgeData[pIdx] = 15; // Dark near-black ink
                edgeData[pIdx + 1] = 15;
                edgeData[pIdx + 2] = 20;
                edgeData[pIdx + 3] = alpha;
              } else {
                edgeData[pIdx + 3] = 0; // Transparent
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);

          // Composite the ink lines
          edgeCtx.putImageData(edgeImgData, 0, 0);
          ctx.drawImage(edgeCanvas, 0, 0);
        } else {
          ctx.putImageData(imgData, 0, 0);
        }

        // 5. Halftone Ben-Day Dot Pattern (Comic Print Texture)
        const dotCanvas = document.createElement('canvas');
        dotCanvas.width = width;
        dotCanvas.height = height;
        const dotCtx = dotCanvas.getContext('2d');
        if (dotCtx) {
          dotCtx.fillStyle = 'rgba(239, 68, 68, 0.08)'; // Subtle red racing dots
          const dotSpacing = 8;
          const radius = 1.2;
          for (let dy = 0; dy < height; dy += dotSpacing) {
            for (let dx = 0; dx < width; dx += dotSpacing) {
              const offsetX = (dy / dotSpacing) % 2 === 0 ? 0 : dotSpacing / 2;
              dotCtx.beginPath();
              dotCtx.arc(dx + offsetX, dy, radius, 0, Math.PI * 2);
              dotCtx.fill();
            }
          }
          ctx.drawImage(dotCanvas, 0, 0);
        }

        // 6. Dynamic Comic Speed Lines & Glow Accents
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;

        // Subtle radiating speed rays from top right
        const originX = width * 0.9;
        const originY = height * 0.1;
        const rays = 18;
        for (let r = 0; r < rays; r++) {
          const angle = (Math.PI * 0.75) + (r * (Math.PI * 0.5) / rays);
          const rayLen = Math.max(width, height) * 1.4;
          const endX = originX + Math.cos(angle) * rayLen;
          const endY = originY + Math.sin(angle) * rayLen;

          ctx.beginPath();
          ctx.moveTo(originX, originY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.restore();

        // 7. Vignette / Racing Border Shading
        const gradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.35,
          width / 2,
          height / 2,
          Math.min(width, height) * 0.75
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(20, 5, 5, 0.45)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Convert to high quality JPEG data url
        const resultDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(resultDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image for comic art generation.'));
    };

    img.src = imageSource;
  });
}
