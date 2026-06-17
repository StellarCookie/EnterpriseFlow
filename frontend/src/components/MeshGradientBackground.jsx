import { useEffect, useRef, useState, useCallback } from "react";
import React from "react";

/* ------------------------------------------------------------------ */
/*  PALETTE — from the supplied color board                             */
/*  Change these hex values to swap the whole look in one place.       */
/* ------------------------------------------------------------------ */
const COLORS = {
  sapphire: "#5b4ad1",      // periwinkle
  arctic: "#f3c9dc",        // light pink
  lace: "#f7f1f8",          // canvas
  bubblegum: "#f0a4c4",     // pastel pink
  balletSlipper: "#b48bd0", // lavender
  sage: "#6a63d4",          // blue-violet
  pistachio: "#b48bd0",     // lavender
  spruce: "#f3c9dc",        // light pink (base gradient top)
  peacock: "#f7f1f8",       // canvas (base gradient bottom)
};

/* ------------------------------------------------------------------ */
/*  BLOBS — the glowing shapes that make up the mesh.                   */
/*     x / y     -> base position, in % of the container               */
/*     size      -> diameter, in vmax (scales with viewport)           */
/*     depth     -> how strongly it reacts to the cursor.              */
/*                  positive = drifts toward the cursor side,           */
/*                  negative = drifts the opposite way (parallax)       */
/*     speed/phase -> idle drifting motion, even with no input          */
/*                                                                       */
/*     Add, remove, or re-tune entries here to restyle the mesh.        */
/* ------------------------------------------------------------------ */
const BLOBS = [
  { color: COLORS.sapphire,      x: 22, y: 26, size: 50, depth:  0.45, speed: 0.55, phase: 0.0 },
  { color: COLORS.balletSlipper, x: 76, y: 36, size: 44, depth: -0.35, speed: 0.40, phase: 2.1 },
  { color: COLORS.pistachio,     x: 58, y: 82, size: 52, depth:  0.30, speed: 0.35, phase: 4.2 },
  { color: COLORS.arctic,        x: 86, y: 14, size: 32, depth:  0.65, speed: 0.70, phase: 1.3 },
  { color: COLORS.bubblegum,     x: 14, y: 78, size: 40, depth: -0.25, speed: 0.45, phase: 3.4 },
  { color: COLORS.sage,          x: 48, y: 52, size: 36, depth:  0.55, speed: 0.60, phase: 5.0 },
];

/* Colors used for the burst that appears on click — cycles randomly. */
const CLICK_COLORS = [
  COLORS.sapphire,
  COLORS.balletSlipper,
  COLORS.pistachio,
  COLORS.bubblegum,
  COLORS.arctic,
  COLORS.sage,
  COLORS.lace,
];

