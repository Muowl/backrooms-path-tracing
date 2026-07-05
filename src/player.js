import * as THREE from 'three';
import { player, keys, roomBounds, poolBounds, wallColliders } from './config.js';

/**
 * Check if a position is inside the pool bounds.
 */
export function isInPool(x, z) {
  return (
    x >= poolBounds.minX &&
    x <= poolBounds.maxX &&
    z >= poolBounds.minZ &&
    z <= poolBounds.maxZ
  );
}

/**
 * Check player collision against a wall collider AABB.
 * Returns the corrected position.
 */
export function resolveWallCollision(pos, radius) {
  const corrected = pos.clone();

  // Room boundary collision
  corrected.x = Math.max(roomBounds.minX + radius, Math.min(roomBounds.maxX - radius, corrected.x));
  corrected.z = Math.max(roomBounds.minZ + radius, Math.min(roomBounds.maxZ - radius, corrected.z));

  // Interior wall collisions (simple AABB push-out)
  wallColliders.forEach((wall) => {
    const expandedMinX = wall.minX - radius;
    const expandedMaxX = wall.maxX + radius;
    const expandedMinZ = wall.minZ - radius;
    const expandedMaxZ = wall.maxZ + radius;

    if (
      corrected.x > expandedMinX &&
      corrected.x < expandedMaxX &&
      corrected.z > expandedMinZ &&
      corrected.z < expandedMaxZ
    ) {
      // Find the smallest penetration axis and push out
      const overlapLeft = corrected.x - expandedMinX;
      const overlapRight = expandedMaxX - corrected.x;
      const overlapFront = corrected.z - expandedMinZ;
      const overlapBack = expandedMaxZ - corrected.z;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapFront, overlapBack);

      if (minOverlap === overlapLeft) {
        corrected.x = expandedMinX;
      } else if (minOverlap === overlapRight) {
        corrected.x = expandedMaxX;
      } else if (minOverlap === overlapFront) {
        corrected.z = expandedMinZ;
      } else {
        corrected.z = expandedMaxZ;
      }
    }
  });

  return corrected;
}

/**
 * Updates player movement, jumping, and pool interaction each frame.
 */
export function updatePlayer(delta, controls, camera, clock) {
  if (!controls.isLocked) return;

  const obj = controls.getObject();
  const currentSpeed = keys.sprint ? player.sprintSpeed : player.speed;

  // Determine desired movement direction (acceleration-based)
  const moveDir = new THREE.Vector3();
  if (keys.forward) moveDir.z -= 1;
  if (keys.backward) moveDir.z += 1;
  if (keys.left) moveDir.x -= 1;
  if (keys.right) moveDir.x += 1;
  moveDir.normalize();

  // Transform movement direction to world space based on camera yaw
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const worldMove = new THREE.Vector3();
  worldMove.addScaledVector(forward, -moveDir.z);
  worldMove.addScaledVector(right, moveDir.x);

  // Pool speed reduction
  const speedMultiplier = player.inPool ? 0.5 : 1.0;

  // Acceleration / deceleration
  const acceleration = 20.0;
  const deceleration = 10.0;

  if (worldMove.length() > 0) {
    player.velocity.x += worldMove.x * acceleration * delta * speedMultiplier;
    player.velocity.z += worldMove.z * acceleration * delta * speedMultiplier;
  } else {
    // Decelerate
    player.velocity.x *= Math.max(0, 1 - deceleration * delta);
    player.velocity.z *= Math.max(0, 1 - deceleration * delta);
  }

  // Clamp horizontal speed
  const hSpeed = Math.sqrt(
    player.velocity.x ** 2 + player.velocity.z ** 2
  );
  const maxSpeed = currentSpeed * speedMultiplier;
  if (hSpeed > maxSpeed) {
    const scale = maxSpeed / hSpeed;
    player.velocity.x *= scale;
    player.velocity.z *= scale;
  }

  // Jumping — a swim-jump from the water needs extra force to clear the
  // pool edge (the eye line sits ~1.6m below standing height while swimming)
  if (keys.jump && player.onGround) {
    const swimming =
      player.inPool &&
      obj.position.y < roomBounds.floorY + player.height - 0.05;
    player.velocity.y = swimming ? 6.8 : player.jumpForce;
    player.onGround = false;
    keys.jump = false; // Consume the jump input
  }

  // Gravity
  if (!player.onGround) {
    player.velocity.y += -9.8 * delta;
  }

  // Apply velocity to position
  obj.position.x += player.velocity.x * delta;
  obj.position.z += player.velocity.z * delta;
  obj.position.y += player.velocity.y * delta;

  // Wall collision (treat player as a sphere of radius 0.3)
  const corrected = resolveWallCollision(obj.position, 0.3);
  obj.position.x = corrected.x;
  obj.position.z = corrected.z;

  // Check if player is in pool
  player.inPool = isInPool(obj.position.x, obj.position.z);

  // Ground / pool floor collision
  let groundLevel = roomBounds.floorY + player.height;

  if (player.inPool) {
    // In the pool, the effective ground is the pool floor
    groundLevel = poolBounds.floorY + player.height;

    // While submerged (feet below floor level), keep the player inside the
    // pool walls — otherwise they could walk through tile into the void
    // under the carpet
    if (obj.position.y < roomBounds.floorY + player.height - 0.05) {
      obj.position.x = Math.max(poolBounds.minX + 0.3, Math.min(poolBounds.maxX - 0.3, obj.position.x));
      obj.position.z = Math.max(poolBounds.minZ + 0.3, Math.min(poolBounds.maxZ - 0.3, obj.position.z));
    }

    // Swim: buoyancy springs the camera to just above the water plane
    // (half-submerged — eyes ~0.3m over the water, not standing height),
    // with water drag and a gentle bob. onGround stays true at the surface
    // so Space performs the swim-jump toward the edge.
    const swimLevel =
      poolBounds.waterY + 0.3 + Math.sin(clock.getElapsedTime() * 2.0) * 0.05;
    if (obj.position.y <= swimLevel + 0.02) {
      player.velocity.y += (swimLevel - obj.position.y) * 30.0 * delta;
      // Asymmetric drag: sinking is damped hard, rising keeps momentum so
      // the swim-jump can clear the pool edge
      const drag = player.velocity.y < 0 ? 6.0 : 2.0;
      player.velocity.y *= Math.max(0, 1 - drag * delta);
      player.onGround = true;
    } else if (obj.position.y < poolBounds.waterY + player.height) {
      // Body in the water but above swim level: gravity must stay active
      // (onGround = false) so the player sinks down to the swim level, and
      // drag only fights downward motion — a rising swim-jump keeps its
      // momentum to clear the pool edge
      if (player.velocity.y < 0) {
        player.velocity.y *= Math.max(0, 1 - 3.0 * delta);
      }
      player.onGround = false;
    }
  }

  if (obj.position.y <= groundLevel) {
    obj.position.y = groundLevel;
    // Only cancel downward velocity — zeroing upward velocity here would
    // fight the buoyancy spring and pin the player to the pool floor
    if (player.velocity.y < 0) player.velocity.y = 0;
    player.onGround = true;
  } else if (!player.inPool || obj.position.y > poolBounds.waterY + player.height + 0.05) {
    // Nothing under the player (walked off the pool edge or mid-jump):
    // let gravity take over
    player.onGround = false;
  }
}
