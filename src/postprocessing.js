// ============================================================================
// postprocessing.js — Post-Processing Pipeline
// Handles all post-processing effects for the Backrooms experience
// ============================================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ============================================================================
// Post-Processing Pipeline
// ============================================================================

/**
 * Custom post-processing shader combining:
 * - Chromatic aberration (subtle RGB offset at edges)
 * - Warm color grading
 * - Film grain (animated noise for path-tracer feel)
 * - Vignette (darken edges)
 */
export const BackroomsPostShader = {
  name: 'BackroomsPostShader',
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    sanity: { value: 1.0 }, // 1 = calm, 0 = losing it
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform vec2 resolution;
    uniform float sanity;

    varying vec2 vUv;

    // Animated film grain
    float grain(vec2 uv, float t) {
      return fract(sin(dot(uv * resolution, vec2(12.9898, 78.233)) + t) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // Fear rises as sanity falls; it amplifies every unsettling effect.
      float fear = 1.0 - clamp(sanity, 0.0, 1.0);

      // --- Chromatic Aberration (worsens with fear) ---
      float caStrength = 0.002 + fear * 0.006;
      float dist = distance(uv, vec2(0.5));
      vec2 caOffset = (uv - 0.5) * caStrength * dist;

      float r = texture2D(tDiffuse, uv + caOffset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - caOffset).b;

      vec3 color = vec3(r, g, b);

      // --- Warm color grading ---
      color *= vec3(1.04, 1.0, 0.94);

      // Desaturation deepens as sanity drains — the world goes grey.
      float luminance = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(luminance), color, 0.96 - fear * 0.55);

      // --- Film grain (surges when afraid, path-tracer noise feel) ---
      float noise = (grain(uv, time) - 0.5) * 0.05 * (1.0 + fear * 4.0);
      color += noise;

      // --- Vignette (closes in and pulses like a heartbeat when afraid) ---
      float pulse = fear * 0.08 * (0.5 + 0.5 * sin(time * 6.0));
      float vig = 1.0 - dist * (0.45 + fear * 1.1 + pulse);
      vig = smoothstep(0.0, 1.0, vig);
      color *= vig;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

// ============================================================================
// Create Post-Processing Pipeline
// ============================================================================

/**
 * Creates and configures the full post-processing pipeline.
 * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
 * @param {THREE.Scene} scene - The game scene
 * @param {THREE.Camera} camera - The game camera
 * @returns {{ composer: EffectComposer, backroomsPass: ShaderPass, bloomPass: UnrealBloomPass }}
 */
export function createPostProcessing(renderer, scene, camera) {
  // Build the composer pipeline
  const composer = new EffectComposer(renderer);

  // Base render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom pass — runs in linear HDR space (before tone mapping), so the
  // threshold of 1.0 only picks up emissive fixtures and hot highlights
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.35, // strength
    0.5,  // radius
    1.0   // threshold
  );
  composer.addPass(bloomPass);

  // Output pass — applies the renderer's tone mapping (ACES) and converts
  // linear -> sRGB. Replaces the old GammaCorrectionShader, which was
  // double-correcting on top of renderer.outputColorSpace.
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // Custom Backrooms atmosphere shader (grain, vignette, CA, color grading)
  // runs last, on the final display-ready image, like a film effect.
  const backroomsPass = new ShaderPass(BackroomsPostShader);
  composer.addPass(backroomsPass);

  return { composer, backroomsPass, bloomPass };
}
