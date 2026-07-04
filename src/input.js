import { keys, ball } from './config.js';
import { tryPickupBall } from './ball.js';
import { throwBall } from './ball.js';

// ============================================================================
// Input Handling
// ============================================================================

/**
 * Sets up all keyboard and mouse input event listeners.
 */
export function setupInput(controls, camera) {
  document.addEventListener('keydown', (e) => {
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
        keys.jump = true;
        break;
      case 'KeyE':
        tryPickupBall(controls);
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
  document.addEventListener('mousedown', (e) => {
    if (controls.isLocked && ball.held) {
      throwBall(camera);
    }
  });
}
