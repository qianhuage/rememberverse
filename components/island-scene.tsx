'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDog } from './dog-companion';
import { rigDog } from './rig-dog';
import { route, walkable, type Point } from '@/lib/island-navigation';
import type { Island } from '@/lib/types';
export default function IslandScene({
  island,
  candles = 0,
  flowers = 0,
  modelUrl,
  characterUrl,
  view = 'orbit',
}: {
  island: Island;
  candles?: number;
  flowers?: number;
  modelUrl?: string;
  characterUrl?: string;
  view?: string;
}) {
  const host = useRef<HTMLDivElement>(null),
    [failed, setFailed] = useState(false);
  const [characterError, setCharacterError] = useState(false);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    if (!host.current) return;
    setCharacterError(false);
    const el = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setFailed(true);
      return;
    }
    let disposed = false;
    const night = island.theme === 'starlight';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(night ? '#202941' : '#d8e7eb');
    scene.fog = new THREE.Fog(night ? '#202941' : '#d8e7eb', 28, 95);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = night ? 1.05 : 0.88;
    el.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.position.set(12, 9, 15);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.25;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    scene.add(
      new THREE.HemisphereLight(
        night ? '#b7caff' : '#eaf7ff',
        night ? '#18202f' : '#877451',
        1.3,
      ),
    );
    const sun = new THREE.DirectionalLight(
      night ? '#9ebeff' : '#fff0cd',
      night ? 2 : 2.8,
    );
    sun.position.set(-8, 15, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -12,
      right: 12,
      top: 12,
      bottom: -12,
    });
    sun.shadow.bias = -0.0002;
    scene.add(sun);
    const stone = new THREE.MeshStandardMaterial({
        color: '#d4c7a8',
        roughness: 0.85,
      }),
      marble = new THREE.MeshStandardMaterial({
        color: '#efece4',
        roughness: 0.25,
        metalness: 0.06,
      }),
      gold = new THREE.MeshStandardMaterial({
        color: '#b69a55',
        metalness: 0.85,
        roughness: 0.24,
      }),
      grass = new THREE.MeshStandardMaterial({
        color: island.theme === 'coast' ? '#9ca97d' : '#6c8760',
        roughness: 1,
      });
    const root = new THREE.Group();
    scene.add(root);
    function mesh(
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      parent: THREE.Object3D = root,
    ) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }
    let seed = 123;
    for (const c of island.name) seed += c.charCodeAt(0);
    function random() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    const rockGeo = new THREE.CylinderGeometry(5.9, 3.8, 3, 48, 5);
    const pos = rockGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i),
        y = pos.getY(i);
      const r =
        1 +
        0.05 * Math.sin(Math.atan2(z, x) * 7) +
        0.035 * Math.sin(y * 6 + x * 3);
      pos.setXYZ(i, x * r, y, z * r);
    }
    rockGeo.computeVertexNormals();
    mesh(rockGeo, stone, 0, -1.7, 0);
    const meadow = mesh(
      new THREE.CylinderGeometry(5.86, 5.92, 0.22, 96),
      grass,
      0,
      -0.08,
      0,
    );
    // Irregular moss patches soften the cliff edge without blocking the meadow.
    const mossMat = new THREE.MeshStandardMaterial({
      color: '#547e3d',
      roughness: 1,
    });
    for (let i = 0; i < 85; i++) {
      const a = random() * Math.PI * 2,
        r = 5.1 + random() * 0.55;
      const rock = mesh(
        new THREE.IcosahedronGeometry(0.22 + random() * 0.42, 1),
        i % 3 ? mossMat : stone,
        Math.cos(a) * r,
        -0.08,
        Math.sin(a) * r,
      );
      rock.scale.set(1, 0.5, 1);
    }
    // Native 3D terrain, memorial architecture, and keepsake interactions.
    for (let i = 0; i < 26; i++) {
      const a = random() * Math.PI * 2,
        r = 5.35 + random() * 0.5;
      const m = mesh(
        new THREE.DodecahedronGeometry(0.5 + random() * 0.6, 0),
        stone,
        Math.cos(a) * r,
        -0.6 - random() * 1.7,
        Math.sin(a) * r,
      );
      m.scale.set(1, 1.8, 1);
      m.rotation.set(random(), random(), random());
    }
    for (let i = 0; i < 22; i++) {
      const z = 4.7 - i * 0.35,
        x = Math.sin(i * 0.16) * 1.15;
      const m = mesh(
        new THREE.CylinderGeometry(0.36, 0.4, 0.09, 7),
        marble,
        x,
        0.08,
        z,
      );
      m.scale.z = 0.77;
      m.rotation.y = random();
    }
    const water = mesh(
      new THREE.CircleGeometry(1.45, 64),
      new THREE.MeshPhysicalMaterial({
        color: night ? '#425e90' : '#719eac',
        metalness: 0.45,
        roughness: 0.1,
        clearcoat: 1,
      }),
      -2.6,
      0.06,
      0.5,
    );
    water.rotation.x = -Math.PI / 2;
    water.scale.set(1, 0.72, 1);
    const pondRing = mesh(
      new THREE.TorusGeometry(1.48, 0.09, 8, 64),
      marble,
      -2.6,
      0.06,
      0.5,
    );
    pondRing.rotation.x = -Math.PI / 2;
    pondRing.scale.y = 0.72;
    // A small classical memorial hall, open to the garden.
    mesh(new THREE.CylinderGeometry(1.8, 1.95, 0.3, 48), marble, 1, 0.15, -2.3);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 2.2, 16),
        marble,
        1 + Math.cos(a) * 1.42,
        1.35,
        -2.3 + Math.sin(a) * 1.42,
      );
      mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.16, 16),
        marble,
        1 + Math.cos(a) * 1.42,
        2.45,
        -2.3 + Math.sin(a) * 1.42,
      );
    }
    mesh(
      new THREE.CylinderGeometry(1.85, 1.85, 0.2, 48),
      marble,
      1,
      2.58,
      -2.3,
    );
    const dome = mesh(
      new THREE.SphereGeometry(1.72, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      marble,
      1,
      2.67,
      -2.3,
    );
    dome.scale.y = 0.65;
    mesh(new THREE.SphereGeometry(0.13, 20, 12), gold, 1, 3.9, -2.3);
    // A polished memorial stone with orbiting gold and pearl.
    const sculpture = new THREE.Group();
    sculpture.position.set(1, 0.35, -2.3);
    root.add(sculpture);
    mesh(
      new THREE.CylinderGeometry(0.58, 0.62, 0.16, 40),
      marble,
      0,
      0,
      0,
      sculpture,
    );
    const shape = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.35, 0.115, 120, 18, 2, 3),
      marble,
    );
    shape.scale.set(0.8, 1.65, 0.8);
    shape.position.y = 0.8;
    sculpture.add(shape);
    const orbit = mesh(
      new THREE.TorusGeometry(0.64, 0.012, 6, 80),
      gold,
      0,
      0.85,
      0,
      sculpture,
    );
    orbit.rotation.x = 1.2;
    orbit.rotation.z = 0.3;
    mesh(
      new THREE.SphereGeometry(0.16, 24, 16),
      new THREE.MeshStandardMaterial({
        color: 'white',
        emissive: '#ffeac3',
        emissiveIntensity: 0.8,
      }),
      0,
      0.22,
      0.46,
      sculpture,
    );
    function cypress(x: number, z: number, scale = 1) {
      const g = new THREE.Group();
      root.add(g);
      g.position.set(x, 0, z);
      g.scale.setScalar(scale);
      mesh(
        new THREE.CylinderGeometry(0.07, 0.14, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: '#625644' }),
        0,
        0.6,
        0,
        g,
      );
      for (let k = 0; k < 5; k++) {
        const m = mesh(
          new THREE.SphereGeometry(0.4 - k * 0.045, 12, 10),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(
              0.27 + random() * 0.025,
              0.2,
              0.2 + random() * 0.1,
            ),
            roughness: 1,
          }),
          0,
          1 + k * 0.36,
          0,
          g,
        );
        m.scale.set(0.8, 2, 0.8);
      }
    }
    [
      [-4, -2],
      [-3.3, -3.5],
      [3.7, -2.8],
      [4.3, -1.3],
      [3.8, 1.8],
    ].forEach(([x, z]) => cypress(x, z, 0.7 + random() * 0.3));
    // Blossom tree retained from the user's personal island design.
    const tree = new THREE.Group();
    tree.position.set(-2.5, 0, -2.2);
    root.add(tree);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: '#807166',
      roughness: 1,
    });
    mesh(
      new THREE.CylinderGeometry(0.12, 0.25, 2.4, 12),
      trunkMat,
      0,
      1.2,
      0,
      tree,
    );
    for (let j = 0; j < 8; j++) {
      const a = (j / 8) * Math.PI * 2;
      const limb = mesh(
        new THREE.CylinderGeometry(0.04, 0.09, 1.5, 8),
        trunkMat,
        Math.cos(a) * 0.35,
        2,
        Math.sin(a) * 0.35,
        tree,
      );
      limb.rotation.z = Math.cos(a) * 0.6;
      limb.rotation.x = Math.sin(a) * 0.6;
    }
    const blossomMat = new THREE.MeshStandardMaterial({
      color: night
        ? '#c1bbda'
        : island.theme === 'coast'
          ? '#b2bc93'
          : '#e9b5bd',
      roughness: 1,
    });
    for (let j = 0; j < 65; j++) {
      const a = random() * Math.PI * 2,
        r = Math.sqrt(random()) * 1.7;
      const m = mesh(
        new THREE.IcosahedronGeometry(0.3 + random() * 0.25, 1),
        blossomMat,
        Math.cos(a) * r,
        2.5 + random() * 0.6 - r * 0.15,
        Math.sin(a) * r,
        tree,
      );
      m.scale.y = 0.65;
    }
    const flowerMat = new THREE.MeshStandardMaterial({
      color: night ? '#abbcba' : '#426d32',
      roughness: 0.8,
    });
    const flowerMesh = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.045, 0.22, 3),
      flowerMat,
      2600 + Math.min(flowers, 30) * 10,
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < flowerMesh.count; i++) {
      let x = (random() - 0.5) * 10,
        z = (random() - 0.5) * 10;
      if (
        x * x + z * z > 29 ||
        Math.abs(x - Math.sin(((4.7 - z) / 0.35) * 0.16) * 1.15) < 0.5
      ) {
        x = 4 + (random() - 0.5);
        z = (random() - 0.5) * 3;
      }
      dummy.position.set(x, 0.12 + random() * 0.13, z);
      dummy.scale.set(1, 0.5 + random(), 1);
      dummy.rotation.set(0, random() * 6.28, (random() - 0.5) * 0.3);
      dummy.updateMatrix();
      flowerMesh.setMatrixAt(i, dummy.matrix);
    }
    root.add(flowerMesh);
    // Small blossoms in clusters, distinct from the living grass.
    for (let i = 0; i < 100; i++) {
      const a = random() * Math.PI * 2,
        r = 3.5 + random() * 1.6;
      const f = mesh(
        new THREE.IcosahedronGeometry(0.045, 0),
        new THREE.MeshStandardMaterial({
          color: i % 3 ? '#d4c2e8' : '#fff1cd',
        }),
        Math.cos(a) * r,
        0.2,
        Math.sin(a) * r,
      );
      f.scale.set(1, 0.5, 1);
    }
    // Water ripples, drifting petals, and butterflies keep the garden alive.
    const ripples: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = mesh(
        new THREE.RingGeometry(0.3, 0.312, 64),
        new THREE.MeshBasicMaterial({
          color: '#c2e6dd',
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        }),
        -2.6,
        0.073,
        0.5,
      );
      ring.rotation.x = -Math.PI / 2;
      ripples.push(ring);
    }
    const butterflies: THREE.Group[] = [];
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Group();
      root.add(b);
      for (const side of [-1, 1]) {
        const wing = mesh(
          new THREE.SphereGeometry(0.055, 8, 4),
          new THREE.MeshStandardMaterial({
            color: i % 2 ? '#f7d69b' : '#cbd8f5',
            side: THREE.DoubleSide,
          }),
          side * 0.05,
          0,
          0,
          b,
        );
        wing.scale.set(1, 0.12, 1.5);
      }
      butterflies.push(b);
    }
    const petalGeo = new THREE.BufferGeometry();
    const petals = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i++) {
      petals[i * 3] = (random() - 0.5) * 10;
      petals[i * 3 + 1] = random() * 5;
      petals[i * 3 + 2] = (random() - 0.5) * 10;
    }
    petalGeo.setAttribute('position', new THREE.BufferAttribute(petals, 3));
    const petalMat = new THREE.PointsMaterial({
      color: '#f2cdd6',
      size: 0.045,
      transparent: true,
      opacity: 0.8,
    });
    root.add(new THREE.Points(petalGeo, petalMat));

    for (let i = 0; i < 8 + Math.min(candles, 20); i++) {
      const a = (i / Math.max(8, 8 + candles)) * Math.PI * 2,
        x = Math.cos(a) * 3.6,
        z = Math.sin(a) * 3.6;
      mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 0.24, 12),
        marble,
        x,
        0.18,
        z,
      );
      const flame = mesh(
        new THREE.SphereGeometry(0.065, 12, 8),
        new THREE.MeshBasicMaterial({ color: '#ffe4a7' }),
        x,
        0.36,
        z,
      );
      flame.scale.y = 1.6;
      if (i < 6) {
        const l = new THREE.PointLight('#ffd492', night ? 1.2 : 0.3, 3);
        l.position.set(x, 0.6, z);
        root.add(l);
      }
    }
    // A skinned animal, with actual leg, tail, and body animation.
    const fox = new THREE.Group();
    fox.position.set(0.25, 0.035, 3.1);
    root.add(fox);
    const demoDog = createDog();
    fox.add(demoDog.object);
    let generatedDog: ReturnType<typeof rigDog> | undefined;
    let characterMixer: THREE.AnimationMixer | undefined;
    let walkAction: THREE.AnimationAction | undefined;
    let idleAction: THREE.AnimationAction | undefined;
    let characterReady = false;
    if (characterUrl) {
      demoDog.object.visible = false;
      new GLTFLoader().load(
        characterUrl,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene,
            bounds = new THREE.Box3().setFromObject(model),
            size = bounds.getSize(new THREE.Vector3()),
            center = bounds.getCenter(new THREE.Vector3());
          const scale = 1.8 / Math.max(size.y, 0.01);
          model.scale.setScalar(scale);
          model.position.set(
            -center.x * scale,
            -bounds.min.y * scale,
            -center.z * scale,
          );
          model.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          fox.add(model);
          characterReady = true;
          if (gltf.animations.length) {
            characterMixer = new THREE.AnimationMixer(model);
            const walk = gltf.animations.find((a) => /walk/i.test(a.name));
            const idle = gltf.animations.find((a) =>
              /idle|stand/i.test(a.name),
            );
            if (walk) walkAction = characterMixer.clipAction(walk);
            if (idle) {
              idleAction = characterMixer.clipAction(idle);
              idleAction.play();
            }
          }
        },
        undefined,
        () => {
          setCharacterError(true);
        },
      );
    } else
      new GLTFLoader().load(
        '/demo/golden-dog-standing.glb',
        (gltf) => {
          if (disposed) return;
          generatedDog = rigDog(gltf.scene);
          fox.add(generatedDog.object);
          demoDog.object.visible = false;
        },
        undefined,
        () => {},
      );
    let path: Point[] = [],
      pause = 1.5,
      manualUntil = 0;
    const destination = mesh(
      new THREE.RingGeometry(0.18, 0.21, 40),
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      }),
      0,
      0.052,
      0,
    );
    destination.rotation.x = -Math.PI / 2;
    destination.visible = false;
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let down = { x: 0, y: 0 };
    const pointerDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const pointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(detailedTerrain || meadow, true)[0];
      if (!hit) return;
      const next = route(fox.position, hit.point);
      if (next.length) {
        path = next;
        manualUntil = performance.now() + 12000;
        destination.position.set(hit.point.x, hit.point.y + 0.07, hit.point.z);
        destination.visible = true;
        pause = 0;
      }
    };
    const keys = new Set<string>();
    const keyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea,[contenteditable]'))
        return;
      if (
        [
          'w',
          'a',
          's',
          'd',
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
          'shift',
        ].includes(e.key.toLowerCase())
      ) {
        keys.add(e.key.toLowerCase());
        e.preventDefault();
      }
    };
    const keyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const blur = () => keys.clear();
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);
    const clock = new THREE.Clock();
    let detailedTerrain: THREE.Object3D | undefined;
    const groundRay = new THREE.Raycaster();
    const terrainHeight = (x: number, z: number) => {
      if (!detailedTerrain) return 0.035;
      groundRay.set(new THREE.Vector3(x, 8, z), new THREE.Vector3(0, -1, 0));
      const hits = groundRay.intersectObject(detailedTerrain, true);
      // Ignore canopy and architecture; find the meadow beneath them.
      const ground = hits.find((h) => h.point.y < 1.1 && h.point.y > -0.8);
      return ground ? ground.point.y + 0.045 : 0.035;
    };
    const builtLandscape = root.children.filter(
      (o) =>
        o !== fox &&
        o !== destination &&
        !butterflies.includes(o as THREE.Group) &&
        !(o instanceof THREE.Points),
    );
    new GLTFLoader().load('/demo/living-island.glb', (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model),
        size = bounds.getSize(new THREE.Vector3());
      model.scale.setScalar(11.8 / Math.max(size.x, size.z));
      model.updateMatrixWorld(true);
      groundRay.set(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0));
      const hit = groundRay.intersectObject(model, true)[0];
      if (hit) model.position.y = 0.035 - hit.point.y;
      model.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      builtLandscape.forEach((o) => (o.visible = false));
      root.add(model);
      detailedTerrain = model;
      model.updateMatrixWorld(true);
      for (let i = 0; i < Math.min(candles, 25); i++) {
        const x = 1.9 + (i % 5) * 0.24,
          z = 2.6 + Math.floor(i / 5) * 0.25,
          y = terrainHeight(x, z);
        mesh(
          new THREE.CylinderGeometry(0.075, 0.09, 0.2, 10),
          marble,
          x,
          y + 0.1,
          z,
        );
        mesh(
          new THREE.SphereGeometry(0.04, 8, 6),
          new THREE.MeshBasicMaterial({ color: '#ffdb91' }),
          x,
          y + 0.24,
          z,
        );
      }
      for (let i = 0; i < Math.min(flowers, 25) * 4; i++) {
        const x = -0.8 + random() * 0.7,
          z = 2 + random() * 0.8,
          y = terrainHeight(x, z);
        mesh(
          new THREE.IcosahedronGeometry(0.065, 1),
          blossomMat,
          x,
          y + 0.08,
          z,
        );
      }
    });
    // Distant floating islands give the sanctuary an archipelago horizon.
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2,
        r = 22 + random() * 30;
      const g = new THREE.Group();
      g.position.set(Math.cos(a) * r, -3 + random() * 5, Math.sin(a) * r);
      g.scale.setScalar(0.5 + random());
      scene.add(g);
      mesh(new THREE.CylinderGeometry(3.5, 2.3, 2.5, 9), stone, 0, -1.5, 0, g);
      mesh(
        new THREE.CylinderGeometry(3.45, 3.5, 0.18, 9),
        grass,
        0,
        -0.16,
        0,
        g,
      );
      mesh(new THREE.CylinderGeometry(0.9, 1, 0.2, 16), marble, 0, 0.1, 0, g);
      mesh(new THREE.ConeGeometry(0.9, 1.4, 16), marble, 0, 1, 0, g);
    }
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    if (view === 'close') {
      camera.position.set(3, 2.4, 6);
      controls.target.set(1, 1, -1);
    }
    let previousView = view;
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05),
        time = clock.elapsedTime;

      let moving = false;
      const direction = new THREE.Vector3();
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      if (keys.has('w') || keys.has('arrowup')) direction.add(forward);
      if (keys.has('s') || keys.has('arrowdown')) direction.sub(forward);
      if (keys.has('d') || keys.has('arrowright')) direction.add(right);
      if (keys.has('a') || keys.has('arrowleft')) direction.sub(right);
      if (characterUrl && (!characterReady || !walkAction)) {
        direction.set(0, 0, 0);
        path = [];
        manualUntil = performance.now() + 60000;
      }
      const speed = keys.has('shift') ? 2.2 : 0.9;
      if (direction.lengthSq()) {
        direction.normalize();
        path = [];
        manualUntil = performance.now() + 6000;
        destination.visible = false;
        const next = fox.position
          .clone()
          .addScaledVector(direction, speed * dt);
        if (walkable(next)) {
          fox.position.copy(next);
          moving = true;
        }
      } else if (path.length) {
        const target = path[0];
        direction.set(target.x - fox.position.x, 0, target.z - fox.position.z);
        if (direction.length() < 0.07) path.shift();
        else {
          direction.normalize();
          fox.position.addScaledVector(direction, 0.9 * dt);
          moving = true;
        }
      } else {
        destination.visible = false;
        pause -= dt;
        if (pause <= 0 && performance.now() > manualUntil) {
          for (let attempt = 0; attempt < 20; attempt++) {
            const goal = { x: (random() - 0.5) * 8, z: (random() - 0.5) * 8 };
            const next = route(fox.position, goal);
            if (next.length) {
              path = next;
              break;
            }
          }
          pause = 2 + random() * 4;
        }
      }
      fox.position.y = THREE.MathUtils.lerp(
        fox.position.y,
        terrainHeight(fox.position.x, fox.position.z),
        Math.min(1, dt * 12),
      );
      if (moving) {
        const angle = Math.atan2(direction.x, direction.z);
        fox.rotation.y +=
          Math.atan2(
            Math.sin(angle - fox.rotation.y),
            Math.cos(angle - fox.rotation.y),
          ) * Math.min(1, dt * 10);
      }
      if (characterMixer) {
        characterMixer.update(dt);
        if (walkAction) {
          walkAction.play();
          walkAction.setEffectiveWeight(moving ? 1 : 0);
          idleAction?.setEffectiveWeight(moving ? 0 : 1);
        }
      }
      if (generatedDog) generatedDog.update(time, moving, speed > 1);
      else demoDog.update(time, moving, speed > 1);
      if (previousView !== viewRef.current) {
        previousView = viewRef.current;
        if (previousView === 'close') {
          camera.position.set(3, 2.4, 6);
          controls.target.set(1, 1, -1);
        }
        if (previousView === 'orbit') {
          camera.position.set(12, 9, 15);
          controls.target.set(0, 1, 0);
        }
      }
      if (viewRef.current === 'follow') {
        const desired = fox.position.clone().add(new THREE.Vector3(4, 3.1, 5));
        camera.position.lerp(desired, 1 - Math.exp(-dt * 2));
        controls.target.lerp(
          fox.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
          1 - Math.exp(-dt * 4),
        );
      }
      for (let i = 0; i < ripples.length; i++) {
        const phase = (time * 0.22 + i / 3) % 1;
        ripples[i].scale.setScalar(0.5 + phase * 3);
        (ripples[i].material as THREE.MeshBasicMaterial).opacity =
          (1 - phase) * 0.28;
      }
      butterflies.forEach((b, i) => {
        b.position.set(
          Math.sin(time * 0.23 + i * 2) * 3.8,
          1 + Math.sin(time * 0.7 + i) * 0.3,
          Math.cos(time * 0.18 + i * 2) * 3,
        );
        b.rotation.y = -time * 0.23;
        b.children.forEach((w, j) => {
          w.rotation.z = Math.sin(time * 14 + i) * (j ? 1 : -1);
        });
      });
      for (let i = 0; i < 120; i++) {
        petals[i * 3] += 0.08 * dt;
        petals[i * 3 + 1] -= 0.12 * dt;
        if (petals[i * 3 + 1] < 0.1) petals[i * 3 + 1] = 5;
        if (petals[i * 3] > 5) petals[i * 3] = -5;
      }
      petalGeo.attributes.position.needsUpdate = true;
      controls.update();
      orbit.rotation.z += 0.001;
      renderer.render(scene, camera);
    };
    tick();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      characterMixer?.stopAllAction();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);

      petalGeo.dispose();
      petalMat.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            if (m.map) m.map.dispose();
            m.dispose();
          }
        }
      });
      env.dispose();
      room.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [
    island.id,
    island.theme,
    island.photo,
    island.name,
    candles,
    flowers,
    modelUrl,
    characterUrl,
  ]);
  return (
    <div className="scene-host" ref={host}>
      <a
        className="scene-credits"
        href="/demo/credits.html"
        target="_blank"
        rel="noreferrer"
      >
        3D credits
      </a>
      {characterError && (
        <div className="character-load-error">
          The character could not load. Try reopening the island or download the
          model.
        </div>
      )}
      {failed && (
        <div className="scene-fallback">
          <img src="/island.png" alt="Memorial garden" />
          <p>
            3D isn’t available on this device. You can still leave memories
            below.
          </p>
        </div>
      )}
    </div>
  );
}
