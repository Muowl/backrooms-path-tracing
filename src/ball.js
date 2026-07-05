import * as THREE from 'three';
import { ball, roomBounds, poolBounds, wallColliders } from './config.js';

// ============================================================================
// Ball (Throwable)
// ============================================================================

/**
 * Check if a position is inside the pool bounds.
 */
function isInPool(x, z) {
  return (
    x >= poolBounds.minX &&
    x <= poolBounds.maxX &&
    z >= poolBounds.minZ &&
    z <= poolBounds.maxZ
  );
}

/**
 * Creates the throwable red rubber ball with physics.
 */
export function buildBall(scene) {
  const ballGeo = new THREE.SphereGeometry(ball.radius, 32, 32);
  // Physical material with a light clearcoat reads as rubber with a
  // worn glossy skin under the fluorescent lights
  const ballMat = new THREE.MeshPhysicalMaterial({
    color: 0xb02a2a,
    roughness: 0.55,
    metalness: 0.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
  });

  ball.mesh = new THREE.Mesh(ballGeo, ballMat);
  ball.mesh.position.set(-3, ball.radius, 3);
  ball.mesh.castShadow = true;
  ball.mesh.receiveShadow = true;
  scene.add(ball.mesh);

  ball.velocity.set(0, 0, 0);
  ball.onGround = true;
}

// ============================================================================
// Ball Interaction
// ============================================================================

/**
 * Attempt to pick up the ball if player is close enough.
 */
export function tryPickupBall(controls) {
  if (!controls.isLocked || ball.held) return;

  const playerPos = controls.getObject().position;
  const dist = playerPos.distanceTo(ball.mesh.position);

  if (dist < 3.0) {
    ball.held = true;
    ball.velocity.set(0, 0, 0);
    // Attach ball to camera (visual, will follow in update)
  }
}

/**
 * Throw the held ball in the camera's look direction.
 */
export function throwBall(camera) {
  ball.held = false;
  ball.onGround = false;

  // Get camera forward direction
  const throwDir = new THREE.Vector3();
  camera.getWorldDirection(throwDir);

  const throwForce = 12.0;
  ball.velocity.copy(throwDir.multiplyScalar(throwForce));
  // Add slight upward arc
  ball.velocity.y += 2.0;

  // Release ball slightly in front of camera
  const camPos = camera.position.clone();
  ball.mesh.position.copy(camPos.add(throwDir.normalize().multiplyScalar(0.8)));
}

/**
 * Updates ball physics: gravity, bouncing, friction, wall collisions,
 * and water floating behavior.
 */
