/**
 * config.js — Shared configuration module for the Backrooms game.
 *
 * Exports all shared constants, state objects, and mutable references
 * used across the game's subsystems (player, input, physics, rendering).
 * This is the single source of truth for game-wide configuration so that
 * every module can import what it needs without circular dependencies.
 */

import * as THREE from 'three';

// Player state
export const player = {
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  onGround: true,
  height: 1.7,
  speed: 5.0,
  sprintSpeed: 8.0,
  jumpForce: 5.0,
  inPool: false,
  holdingBall: false,
};

// Input state
export const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
};

// Ball state
export const ball = {
  mesh: null,
  velocity: new THREE.Vector3(),
  onGround: false,
  held: false,
  gravity: -9.8,
  restitution: 0.6,
  friction: 0.98,
  radius: 0.2,
};

// FPS tracking
export const fpsTracker = {
  frames: 0,
  elapsed: 0,
  lastFps: 0,
};

// Light flicker state
export const flickerLights = [];

// Lit ceiling fixtures registered for the sanity "stay in the light"
// mechanic. Each entry: { x, z, radius, strength, light, baseIntensity }.
// `light`/`baseIntensity` let flickering fixtures dim their safe-zone in
// real time, so standing under a stuttering light is genuinely risky.
export const litFixtures = [];

// Sanity: drains in the dark, regenerates in the light. 0 triggers a blackout.
export const sanity = {
  value: 100,
  max: 100,
};

// VHS tape collectibles scattered around the level.
export const collectibles = {
  collected: 0,
  total: 0,
  won: false,
  items: [], // { mesh, glow, collected, baseY, phase }
};

// Room bounds (AABB walls for collision)
export const roomBounds = {
  minX: -20,
  maxX: 20,
  minZ: -20,
  maxZ: 20,
  floorY: 0,
  ceilingY: 4,
};

// Pool bounds
export const poolBounds = {
  minX: 4,
  maxX: 12,
  minZ: -8,
  maxZ: -2,
  waterY: -0.2,
  depth: 2,
  floorY: -2,
};

// Interior walls for collision (list of AABBs)
export const wallColliders = [];

// Mutable references for cross-module access
export const refs = {
  dustParticles: null,
  waterMaterial: null,
  waterMesh: null,
};
