import { keys, ball } from './config.js';
import { tryPickupBall, throwBall } from './ball.js';

// ============================================================================
// Input Handling
// ============================================================================

/**
 * Sets up all keyboard and mouse input event listeners.
 *
 * `handlers` collects one-shot actions that need dependencies owned by the
 * main module (renderer, audio), keeping all key handling in one place
 * instead of scattering extra `keydown` listeners across the codebase:
 *   - onTogglePathTracing() — bound to P
 *   - onToggleMute()        — bound to M
 */
export function setupInput(controls, camera, handlers = {}) {
  document.addEventListener('keydown', (e) => {
    // Ignore auto-repeat so held keys don't re-fire one-shot actions.
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = true;
        break;
      case 'Space':
        if (!e.repeat) keys.jump = true;
        break;
      case 'KeyE':
        if (!e.repeat) tryPickupBall(controls);
        break;
      case 'KeyP':
        if (!e.repeat) handlers.onTogglePathTracing?.();
        break;
      case 'KeyM':
        if (!e.repeat) handlers.onToggleMute?.();
        break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = false;
        break;
      case 'Space':
        keys.jump = false;
        break;
    }
  });

  // Throw ball on click when holding it
  document.addEventListener('mousedown', () => {
    if (controls.isLocked && ball.held) {
      throwBall(camera);
    }
  });
}
