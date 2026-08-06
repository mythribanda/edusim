/**
 * Safe asset image loading with intelligent fallback and error recovery
 */

export function createImageSafeLoader() {
  const cache = new Map<string, Promise<HTMLImageElement>>();
  const failedAssets = new Set<string>();

  const FALLBACK_CHAIN = [
    '/assets/physics/balls/ball_generic/ball_generic1.png',
    '/assets/physics/interactables/block_locked_square/block_locked_square.png',
    '/assets/terrain/road/road_asphalt/road_asphalt.png',
  ];

  function createPlaceholderImage(width = 64, height = 64): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText('?', width / 2 - 3, height / 2 + 3);
    }

    const img = new Image();
    img.src = canvas.toDataURL();
    img.width = width;
    img.height = height;
    return img;
  }

  async function loadImage(
    path: string,
    timeout = 5000,
    fallbackIndex = 0
  ): Promise<HTMLImageElement> {
    if (!path) {
      return createPlaceholderImage();
    }

    if (cache.has(path)) {
      return cache.get(path)!;
    }

    const promise = (async () => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';

        const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
          const timeoutHandle = setTimeout(
            () => reject(new Error(`Image load timeout: ${path}`)),
            timeout
          );

          img.onload = () => {
            clearTimeout(timeoutHandle);
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              resolve(img);
            } else {
              reject(new Error(`Invalid image dimensions: ${path}`));
            }
          };

          img.onerror = () => {
            clearTimeout(timeoutHandle);
            reject(new Error(`Failed to load: ${path}`));
          };

          img.src = path;
        });

        return await loadPromise;
      } catch (error) {
        console.warn(`[ImageLoader] Failed: ${path}`, error);
        failedAssets.add(path);

        // Try next fallback
        if (fallbackIndex < FALLBACK_CHAIN.length) {
          const fallback = FALLBACK_CHAIN[fallbackIndex];
          if (fallback !== path) {
            return loadImage(fallback, timeout, fallbackIndex + 1);
          }
        }

        // All fallbacks exhausted
        console.error(`[ImageLoader] All fallbacks exhausted for: ${path}`);
        return createPlaceholderImage();
      }
    })();

    cache.set(path, promise);
    return promise;
  }

  return {
    load: loadImage,
    has: (path: string) => cache.has(path) && !failedAssets.has(path),
    clear: () => {
      cache.clear();
      failedAssets.clear();
    },
  };
}

export const imageSafeLoader = createImageSafeLoader();
