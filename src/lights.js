import * as THREE from 'three';
import { flickerLights } from './config.js';

// ============================================================================
// Fluorescent Light Fixtures
// ============================================================================

/**
 * Creates fluorescent ceiling light fixtures with corresponding point lights.
 * Some lights flicker for atmosphere.
 */
export function buildLights(scene) {
  const lightPositions = [
    { x: -8, z: -10, flicker: false, dim: false },
    { x: 4, z: -12, flicker: true, dim: false },
    { x: -6, z: 0, flicker: false, dim: false },
    { x: 6, z: 2, flicker: false, dim: true },   // dim light
    { x: -10, z: 10, flicker: true, dim: false },
    { x: 3, z: 12, flicker: false, dim: false },
    { x: 14, z: -5, flicker: false, dim: false },
    { x: -14, z: -4, flicker: false, dim: true }, // off / very dim
  ];

  // Emissive material for the light fixture body
  const fixtureMatOn = new THREE.MeshStandardMaterial({
    color: 0xfff8e8,
    emissive: 0xfff5e0,
    emissiveIntensity: 3,
    roughness: 0.3,
    metalness: 0.1,
  });

  const fixtureMatDim = new THREE.MeshStandardMaterial({
    color: 0x998870,
    emissive: 0x665530,
    emissiveIntensity: 0.3,
    roughness: 0.5,
    metalness: 0.1,
  });

  // Metal housing material
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.6,
    metalness: 0.3,
  });

  const fixtureGeo = new THREE.BoxGeometry(2.0, 0.05, 0.3);
  const housingGeo = new THREE.BoxGeometry(2.1, 0.06, 0.35);

  lightPositions.forEach((lp) => {
    const isDim = lp.dim;

    // Housing (slightly larger, behind the tube)
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.set(lp.x, 3.97, lp.z);
    scene.add(housing);

    // Light fixture tube
    const fixture = new THREE.Mesh(
      fixtureGeo,
      isDim ? fixtureMatDim : fixtureMatOn.clone()
    );
    fixture.position.set(lp.x, 3.94, lp.z);
    scene.add(fixture);

    // PointLight
    const intensity = isDim ? 1.5 : 15;
    const pointLight = new THREE.PointLight(0xfff5e0, intensity, 20);
    pointLight.position.set(lp.x, 3.9, lp.z);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    pointLight.shadow.bias = -0.001;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 20;
    scene.add(pointLight);

    // Register flickering lights
    if (lp.flicker && !isDim) {
      flickerLights.push({
        light: pointLight,
        material: fixture.material,
        baseIntensity: intensity,
        baseEmissive: 3,
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
