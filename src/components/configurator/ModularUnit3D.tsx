import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ConfigState } from "@/hooks/useConfigurator";

// ─── Facade colour map ────────────────────────────────────────────────────────
function getFacadeProps(facade: ConfigState["facade"]) {
  switch (facade) {
    case "thermowood-black":
      return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
    case "thermowood-natural":
      return { color: "#7a5728", roughness: 0.88, metalness: 0.0, isWood: true };
    case "composite-white":
      return { color: "#ededea", roughness: 0.55, metalness: 0.04, isWood: false };
    case "composite-black":
      return { color: "#1c1c1e", roughness: 0.58, metalness: 0.05, isWood: false };
    case "aluminium-anthracite":
      return { color: "#383a3b", roughness: 0.28, metalness: 0.80, isWood: false };
    case "aluminium-bronze":
      return { color: "#6e4e2e", roughness: 0.26, metalness: 0.82, isWood: false };
    default:
      return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
  }
}

// ─── Narrow vertical plank strip ─────────────────────────────────────────────
function PlankWall({
  width,
  height,
  posX = 0,
  posY = 0,
  posZ = 0,
  rotY = 0,
  baseColor,
  roughness,
  metalness,
  isWood,
}: {
  width: number; height: number;
  posX?: number; posY?: number; posZ?: number; rotY?: number;
  baseColor: string; roughness: number; metalness: number; isWood: boolean;
}) {
  // Each plank: ~65 mm wide, ~8 mm gap
  const plankW = 0.065;
  const gapW = 0.008;
  const pitch = plankW + gapW;
  const count = Math.round(width / pitch);

  const base = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  const planks = useMemo(() => {
    const arr: { x: number; col: THREE.Color }[] = [];
    for (let i = 0; i < count; i++) {
      const x = -width / 2 + (i + 0.5) * pitch;
      const variance = (Math.sin(i * 7.3) * 0.5 + Math.cos(i * 3.1) * 0.5) * (isWood ? 0.10 : 0.02);
      const col = base.clone().lerp(
        variance > 0 ? new THREE.Color("#ffffff") : new THREE.Color("#000000"),
        Math.abs(variance)
      );
      arr.push({ x, col });
    }
    return arr;
  }, [count, width, pitch, base, isWood]);

  return (
    <group position={[posX, posY, posZ]} rotation={[0, rotY, 0]}>
      {planks.map(({ x, col }, i) => (
        <mesh key={i} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[plankW, height, 0.022]} />
          <meshStandardMaterial
            color={col}
            roughness={roughness + (isWood ? (Math.sin(i * 4.1) * 0.04) : 0)}
            metalness={metalness}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Window/door opening with frame + physical glass ─────────────────────────
function GlazingUnit({
  width,
  height,
  posX,
  posY,
  posZ,
  frameColor,
  hasDivider = false,
}: {
  width: number; height: number;
  posX: number; posY: number; posZ: number;
  frameColor: string; hasDivider?: boolean;
}) {
  const fw = 0.038; // frame thickness

  return (
    <group position={[posX, posY, posZ]}>
      {/* Outer frame - top */}
      <mesh position={[0, height / 2 - fw / 2, 0]}>
        <boxGeometry args={[width, fw, 0.055]} />
        <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* bottom */}
      <mesh position={[0, -height / 2 + fw / 2, 0]}>
        <boxGeometry args={[width, fw, 0.055]} />
        <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* left */}
      <mesh position={[-width / 2 + fw / 2, 0, 0]}>
        <boxGeometry args={[fw, height, 0.055]} />
        <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* right */}
      <mesh position={[width / 2 - fw / 2, 0, 0]}>
        <boxGeometry args={[fw, height, 0.055]} />
        <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* center divider (sliding) */}
      {hasDivider && (
        <mesh position={[0, 0, 0.005]}>
          <boxGeometry args={[fw, height - fw * 2, 0.045]} />
          <meshStandardMaterial color={frameColor} roughness={0.35} metalness={0.65} />
        </mesh>
      )}
      {/* Glass pane */}
      <mesh position={[0, 0, 0.002]}>
        <boxGeometry args={[width - fw * 2, height - fw * 2, 0.008]} />
        <meshPhysicalMaterial
          color="#b8cfd8"
          roughness={0.02}
          metalness={0.0}
          transmission={0.92}
          thickness={0.15}
          ior={1.5}
          transparent
          opacity={0.30}
          envMapIntensity={1.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── Interior room visible through glass ─────────────────────────────────────
function Interior({ w, h, d }: { w: number; h: number; d: number }) {
  const inset = 0.04;
  const iw = w - inset * 2;
  const ih = h - inset;
  const id = d - inset;

  return (
    <group position={[0, -inset / 2, 0]}>
      {/* Floor - light timber colour */}
      <mesh position={[0, -ih / 2 + 0.01, 0]} receiveShadow>
        <boxGeometry args={[iw, 0.018, id]} />
        <meshStandardMaterial color="#c8a97e" roughness={0.65} metalness={0.0} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, ih / 2, 0]}>
        <boxGeometry args={[iw, 0.015, id]} />
        <meshStandardMaterial color="#f0eeeb" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0, -id / 2 + 0.015]}>
        <boxGeometry args={[iw, ih, 0.02]} />
        <meshStandardMaterial color="#ebe9e4" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-iw / 2 + 0.015, 0, 0]}>
        <boxGeometry args={[0.02, ih, id]} />
        <meshStandardMaterial color="#e8e6e1" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Right wall */}
      <mesh position={[iw / 2 - 0.015, 0, 0]}>
        <boxGeometry args={[0.02, ih, id]} />
        <meshStandardMaterial color="#e8e6e1" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Sofa silhouette */}
      <group position={[iw * 0.05, -ih / 2 + 0.01, -id * 0.28]}>
        {/* Seat */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[iw * 0.52, 0.18, id * 0.30]} />
          <meshStandardMaterial color="#b8afa5" roughness={0.85} metalness={0.0} />
        </mesh>
        {/* Back cushion */}
        <mesh position={[0, 0.46, -id * 0.13]} castShadow>
          <boxGeometry args={[iw * 0.52, 0.34, 0.12]} />
          <meshStandardMaterial color="#b0a79d" roughness={0.85} metalness={0.0} />
        </mesh>
        {/* Left arm */}
        <mesh position={[-iw * 0.27, 0.32, 0]} castShadow>
          <boxGeometry args={[0.08, 0.22, id * 0.30]} />
          <meshStandardMaterial color="#a89f95" roughness={0.85} metalness={0.0} />
        </mesh>
        {/* Right arm */}
        <mesh position={[iw * 0.27, 0.32, 0]} castShadow>
          <boxGeometry args={[0.08, 0.22, id * 0.30]} />
          <meshStandardMaterial color="#a89f95" roughness={0.85} metalness={0.0} />
        </mesh>
      </group>

      {/* Coffee table */}
      <group position={[iw * 0.05, -ih / 2 + 0.01, id * 0.08]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[iw * 0.22, 0.04, id * 0.12]} />
          <meshStandardMaterial color="#8a7560" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Legs */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx * iw * 0.09, 0.12, lz * id * 0.045]} castShadow>
            <boxGeometry args={[0.025, 0.24, 0.025]} />
            <meshStandardMaterial color="#5a4a38" roughness={0.5} metalness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Warm interior point light */}
      <pointLight position={[0, ih * 0.38, -id * 0.1]} intensity={1.2} color="#fff3e0" distance={8} decay={2} />
      {/* Ceiling strip light */}
      <pointLight position={[0, ih * 0.44, id * 0.2]} intensity={0.6} color="#fffaf0" distance={6} decay={2} />
    </group>
  );
}

