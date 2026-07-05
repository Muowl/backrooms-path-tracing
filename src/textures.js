import * as THREE from 'three';

// ============================================================================
// Procedural Texture Generation
// ============================================================================
//
// All color textures are tagged with THREE.SRGBColorSpace so the renderer
// converts them to linear space before lighting — without this the whole
// scene looks washed-out and gray. Bump maps stay in linear (default).

/**
 * Creates the classic Backrooms yellow wallpaper: vertical two-tone stripes
 * with mottling, aging streaks, and baked-in grime near the floor.
 * The texture is designed to cover a full 2m (width) x 4m (height) wall
 * section, so use repeat.set(wallLength / 2, 1).
 */
export function createWallpaperTexture() {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  // Base yellow
  ctx.fillStyle = '#b09a34';
  ctx.fillRect(0, 0, size, size);

  // Vertical stripe pairs (classic backrooms wallpaper pattern)
  const stripeW = 24;
  for (let x = 0; x < size; x += stripeW * 2) {
    ctx.fillStyle = 'rgba(255, 235, 140, 0.08)';
    ctx.fillRect(x, 0, stripeW, size);
    ctx.fillStyle = 'rgba(70, 50, 10, 0.05)';
    ctx.fillRect(x + stripeW, 0, 4, size);
  }

  // Mottled blotches (aged paper)
  for (let i = 0; i < 60; i++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    const br = Math.random() * 50 + 15;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    const dark = Math.random() < 0.5;
    g.addColorStop(0, dark ? 'rgba(80, 60, 15, 0.06)' : 'rgba(240, 220, 130, 0.06)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - br, by - br, br * 2, br * 2);
  }

  // Faint vertical drip streaks
  for (let i = 0; i < 26; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size * 0.5;
    ctx.strokeStyle = `rgba(60, 42, 10, ${Math.random() * 0.09})`;
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 8, sy + Math.random() * size * 0.6);
    ctx.stroke();
  }

  // Grime gradient at the bottom (near baseboard) and subtle shadow at top
  let grad = ctx.createLinearGradient(0, size, 0, size - 90);
  grad.addColorStop(0, 'rgba(40, 28, 8, 0.35)');
  grad.addColorStop(1, 'rgba(40, 28, 8, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, size - 90, size, 90);

  grad = ctx.createLinearGradient(0, 0, 0, 50);
  grad.addColorStop(0, 'rgba(40, 30, 10, 0.18)');
  grad.addColorStop(1, 'rgba(40, 30, 10, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, 50);

  // Fine paper-grain noise
  addNoise(ctx, size, 10);

  const texture = new THREE.CanvasTexture(cvs);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Bump map matching the wallpaper stripes (grayscale, linear space).
 */
export function createWallpaperBumpMap() {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Stripe relief matching the color texture (half resolution)
  const stripeW = 12;
  for (let x = 0; x < size; x += stripeW * 2) {
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(x, 0, stripeW, size);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(x + stripeW, 0, 2, size);
  }

  addNoise(ctx, size, 18);

  const texture = new THREE.CanvasTexture(cvs);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Brownish-yellow carpet with two scales of fiber noise and damp stains.
 * Designed for ~4m x 4m per repeat.
 */
export function createCarpetTexture() {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = '#7a6a36';
  ctx.fillRect(0, 0, size, size);

  // Coarse tonal patches (worn areas)
  for (let i = 0; i < 40; i++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    const br = Math.random() * 70 + 30;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    const dark = Math.random() < 0.6;
    g.addColorStop(0, dark ? 'rgba(45, 35, 12, 0.10)' : 'rgba(160, 140, 70, 0.08)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - br, by - br, br * 2, br * 2);
  }

  // Short fiber strokes
  for (let i = 0; i < 3500; i++) {
    const fx = Math.random() * size;
    const fy = Math.random() * size;
    const light = Math.random() < 0.5;
    ctx.strokeStyle = light
      ? `rgba(150, 130, 65, ${0.05 + Math.random() * 0.1})`
      : `rgba(40, 32, 12, ${0.05 + Math.random() * 0.1})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + (Math.random() - 0.5) * 4, fy + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  // Dark damp stains
  for (let i = 0; i < 10; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const sr = Math.random() * 45 + 20;
    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    gradient.addColorStop(0, 'rgba(35, 28, 12, 0.22)');
    gradient.addColorStop(0.7, 'rgba(35, 28, 12, 0.10)');
    gradient.addColorStop(1, 'rgba(35, 28, 12, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }

  addNoise(ctx, size, 26);

  const texture = new THREE.CanvasTexture(cvs);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Grayscale bump map for the carpet fibers (linear space).
 */
export function createCarpetBumpMap() {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  addNoise(ctx, size, 60);

  const texture = new THREE.CanvasTexture(cvs);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Off-white acoustic drop-ceiling tiles with grid and water stains.
 * One texture covers a 2x2 tile group (~4m).
 */
export function createCeilingTexture() {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = '#cfc7ae';
  ctx.fillRect(0, 0, size, size);

  const tileSize = size / 2;

  // Slight per-tile shade variation + pinhole texture
  for (let tx = 0; tx < 2; tx++) {
    for (let ty = 0; ty < 2; ty++) {
      const ox = tx * tileSize;
      const oy = ty * tileSize;

      const shade = (Math.random() - 0.5) * 14;
      ctx.fillStyle = `rgba(${120 + shade}, ${110 + shade}, ${85 + shade}, 0.12)`;
      ctx.fillRect(ox, oy, tileSize, tileSize);

      for (let i = 0; i < 140; i++) {
        const px = ox + 8 + Math.random() * (tileSize - 16);
        const py = oy + 8 + Math.random() * (tileSize - 16);
        ctx.fillStyle = `rgba(110, 100, 80, ${Math.random() * 0.25})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.random() * 1.4 + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Occasional brownish water stain
  for (let i = 0; i < 3; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const sr = Math.random() * 50 + 25;
    const g = ctx.createRadialGradient(sx, sy, sr * 0.4, sx, sy, sr);
    g.addColorStop(0, 'rgba(140, 110, 55, 0.10)');
    g.addColorStop(0.85, 'rgba(120, 90, 40, 0.16)');
    g.addColorStop(1, 'rgba(120, 90, 40, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }

  // T-bar grid with slight shadow
  ctx.strokeStyle = 'rgba(70, 62, 45, 0.55)';
  ctx.lineWidth = 4;
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, x);
    ctx.lineTo(size, x);
    ctx.stroke();
  }

  addNoise(ctx, size, 8);

  const texture = new THREE.CanvasTexture(cvs);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Light blue/cyan ceramic tiles for the pool walls and floor.
 */
export function createPoolTileTexture() {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  // Grout base
  ctx.fillStyle = '#9aa9a5';
  ctx.fillRect(0, 0, size, size);

  // Individual tiles with variation and a subtle glaze highlight
  const tileSize = 32;
  const gap = 3;
  for (let x = 0; x < size; x += tileSize) {
    for (let y = 0; y < size; y += tileSize) {
      const r = 110 + Math.floor(Math.random() * 25);
      const g = 165 + Math.floor(Math.random() * 25);
      const b = 185 + Math.floor(Math.random() * 20);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + gap / 2, y + gap / 2, tileSize - gap, tileSize - gap);

      // Glaze highlight in the upper-left of each tile
      const hg = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
      hg.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
      hg.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = hg;
      ctx.fillRect(x + gap / 2, y + gap / 2, tileSize - gap, tileSize - gap);
    }
  }

  addNoise(ctx, size, 8);

  const texture = new THREE.CanvasTexture(cvs);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
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

  const texture = new THREE.CanvasTexture(cvs);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Adds uniform RGB noise to a canvas (helper).
 */
function addNoise(ctx, size, amount) {
  const imageData = ctx.getImageData(0, 0, size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    d[i] = Math.min(255, Math.max(0, d[i] + noise));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}
