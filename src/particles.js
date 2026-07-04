import * as THREE from 'three';
import { refs } from './config.js';
import { createDustTexture } from './textures.js';

// ============================================================================
// Dust Particles
// ============================================================================

/**
 * Creates a particle system of floating dust motes illuminated by the
 * fluorescent lights. ~200 particles drift slowly through the air.
 */
export function buildDustParticles(scene) {
  const count = 200;
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    // Spread across the room
    positions[i * 3] = (Math.random() - 0.5) * 36;
    positions[i * 3 + 1] = 0.5 + Math.random() * 3.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 36;

    // Slow random drift velocity
    velocities.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.05
      )
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const dustTexture = createDustTexture();
  const material = new THREE.PointsMaterial({
    map: dustTexture,
    size: 0.08,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xfff5d0,
  });

  const dustParticles = new THREE.Points(geometry, material);
  dustParticles.userData.velocities = velocities;
  scene.add(dustParticles);

  // Store reference for update function
  refs.dustParticles = dustParticles;
}

/**
 * Updates dust particle positions — slow drift with wraparound.
 */
export function updateParticles(delta, clock) {
  if (!refs.dustParticles) return;

  const positions = refs.dustParticles.geometry.attributes.position.array;
  const velocities = refs.dustParticles.userData.velocities;

  for (let i = 0; i < velocities.length; i++) {
    positions[i * 3] += velocities[i].x * delta;
    positions[i * 3 + 1] += velocities[i].y * delta;
    positions[i * 3 + 2] += velocities[i].z * delta;

    // Wrap around room bounds
    if (positions[i * 3] > 18) positions[i * 3] = -18;
    if (positions[i * 3] < -18) positions[i * 3] = 18;
    if (positions[i * 3 + 1] > 3.8) positions[i * 3 + 1] = 0.5;
    if (positions[i * 3 + 1] < 0.5) positions[i * 3 + 1] = 3.8;
    if (positions[i * 3 + 2] > 18) positions[i * 3 + 2] = -18;
    if (positions[i * 3 + 2] < -18) positions[i * 3 + 2] = 18;

    // Add subtle sine drift for floating feel
    positions[i * 3 + 1] +=
      Math.sin(clock.getElapsedTime() * 0.5 + i) * 0.001;
  }

  refs.dustParticles.geometry.attributes.position.needsUpdate = true;
}
