import * as THREE from 'three';

/** Articulated, photo-inspired demo companion. All limbs are independent joints. */
export function createDog() {
  const dog = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({
    color: '#b77a36',
    roughness: 0.95,
  });
  const light = new THREE.MeshStandardMaterial({
    color: '#d6a55e',
    roughness: 1,
  });
  const cream = new THREE.MeshStandardMaterial({
    color: '#e3c99e',
    roughness: 1,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#674121',
    roughness: 1,
  });
  const nose = new THREE.MeshStandardMaterial({
    color: '#211e1b',
    roughness: 0.4,
  });
  const white = new THREE.MeshStandardMaterial({
    color: '#f5e9d5',
    roughness: 0.8,
  });
  const sphere = new THREE.SphereGeometry(1, 24, 18);
  function part(
    parent: THREE.Object3D,
    material: THREE.Material,
    position: number[],
    scale: number[],
  ) {
    const m = new THREE.Mesh(sphere, material);
    m.position.set(...(position as [number, number, number]));
    m.scale.set(...(scale as [number, number, number]));
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const torso = new THREE.Group();
  dog.add(torso);
  part(torso, coat, [0, 0.62, 0], [0.29, 0.34, 0.5]);
  part(torso, light, [0, 0.72, 0.27], [0.3, 0.37, 0.27]);
  part(torso, cream, [0, 0.58, 0.41], [0.22, 0.25, 0.08]);
  const head = new THREE.Group();
  head.position.set(0, 0.98, 0.36);
  torso.add(head);
  part(head, light, [0, 0, 0], [0.265, 0.26, 0.255]);
  part(head, coat, [0, 0.1, -0.02], [0.25, 0.2, 0.2]);
  part(head, cream, [0, -0.085, 0.2], [0.17, 0.13, 0.16]);
  part(head, nose, [0, -0.045, 0.327], [0.085, 0.063, 0.045]);
  for (const side of [-1, 1]) {
    const ear = part(
      head,
      dark,
      [side * 0.2, 0.19, -0.01],
      [0.105, 0.14, 0.09],
    );
    ear.rotation.z = side * -0.45;
    part(head, coat, [side * 0.19, 0.23, -0.035], [0.1, 0.1, 0.075]);
    part(head, nose, [side * 0.125, 0.035, 0.205], [0.043, 0.032, 0.026]);
    part(head, white, [side * 0.117, 0.047, 0.226], [0.01, 0.009, 0.008]);
    const brow = part(
      head,
      coat,
      [side * 0.127, 0.08, 0.19],
      [0.075, 0.035, 0.04],
    );
    brow.rotation.z = side * 0.2;
  }
  const legs: THREE.Group[] = [];
  for (const z of [0.29, -0.31])
    for (const side of [-1, 1]) {
      const joint = new THREE.Group();
      joint.position.set(side * 0.205, 0.58, z);
      dog.add(joint);
      part(joint, coat, [0, -0.16, 0], [0.105, 0.24, 0.11]);
      part(joint, light, [0, -0.36, 0.015], [0.069, 0.16, 0.075]);
      part(joint, cream, [0, -0.48, 0.055], [0.095, 0.07, 0.13]);
      part(joint, white, [0, -0.49, 0.13], [0.085, 0.048, 0.055]);
      legs.push(joint);
    }
  const tail = new THREE.Group();
  tail.position.set(0, 0.72, -0.42);
  torso.add(tail);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, 0.13, -0.2),
    new THREE.Vector3(0.13, 0.36, -0.23),
    new THREE.Vector3(0.06, 0.47, -0.07),
    new THREE.Vector3(0, 0.35, 0.05),
  ]);
  const curl = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 28, 0.08, 10, false),
    light,
  );
  curl.castShadow = true;
  tail.add(curl);
  // A layered ruff gives the broad, fluffy silhouette in the reference.
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 110; i++) {
    const a = random() * Math.PI * 2,
      z = (random() - 0.5) * 0.7;
    const tuft = part(
      torso,
      i % 3 ? light : coat,
      [Math.cos(a) * 0.255, 0.66 + Math.sin(a) * 0.29, z],
      [0.05, 0.065, 0.09],
    );
    tuft.rotation.z = a;
  }
  return {
    object: dog,
    update(time: number, moving: boolean, running: boolean) {
      const phase = time * (running ? 13 : 8);
      legs.forEach((leg, i) => {
        const target = moving
          ? Math.sin(phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.48
          : 0;
        leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, target, 0.24);
      });
      torso.position.y = moving
        ? Math.abs(Math.sin(phase)) * 0.018
        : Math.sin(time * 2) * 0.006;
      head.rotation.y = moving
        ? Math.sin(time * 2) * 0.04
        : Math.sin(time * 0.7) * 0.16;
      head.rotation.x = moving ? 0 : Math.sin(time * 1.1) * 0.045;
      tail.rotation.z = Math.sin(time * (moving ? 8 : 4)) * 0.28;
    },
  };
}
