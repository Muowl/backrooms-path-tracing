// ============================================================================
// game.js — Backrooms: Path Tracing Experience
// Main entry point — orchestrates all game modules
// ============================================================================

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Game modules
import { player, keys, ball, fpsTracker, roomBounds } from './src/config.js';
import { buildRoom } from './src/room.js';
import { buildLights, updateLightFlicker } from './src/lights.js';
import { buildPool, updateWater } from './src/pool.js';
import { buildBall, updateBall } from './src/ball.js';
import { buildProps } from './src/props.js';
import { buildDustParticles, updateParticles } from './src/particles.js';
import { createPostProcessing } from './src/postprocessing.js';
import { updatePlayer } from './src/player.js';
import { setupInput } from './src/input.js';
import {
  togglePathTracing,
  renderPathTracing,
  isPathTracingEnabled,
  isPathTracingBuilding,
  getPathTracingSamples,
  notifyPathTracingResize,
} from './src/pathtracing.js';

// ============================================================================
// DOM References
// ============================================================================

const canvas = document.getElementById('game-canvas');
const instructionsPanel = document.getElementById('instructions');
const hud = document.getElementById('hud');
const fpsDisplay = document.getElementById('fps-counter');
const ptStatusDisplay = document.getElementById('pt-status');

// ============================================================================
// Renderer Setup
// ============================================================================

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ============================================================================
// Scene & Camera
// ============================================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2210);
scene.fog = new THREE.FogExp2(0x2a2210, 0.015);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, player.height, 0);

// ============================================================================
// Ambient Fill Light
// ============================================================================

// Hemisphere fill: warm bounce from the lit ceiling above, darker
// carpet-colored bounce from below. Reads more naturally than a flat
// AmbientLight because surfaces facing up/down get different fill.
const hemiLight = new THREE.HemisphereLight(0xfff0d0, 0x5a4a28, 0.45);
scene.add(hemiLight);

// ============================================================================
// Controls (Pointer Lock)
// ============================================================================

const controls = new PointerLockControls(camera, document.body);

if (instructionsPanel) {
  instructionsPanel.addEventListener('click', () => {
    controls.lock();
  });
}

controls.addEventListener('lock', () => {
  if (instructionsPanel) instructionsPanel.style.display = 'none';
  if (hud) hud.style.display = 'block';
});

controls.addEventListener('unlock', () => {
  if (instructionsPanel) instructionsPanel.style.display = '';
  if (hud) hud.style.display = 'none';
});

scene.add(controls.getObject());

// ============================================================================
// Post-Processing
// ============================================================================

const { composer, backroomsPass, bloomPass } = createPostProcessing(renderer, scene, camera);

// ============================================================================
// Input
// ============================================================================

setupInput(controls, camera);

// P toggles between the raster pipeline and real progressive path tracing
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP') {
    togglePathTracing(renderer, scene, camera);
  }
});

// ============================================================================
// Clock
// ============================================================================

const clock = new THREE.Clock();

// ============================================================================
// FPS Counter
// ============================================================================

function updateFPS(delta) {
  fpsTracker.frames++;
  fpsTracker.elapsed += delta;

  if (fpsTracker.elapsed >= 0.5) {
    fpsTracker.lastFps = Math.round(fpsTracker.frames / fpsTracker.elapsed);
    fpsTracker.frames = 0;
    fpsTracker.elapsed = 0;

    if (fpsDisplay) {
      fpsDisplay.textContent = `FPS: ${fpsTracker.lastFps}`;
    }
  }
}

// ============================================================================
// Window Resize Handler
// ============================================================================

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);

  bloomPass.resolution.set(width, height);
  backroomsPass.uniforms.resolution.value.set(width, height);
  notifyPathTracingResize();
}

window.addEventListener('resize', onWindowResize);

// ============================================================================
// Initialization
// ============================================================================

function init() {
  buildRoom(scene);
  buildLights(scene);
  buildPool(scene);
  buildBall(scene);
  buildProps(scene);
  buildDustParticles(scene);

  animate();

  console.log(
    '%c🏢 Backrooms: Path Tracing — Initialized',
    'color: #c4a83a; font-size: 14px; font-weight: bold;'
  );
  console.log(
    '%cWASD to move | Mouse to look | Shift to sprint | Space to jump | E to grab ball | Click to throw',
    'color: #888; font-size: 11px;'
  );
}

// ============================================================================
// Animation Loop
// ============================================================================

// Audio note: In a full implementation, add a looping 60Hz hum audio source
// positioned at each fluorescent light fixture for immersive ambience.

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const clampedDelta = Math.min(delta, 0.1);

  updatePlayer(clampedDelta, controls, camera, clock);
  updateFPS(delta);

  if (isPathTracingEnabled()) {
    // Path tracing mode: dynamic objects are frozen (the BVH was built
    // once at toggle time); each frame accumulates one more sample.
    renderPathTracing(camera);
  } else {
    updateBall(clampedDelta, clock, camera);
    updateWater(clock, camera);
    updateLightFlicker(clampedDelta);
    updateParticles(clampedDelta, clock);

    backroomsPass.uniforms.time.value = clock.getElapsedTime();
    composer.render();
  }

  updatePTStatus();
}

function updatePTStatus() {
  if (!ptStatusDisplay) return;

  let text;
  if (isPathTracingBuilding()) {
    text = 'Path Tracing: building BVH…';
  } else if (isPathTracingEnabled()) {
    text = `Path Tracing: ${getPathTracingSamples()} samples`;
  } else {
    text = 'Raster — press P for path tracing';
  }

  if (ptStatusDisplay.textContent !== text) {
    ptStatusDisplay.textContent = text;
  }
}

// ============================================================================
// Start the game
// ============================================================================

init();

// Debug hook for automated screenshots / camera inspection (?debug)
if (new URLSearchParams(location.search).has('debug')) {
  window.__debug = {
    camera,
    scene,
    renderer,
    controls,
    composer,
    ball,
    pt: {
      toggle: () => togglePathTracing(renderer, scene, camera),
      isEnabled: isPathTracingEnabled,
      isBuilding: isPathTracingBuilding,
      samples: getPathTracingSamples,
    },
  };
}
