import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
function readMesh(path) {
  const b = fs.readFileSync(path),
    n = b.readUInt32LE(12),
    j = JSON.parse(b.subarray(20, 20 + n)),
    binary = b.subarray(28 + n);
  const p = j.meshes[0].primitives[0];
  function array(i) {
    const a = j.accessors[i],
      v = j.bufferViews[a.bufferView],
      components = a.type === 'VEC3' ? 3 : 1,
      width = a.componentType === 5126 ? 4 : 2,
      stride = v.byteStride || components * width;
    const out =
      a.componentType === 5126
        ? new Float32Array(a.count * components)
        : new Uint16Array(a.count * components);
    for (let n = 0; n < a.count; n++)
      for (let c = 0; c < components; c++) {
        const offset =
          (v.byteOffset || 0) + (a.byteOffset || 0) + n * stride + c * width;
        out[n * components + c] =
          width === 4
            ? binary.readFloatLE(offset)
            : binary.readUInt16LE(offset);
      }
    return out;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    'position',
    new THREE.BufferAttribute(array(p.attributes.POSITION), 3),
  );
  g.setIndex(new THREE.BufferAttribute(array(p.indices), 1));
  g.computeBoundingBox();
  return new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  );
}
const terrain = readMesh('public/demo/living-island.glb');
const size = terrain.geometry.boundingBox.getSize(new THREE.Vector3());
terrain.scale.setScalar(11.8 / Math.max(size.x, size.z));
terrain.updateMatrixWorld(true);
const ray = new THREE.Raycaster(
  new THREE.Vector3(0, 10, 0),
  new THREE.Vector3(0, -1, 0),
);
const center = ray.intersectObject(terrain)[0];
assert.ok(center, 'terrain must have a central surface');
terrain.position.y = 0.035 - center.point.y;
terrain.updateMatrixWorld(true);
ray.set(new THREE.Vector3(0.25, 8, 3.1), new THREE.Vector3(0, -1, 0));
const hits = ray.intersectObject(terrain);
assert.ok(
  hits.some((h) => h.point.y < 1.1 && h.point.y > -0.8),
  'dog arrival must be grounded',
);
const dog = readMesh('public/demo/golden-dog-standing.glb');
const ds = dog.geometry.boundingBox.getSize(new THREE.Vector3());
assert.ok(
  ds.y / Math.max(ds.x, ds.z) > 0.7,
  'walking asset must be upright, not lying',
);
console.log(
  'Demo models valid; arrival surface height:',
  hits
    .slice(0, 3)
    .map((h) => h.point.y.toFixed(2))
    .join(', '),
);
