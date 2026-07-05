import * as THREE from 'three';
import { wallColliders, roomBounds, poolBounds } from './config.js';
import {
  createWallpaperTexture,
  createWallpaperBumpMap,
  createCarpetTexture,
  createCarpetBumpMap,
  createCeilingTexture,
} from './textures.js';

// ============================================================================
// Room Geometry (Backrooms-style)
// ============================================================================

/**
 * The wallpaper texture covers a 2m-wide x 4m-tall wall section, so a
 * surface of `length` meters needs repeat.set(length / 2, 1).
 */
function makeWallMaterial(baseTex, baseBump, length) {
  const tex = baseTex.clone();
  tex.repeat.set(length / 2, 1);
  const bump = baseBump.clone();
  bump.repeat.set(length / 2, 1);
  return new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: bump,
    bumpScale: 0.02,
    roughness: 0.9,
    metalness: 0.0,
  });
}

/**
 * Builds the main room: floor (with a hole for the pool), ceiling, walls,
 * partitions, and baseboards.
 */
export function buildRoom(scene) {
  const wallpaperTex = createWallpaperTexture();
  const wallpaperBump = createWallpaperBumpMap();
  const carpetTex = createCarpetTexture();
  const carpetBump = createCarpetBumpMap();
  const ceilingTex = createCeilingTexture();

  const roomW = roomBounds.maxX - roomBounds.minX; // 40
  const roomH = roomBounds.ceilingY;               // 4

  // --- Floor (carpet with a rectangular hole where the pool sits) ---
  // ShapeGeometry generates UVs in shape-space units, so 1 texture repeat
  // spans 1/repeat world meters. rotation.x = -PI/2 maps shape (x, y) to
  // world (x, 0, -y), hence the hole uses negated Z coordinates.
  const floorShape = new THREE.Shape();
  floorShape.moveTo(roomBounds.minX, -roomBounds.maxZ);
  floorShape.lineTo(roomBounds.maxX, -roomBounds.maxZ);
  floorShape.lineTo(roomBounds.maxX, -roomBounds.minZ);
  floorShape.lineTo(roomBounds.minX, -roomBounds.minZ);
  floorShape.closePath();

  const poolHole = new THREE.Path();
  poolHole.moveTo(poolBounds.minX, -poolBounds.maxZ);
  poolHole.lineTo(poolBounds.maxX, -poolBounds.maxZ);
  poolHole.lineTo(poolBounds.maxX, -poolBounds.minZ);
  poolHole.lineTo(poolBounds.minX, -poolBounds.minZ);
  poolHole.closePath();
  floorShape.holes.push(poolHole);

  carpetTex.repeat.set(1 / 4, 1 / 4);   // one carpet tile per 4m
  carpetBump.repeat.set(1 / 4, 1 / 4);

  const floorGeo = new THREE.ShapeGeometry(floorShape);
  const floorMat = new THREE.MeshStandardMaterial({
    map: carpetTex,
    bumpMap: carpetBump,
    bumpScale: 0.015,
    roughness: 0.95,
    metalness: 0.0,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- Ceiling ---
  const ceilingGeo = new THREE.PlaneGeometry(roomW, roomW);
  ceilingTex.repeat.set(10, 10); // 2m acoustic tiles (texture holds 2x2)
  const ceilingMat = new THREE.MeshStandardMaterial({
    map: ceilingTex,
    roughness: 0.9,
    metalness: 0.0,
  });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = roomBounds.ceilingY;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // --- Perimeter walls ---
  const perimeterMat = makeWallMaterial(wallpaperTex, wallpaperBump, roomW);

  const wallDefs = [
    { x: 0, z: roomBounds.minZ, ry: 0 },            // North
    { x: 0, z: roomBounds.maxZ, ry: Math.PI },      // South
    { x: roomBounds.maxX, z: 0, ry: -Math.PI / 2 }, // East
    { x: roomBounds.minX, z: 0, ry: Math.PI / 2 },  // West
  ];

  wallDefs.forEach((w) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), perimeterMat);
    wall.position.set(w.x, roomH / 2, w.z);
    wall.rotation.y = w.ry;
    wall.receiveShadow = true;
    scene.add(wall);
  });

  // --- Interior partition walls ---
  const partitions = [
    // Long horizontal partition near center-north
    { x: -5, z: -8, w: 12, h: 4, d: 0.2 },
    // Vertical partition creating a corridor
    { x: 8, z: 5, w: 0.2, h: 4, d: 10 },
    // Short wall creating a nook
    { x: -12, z: 6, w: 8, h: 4, d: 0.2 },
    // Another partition creating corridor depth
    { x: -3, z: 14, w: 0.2, h: 4, d: 8 },
  ];

  partitions.forEach((p) => {
    const length = Math.max(p.w, p.d);
    const mat = makeWallMaterial(wallpaperTex, wallpaperBump, length);
    const geo = new THREE.BoxGeometry(p.w, p.h, p.d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.x, p.h / 2, p.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Add collision AABB
    wallColliders.push({
      minX: p.x - p.w / 2,
      maxX: p.x + p.w / 2,
      minZ: p.z - p.d / 2,
      maxZ: p.z + p.d / 2,
    });
  });

  // --- Baseboards (thin dark strips along walls) ---
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a15,
    roughness: 0.7,
    metalness: 0.1,
  });
  const baseboardHeight = 0.12;
  const baseboardThickness = 0.05;

  const baseboardDefs = [
    { w: roomW, d: baseboardThickness, x: 0, z: roomBounds.minZ + baseboardThickness / 2 },
    { w: roomW, d: baseboardThickness, x: 0, z: roomBounds.maxZ - baseboardThickness / 2 },
    { w: baseboardThickness, d: roomW, x: roomBounds.maxX - baseboardThickness / 2, z: 0 },
    { w: baseboardThickness, d: roomW, x: roomBounds.minX + baseboardThickness / 2, z: 0 },
  ];

  baseboardDefs.forEach((b) => {
    const bb = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, baseboardHeight, b.d),
      baseboardMat
    );
    bb.position.set(b.x, baseboardHeight / 2, b.z);
    scene.add(bb);
  });
}