// ─── Front face wall segments (with cutouts for windows) ─────────────────────
function FrontWallWithOpenings({
  w, h,
  posZ,
  openings,
  baseColor, roughness, metalness, isWood,
}: {
  w: number; h: number; posZ: number;
  openings: { x: number; width: number; height: number; y: number }[];
  baseColor: string; roughness: number; metalness: number; isWood: boolean;
}) {
  // Sort openings by x
  const sorted = [...openings].sort((a, b) => a.x - b.x);

  // Build vertical wall segments between/around window openings
  const segments: { x: number; width: number; y: number; height: number }[] = [];

  // Above all openings (full width top band)
  const maxTop = Math.max(...sorted.map(o => o.y + o.height / 2));
  const topBandH = h / 2 - maxTop;
  if (topBandH > 0.01) {
    segments.push({ x: 0, width: w, y: maxTop + topBandH / 2, height: topBandH });
  }

  // Below all openings (sill band)
  const minBottom = Math.min(...sorted.map(o => o.y - o.height / 2));
  const bottomBandH = minBottom + h / 2;
  if (bottomBandH > 0.01) {
    segments.push({ x: 0, width: w, y: -h / 2 + bottomBandH / 2, height: bottomBandH });
  }

  // Vertical segments beside/between openings (at the opening height band)
  let cursor = -w / 2;
  for (let i = 0; i <= sorted.length; i++) {
    const nextEdge = i < sorted.length ? sorted[i].x - sorted[i].width / 2 : w / 2;
    const segW = nextEdge - cursor;
    if (segW > 0.01) {
      const midY = (maxTop + minBottom) / 2;
      const midH = maxTop - minBottom;
      segments.push({ x: cursor + segW / 2, width: segW, y: midY, height: midH });
    }
    if (i < sorted.length) cursor = sorted[i].x + sorted[i].width / 2;
  }

  return (
    <group position={[0, 0, posZ]}>
      {segments.map((seg, i) => (
        <PlankWall
          key={i}
          width={seg.width}
          height={seg.height}
          posX={seg.x}
          posY={seg.y}
          posZ={0}
          baseColor={baseColor}
          roughness={roughness}
          metalness={metalness}
          isWood={isWood}
        />
      ))}
    </group>
  );
}

