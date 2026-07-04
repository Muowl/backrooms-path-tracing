import * as THREE from 'three';
import { poolBounds, refs } from './config.js';
import { createPoolTileTexture } from './textures.js';

// ============================================================================
// Pool Construction
// ============================================================================

/**
 * Builds a rectangular swimming pool recessed into the floor with
 * tiled walls and an animated water surface.
 */
export function buildPool(scene) {
  const poolTileTex = createPoolTileTexture();
  const tileMat = new THREE.MeshStandardMaterial({
    map: poolTileTex,
    roughness: 0.4,
    metalness: 0.1,
  });

  const poolW = poolBounds.maxX - poolBounds.minX; // 8
  const poolD = poolBounds.maxZ - poolBounds.minZ; // 6
  const poolDepth = poolBounds.depth; // 2
  const poolCenterX = (poolBounds.minX + poolBounds.maxX) / 2; // 8
  const poolCenterZ = (poolBounds.minZ + poolBounds.maxZ) / 2; // -5

  // Pool floor
  const poolFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(poolW, poolD),
    tileMat
  );
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(poolCenterX, poolBounds.floorY, poolCenterZ);
  poolFloor.receiveShadow = true;
  scene.add(poolFloor);

  // Pool walls (4 inner walls)
  // North wall (closer to z = -8)
  const poolWallNorth = new THREE.Mesh(
    new THREE.PlaneGeometry(poolW, poolDepth),
    tileMat
  );
  poolWallNorth.position.set(poolCenterX, -poolDepth / 2, poolBounds.minZ);
  poolWallNorth.receiveShadow = true;
  scene.add(poolWallNorth);

  // South wall (closer to z = -2)
  const poolWallSouth = new THREE.Mesh(
    new THREE.PlaneGeometry(poolW, poolDepth),
    tileMat
  );
  poolWallSouth.position.set(poolCenterX, -poolDepth / 2, poolBounds.maxZ);
  poolWallSouth.rotation.y = Math.PI;
  poolWallSouth.receiveShadow = true;
  scene.add(poolWallSouth);

  // East wall (closer to x = 12)
  const poolWallEast = new THREE.Mesh(
    new THREE.PlaneGeometry(poolD, poolDepth),
    tileMat
  );
  poolWallEast.position.set(poolBounds.maxX, -poolDepth / 2, poolCenterZ);
  poolWallEast.rotation.y = -Math.PI / 2;
  poolWallEast.receiveShadow = true;
  scene.add(poolWallEast);

  // West wall (closer to x = 4)
  const poolWallWest = new THREE.Mesh(
    new THREE.PlaneGeometry(poolD, poolDepth),
    tileMat
  );
  poolWallWest.position.set(poolBounds.minX, -poolDepth / 2, poolCenterZ);
  poolWallWest.rotation.y = Math.PI / 2;
  poolWallWest.receiveShadow = true;
  scene.add(poolWallWest);

  // Pool rim (raised edge around the pool)
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xb0a888,
    roughness: 0.5,
    metalness: 0.1,
  });
  const rimThickness = 0.3;
  const rimHeight = 0.15;

  // North rim
  const rimN = new THREE.Mesh(
    new THREE.BoxGeometry(poolW + rimThickness * 2, rimHeight, rimThickness),
    rimMat
  );
  rimN.position.set(poolCenterX, rimHeight / 2, poolBounds.minZ - rimThickness / 2);
  rimN.receiveShadow = true;
  rimN.castShadow = true;
  scene.add(rimN);

  // South rim
  const rimS = new THREE.Mesh(
    new THREE.BoxGeometry(poolW + rimThickness * 2, rimHeight, rimThickness),
    rimMat
  );
  rimS.position.set(poolCenterX, rimHeight / 2, poolBounds.maxZ + rimThickness / 2);
  rimS.receiveShadow = true;
  rimS.castShadow = true;
  scene.add(rimS);

  // East rim
  const rimE = new THREE.Mesh(
    new THREE.BoxGeometry(rimThickness, rimHeight, poolD),
    rimMat
  );
  rimE.position.set(poolBounds.maxX + rimThickness / 2, rimHeight / 2, poolCenterZ);
  rimE.receiveShadow = true;
  rimE.castShadow = true;
  scene.add(rimE);

  // West rim
  const rimW = new THREE.Mesh(
    new THREE.BoxGeometry(rimThickness, rimHeight, poolD),
    rimMat
  );
  rimW.position.set(poolBounds.minX - rimThickness / 2, rimHeight / 2, poolCenterZ);
  rimW.receiveShadow = true;
  rimW.castShadow = true;
  scene.add(rimW);

  // --- Water surface ---
  buildWater(scene, poolW, poolD, poolCenterX, poolCenterZ);

  // Store reference for update function
  refs.waterMaterial = waterMaterial;
}

