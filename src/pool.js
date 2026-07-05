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
      opacity: { value: 0.8 },
      waterColor: { value: new THREE.Color(0x2e4a34) }, // murky green
      fogColor: { value: new THREE.Color(0x2a2210) },
      fogDensity: { value: 0.015 },
      cameraPos: { value: new THREE.Vector3() },
      // World positions of the two nearest ceiling fixtures, for specular glints
      lightPos1: { value: new THREE.Vector3(14, 3.9, -5) },
      lightPos2: { value: new THREE.Vector3(4, 3.9, -12) },
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
      uniform vec3 lightPos1;
      uniform vec3 lightPos2;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      // Specular glint from a point light (Blinn-Phong on the wavy normal)
      float glint(vec3 lightPos, vec3 viewDir, vec3 normal) {
        vec3 lightDir = normalize(lightPos - vWorldPos);
        vec3 halfDir = normalize(lightDir + viewDir);
        return pow(max(dot(normal, halfDir), 0.0), 140.0);
      }

      void main() {
        // View direction
        vec3 viewDir = normalize(cameraPos - vWorldPos);

        // Perturb the vertex normal with high-frequency ripples so the
        // surface sparkles instead of reading as a smooth sheet
        vec3 normal = vNormal;
        normal.x += sin(vUv.x * 90.0 + time * 3.0) * 0.04
                  + sin(vUv.x * 47.0 - time * 2.2) * 0.03;
        normal.y += sin(vUv.y * 80.0 - time * 2.5) * 0.04
                  + sin((vUv.x + vUv.y) * 60.0 + time * 1.7) * 0.03;
        normal = normalize(normal);
        // vNormal is in the plane's local space where +Z is up; swizzle to world
        vec3 worldNormal = normalize(vec3(normal.x, normal.z, -normal.y));

        // Schlick fresnel (F0 = 0.02 for water)
        float cosTheta = max(dot(viewDir, worldNormal), 0.0);
        float fresnel = 0.02 + 0.98 * pow(1.0 - cosTheta, 5.0);

        // Fake ceiling reflection — matches the actual dark ceiling of the
        // room, so at grazing angles the water mirrors darkness rather
        // than turning milky. The fixture glints below add the highlights.
        vec3 reflectionColor = vec3(0.16, 0.13, 0.08);

        // Caustic-like shimmer pattern
        float shimmer = sin(vUv.x * 30.0 + time * 2.0) *
                        sin(vUv.y * 25.0 - time * 1.5) * 0.1 + 0.9;

        // Blend murky water body with reflection at glancing angles
        vec3 color = mix(waterColor * shimmer, reflectionColor, fresnel);

        // Specular glints from the two nearest ceiling fixtures
        float spec = glint(lightPos1, viewDir, worldNormal) * 0.7
                   + glint(lightPos2, viewDir, worldNormal) * 0.4;
        color += vec3(1.0, 0.95, 0.8) * spec;

        // Fog
        float dist = length(cameraPos - vWorldPos);
        float fogFactor = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
        color = mix(color, fogColor, fogFactor);

        // More opaque at glancing angles, spec highlights always visible
        float alpha = clamp(opacity + fresnel * 0.4 + spec * 0.5, 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
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

  // Referenced by the path tracing mode to swap in a physical material
  refs.waterMesh = waterMesh;
}

/**
 * Updates the water shader uniforms for animation.
 */
export function updateWater(clock, camera) {
  if (!refs.waterMaterial) return;
  refs.waterMaterial.uniforms.time.value = clock.getElapsedTime();
  refs.waterMaterial.uniforms.cameraPos.value.copy(camera.position);
}
