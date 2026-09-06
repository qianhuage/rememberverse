import * as THREE from 'three';

/** Lightweight quadruped deformation rig for the neutral standing demo asset. */
export function rigDog(model: THREE.Group) {
  model.updateMatrixWorld(true);
  const group = new THREE.Group();
  const box = new THREE.Box3().setFromObject(model),
    size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const yaw = size.x > size.z ? Math.PI / 2 : 0;
  const normalizer = new THREE.Matrix4()
    .makeRotationY(yaw)
    .multiply(
      new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z),
    );
  const parts: THREE.Mesh[] = [];
  model.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      g.applyMatrix4(normalizer);
      const m = new THREE.Mesh(
        g,
        (o.material as THREE.MeshStandardMaterial).clone(),
      );
      parts.push(m);
      group.add(m);
    }
  });
  let upperZ = 0,
    count = 0;
  for (const m of parts) {
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) > size.y * 0.72) {
        upperZ += p.getZ(i);
        count++;
      }
    }
  }
  const reverse = count && upperZ / count < 0;
  const length = Math.max(size.x, size.z),
    scale = 1.65 / length;
  const uniforms = {
    dogTime: { value: 0 },
    dogMove: { value: 0 },
    dogRun: { value: 0 },
  };
  for (const m of parts) {
    if (reverse) m.geometry.rotateY(Math.PI);
    m.geometry.scale(scale, scale, scale);
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader =
        'uniform float dogTime; uniform float dogMove; uniform float dogRun;\n' +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float legMask=1.0-smoothstep(0.42,0.68,position.y);
        float side=position.x>0.0?1.0:-1.0;
        float front=position.z>0.0?1.0:-1.0;
        float phase=dogTime*mix(8.0,13.0,dogRun)+(side*front>0.0?0.0:3.14159265);
        float angle=sin(phase)*0.48*dogMove*legMask;
        float pivotY=0.60;
        float pivotZ=front*0.43;
        vec2 limb=vec2(position.y-pivotY,position.z-pivotZ);
        transformed.y=pivotY+cos(angle)*limb.x-sin(angle)*limb.y;
        transformed.z=pivotZ+sin(angle)*limb.x+cos(angle)*limb.y;
        transformed.y+=abs(sin(phase))*0.02*dogMove;
        float head=smoothstep(0.6,0.9,position.y)*smoothstep(0.12,0.4,position.z);
        transformed.x+=sin(dogTime*1.5)*0.018*head;
        float tail=smoothstep(0.6,0.9,position.y)*(1.0-smoothstep(-0.5,-0.3,position.z));
        transformed.x+=sin(dogTime*5.0)*0.075*tail;
        transformed.y+=sin(dogTime*2.0)*0.004;
      `,
      );
    };
    mat.customProgramCacheKey = () => 'golden-dog-gait-v1';
    m.castShadow = true;
    m.receiveShadow = true;
    const depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
    });
    depth.onBeforeCompile = mat.onBeforeCompile;
    depth.customProgramCacheKey = mat.customProgramCacheKey;
    m.customDepthMaterial = depth;
  }
  return {
    object: group,
    update(time: number, moving: boolean, running: boolean) {
      uniforms.dogTime.value = time;
      uniforms.dogMove.value = THREE.MathUtils.lerp(
        uniforms.dogMove.value,
        moving ? 1 : 0,
        0.14,
      );
      uniforms.dogRun.value = running ? 1 : 0;
    },
  };
}
