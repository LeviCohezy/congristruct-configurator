import { useMemo } from "react";
import * as THREE from "three";
import type { ConfigState } from "@/hooks/useConfigurator";

// ─── Facade props ─────────────────────────────────────────────────────────────
function getFacadeProps(facade: ConfigState["facade"]) {
  switch (facade) {
    case "thermowood-black":    return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
    case "thermowood-natural":  return { color: "#7a5728", roughness: 0.88, metalness: 0.0, isWood: true };
    case "composite-white":     return { color: "#ededea", roughness: 0.55, metalness: 0.04, isWood: false };
    case "composite-black":     return { color: "#1c1c1e", roughness: 0.58, metalness: 0.05, isWood: false };
    case "aluminium-anthracite": return { color: "#383a3b", roughness: 0.28, metalness: 0.80, isWood: false };
    case "aluminium-bronze":    return { color: "#6e4e2e", roughness: 0.26, metalness: 0.82, isWood: false };
    default:                    return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
  }
}

// ─── Plank texture ────────────────────────────────────────────────────────────
function createPlankTexture(baseColor: string, isWood: boolean): THREE.CanvasTexture | null {
  if (!isWood) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const base = new THREE.Color(baseColor);

  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, 512, 1024);

  const numPlanks = 20;
  const pw = 512 / numPlanks;
  for (let i = 0; i < numPlanks; i++) {
    const x = i * pw;
    // slight plank tone
    const tone = (Math.sin(i * 6.3) * 0.5 + Math.cos(i * 2.1) * 0.5) * 0.08;
    const col = base.clone().lerp(tone > 0 ? new THREE.Color("#fff") : new THREE.Color("#000"), Math.abs(tone));
    ctx.fillStyle = `#${col.getHexString()}`;
    ctx.fillRect(x, 0, pw, 1024);
    // grain lines
    for (let g = 0; g < 12; g++) {
      const gx = x + Math.random() * pw;
      ctx.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
      ctx.fillRect(gx, 0, 1 + Math.random() * 1.5, 1024);
    }
    // gap
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x + pw - 3, 0, 3, 1024);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// ─── Rounded shape (for extrude) ─────────────────────────────────────────────
function roundedRect(w: number, d: number, r: number) {
  const s = new THREE.Shape();
  s.absarc(-w / 2 + r, -d / 2 + r, r, Math.PI, Math.PI * 1.5);
  s.absarc( w / 2 - r, -d / 2 + r, r, Math.PI * 1.5, 0);
  s.absarc( w / 2 - r,  d / 2 - r, r, 0, Math.PI * 0.5);
  s.absarc(-w / 2 + r,  d / 2 - r, r, Math.PI * 0.5, Math.PI);
  return s;
}




