import * as THREE from 'three';
import { wallColliders, roomBounds } from './config.js';
import { createWallpaperTexture, createWallpaperBumpMap, createCarpetTexture, createCeilingTexture } from './textures.js';

// ============================================================================
// Room Geometry (Backrooms-style)
// ============================================================================

/**
 * Builds the main room: floor, ceiling, walls, partitions, and baseboards.
 */
export function buildRoom(scene) {
  const wallpaperTex = createWallpaperTexture();
  const wallpaperBump = createWallpaperBumpMap();
  const carpetTex = createCarpetTexture();
  const ceilingTex = createCeilingTexture();

  // --- Wall material ---
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallpaperTex,
    bumpMap: wallpaperBump,
    bumpScale: 0.03,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // --- Floor ---
  const floorGeo = new THREE.PlaneGeometry(40, 40);
  const floorMat = new THREE.MeshStandardMaterial({
    map: carpetTex,
    roughness: 0.9,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- Ceiling ---
  const ceilingGeo = new THREE.PlaneGeometry(40, 40);
  const ceilingMat = new THREE.MeshStandardMaterial({
    map: ceilingTex,
    roughness: 0.8,
    metalness: 0.0,
  });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4;
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // --- Perimeter walls ---
  // North wall (z = -20)
  const northWall = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 4),
    wallMaterial
  );
  northWall.position.set(0, 2, -20);
  northWall.receiveShadow = true;
  scene.add(northWall);

  // South wall (z = +20)
  const southWall = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 4),
    wallMaterial
  );
  southWall.position.set(0, 2, 20);
  southWall.rotation.y = Math.PI;
  southWall.receiveShadow = true;
  scene.add(southWall);

  // East wall (x = +20)
  const eastWall = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 4),
    wallMaterial
  );
  eastWall.position.set(20, 2, 0);
  eastWall.rotation.y = -Math.PI / 2;
  eastWall.receiveShadow = true;
  scene.add(eastWall);

  // West wall (x = -20)
  const westWall = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 4),
    wallMaterial
  );
  westWall.position.set(-20, 2, 0);
  westWall.rotation.y = Math.PI / 2;
  westWall.receiveShadow = true;
  scene.add(westWall);

  // --- Interior partition walls ---
  const partitions = [
    // Long horizontal partition near center-north
    { x: -5, z: -8, w: 12, h: 4, d: 0.2, ry: 0 },
    // Vertical partition creating a corridor
    { x: 8, z: 5, w: 0.2, h: 4, d: 10, ry: 0 },
    // Short wall creating a nook
    { x: -12, z: 6, w: 8, h: 4, d: 0.2, ry: 0 },
    // Another partition creating corridor depth
    { x: -3, z: 14, w: 0.2, h: 4, d: 8, ry: 0 },
  ];

  const partitionMaterial = new THREE.MeshStandardMaterial({
    map: wallpaperTex.clone(),
    bumpMap: wallpaperBump.clone(),
    bumpScale: 0.03,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  partitions.forEach((p) => {
    const geo = new THREE.BoxGeometry(p.w, p.h, p.d);
    const mesh = new THREE.Mesh(geo, partitionMaterial);
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

  // North baseboard
  const bbNorth = new THREE.Mesh(
    new THREE.BoxGeometry(40, baseboardHeight, baseboardThickness),
    baseboardMat
  );
  bbNorth.position.set(0, baseboardHeight / 2, -20 + baseboardThickness / 2);
  scene.add(bbNorth);

  // South baseboard
  const bbSouth = new THREE.Mesh(
    new THREE.BoxGeometry(40, baseboardHeight, baseboardThickness),
    baseboardMat
  );
  bbSouth.position.set(0, baseboardHeight / 2, 20 - baseboardThickness / 2);
  scene.add(bbSouth);

  // East baseboard
  const bbEast = new THREE.Mesh(
    new THREE.BoxGeometry(baseboardThickness, baseboardHeight, 40),
    baseboardMat
  );
  bbEast.position.set(20 - baseboardThickness / 2, baseboardHeight / 2, 0);
  scene.add(bbEast);

  // West baseboard
  const bbWest = new THREE.Mesh(
    new THREE.BoxGeometry(baseboardThickness, baseboardHeight, 40),
    baseboardMat
  );
  bbWest.position.set(-20 + baseboardThickness / 2, baseboardHeight / 2, 0);
  scene.add(bbWest);
}
