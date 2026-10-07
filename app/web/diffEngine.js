/**
 * OmniDiff Sub-Pixel Differential Optical Engine
 * Client-Side High-Frequency Pixel & Texture Analysis
 */

class OmniDiffEngine {
  constructor() {
    this.canvasA = document.createElement('canvas');
    this.canvasB = document.createElement('canvas');
    this.diffCanvas = document.createElement('canvas');
    this.ctxA = this.canvasA.getContext('2d', { willReadFrequently: true });
    this.ctxB = this.canvasB.getContext('2d', { willReadFrequently: true });
    this.ctxDiff = this.diffCanvas.getContext('2d', { willReadFrequently: true });
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Failed to load image: ' + src));
      img.src = src;
    });
  }

  async computeDifferential(srcA, srcB, options = {}) {
    const threshold = options.threshold || 22; // Sub-visual noise gate
    const highPassBoost = options.highPassBoost || 2.4;
    const targetWidth = options.width || 600;
    const targetHeight = options.height || 450;

    const [imgA, imgB] = await Promise.all([this.loadImage(srcA), this.loadImage(srcB)]);

    this.canvasA.width = targetWidth;
    this.canvasA.height = targetHeight;
    this.canvasB.width = targetWidth;
    this.canvasB.height = targetHeight;
    this.diffCanvas.width = targetWidth;
    this.diffCanvas.height = targetHeight;

    this.ctxA.drawImage(imgA, 0, 0, targetWidth, targetHeight);
    this.ctxB.drawImage(imgB, 0, 0, targetWidth, targetHeight);

    const dataA = this.ctxA.getImageData(0, 0, targetWidth, targetHeight).data;
    const dataB = this.ctxB.getImageData(0, 0, targetWidth, targetHeight).data;
    const diffImgData = this.ctxDiff.createImageData(targetWidth, targetHeight);
    const diffData = diffImgData.data;

    let deltaPixelCount = 0;
    let maxIntensity = 0;
    let sumDelta = 0;
    let minX = targetWidth, minY = targetHeight, maxX = 0, maxY = 0;

    const totalPixels = targetWidth * targetHeight;

    for (let i = 0; i < dataA.length; i += 4) {
      const rDiff = Math.abs(dataA[i] - dataB[i]);
      const gDiff = Math.abs(dataA[i + 1] - dataB[i + 1]);
      const bDiff = Math.abs(dataA[i + 2] - dataB[i + 2]);

      // Perceptual luminance differential
      const lumaDelta = (rDiff * 0.299 + gDiff * 0.587 + bDiff * 0.114) * highPassBoost;

      const pxIndex = i / 4;
      const x = pxIndex % targetWidth;
      const y = Math.floor(pxIndex / targetWidth);

      if (lumaDelta > threshold) {
        deltaPixelCount++;
        sumDelta += lumaDelta;
        if (lumaDelta > maxIntensity) maxIntensity = lumaDelta;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // False-Color Neon Palette
        // Mild delta -> Cyan (#00F0FF), High delta -> Magenta/Hot Pink (#FF0055)
        const norm = Math.min(1.0, (lumaDelta - threshold) / 90);
        diffData[i] = Math.round(255 * norm);                 // R
        diffData[i + 1] = Math.round(240 * (1 - norm * 0.8)); // G
        diffData[i + 2] = Math.round(255);                    // B
        diffData[i + 3] = Math.round(180 + norm * 75);        // Alpha
      } else {
        // Darkened background for high contrast
        const baseLuma = (dataA[i] * 0.299 + dataA[i + 1] * 0.587 + dataA[i + 2] * 0.114) * 0.2;
        diffData[i] = Math.round(baseLuma * 0.4);
        diffData[i + 1] = Math.round(baseLuma * 0.5);
        diffData[i + 2] = Math.round(baseLuma * 0.7);
        diffData[i + 3] = 230;
      }
    }

    this.ctxDiff.putImageData(diffImgData, 0, 0);

    const deltaPercentage = ((deltaPixelCount / totalPixels) * 100);
    const hasAnomaly = deltaPixelCount > 35; // Filter lone noise pixels

    return {
      hasAnomaly,
      deltaPercentage: parseFloat(deltaPercentage.toFixed(3)),
      deltaPixelCount,
      maxIntensity: Math.round(maxIntensity),
      boundingBox: hasAnomaly ? { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY } : null,
      heatmapDataUrl: this.diffCanvas.toDataURL('image/jpeg', 0.88),
      targetWidth,
      targetHeight
    };
  }
}

if (typeof window !== 'undefined') {
  window.OmniDiffEngine = OmniDiffEngine;
}
