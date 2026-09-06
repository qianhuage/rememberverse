'use client';
import { useEffect, useRef } from 'react';
export default function LivingHero() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => {
      host.current?.style.setProperty(
        '--hero-x',
        `${(e.clientX / window.innerWidth - 0.5) * -14}px`,
      );
      host.current?.style.setProperty(
        '--hero-y',
        `${(e.clientY / window.innerHeight - 0.5) * -9}px`,
      );
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return (
    <div className="panorama" ref={host} aria-hidden="true">
      <div className="hero-drift">
        <img
          src="/sanctuary.png"
          alt=""
          onError={(e) => {
            e.currentTarget.src = '/island.png';
          }}
        />
      </div>
      <div className="hero-cloud cloud-one" />
      <div className="hero-cloud cloud-two" />
      <div className="hero-motes">
        {Array.from({ length: 16 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${28 + ((i * 17) % 72)}%`,
              top: `${(i * 23) % 100}%`,
              animationDelay: `${-i * 1.9}s`,
              animationDuration: `${13 + (i % 6) * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