/* ------------------------------------------------------------------ */
/*  MeshGradientBackground                                              */
/*                                                                       */
/*  Drop this once near the root of your app (App.jsx).                */
/*  - fixed=true  -> position:fixed, covers the whole viewport,         */
/*                   stays put while content scrolls (default).         */
/*  - fixed=false -> position:absolute, fills the nearest positioned    */
/*                   ancestor (use this if you want it scoped to a       */
/*                   single page/section instead).                      */
/* ------------------------------------------------------------------ */
export default function MeshGradientBackground({ className = "", style = {}, fixed = true }) {
  const wrapRef = useRef(null);
  const blobRefs = useRef([]);
  const glowRef = useRef(null);
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const smooth = useRef({ x: 0.5, y: 0.5 });
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const node = wrapRef.current;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handlePointer = (e) => {
      const rect = node.getBoundingClientRect();
      pointer.current.x = (e.clientX - rect.left) / rect.width;
      pointer.current.y = (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener("pointermove", handlePointer);

    if (reduceMotion) {
      // Respect reduced-motion preferences: static mesh, no parallax loop.
      return () => window.removeEventListener("pointermove", handlePointer);
    }

    let raf;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) / 1000;

      // Ease the tracked pointer toward the real pointer for a smooth,
      // slightly "floaty" follow rather than a 1:1 snap.
      smooth.current.x += (pointer.current.x - smooth.current.x) * 0.06;
      smooth.current.y += (pointer.current.y - smooth.current.y) * 0.06;
      const dx = smooth.current.x - 0.5;
      const dy = smooth.current.y - 0.5;

      BLOBS.forEach((b, i) => {
        const el = blobRefs.current[i];
        if (!el) return;
        const driftX = Math.sin(t * b.speed + b.phase) * 4;
        const driftY = Math.cos(t * b.speed * 0.8 + b.phase) * 4;
        const px = dx * b.depth * 70 + driftX;
        const py = dy * b.depth * 70 + driftY;
        el.style.transform = `translate(${px}px, ${py}px)`;
      });

      // A soft highlight that tracks the raw cursor position directly.
      if (glowRef.current) {
        glowRef.current.style.left = `${pointer.current.x * 100}%`;
        glowRef.current.style.top = `${pointer.current.y * 100}%`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointer);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Click/tap: drop a colored burst + expanding ring at that point.
  const handleClick = useCallback((e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const color = CLICK_COLORS[Math.floor(Math.random() * CLICK_COLORS.length)];
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setRipples((r) => [...r, { id, x, y, color }]);
    setTimeout(() => {
      setRipples((r) => r.filter((rp) => rp.id !== id));
    }, 1500);
  }, []);

  return (
    <div
      ref={wrapRef}
      onClick={handleClick}
      className={className}
      style={{
        position: fixed ? "fixed" : "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${COLORS.lace} 0%, ${COLORS.arctic} 55%, rgba(180,139,208,0.25) 100%)`,
        cursor: "pointer",
        ...style,
      }}
    >
      <style>{`
        @keyframes meshFadeIn { from { opacity: 0; } to { opacity: 0.4; } }
        @keyframes meshRipple { 0% { transform: scale(0.15); opacity: 0.55; } 100% { transform: scale(1); opacity: 0; } }
        @keyframes meshRing { 0% { transform: scale(0); opacity: 0.7; } 100% { transform: scale(1); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .mesh-blob { animation: none !important; opacity: 0.6 !important; }
        }
      `}</style>

      {BLOBS.map((b, i) => (
        <div
          key={i}
          ref={(el) => (blobRefs.current[i] = el)}
          className="mesh-blob"
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.size}vmax`,
            height: `${b.size}vmax`,
            marginLeft: `-${b.size / 2}vmax`,
            marginTop: `-${b.size / 2}vmax`,
            borderRadius: "50%",
            background: b.color,
            filter: "blur(70px)", // increase for a softer look, lower for sharper
            mixBlendMode: "multiply",
            opacity: 0.4,
            willChange: "transform",
            animation: "meshFadeIn 1.4s ease-out",
          }}
        />
      ))}

      {/* Soft highlight that follows the raw cursor position */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "30vmax",
          height: "30vmax",
          marginLeft: "-15vmax",
          marginTop: "-15vmax",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.lace}30 0%, transparent 70%)`,
          mixBlendMode: "soft-light",
          pointerEvents: "none",
        }}
      />

      {/* Click bursts */}
      {ripples.map((r) => (
        <React.Fragment key={r.id}>
          <div
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: "55vmax",
              height: "55vmax",
              marginLeft: "-27.5vmax",
              marginTop: "-27.5vmax",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${r.color}66 0%, transparent 60%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
              animation: "meshRipple 1.5s ease-out forwards",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: 360,
              height: 360,
              marginLeft: -180,
              marginTop: -180,
              borderRadius: "50%",
              border: `1.5px solid ${r.color}`,
              pointerEvents: "none",
              animation: "meshRing 1.1s ease-out forwards",
            }}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