// ─── Main unit ────────────────────────────────────────────────────────────────
export function ModularUnit3D({ config }: { config: ConfigState }) {
  const fp = getFacadeProps(config.facade);
  const roofColor  = config.roofEdge === "white" ? "#e0deda" : "#0e0d0b";
  const frameColor = fp.color === "#ededea" ? "#1a1a1a" : "#080807";

  const plankTex = useMemo(
    () => createPlankTexture(fp.color, fp.isWood),
    [fp.color, fp.isWood]
  );

  // Dimensions
  const { width, height, depth } = useMemo(() => {
    switch (config.model) {
      case "compact":  return { width: 4.5,  height: 3.0, depth: 3.2 };
      case "standard": return { width: 7.2,  height: 3.0, depth: 3.6 };
      case "large":    return { width: 10.0, height: 3.0, depth: 4.0 };
    }
  }, [config.model]);

  const cornerRadius  = config.roundedCorners ? 0.45 : 0.0;
  const wallThick     = 0.18;
  const roofThick     = 0.18;
  const floorThick    = 0.18;
  const PILLAR_W      = 0.38;

  // Room split based on layout
  const roomSplit = config.layout === "office" ? 60 : config.layout === "studio" ? 100 : 45;

  // Front facade geometry constants
  const flatStartX   = -width / 2 + cornerRadius;
  const flatEndX     =  width / 2 - cornerRadius;
  const flatWidth    = flatEndX - flatStartX;
  const usableWidth  = flatWidth - PILLAR_W;
  const room1Width   = usableWidth * (roomSplit / 100);
  const room2Width   = usableWidth * (1 - roomSplit / 100);
  const room1CX      = flatStartX + PILLAR_W + room1Width / 2;
  const room2StartX  = flatStartX + PILLAR_W + room1Width;

  // Window heights
  const winH    = height * (config.windowType === "panoramic" ? 0.82 : config.windowType === "minimal" ? 0.56 : 0.72);
  const winBot  = height * 0.09;
  const winTop  = winBot + winH;
  const winCY   = winBot + winH / 2;

  const DOOR_W  = config.windowType === "minimal" ? 0.85 : 1.05;

  // Rounded slab shape
  const slabShape = useMemo(
    () => (cornerRadius > 0 ? roundedRect(width, depth, cornerRadius) : null),
    [width, depth, cornerRadius]
  );

  // Corner wedge shapes (pie-slice solid quarter cylinders)
  const cornerShapes = useMemo(() => {
    if (cornerRadius <= 0) return null;
    const make = (start: number, end: number) => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.absarc(0, 0, cornerRadius, start, end, false);
      s.lineTo(0, 0);
      return s;
    };
    return [
      // Rx(+PI/2): shape XY → world XZ; shape Y → world Z; extrudes downward
      // Angles chosen so each wedge fills the correct world quadrant
      { shape: make(0,           Math.PI * 0.5), posX:  width/2-cornerRadius, posZ:  depth/2-cornerRadius }, // front-right
      { shape: make(Math.PI*0.5, Math.PI),       posX: -width/2+cornerRadius, posZ:  depth/2-cornerRadius }, // front-left
      { shape: make(Math.PI,     Math.PI*1.5),   posX: -width/2+cornerRadius, posZ: -depth/2+cornerRadius }, // back-left
      { shape: make(Math.PI*1.5, Math.PI*2),     posX:  width/2-cornerRadius, posZ: -depth/2+cornerRadius }, // back-right
    ];
  }, [cornerRadius, width, depth]);

  const claddingProps = {
    color: fp.color,
    roughness: fp.roughness,
    metalness: fp.metalness,
    map: plankTex ?? undefined,
    bumpMap: plankTex ?? undefined,
    bumpScale: fp.isWood ? 0.012 : 0,
  };

  const scaleX = config.mirrorPlan ? -1 : 1;

  return (
    <group scale={[scaleX, 1, 1]}>

      {/* ── Floor slab ────────────────────────────────────────── */}
      {slabShape ? (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <extrudeGeometry args={[slabShape, { depth: floorThick, bevelEnabled: false }]} />
          <meshStandardMaterial color={roofColor} roughness={0.5} metalness={0.3} />
        </mesh>
      ) : (
        <mesh position={[0, floorThick / 2, 0]} receiveShadow>
          <boxGeometry args={[width + 0.04, floorThick, depth + 0.04]} />
          <meshStandardMaterial color={roofColor} roughness={0.5} metalness={0.3} />
        </mesh>
      )}

      {/* Walkable floor */}
      <mesh position={[0, floorThick + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width - wallThick * 2, depth - wallThick * 2]} />
        <meshStandardMaterial color="#c9a97e" roughness={0.65} />
      </mesh>

      {/* ── Roof slab ─────────────────────────────────────────── */}
      {slabShape ? (
        <mesh position={[0, height + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <extrudeGeometry args={[slabShape, { depth: roofThick, bevelEnabled: false }]} />
          <meshStandardMaterial {...claddingProps} />
        </mesh>
      ) : (
        <mesh position={[0, height + roofThick / 2 + 0.003, 0]} castShadow>
          <boxGeometry args={[width, roofThick, depth]} />
          <meshStandardMaterial {...claddingProps} />
        </mesh>
      )}

      {/* ── Back wall ─────────────────────────────────────────── */}
      <mesh position={[0, height / 2 + floorThick, -depth / 2 + wallThick / 2]} castShadow>
        <boxGeometry args={[width - cornerRadius * 2, height, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>

      {/* ── Right wall ────────────────────────────────────────── */}
      <mesh position={[width / 2 - wallThick / 2, height / 2 + floorThick, 0]} castShadow>
        <boxGeometry args={[wallThick, height, depth - cornerRadius * 2]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>

      {/* ── Left wall ─────────────────────────────────────────── */}
      <mesh position={[-width / 2 + wallThick / 2, height / 2 + floorThick, 0]} castShadow>
        <boxGeometry args={[wallThick, height, depth - cornerRadius * 2]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>

      {/* ── Rounded corners (solid wedge per corner) ──────────── */}
      {cornerShapes && cornerShapes.map(({ shape, posX, posZ }, i) => (
        // Rx(+PI/2): shape XY → XZ plane; extrusion goes from floorThick+height DOWN to floorThick
        <mesh key={i} position={[posX, floorThick + height, posZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
          <meshStandardMaterial {...claddingProps} />
        </mesh>
      ))}

      {/* ── Interior ceiling ──────────────────────────────────── */}
      <mesh position={[0, height + floorThick - 0.01, 0]}>
        <boxGeometry args={[width - wallThick * 2, 0.02, depth - wallThick * 2]} />
        <meshStandardMaterial color="#eceae6" roughness={0.95} />
      </mesh>

      {/* ── Interior back wall visible surface ────────────────── */}
      <mesh position={[0, height / 2 + floorThick, -depth / 2 + wallThick + 0.01]}>
        <boxGeometry args={[width - wallThick * 2, height, 0.01]} />
        <meshStandardMaterial color="#e8e5e0" roughness={0.9} />
      </mesh>

      {/* ── Interior lighting ─────────────────────────────────── */}
      <pointLight position={[0, height * 0.85 + floorThick, -depth * 0.1]} intensity={1.4} color="#fff8f0" distance={9} decay={2} />
      <pointLight position={[0, height * 0.85 + floorThick,  depth * 0.2]} intensity={0.7} color="#fffaf5" distance={6} decay={2} />

      {/* ── FRONT FACADE ──────────────────────────────────────── */}
      <group position={[0, floorThick, depth / 2 - wallThick / 2]}>

        {/* Starting pillar (left) */}
        <mesh position={[flatStartX + PILLAR_W / 2, height / 2, 0]} castShadow>
          <boxGeometry args={[PILLAR_W, height, wallThick]} />
          <meshStandardMaterial {...claddingProps} />
        </mesh>

        {/* Room 1 — large window (or solid if studio open plan skip) */}
        {roomSplit < 100 ? (
          <>
            {/* Sill below window */}
            <mesh position={[room1CX, winBot / 2, 0]} castShadow>
              <boxGeometry args={[room1Width, winBot, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            {/* Header above window */}
            <mesh position={[room1CX, winTop + (height - winTop) / 2, 0]} castShadow>
              <boxGeometry args={[room1Width, height - winTop, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            {/* Glass */}
            <GlassPane posX={room1CX} posY={winCY} width={room1Width} height={winH} frameColor={frameColor} hasDivider />

            {/* Room 2 partition pillar */}
            <mesh position={[room2StartX + PILLAR_W / 2, height / 2, 0]} castShadow>
              <boxGeometry args={[PILLAR_W, height, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>

            {/* Room 2 — door + window */}
            <Room2Facade
              room2StartX={room2StartX}
              room2Width={room2Width}
              height={height}
              wallThick={wallThick}
              winBot={winBot}
              winTop={winTop}
              winCY={winCY}
              winH={winH}
              flatEndX={flatEndX}
              PILLAR_W={PILLAR_W}
              DOOR_W={DOOR_W}
              frameColor={frameColor}
              claddingProps={claddingProps}
              floorThick={floorThick}
            />
          </>
        ) : (
          // Studio: full panoramic window
          <>
            <mesh position={[room1CX, winBot / 2, 0]} castShadow>
              <boxGeometry args={[flatWidth - PILLAR_W, winBot, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            <mesh position={[room1CX, winTop + (height - winTop) / 2, 0]} castShadow>
              <boxGeometry args={[flatWidth - PILLAR_W, height - winTop, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            <GlassPane posX={room1CX} posY={winCY} width={flatWidth - PILLAR_W} height={winH} frameColor={frameColor} hasDivider />
            {/* End pillar */}
            <mesh position={[flatEndX - PILLAR_W / 2, height / 2, 0]} castShadow>
              <boxGeometry args={[PILLAR_W, height, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
          </>
        )}
      </group>

      {/* ── Room divider (not for studio) ─────────────────────── */}
      {roomSplit < 100 && (
        <mesh position={[room2StartX + PILLAR_W / 2, height / 2 + floorThick, 0]}>
          <boxGeometry args={[0.06, height, depth - wallThick * 2]} />
          <meshStandardMaterial color="#e0ddd8" roughness={0.92} />
        </mesh>
      )}

    </group>
  );
}

// ─── Glass pane with frame ────────────────────────────────────────────────────
function GlassPane({
  posX, posY, width, height, frameColor, hasDivider,
}: {
  posX: number; posY: number; width: number; height: number; frameColor: string; hasDivider?: boolean;
}) {
  const fw = 0.036;
  return (
    <group position={[posX, posY, 0]}>
      {(
        [
          [0,  height / 2 - fw / 2, 0, width, fw, 0.06],
          [0, -height / 2 + fw / 2, 0, width, fw, 0.06],
          [-width / 2 + fw / 2, 0, 0, fw, height, 0.06],
          [ width / 2 - fw / 2, 0, 0, fw, height, 0.06],
          ...(hasDivider ? [[0, 0, 0.004, fw, height - fw * 2, 0.05]] : []),
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, z, bw, bh, bd], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[bw, bh, bd]} />
          <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.65} />
        </mesh>
      ))}
      {/* Glass */}
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[width - fw * 2, height - fw * 2, 0.006]} />
        <meshPhysicalMaterial
          color="#c5d8e0"
          roughness={0.01}
          metalness={0.0}
          transmission={0.94}
          thickness={0.12}
          ior={1.52}
          transparent
          opacity={0.22}
          envMapIntensity={2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── Room 2 facade sub-component ─────────────────────────────────────────────
function Room2Facade({
  room2StartX, room2Width, height, wallThick, winBot, winTop, winCY, winH,
  flatEndX, PILLAR_W, DOOR_W, frameColor, claddingProps, floorThick,
}: any) {
  const r2Content = room2Width - PILLAR_W * 2;
  const doorCX    = room2StartX + PILLAR_W + DOOR_W / 2;
  const win2W     = r2Content - DOOR_W - PILLAR_W;
  const win2CX    = room2StartX + PILLAR_W + DOOR_W + PILLAR_W + win2W / 2;

  return (
    <>
      {/* Door sill */}
      <mesh position={[doorCX, winBot / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_W, winBot, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      {/* Door header */}
      <mesh position={[doorCX, winTop + (height - winTop) / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_W, height - winTop, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      {/* Door glass */}
      <GlassPane posX={doorCX} posY={winCY} width={DOOR_W} height={winH} frameColor={frameColor} />
      {/* Step */}
      <mesh position={[doorCX, -floorThick * 0.5, wallThick + 0.18]} castShadow>
        <boxGeometry args={[DOOR_W + 0.15, floorThick, 0.32]} />
        <meshStandardMaterial color="#c0bbb5" roughness={0.6} />
      </mesh>

      {/* Middle pillar */}
      <mesh position={[room2StartX + PILLAR_W + DOOR_W + PILLAR_W / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[PILLAR_W, height, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>

      {/* Window 2 sill */}
      <mesh position={[win2CX, winBot / 2, 0]} castShadow>
        <boxGeometry args={[win2W, winBot, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      {/* Window 2 header */}
      <mesh position={[win2CX, winTop + (height - winTop) / 2, 0]} castShadow>
        <boxGeometry args={[win2W, height - winTop, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      {/* Window 2 glass */}
      <GlassPane posX={win2CX} posY={winCY} width={win2W} height={winH} frameColor={frameColor} hasDivider />

      {/* Final pillar */}
      <mesh position={[flatEndX - PILLAR_W / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[PILLAR_W, height, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
    </>
  );
}