// ─── Main exported 3D unit ────────────────────────────────────────────────────
export function ModularUnit3D({ config }: { config: ConfigState }) {
  const fp = getFacadeProps(config.facade);
  const roofColor = config.roofEdge === "white" ? "#e2e0dc" : "#0e0d0b";

  const dims = useMemo(() => {
    switch (config.model) {
      case "compact":  return { w: 3.8, h: 2.75, d: 2.5 };
      case "standard": return { w: 6.2, h: 2.75, d: 3.0 };
      case "large":    return { w: 8.6, h: 2.75, d: 3.3 };
    }
  }, [config.model]);

  const { w, h, d } = dims;
  const frameColor = fp.color === "#ededea" ? "#222222" : "#080807";

  // Window/door openings on the front face
  const openings = useMemo(() => {
    const doorH = h * 0.78;
    const winH = h * (config.windowType === "panoramic" ? 0.82 : config.windowType === "minimal" ? 0.58 : 0.74);
    const winW = w * (config.windowType === "panoramic" ? 0.50 : config.windowType === "minimal" ? 0.28 : 0.42);
    const doorW = config.windowType === "minimal" ? 0.82 : 0.96;
    const doorX = -w * 0.28;
    const winX  = w * 0.10;

    return [
      { x: doorX, width: doorW, height: doorH, y: 0 },
      { x: winX,  width: winW,  height: winH,  y: 0, hasDivider: true },
    ];
  }, [config.windowType, w, h]);

  const scaleX = config.mirrorPlan ? -1 : 1;
  const shellThick = 0.14; // wall thickness

  return (
    <group scale={[scaleX, 1, 1]}>

      {/* ── Interior (rendered first so glass is see-through) ── */}
      <Interior w={w - shellThick * 2} h={h - shellThick} d={d - shellThick} />

      {/* ── Exterior shell – 5 solid faces (no front) ── */}
      {/* Back wall */}
      <group position={[0, 0, -d / 2 + shellThick / 2]}>
        <PlankWall width={w} height={h} posZ={0} baseColor={fp.color} roughness={fp.roughness} metalness={fp.metalness} isWood={fp.isWood} />
      </group>

      {/* Left wall */}
      <PlankWall
        width={d} height={h}
        posX={-w / 2 + shellThick / 2} posZ={0}
        rotY={Math.PI / 2}
        baseColor={fp.color} roughness={fp.roughness} metalness={fp.metalness} isWood={fp.isWood}
      />

      {/* Right wall */}
      <PlankWall
        width={d} height={h}
        posX={w / 2 - shellThick / 2} posZ={0}
        rotY={-Math.PI / 2}
        baseColor={fp.color} roughness={fp.roughness} metalness={fp.metalness} isWood={fp.isWood}
      />

      {/* Ceiling */}
      <mesh position={[0, h / 2 - shellThick / 2, 0]}>
        <boxGeometry args={[w, shellThick, d]} />
        <meshStandardMaterial color={fp.color} roughness={fp.roughness} metalness={fp.metalness} />
      </mesh>

      {/* Floor slab */}
      <mesh position={[0, -h / 2 + shellThick / 2 - 0.02, 0]} receiveShadow>
        <boxGeometry args={[w + 0.06, shellThick + 0.04, d + 0.06]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} metalness={0.35} />
      </mesh>

      {/* ── Front face – wall segments around windows ── */}
      <FrontWallWithOpenings
        w={w} h={h}
        posZ={d / 2 - shellThick / 2}
        openings={openings}
        baseColor={fp.color} roughness={fp.roughness} metalness={fp.metalness} isWood={fp.isWood}
      />

      {/* ── Glazing units ── */}
      {openings.map((o, i) => (
        <GlazingUnit
          key={i}
          width={o.width} height={o.height}
          posX={o.x} posY={o.y} posZ={d / 2}
          frameColor={frameColor}
          hasDivider={(o as any).hasDivider}
        />
      ))}

      {/* ── Roof trim edge ── */}
      <mesh position={[0, h / 2 + 0.04, 0]}>
        <boxGeometry args={[w + 0.08, 0.08, d + 0.08]} />
        <meshStandardMaterial color={roofColor} roughness={0.38} metalness={0.45} />
      </mesh>
    </group>
  );
}