/**
 * Creates the animated water surface with a custom ShaderMaterial.
 * Uses vertex displacement for waves and a murky yellow-green color
 * with semi-transparency and reflective shimmer.
 */
let waterMaterial = null;

function buildWater(scene, width, depth, cx, cz) {
  const waterGeo = new THREE.PlaneGeometry(width, depth, 64, 64);

  waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      opacity: { value: 0.6 },
      waterColor: { value: new THREE.Color(0x5a6a30) }, // murky yellow-green
      fogColor: { value: new THREE.Color(0x2a2210) },
      fogDensity: { value: 0.015 },
      cameraPos: { value: new THREE.Vector3() },
    },
    vertexShader: /* glsl */ `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Multiple sine wave displacement for realistic water
        float wave1 = sin(pos.x * 2.0 + time * 1.5) * 0.03;
        float wave2 = sin(pos.y * 3.0 + time * 2.0) * 0.02;
        float wave3 = sin((pos.x + pos.y) * 1.5 + time * 1.0) * 0.025;
        float wave4 = sin(pos.x * 5.0 - time * 3.0) * 0.01;

        pos.z += wave1 + wave2 + wave3 + wave4;

        // Compute displaced normal for lighting
        float dx = cos(pos.x * 2.0 + time * 1.5) * 2.0 * 0.03
                  + cos((pos.x + pos.y) * 1.5 + time * 1.0) * 1.5 * 0.025
                  + cos(pos.x * 5.0 - time * 3.0) * 5.0 * 0.01;
        float dy = cos(pos.y * 3.0 + time * 2.0) * 3.0 * 0.02
                  + cos((pos.x + pos.y) * 1.5 + time * 1.0) * 1.5 * 0.025;
        vNormal = normalize(vec3(-dx, -dy, 1.0));

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform float opacity;
      uniform vec3 waterColor;
      uniform vec3 fogColor;
      uniform float fogDensity;
      uniform vec3 cameraPos;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      void main() {
        // View direction
        vec3 viewDir = normalize(cameraPos - vWorldPos);

        // Fresnel effect: more reflective at glancing angles
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

        // Fake reflection color (ceiling light reflection)
        vec3 reflectionColor = vec3(0.9, 0.85, 0.6);

        // Caustic-like shimmer pattern
        float shimmer = sin(vUv.x * 30.0 + time * 2.0) *
                        sin(vUv.y * 25.0 - time * 1.5) * 0.1 + 0.9;

        // Blend water color with reflection based on fresnel
        vec3 color = mix(waterColor * shimmer, reflectionColor, fresnel * 0.4);

        // Slight color variation with depth
        color += vec3(0.02, 0.03, 0.0) * sin(time * 0.5);

        // Fog
        float dist = length(cameraPos - vWorldPos);
        float fogFactor = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
        color = mix(color, fogColor, fogFactor);

        gl_FragColor = vec4(color, opacity + fresnel * 0.2);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(cx, poolBounds.waterY, cz);
  scene.add(waterMesh);
}

/**
 * Updates the water shader uniforms for animation.
 */
export function updateWater(clock, camera) {
  if (!refs.waterMaterial) return;
  refs.waterMaterial.uniforms.time.value = clock.getElapsedTime();
  refs.waterMaterial.uniforms.cameraPos.value.copy(camera.position);
}
