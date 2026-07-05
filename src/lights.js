import * as THREE from 'three';
import { flickerLights } from './config.js';

// ============================================================================
// Fluorescent Light Fixtures
// ============================================================================

/**
 * Creates recessed fluorescent ceiling panels with corresponding point
 * lights. Only a subset casts shadows: each shadow-casting PointLight
 * renders a 6-face cube shadow map, so 8 of them would mean 48 shadow
 * passes per frame. Some lights flicker or run dim for atmosphere.
 */
export function buildLights(scene) {
  const lightPositions = [
    { x: -8, z: -10, flicker: false, dim: false, shadow: true },
    { x: 4, z: -12, flicker: true, dim: false, shadow: false },
    { x: -6, z: 0, flicker: false, dim: false, shadow: true },
    { x: 6, z: 2, flicker: false, dim: true, shadow: false },   // dim light
    { x: -10, z: 10, flicker: true, dim: false, shadow: false },
    { x: 3, z: 12, flicker: false, dim: false, shadow: true },
    { x: 14, z: -5, flicker: false, dim: false, shadow: true },
    { x: -14, z: -4, flicker: false, dim: true, shadow: false }, // very dim
  ];

  // Emissive panel materials (diffuser acrylic)
  const panelMatOn = new THREE.MeshStandardMaterial({
    color: 0xfff8e8,
    emissive: 0xfff5e0,
    emissiveIntensity: 2.4,
    roughness: 0.4,
    metalness: 0.0,
  });

  const panelMatDim = new THREE.MeshStandardMaterial({
    color: 0x8a8072,
    emissive: 0x554828,
    emissiveIntensity: 0.35,
    roughness: 0.5,
    metalness: 0.0,
  });

  // Dark metal trim frame around each recessed panel
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x555550,
    roughness: 0.55,
    metalness: 0.4,
  });

  const panelGeo = new THREE.PlaneGeometry(1.4, 0.7);
  const frameGeo = new THREE.BoxGeometry(1.56, 0.04, 0.86);

  lightPositions.forEach((lp) => {
    const isDim = lp.dim;

    // Trim frame flush with the ceiling
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(lp.x, 3.985, lp.z);
    scene.add(frame);

    // Emissive diffuser panel, facing down, slightly below the frame
    const panel = new THREE.Mesh(
      panelGeo,
      isDim ? panelMatDim : panelMatOn.clone()
    );
    panel.rotation.x = Math.PI / 2;
    panel.position.set(lp.x, 3.96, lp.z);
    scene.add(panel);

    // PointLight below the panel so light spreads across the room
    const intensity = isDim ? 2 : 26;
    const pointLight = new THREE.PointLight(0xffeecc, intensity, 22, 1.8);
    pointLight.position.set(lp.x, 3.6, lp.z);
    if (lp.shadow && !isDim) {
      pointLight.castShadow = true;
      pointLight.shadow.mapSize.width = 1024;
      pointLight.shadow.mapSize.height = 1024;
      pointLight.shadow.bias = -0.005;
      pointLight.shadow.camera.near = 0.3;
      pointLight.shadow.camera.far = 22;
    }
    scene.add(pointLight);

    // Register flickering lights
    if (lp.flicker && !isDim) {
      flickerLights.push({
        light: pointLight,
        material: panel.material,
        baseIntensity: intensity,
        baseEmissive: 2.4,
        timer: Math.random() * 10,
        flickerSpeed: 5 + Math.random() * 10,
      });
    }
  });
}

/**
 * Updates flickering fluorescent lights for atmosphere.
 */
export function updateLightFlicker(delta) {
  flickerLights.forEach((fl) => {
    fl.timer += delta * fl.flickerSpeed;

    // Combine sine and random for organic flicker
    const flickerValue =
      Math.sin(fl.timer * 3.7) * 0.1 +
      Math.sin(fl.timer * 7.3) * 0.05 +
      Math.sin(fl.timer * 13.1) * 0.03;

    // Occasional strong flicker (stutter)
    const stutter =
      Math.random() < 0.005 ? (Math.random() < 0.5 ? 0.2 : 0) : 1.0;

    fl.light.intensity = fl.baseIntensity * (1 + flickerValue) * stutter;
    fl.material.emissiveIntensity = fl.baseEmissive * (1 + flickerValue) * stutter;
  });
}
