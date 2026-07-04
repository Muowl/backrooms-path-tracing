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

  // Jumping
  if (keys.jump && player.onGround) {
    player.velocity.y = player.jumpForce;
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

    // Cap the player at water surface level with bob effect
    const waterLevel = poolBounds.waterY + player.height;
    if (obj.position.y < waterLevel && obj.position.y > groundLevel) {
      // Add gentle bobbing
      const bobAmount = Math.sin(clock.getElapsedTime() * 2.0) * 0.03;
      obj.position.y = Math.max(obj.position.y, waterLevel + bobAmount);
    }
  }

  if (obj.position.y <= groundLevel) {
    obj.position.y = groundLevel;
    player.velocity.y = 0;
    player.onGround = true;
  } else {
    // Check if we just walked off the edge into the pool
    if (!player.inPool && obj.position.y <= roomBounds.floorY + player.height) {
      obj.position.y = roomBounds.floorY + player.height;
      player.velocity.y = 0;
      player.onGround = true;
    }
  }
}
