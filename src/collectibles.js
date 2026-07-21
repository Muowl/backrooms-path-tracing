/**
 * collectibles.js — VHS tapes to hunt down.
 *
 * A handful of VHS tapes are scattered across the level. They hover, spin
 * slowly, and glow faintly so they're findable in the gloom (and give you a
 * reason to leave the safety of the light). Walk over one to collect it;
 * gather them all to win the run.
 */

import * as THREE from 'three';
import { collectibles } from './config.js';
import { collectSound } from './audio.js';

// Fixed spots, chosen to sit in the open — clear of the sunken pool
// (x 4..12, z -8..-2) and spread into the darker corners so the hunt pulls
// the player away from the safe fixtures.
const TAPE_POSITIONS = [
  { x: -15, z: 8 },
  { x: 12, z: 14 },
  { x: -3, z: -15 },
  { x: 16, z: 2 },
  { x: -16, z: -12 },
  { x: 2, z: 16 },
];

const HOVER_Y = 0.7; // resting height of the hover
const PICKUP_RADIUS = 1.4; // horizontal distance to auto-collect

/**
 * Build the VHS tape meshes and register them in shared state.
 */
export function buildCollectibles(scene) {
  // Black plastic shell with a faint warm glow so it pops in the dark.
  const shellGeo = new THREE.BoxGeometry(0.2, 0.032, 0.11);
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.35,
    metalness: 0.15,
    emissive: 0x3a2f10,
    emissiveIntensity: 0.6,
  });

  // The paper spine label on top.
  const labelGeo = new THREE.PlaneGeometry(0.12, 0.07);
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xd8c7a0,
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0x2a2415,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  });

  collectibles.items = [];
  collectibles.collected = 0;
  collectibles.won = false;
  collectibles.total = TAPE_POSITIONS.length;

  TAPE_POSITIONS.forEach((pos, i) => {
    const group = new THREE.Group();

    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.castShadow = true;
    group.add(shell);

    const label = new THREE.Mesh(labelGeo, labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.y = 0.017;
    group.add(label);

    group.position.set(pos.x, HOVER_Y, pos.z);

    // A soft point light sells the "glowing pickup" and casts a little pool
    // of light — a faint safe-ish spot as a reward for reaching it.
    const glow = new THREE.PointLight(0xffcf7a, 1.6, 3.5, 2.0);
    glow.position.set(0, 0, 0);
    group.add(glow);

    scene.add(group);

    collectibles.items.push({
      mesh: group,
      glow,
      collected: false,
      baseY: HOVER_Y,
      phase: i * 1.7, // desync the bobbing
    });
  });
}

/**
 * Animate the tapes (spin + hover) and auto-collect any the player reaches.
 * @param {number} delta
 * @param {THREE.Clock} clock
 * @param {THREE.Object3D} playerObj - pointer-lock camera holder
 * @param {() => void} [onCollect] - called when a tape is picked up
 * @param {() => void} [onWin] - called once, when the last tape is collected
 */
export function updateCollectibles(delta, clock, playerObj, onCollect, onWin) {
  const t = clock.getElapsedTime();
  const px = playerObj.position.x;
  const pz = playerObj.position.z;

  for (const item of collectibles.items) {
    if (item.collected) continue;

    // Spin + hover bob.
    item.mesh.rotation.y += delta * 1.2;
    item.mesh.position.y = item.baseY + Math.sin(t * 1.6 + item.phase) * 0.08;

    // Proximity pickup (horizontal distance — the tape hovers above the floor).
    const dx = px - item.mesh.position.x;
    const dz = pz - item.mesh.position.z;
    if (dx * dx + dz * dz < PICKUP_RADIUS * PICKUP_RADIUS) {
      item.collected = true;
      item.mesh.visible = false;
      item.glow.intensity = 0;
      collectibles.collected++;
      collectSound();
      if (onCollect) onCollect();

      if (collectibles.collected >= collectibles.total && !collectibles.won) {
        collectibles.won = true;
        if (onWin) onWin();
      }
    }
  }
}
