import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { refs } from './config.js';

// ============================================================================
// Real Path Tracing Mode (three-gpu-pathtracer)
// ============================================================================
//
// Progressive Monte Carlo path tracing of the exact same scene the raster
// pipeline draws — toggled with P. Rays bounce around the room accumulating
// radiance, so global illumination, soft shadows, and water refraction come
// out of the simulation instead of being faked.
//
// While active, ball/water/flicker updates are frozen (moving geometry would
// invalidate the BVH every frame). The player can still walk: every camera
// move restarts the accumulation at low resolution; standing still lets the
// image converge sample by sample — watch the noise melt away in the HUD.

let pathTracer = null;
let enabled = false;
let building = false;
let savedWaterMaterial = null;
let ptWaterMaterial = null;
const lastCameraMatrix = new THREE.Matrix4();

export function isPathTracingEnabled() {
  return enabled;
}

export function isPathTracingBuilding() {
  return building;
}

export function getPathTracingSamples() {
  return pathTracer ? Math.floor(pathTracer.samples) : 0;
}

/**
 * Toggles path tracing on/off. Enabling is deferred one tick so the HUD
 * can paint a "building" status before the synchronous BVH build blocks
 * the main thread for a moment.
 */
export function togglePathTracing(renderer, scene, camera) {
  if (building) return;
  if (enabled) {
    disable();
    return;
  }

  building = true;
  setTimeout(() => {
    try {
      enable(renderer, scene, camera);
    } finally {
      building = false;
    }
  }, 50);
}

function enable(renderer, scene, camera) {
  // Points and custom ShaderMaterials can't be path traced: hide the dust
  // motes and swap the water for a physical transmissive material. The
  // path tracer then does real refraction (ior 1.33) and Beer-Lambert
  // absorption (attenuationColor) instead of the raster shader's fakes.
  if (refs.dustParticles) refs.dustParticles.visible = false;
  if (refs.waterMesh) {
    if (!ptWaterMaterial) {
      ptWaterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x9fc4a8,
        roughness: 0.08,
        metalness: 0.0,
        transmission: 0.8,
        ior: 1.33,
        thickness: 0.6,
        attenuationColor: new THREE.Color(0x2e4a34),
        attenuationDistance: 0.8,
        side: THREE.DoubleSide,
      });
    }
    savedWaterMaterial = refs.waterMesh.material;
    refs.waterMesh.material = ptWaterMaterial;
  }

  if (!pathTracer) {
    pathTracer = new WebGLPathTracer(renderer);
    pathTracer.bounces = 6;             // enclosed room needs a few GI bounces
    pathTracer.filterGlossyFactor = 0.5; // tames specular fireflies
    pathTracer.renderScale = 0.5;        // half-res for interactivity
    pathTracer.dynamicLowRes = true;     // coarse preview while moving
    pathTracer.lowResScale = 0.15;
    if (pathTracer.tiles) pathTracer.tiles.set(2, 2);
  }

  pathTracer.setScene(scene, camera);
  camera.updateMatrixWorld();
  lastCameraMatrix.copy(camera.matrixWorld);
  enabled = true;
}

function disable() {
  if (refs.dustParticles) refs.dustParticles.visible = true;
  if (refs.waterMesh && savedWaterMaterial) {
    refs.waterMesh.material = savedWaterMaterial;
    savedWaterMaterial = null;
  }
  enabled = false;
}

/**
 * Renders one progressive sample. Restarts accumulation if the camera moved.
 */
export function renderPathTracing(camera) {
  if (!enabled) return;

  camera.updateMatrixWorld();
  if (!lastCameraMatrix.equals(camera.matrixWorld)) {
    lastCameraMatrix.copy(camera.matrixWorld);
    pathTracer.updateCamera();
  }

  pathTracer.renderSample();
}

export function notifyPathTracingResize() {
  if (enabled && pathTracer) pathTracer.updateCamera();
}
