/**
 * sanity.js — "Stay in the light" survival mechanic.
 *
 * The Backrooms punish the dark. Standing under a fluorescent fixture keeps
 * you sane; wandering into the unlit gaps drains a sanity meter. Hit zero and
 * you black out and wake up back under a light, shaken (partial sanity) — a
 * soft-fail that nudges you back toward safety instead of ending the run.
 *
 * Light level is sampled from the fixtures registered in `litFixtures`
 * (see lights.js). Flickering fixtures dim their own safe-zone in real time,
 * so a stuttering light is a false sense of security.
 */

import { sanity, litFixtures, player } from './config.js';
import { heartbeat } from './audio.js';

const DARK_THRESHOLD = 0.3; // light level below this drains sanity
const DRAIN_RATE = 7.0; // sanity/sec lost in total darkness
const REGEN_RATE = 16.0; // sanity/sec recovered in full light
const BLACKOUT_RECOVERY = 55; // sanity restored after a blackout

let heartbeatTimer = 0;
let blackoutFlash = 0; // 1 → 0, drives a white-out fade on the HUD

/**
 * Sample the light level at a world (x, z) position: the strongest safe-zone
 * contribution from any fixture, falling off linearly to its radius and
 * scaled by the fixture's live intensity (so flicker matters).
 */
export function lightLevelAt(x, z) {
  let level = 0;
  for (const f of litFixtures) {
    const dx = x - f.x;
    const dz = z - f.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const falloff = Math.max(0, 1 - dist / f.radius);
    if (falloff <= 0) continue;
    // Current intensity relative to nominal — a stuttering light contributes
    // less (or nothing) even if you're standing right under it.
    const liveMult = f.light ? Math.min(1, f.light.intensity / f.baseIntensity) : 1;
    const contrib = f.strength * falloff * liveMult;
    if (contrib > level) level = contrib;
  }
  return level;
}

/**
 * Advance the sanity meter one frame.
 * @param {number} delta - Frame time in seconds.
 * @param {THREE.Object3D} playerObj - The pointer-lock camera holder.
 * @param {() => void} [onBlackout] - Called when sanity bottoms out.
 */
export function updateSanity(delta, playerObj, onBlackout) {
  const p = playerObj.position;
  const light = lightLevelAt(p.x, p.z);

  if (light > DARK_THRESHOLD) {
    sanity.value = Math.min(sanity.max, sanity.value + REGEN_RATE * delta * light);
  } else {
    const darkness = 1 - light / DARK_THRESHOLD; // 0 (edge of light) → 1 (pitch black)
    sanity.value = Math.max(0, sanity.value - DRAIN_RATE * delta * darkness);
  }

  // Heartbeat quickens as sanity falls; silent while comfortably sane.
  const fear = 1 - sanity.value / sanity.max;
  if (fear > 0.45) {
    heartbeatTimer -= delta;
    if (heartbeatTimer <= 0) {
      heartbeat(fear);
      heartbeatTimer = 1.1 - fear * 0.6; // 0.5s..~0.75s between beats
    }
  } else {
    heartbeatTimer = 0;
  }

  // Blackout: teleport to the brightest fixture and recover partial sanity.
  if (sanity.value <= 0) {
    const spot = brightestFixture();
    if (spot) {
      playerObj.position.set(spot.x, player.height, spot.z);
      player.velocity.set(0, 0, 0);
      player.onGround = true;
    }
    sanity.value = BLACKOUT_RECOVERY;
    blackoutFlash = 1;
    if (onBlackout) onBlackout();
  }

  if (blackoutFlash > 0) {
    blackoutFlash = Math.max(0, blackoutFlash - delta * 1.5);
  }
}

/**
 * The brightest non-flickering fixture — a reliable safe respawn point.
 */
function brightestFixture() {
  let best = null;
  let bestScore = -1;
  for (const f of litFixtures) {
    const score = f.strength * f.radius;
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return best;
}

/** Normalized sanity 0..1 for shader/HUD feedback. */
export function getSanity01() {
  return sanity.value / sanity.max;
}

/** Current blackout white-out strength (1 → 0). */
export function getBlackoutFlash() {
  return blackoutFlash;
}

/** Reset sanity to full (used on a fresh run / win). */
export function resetSanity() {
  sanity.value = sanity.max;
  blackoutFlash = 0;
  heartbeatTimer = 0;
}
