'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  LoaderCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
export default function ImmersiveScene({
  url,
  modelUrl,
  onFailure,
  scale = 1,
  ground = 0,
  candles = 0,
  flowers = 0,
}: {
  url: string;
  modelUrl?: string;
  onFailure: () => void;
  scale?: number;
  ground?: number;
  candles?: number;
  flowers?: number;
}) {
  const host = useRef<HTMLDivElement>(null),
    keys = useRef(new Set<string>()),
    reset = useRef(() => {}),
    offeringRoot = useRef<THREE.Group | null>(null),
    [loading, setLoading] = useState(true),
    [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!host.current) return;
    const el = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false });
    } catch {
      onFailure();
      return;
    }
    let canceled = false;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor('#d7e1dc');
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(65, 1, 0.03, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, ground, 0);
    const spark = new SparkRenderer({ renderer });
    scene.add(spark);
    const splat = new SplatMesh({
      url,
      onProgress: (e) => {
        if (!canceled && e.total)
          setProgress(Math.round((e.loaded / e.total) * 100));
      },
      onLoad: () => {
        if (!canceled) setLoading(false);
      },
    });
    splat.quaternion.set(1, 0, 0, 0);
    splat.scale.setScalar(scale);
    splat.position.y = ground;
    scene.add(splat);
    const offerings = new THREE.Group();
    offerings.position.set(0, ground - 1.15, -2);
    scene.add(offerings);
    offeringRoot.current = offerings;
    splat.initialized.catch(() => {
      if (!canceled) onFailure();
    });
    scene.add(new THREE.HemisphereLight('#ffffff', '#817555', 3));
    const light = new THREE.DirectionalLight('#fff0d1', 3);
    light.position.set(2, 8, 2);
    scene.add(light);
    if (modelUrl)
      new GLTFLoader().load(
        modelUrl,
        (gltf) => {
          if (canceled) return;
          const m = gltf.scene,
            box = new THREE.Box3().setFromObject(m),
            size = box.getSize(new THREE.Vector3()),
            center = box.getCenter(new THREE.Vector3());
          m.position.sub(center);
          const group = new THREE.Group();
          group.add(m);
          group.scale.setScalar(0.8 / Math.max(size.x, size.y, size.z));
          group.position.set(1, ground - 0.75, -2.5);
          scene.add(group);
        },
        undefined,
        () => {},
      );
    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    let dragging = false,
      lastX = 0,
      lastY = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      camera.rotation.y -= (e.clientX - lastX) * 0.003;
      camera.rotation.x = THREE.MathUtils.clamp(
        camera.rotation.x - (e.clientY - lastY) * 0.003,
        -1.35,
        1.35,
      );
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => (dragging = false);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.03, 35, 90);
      camera.updateProjectionMatrix();
    };
    const keydown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea,[role=dialog]'))
        return;
      if (
        [
          'w',
          'a',
          's',
          'd',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
        ].includes(e.key)
      ) {
        e.preventDefault();
        keys.current.add(e.key);
      }
    };
    const keyup = (e: KeyboardEvent) => keys.current.delete(e.key);
    const blur = () => {
      keys.current.clear();
      dragging = false;
    };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', up);
    renderer.domElement.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    reset.current = () => {
      camera.position.set(0, ground, 0);
      camera.rotation.set(0, 0, 0);
      camera.fov = 65;
      camera.updateProjectionMatrix();
    };
    const clock = new THREE.Clock();
    const direction = new THREE.Vector3();
    let frame = 0;
    function tick() {
      frame = requestAnimationFrame(tick);
      const delta = Math.min(clock.getDelta(), 0.05),
        k = keys.current;
      direction.set(
        (k.has('d') || k.has('ArrowRight') ? 1 : 0) -
          (k.has('a') || k.has('ArrowLeft') ? 1 : 0),
        0,
        (k.has('s') || k.has('ArrowDown') ? 1 : 0) -
          (k.has('w') || k.has('ArrowUp') ? 1 : 0),
      );
      direction
        .normalize()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
      camera.position.addScaledVector(direction, delta * 1.4);
      const y = camera.position.y;
      camera.position.y = 0;
      camera.position.clampLength(0, 15);
      camera.position.y = y;
      renderer.render(scene, camera);
    }
    tick();
    return () => {
      canceled = true;
      keys.current.clear();
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      splat.dispose();
      spark.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            m.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [url, modelUrl, onFailure, scale, ground]);
  useEffect(() => {
    const root = offeringRoot.current;
    if (!root) return;
    for (const child of [...root.children]) {
      root.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    for (let i = 0; i < Math.min(candles, 20); i++) {
      const a = i * 0.8,
        x = Math.cos(a) * (0.35 + i * 0.04),
        z = Math.sin(a) * (0.35 + i * 0.04);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.05, 0.14, 12),
        new THREE.MeshStandardMaterial({ color: 0xf6ead3 }),
      );
      base.position.set(x, 0.07, z);
      root.add(base);
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.027, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xffdc91 }),
      );
      flame.scale.y = 1.6;
      flame.position.set(x, 0.18, z);
      root.add(flame);
    }
    for (let i = 0; i < Math.min(flowers, 20) * 5; i++) {
      const a = i * 2.4;
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 6),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0xeac0cf : 0xf4ead5 }),
      );
      petal.scale.y = 0.4;
      petal.position.set(
        -0.6 + Math.cos(a) * 0.2,
        0.03 + Math.sin(i) * 0.015,
        Math.sin(a) * 0.25,
      );
      root.add(petal);
    }
  }, [candles, flowers, loading]);
  return (
    <>
      <div className="scene-host immersive-host" ref={host} />
      {loading && (
        <div className="immersive-loading">
          <img src="/sanctuary.png" alt="Memorial sanctuary" />
          <div>
            <LoaderCircle className="spin" />
            <h2>Your sanctuary is coming into view.</h2>
            <p>{progress ? `${progress}% · ` : ''}Opening the 3D world</p>
          </div>
        </div>
      )}
      <div className="walk-pad glass">
        {[
          { key: 'w', Icon: ArrowUp, label: 'Forward' },
          { key: 'a', Icon: ArrowLeft, label: 'Left' },
          { key: 's', Icon: ArrowDown, label: 'Back' },
          { key: 'd', Icon: ArrowRight, label: 'Right' },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            aria-label={`Move ${label.toLowerCase()}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              keys.current.add(key);
            }}
            onPointerUp={() => keys.current.delete(key)}
            onPointerCancel={() => keys.current.delete(key)}
          >
            <Icon size={17} />
          </button>
        ))}
        <button
          onClick={() => reset.current()}
          aria-label="Return to arrival point"
        >
          <RotateCcw size={16} />
        </button>
        <small>W A S D · Drag to look</small>
      </div>
    </>
  );
}
