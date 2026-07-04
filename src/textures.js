import * as THREE from 'three';

// ============================================================================
// Procedural Texture Generation
// ============================================================================

/**
 * Creates a yellow wallpaper texture with repeating panel pattern.
 * Simulates aged, institutional wallpaper found in the Backrooms.
 */
export function createWallpaperTexture() {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  // Base yellow
  ctx.fillStyle = '#c4a83a';
  ctx.fillRect(0, 0, size, size);

  // Draw repeating wallpaper panels with subtle color variation
  const panelW = 64;
  const panelH = 128;
  for (let x = 0; x < size; x += panelW) {
    for (let y = 0; y < size; y += panelH) {
      // Slight hue variation per panel
      const r = 180 + Math.floor(Math.random() * 20);
      const g = 155 + Math.floor(Math.random() * 20);
      const b = 40 + Math.floor(Math.random() * 15);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 1, y + 1, panelW - 2, panelH - 2);

      // Panel border groove
      ctx.strokeStyle = 'rgba(80, 60, 20, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, panelW - 2, panelH - 2);
    }
  }

  // Add subtle noise for texture
  const imageData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    imageData.data[i] += noise;
    imageData.data[i + 1] += noise;
    imageData.data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);

  // Add faint vertical streaks for age effect
  for (let i = 0; i < 20; i++) {
    const sx = Math.random() * size;
    ctx.strokeStyle = `rgba(60, 40, 10, ${Math.random() * 0.08})`;
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + (Math.random() - 0.5) * 10, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(cvs);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates a simple bump map for wallpaper (grayscale noise).
 */
export function createWallpaperBumpMap() {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Panel grooves as bump
  const panelW = 32;
  const panelH = 64;
  for (let x = 0; x < size; x += panelW) {
    for (let y = 0; y < size; y += panelH) {
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, panelW, panelH);
    }
  }

  // Noise
  const imageData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    imageData.data[i] += noise;
    imageData.data[i + 1] += noise;
    imageData.data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(cvs);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates a brownish-yellow carpet texture with noise pattern.
 * Simulates the damp, stained carpet of the Backrooms.
 */
export function createCarpetTexture() {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  // Base carpet color
  ctx.fillStyle = '#8a7a42';
  ctx.fillRect(0, 0, size, size);

  // Carpet fiber noise
  const imageData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + noise));
    imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] + noise));
    imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] + noise * 0.5));
  }
  ctx.putImageData(imageData, 0, 0);

  // Add some darker stain patches
  for (let i = 0; i < 8; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const sr = Math.random() * 40 + 20;
    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    gradient.addColorStop(0, 'rgba(50, 40, 20, 0.15)');
    gradient.addColorStop(1, 'rgba(50, 40, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }

  const texture = new THREE.CanvasTexture(cvs);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

/**
 * Creates an off-white ceiling tile texture with grid pattern.
 * Simulates drop-ceiling acoustic tiles.
 */
export function createCeilingTexture() {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  // Off-white base
  ctx.fillStyle = '#d4cdb8';
  ctx.fillRect(0, 0, size, size);

  // Tile grid (2x2 tiles per texture repeat)
  const tileSize = size / 2;
  ctx.strokeStyle = 'rgba(100, 90, 70, 0.4)';
  ctx.lineWidth = 3;
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Tiny pinholes / texture on each tile
  for (let tx = 0; tx < 2; tx++) {
    for (let ty = 0; ty < 2; ty++) {
      const ox = tx * tileSize;
      const oy = ty * tileSize;
      for (let i = 0; i < 80; i++) {
        const px = ox + 10 + Math.random() * (tileSize - 20);
        const py = oy + 10 + Math.random() * (tileSize - 20);
        ctx.fillStyle = `rgba(150, 140, 120, ${Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Subtle noise
  const imageData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    imageData.data[i] += noise;
    imageData.data[i + 1] += noise;
    imageData.data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(cvs);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

/**
 * Creates a light blue/cyan tile texture for pool walls.
 */
export function createPoolTileTexture() {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  // Light blue base
  ctx.fillStyle = '#88b8c8';
  ctx.fillRect(0, 0, size, size);

  // Tile grid
  const tileSize = 32;
  for (let x = 0; x < size; x += tileSize) {
    for (let y = 0; y < size; y += tileSize) {
      const r = 120 + Math.floor(Math.random() * 20);
      const g = 170 + Math.floor(Math.random() * 20);
      const b = 190 + Math.floor(Math.random() * 15);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
    }
  }

  // Grout lines
  ctx.strokeStyle = 'rgba(60, 80, 80, 0.4)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(cvs);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
}

/**
 * Creates a small circular particle texture for dust motes.
 */
export function createDustTexture() {
  const size = 32;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 245, 220, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 245, 220, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 245, 220, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(cvs);
}
