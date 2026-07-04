import * as THREE from 'three';

// ============================================================================
// Props (Boxes, Chairs)
// ============================================================================

/**
 * Adds atmospheric props: cardboard boxes and simple folding chairs.
 */
export function buildProps(scene) {
  // --- Cardboard boxes ---
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0x8b6914,
    roughness: 0.9,
    metalness: 0.0,
  });

  const boxConfigs = [
    { x: -15, z: -15, w: 1.0, h: 0.8, d: 0.7, ry: 0.3 },
    { x: -14.5, z: -14.2, w: 0.6, h: 0.5, d: 0.6, ry: -0.5 },
    { x: -15.5, z: -14.8, w: 0.8, h: 1.0, d: 0.8, ry: 0.1 },
    { x: 12, z: 15, w: 0.9, h: 0.7, d: 0.9, ry: 0.8 },
    { x: 13, z: 14.5, w: 0.5, h: 0.4, d: 0.5, ry: -0.2 },
  ];

  boxConfigs.forEach((bc) => {
    const geo = new THREE.BoxGeometry(bc.w, bc.h, bc.d);
    const mesh = new THREE.Mesh(geo, boxMat);
    mesh.position.set(bc.x, bc.h / 2, bc.z);
    mesh.rotation.y = bc.ry;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });

  // --- Simple folding chairs (constructed from thin box geometries) ---
  buildChair(scene, -10, 3, 0.4);
  buildChair(scene, 15, -10, -1.2);
}

/**
 * Builds a simple folding chair from box geometries.
 */
function buildChair(scene, x, z, rotation) {
  const chairGroup = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.4,
    metalness: 0.6,
  });
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x554433,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.03, 0.45),
    seatMat
  );
  seat.position.set(0, 0.5, 0);
  seat.castShadow = true;
  chairGroup.add(seat);

  // Back rest
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.03),
    seatMat
  );
  back.position.set(0, 0.75, -0.21);
  back.castShadow = true;
  chairGroup.add(back);

  // Legs (4 thin cylinders approximated with boxes)
  const legGeo = new THREE.BoxGeometry(0.03, 0.5, 0.03);
  const positions = [
    [-0.22, 0.25, 0.18],
    [0.22, 0.25, 0.18],
    [-0.22, 0.25, -0.18],
    [0.22, 0.25, -0.18],
  ];
  positions.forEach((pos) => {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(...pos);
    leg.castShadow = true;
    chairGroup.add(leg);
  });

  chairGroup.position.set(x, 0, z);
  chairGroup.rotation.y = rotation;
  scene.add(chairGroup);
}