export function updateBall(delta, clock, camera) {
  if (!ball.mesh) return;

  // If ball is held, attach it to camera
  if (ball.held) {
    const camPos = camera.position.clone();
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    // Position ball in front and slightly below camera center
    ball.mesh.position.copy(
      camPos
        .clone()
        .add(camDir.multiplyScalar(0.8))
        .add(new THREE.Vector3(0, -0.2, 0))
    );
    return;
  }

  // Apply gravity
  ball.velocity.y += ball.gravity * delta;

  // Update position
  ball.mesh.position.x += ball.velocity.x * delta;
  ball.mesh.position.y += ball.velocity.y * delta;
  ball.mesh.position.z += ball.velocity.z * delta;

  // Check if ball is in pool area
  const ballInPool = isInPool(ball.mesh.position.x, ball.mesh.position.z);

  // Determine ground level for the ball
  let ballGround = roomBounds.floorY + ball.radius;
  if (ballInPool) {
    ballGround = poolBounds.floorY + ball.radius;

    // While below floor level, keep the ball inside the pool walls
    if (ball.mesh.position.y < roomBounds.floorY - ball.radius) {
      const p = ball.mesh.position;
      if (p.x < poolBounds.minX + ball.radius) { p.x = poolBounds.minX + ball.radius; ball.velocity.x *= -ball.restitution; }
      if (p.x > poolBounds.maxX - ball.radius) { p.x = poolBounds.maxX - ball.radius; ball.velocity.x *= -ball.restitution; }
      if (p.z < poolBounds.minZ + ball.radius) { p.z = poolBounds.minZ + ball.radius; ball.velocity.z *= -ball.restitution; }
      if (p.z > poolBounds.maxZ - ball.radius) { p.z = poolBounds.maxZ - ball.radius; ball.velocity.z *= -ball.restitution; }
    }

    // Buoyancy: a spring pushes the ball up toward its float height while
    // gravity pulls down. With stiffness 150, the rest point (spring force
    // = gravity) sits ~0.065m below floatY — half-submerged at the water
    // line. Splashing in overshoots and bobs back up naturally.
    const floatY = poolBounds.waterY + ball.radius * 0.4;
    if (ball.mesh.position.y < floatY) {
      ball.velocity.y += (floatY - ball.mesh.position.y) * 150.0 * delta;
      ball.velocity.y *= Math.max(0, 1 - 3.0 * delta);  // vertical drag
      ball.velocity.x *= Math.max(0, 1 - 1.5 * delta);  // water resistance
      ball.velocity.z *= Math.max(0, 1 - 1.5 * delta);
      ball.onGround = false;
    }
  }

  // Floor collision
  if (ball.mesh.position.y <= ballGround) {
    ball.mesh.position.y = ballGround;
    ball.velocity.y *= -ball.restitution;

    // Stop bouncing when velocity is very small
    if (Math.abs(ball.velocity.y) < 0.3) {
      ball.velocity.y = 0;
      ball.onGround = true;
    }

    // Ground friction
    ball.velocity.x *= ball.friction;
    ball.velocity.z *= ball.friction;
  }

  // Ceiling collision
  if (ball.mesh.position.y >= roomBounds.ceilingY - ball.radius) {
    ball.mesh.position.y = roomBounds.ceilingY - ball.radius;
    ball.velocity.y *= -ball.restitution;
  }

  // Wall collisions (room bounds)
  if (ball.mesh.position.x <= roomBounds.minX + ball.radius) {
    ball.mesh.position.x = roomBounds.minX + ball.radius;
    ball.velocity.x *= -ball.restitution;
  }
  if (ball.mesh.position.x >= roomBounds.maxX - ball.radius) {
    ball.mesh.position.x = roomBounds.maxX - ball.radius;
    ball.velocity.x *= -ball.restitution;
  }
  if (ball.mesh.position.z <= roomBounds.minZ + ball.radius) {
    ball.mesh.position.z = roomBounds.minZ + ball.radius;
    ball.velocity.z *= -ball.restitution;
  }
  if (ball.mesh.position.z >= roomBounds.maxZ - ball.radius) {
    ball.mesh.position.z = roomBounds.maxZ - ball.radius;
    ball.velocity.z *= -ball.restitution;
  }

  // Interior wall collisions for ball
  wallColliders.forEach((wall) => {
    const r = ball.radius;
    const p = ball.mesh.position;
    const expandedMinX = wall.minX - r;
    const expandedMaxX = wall.maxX + r;
    const expandedMinZ = wall.minZ - r;
    const expandedMaxZ = wall.maxZ + r;

    if (
      p.x > expandedMinX &&
      p.x < expandedMaxX &&
      p.z > expandedMinZ &&
      p.z < expandedMaxZ
    ) {
      const overlapLeft = p.x - expandedMinX;
      const overlapRight = expandedMaxX - p.x;
      const overlapFront = p.z - expandedMinZ;
      const overlapBack = expandedMaxZ - p.z;
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapFront, overlapBack);

      if (minOverlap === overlapLeft) {
        p.x = expandedMinX;
        ball.velocity.x *= -ball.restitution;
      } else if (minOverlap === overlapRight) {
        p.x = expandedMaxX;
        ball.velocity.x *= -ball.restitution;
      } else if (minOverlap === overlapFront) {
        p.z = expandedMinZ;
        ball.velocity.z *= -ball.restitution;
      } else {
        p.z = expandedMaxZ;
        ball.velocity.z *= -ball.restitution;
      }
    }
  });

  // Rolling resistance when on ground
  if (ball.onGround) {
    const rollingResistance = 0.96;
    ball.velocity.x *= rollingResistance;
    ball.velocity.z *= rollingResistance;

    // Stop completely when very slow
    if (
      Math.abs(ball.velocity.x) < 0.01 &&
      Math.abs(ball.velocity.z) < 0.01
    ) {
      ball.velocity.x = 0;
      ball.velocity.z = 0;
    }
  }

  // Spin the ball mesh based on velocity for visual feedback
  const speed = ball.velocity.length();
  if (speed > 0.05) {
    ball.mesh.rotation.x += ball.velocity.z * delta * 5;
    ball.mesh.rotation.z -= ball.velocity.x * delta * 5;
  }
}
