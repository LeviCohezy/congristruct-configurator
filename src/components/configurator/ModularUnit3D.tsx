import { useMemo } from "react";
import * as THREE from "three";
import type { ConfigState } from "@/hooks/useConfigurator";
import { getRoofColor } from "@/hooks/useConfigurator";

// ─── Facade props ─────────────────────────────────────────────────────────────
function getFacadeProps(facade: ConfigState["facade"]) {
  switch (facade) {
    case "thermowood-black":     return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
    case "thermowood-natural":   return { color: "#7a5728", roughness: 0.88, metalness: 0.0, isWood: true };
    case "composite-white":      return { color: "#ededea", roughness: 0.55, metalness: 0.04, isWood: false };
    case "composite-black":      return { color: "#1c1c1e", roughness: 0.58, metalness: 0.05, isWood: false };
    case "aluminium-anthracite": return { color: "#383a3b", roughness: 0.28, metalness: 0.80, isWood: false };
    case "aluminium-bronze":     return { color: "#6e4e2e", roughness: 0.26, metalness: 0.82, isWood: false };
    case "aluminium-white":      return { color: "#e8e6e2", roughness: 0.30, metalness: 0.75, isWood: false };
    case "brick-grey":           return { color: "#7a7a78", roughness: 0.95, metalness: 0.0, isWood: false };
    default:                     return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
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
    const tone = (Math.sin(i * 6.3) * 0.5 + Math.cos(i * 2.1) * 0.5) * 0.08;
    const col = base.clone().lerp(tone > 0 ? new THREE.Color("#fff") : new THREE.Color("#000"), Math.abs(tone));
    ctx.fillStyle = `#${col.getHexString()}`;
    ctx.fillRect(x, 0, pw, 1024);
    for (let g = 0; g < 12; g++) {
      const gx = x + Math.random() * pw;
      ctx.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
      ctx.fillRect(gx, 0, 1 + Math.random() * 1.5, 1024);
    }
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x + pw - 3, 0, 3, 1024);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// ─── Rounded shape ───────────────────────────────────────────────────────────
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
  const roofColor = getRoofColor(config.facade);
  const frameColor = fp.color === "#ededea" || fp.color === "#e8e6e2" ? "#1a1a1a" : "#080807";

  const plankTex = useMemo(
    () => createPlankTexture(fp.color, fp.isWood),
    [fp.color, fp.isWood]
  );

  // Dimensions — all 4m depth, variable width
  const { width, height, depth } = useMemo(() => {
    switch (config.model) {
      case "start": return { width: 3.5,  height: 3.0, depth: 4.0 };
      case "flow":  return { width: 6.0,  height: 3.0, depth: 4.0 };
      case "hub":   return { width: 8.75, height: 3.0, depth: 4.0 };
      case "base":  return { width: 12.5, height: 3.0, depth: 4.0 };
    }
  }, [config.model]);

  const cornerRadius  = config.roundedCorners ? 0.45 : 0.0;
  const wallThick     = 0.18;
  const roofThick     = 0.18;
  const floorThick    = 0.18;
  const PILLAR_W      = 0.38;

  // Window heights
  const winH    = height * 0.72;
  const winBot  = height * 0.09;
  const winTop  = winBot + winH;
  const winCY   = winBot + winH / 2;

  const slabShape = useMemo(
    () => (cornerRadius > 0 ? roundedRect(width, depth, cornerRadius) : null),
    [width, depth, cornerRadius]
  );

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
      { shape: make(0,           Math.PI * 0.5), posX:  width/2-cornerRadius, posZ:  depth/2-cornerRadius },
      { shape: make(Math.PI*0.5, Math.PI),       posX: -width/2+cornerRadius, posZ:  depth/2-cornerRadius },
      { shape: make(Math.PI,     Math.PI*1.5),   posX: -width/2+cornerRadius, posZ: -depth/2+cornerRadius },
      { shape: make(Math.PI*1.5, Math.PI*2),     posX:  width/2-cornerRadius, posZ: -depth/2+cornerRadius },
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

  /* ── START-specific wall/window/door layout from architectural plan ── */
  /* Back wall:  185 + 80(window) + 135 = 400cm
     Front wall: 96 + 200(window) + 104 = 400cm
     Right wall: 165 + 100(door) + 85 = 350cm
     Left wall:  solid (storage unit against it) */
  const isStart = config.model === "start";

  // Convert cm to 3D units for the START model
  const cmToUnit = (cm: number) => (cm / 400) * width; // width maps to 400cm
  const cmToDepth = (cm: number) => (cm / 350) * depth; // depth maps to 350cm

  return (
    <group scale={[scaleX, 1, 1]}>

      {/* ── Floor slab ── */}
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

      {/* ── Roof slab ── */}
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

      {/* ── Rounded corners ── */}
      {cornerShapes && cornerShapes.map(({ shape, posX, posZ }, i) => (
        <mesh key={i} position={[posX, floorThick + height, posZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
          <meshStandardMaterial {...claddingProps} />
        </mesh>
      ))}

      {/* ── Interior ceiling — white box just under roof slab ── */}
      <mesh position={[0, height - 0.03, 0]}>
        <boxGeometry args={[width - wallThick * 2, 0.04, depth - wallThick * 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>

      {/* ── Interior lighting ── */}
      <pointLight position={[0, height * 0.85 + floorThick, -depth * 0.1]} intensity={1.4} color="#fff8f0" distance={9} decay={2} />
      <pointLight position={[0, height * 0.85 + floorThick,  depth * 0.2]} intensity={0.7} color="#fffaf5" distance={6} decay={2} />

      {isStart ? (
        <StartWalls
          width={width} height={height} depth={depth}
          wallThick={wallThick} floorThick={floorThick}
          cornerRadius={cornerRadius}
          winH={winH} winBot={winBot} winTop={winTop} winCY={winCY}
          claddingProps={claddingProps} frameColor={frameColor}
          cmToUnit={cmToUnit} cmToDepth={cmToDepth}
          floorPlan={config.floorPlan}
        />
      ) : (
        <GenericWalls
          width={width} height={height} depth={depth}
          wallThick={wallThick} floorThick={floorThick}
          cornerRadius={cornerRadius}
          winH={winH} winBot={winBot} winTop={winTop} winCY={winCY}
          PILLAR_W={PILLAR_W}
          claddingProps={claddingProps} frameColor={frameColor}
          floorPlan={config.floorPlan}
          model={config.model}
        />
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   START model walls — windows & door placed per architectural plan
   ═══════════════════════════════════════════════════════════════════════ */
function StartWalls({
  width, height, depth, wallThick, floorThick, cornerRadius,
  winH, winBot, winTop, winCY,
  claddingProps, frameColor,
  cmToUnit, cmToDepth, floorPlan,
}: any) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const flatW = width - cornerRadius * 2;

  // ── Back wall (Z = -depth/2): window 80cm wide, starts at 185cm from left ──
  const backWinW = cmToUnit(80);
  const backWinCenterX = -halfW + cmToUnit(185) + backWinW / 2;

  // Back wall segments — full size to corners
  const backLeftW = cmToUnit(185) - cornerRadius;
  const backRightW = cmToUnit(135) - cornerRadius;
  const backLeftCX = -halfW + cornerRadius + backLeftW / 2;
  const backRightCX = halfW - cornerRadius - backRightW / 2;

  // ── Front wall (Z = +depth/2): window 200cm, starts at 96cm from left ──
  const frontWinW = cmToUnit(200);
  const frontWinCenterX = -halfW + cmToUnit(96) + frontWinW / 2;
  const frontLeftW = cmToUnit(96) - cornerRadius;
  const frontRightW = cmToUnit(104) - cornerRadius;
  const frontLeftCX = -halfW + cornerRadius + frontLeftW / 2;
  const frontRightCX = halfW - cornerRadius - frontRightW / 2;

  // Inset so side walls sit between front/back walls (avoids z-fighting overlap)
  const sideInset = Math.max(cornerRadius, wallThick);

  // ── Right wall (X = +width/2): door 100cm, starts 165cm from back (top) ──
  const doorH = cmToDepth(100);
  const doorStartZ = -halfD + cmToDepth(165);
  const doorCenterZ = doorStartZ + doorH / 2;
  const rightTopH = cmToDepth(165) - sideInset;
  const rightBotH = cmToDepth(85) - sideInset;
  const rightTopCZ = -halfD + sideInset + rightTopH / 2;
  const rightBotCZ = halfD - sideInset - rightBotH / 2;

  // ── Left wall: fully solid ──
  const leftFlatD = depth - sideInset * 2;

  // Interior white walls: always clipped to wallThick inset (never extend past outer wall)
  const intLeftD = depth - wallThick * 2;
  const intBackLeftW = cmToUnit(185) - wallThick;
  const intBackLeftCX = -halfW + wallThick + intBackLeftW / 2;
  const intBackRightW = cmToUnit(135) - wallThick;
  const intBackRightCX = halfW - wallThick - intBackRightW / 2;
  const intFrontLeftW = cmToUnit(96) - wallThick;
  const intFrontLeftCX = -halfW + wallThick + intFrontLeftW / 2;
  const intFrontRightW = cmToUnit(104) - wallThick;
  const intFrontRightCX = halfW - wallThick - intFrontRightW / 2;
  const intRightTopH = cmToDepth(165) - wallThick;
  const intRightTopCZ = -halfD + wallThick + intRightTopH / 2;
  const intRightBotH = cmToDepth(85) - wallThick;
  const intRightBotCZ = halfD - wallThick - intRightBotH / 2;

  return (
    <group>
      {/* ── LEFT WALL — solid ── */}
      <mesh position={[-halfW + wallThick / 2, height / 2 + floorThick, 0]} castShadow>
        <boxGeometry args={[wallThick, height, leftFlatD]} />
        <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Interior left wall */}
      <mesh position={[-halfW + wallThick + 0.005, height / 2 + floorThick, 0]}>
        <boxGeometry args={[0.01, height, intLeftD]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* ── BACK WALL — 3 segments + window (front-priority: negative offset) ── */}
      {backLeftW > 0.01 && (
        <mesh position={[backLeftCX, height / 2 + floorThick, -halfD + wallThick / 2]} castShadow>
          <boxGeometry args={[backLeftW, height, wallThick]} />
          <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}
      {backRightW > 0.01 && (
        <mesh position={[backRightCX, height / 2 + floorThick, -halfD + wallThick / 2]} castShadow>
          <boxGeometry args={[backRightW, height, wallThick]} />
          <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}
      {/* Window area — spandrel below + header above + glass */}
      <mesh position={[backWinCenterX, winBot / 2 + floorThick, -halfD + wallThick / 2]} castShadow>
        <boxGeometry args={[backWinW, winBot, wallThick]} />
        <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh position={[backWinCenterX, winTop + (height - winTop) / 2 + floorThick, -halfD + wallThick / 2]} castShadow>
        <boxGeometry args={[backWinW, height - winTop, wallThick]} />
        <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <GlassPane posX={backWinCenterX} posY={winCY + floorThick} width={backWinW} height={winH} frameColor={frameColor} z={-halfD + wallThick / 2} />
      {/* Interior back wall — split around window */}
      {intBackLeftW > 0.01 && (
        <mesh position={[intBackLeftCX, height / 2 + floorThick, -halfD + wallThick + 0.01]}>
          <boxGeometry args={[intBackLeftW, height, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      )}
      {intBackRightW > 0.01 && (
        <mesh position={[intBackRightCX, height / 2 + floorThick, -halfD + wallThick + 0.01]}>
          <boxGeometry args={[intBackRightW, height, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      )}
      {/* Interior back wall — above & below window */}
      <mesh position={[backWinCenterX, winBot / 2 + floorThick, -halfD + wallThick + 0.005]}>
        <boxGeometry args={[backWinW, winBot, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[backWinCenterX, winTop + (height - winTop) / 2 + floorThick, -halfD + wallThick + 0.005]}>
        <boxGeometry args={[backWinW, height - winTop, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* ── FRONT WALL — 2 solid segments + big window (front-priority: negative offset) ── */}
      {frontLeftW > 0.01 && (
        <mesh position={[frontLeftCX, height / 2 + floorThick, halfD - wallThick / 2]} castShadow>
          <boxGeometry args={[frontLeftW, height, wallThick]} />
          <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}
      {frontRightW > 0.01 && (
        <mesh position={[frontRightCX, height / 2 + floorThick, halfD - wallThick / 2]} castShadow>
          <boxGeometry args={[frontRightW, height, wallThick]} />
          <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}
      {/* Window spandrel + header */}
      <mesh position={[frontWinCenterX, winBot / 2 + floorThick, halfD - wallThick / 2]} castShadow>
        <boxGeometry args={[frontWinW, winBot, wallThick]} />
        <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh position={[frontWinCenterX, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick / 2]} castShadow>
        <boxGeometry args={[frontWinW, height - winTop, wallThick]} />
        <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <GlassPane posX={frontWinCenterX} posY={winCY + floorThick} width={frontWinW} height={winH} frameColor={frameColor} z={halfD - wallThick / 2} />
      {/* Interior front wall segments */}
      {intFrontLeftW > 0.01 && (
        <mesh position={[intFrontLeftCX, height / 2 + floorThick, halfD - wallThick - 0.005]}>
          <boxGeometry args={[intFrontLeftW, height, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      )}
      {intFrontRightW > 0.01 && (
        <mesh position={[intFrontRightCX, height / 2 + floorThick, halfD - wallThick - 0.005]}>
          <boxGeometry args={[intFrontRightW, height, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      )}
      {/* Interior front — above & below window */}
      <mesh position={[frontWinCenterX, winBot / 2 + floorThick, halfD - wallThick - 0.005]}>
        <boxGeometry args={[frontWinW, winBot, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[frontWinCenterX, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick - 0.005]}>
        <boxGeometry args={[frontWinW, height - winTop, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* ── RIGHT WALL — 2 solid segments + door opening (floor to lintel) ── */}
      {rightTopH > 0.01 && (
        <mesh position={[halfW - wallThick / 2, height / 2 + floorThick, rightTopCZ]} castShadow>
          <boxGeometry args={[wallThick, height, rightTopH]} />
          <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      )}
      {rightBotH > 0.01 && (
        <mesh position={[halfW - wallThick / 2, height / 2 + floorThick, rightBotCZ]} castShadow>
          <boxGeometry args={[wallThick, height, rightBotH]} />
          <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      )}
      {/* Door header above opening */}
      <mesh position={[halfW - wallThick / 2, winTop + (height - winTop) / 2 + floorThick, doorCenterZ]} castShadow>
        <boxGeometry args={[wallThick, height - winTop, doorH]} />
        <meshStandardMaterial {...claddingProps} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Interior right wall segments */}
      {intRightTopH > 0.01 && (
        <mesh position={[halfW - wallThick - 0.005, height / 2 + floorThick, intRightTopCZ]}>
          <boxGeometry args={[0.01, height, intRightTopH]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      )}
      {intRightBotH > 0.01 && (
        <mesh position={[halfW - wallThick - 0.005, height / 2 + floorThick, intRightBotCZ]}>
          <boxGeometry args={[0.01, height, intRightBotH]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      )}
      {/* Interior right — door header */}
      <mesh position={[halfW - wallThick - 0.005, winTop + (height - winTop) / 2 + floorThick, doorCenterZ]}>
        <boxGeometry args={[0.01, height - winTop, doorH]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Door — full height from floor to lintel */}
      <DoorPane
        posX={halfW - wallThick / 2} posY={floorThick + winTop / 2}
        width={doorH} height={winTop}
        frameColor={frameColor} z={doorCenterZ}
      />
      {/* Door step */}
      <mesh position={[halfW + 0.18, floorThick / 2, doorCenterZ]} castShadow>
        <boxGeometry args={[0.32, floorThick, doorH + 0.15]} />
        <meshStandardMaterial color="#c0bbb5" roughness={0.6} />
      </mesh>

      {/* ── Plan B: toilet partition in back-right corner ── */}
      {floorPlan === "b" && (() => {
        // Shift partition 15cm right of back window edge (265+15=280cm) for a gap
        const partX = -halfW + cmToUnit(280);
        const partDepth = cmToDepth(130);
        const partWallT = 0.08;
        const horizW = halfW - partX - partWallT / 2 - wallThick;
        const horizCX = partX + partWallT / 2 + horizW / 2;
        const horizZ = -halfD + wallThick + partDepth;

        // Door in horizontal wall: 70cm wide
        const doorW3D = cmToUnit(90);
        const doorH3D = height * 0.82;
        const doorCenterLocal = horizW / 2;
        const leftSegW = doorCenterLocal - doorW3D / 2;
        const rightSegW = horizW - doorCenterLocal - doorW3D / 2;
        const leftSegCX = partX + partWallT / 2 + leftSegW / 2;
        const rightSegCX = partX + partWallT / 2 + doorCenterLocal + doorW3D / 2 + rightSegW / 2;
        const doorAbsX = partX + partWallT / 2 + doorCenterLocal;
        const headerH = height - doorH3D;

        return (
          <group>
            {/* Vertical partition wall */}
            <mesh position={[partX, height / 2 + floorThick, -halfD + wallThick + partDepth / 2]}>
              <boxGeometry args={[partWallT, height, partDepth]} />
              <meshStandardMaterial color="#ffffff" roughness={0.92} />
            </mesh>
            {/* Horizontal wall — left of door */}
            {leftSegW > 0.01 && (
              <mesh position={[leftSegCX, height / 2 + floorThick, horizZ]}>
                <boxGeometry args={[leftSegW, height, partWallT]} />
                <meshStandardMaterial color="#ffffff" roughness={0.92} />
              </mesh>
            )}
            {/* Horizontal wall — right of door */}
            {rightSegW > 0.01 && (
              <mesh position={[rightSegCX, height / 2 + floorThick, horizZ]}>
                <boxGeometry args={[rightSegW, height, partWallT]} />
                <meshStandardMaterial color="#ffffff" roughness={0.92} />
              </mesh>
            )}
            {/* Door header */}
            <mesh position={[doorAbsX, doorH3D + headerH / 2 + floorThick, horizZ]}>
              <boxGeometry args={[doorW3D, headerH, partWallT]} />
              <meshStandardMaterial color="#ffffff" roughness={0.92} />
            </mesh>
            {/* Door frame — left jamb */}
            <mesh position={[doorAbsX - doorW3D / 2 - 0.015, doorH3D / 2 + floorThick, horizZ]}>
              <boxGeometry args={[0.03, doorH3D, partWallT + 0.01]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Door frame — right jamb */}
            <mesh position={[doorAbsX + doorW3D / 2 + 0.015, doorH3D / 2 + floorThick, horizZ]}>
              <boxGeometry args={[0.03, doorH3D, partWallT + 0.01]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Door frame — top */}
            <mesh position={[doorAbsX, doorH3D + floorThick + 0.015, horizZ]}>
              <boxGeometry args={[doorW3D + 0.06, 0.03, partWallT + 0.01]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Door panel (solid white) */}
            <mesh position={[doorAbsX, doorH3D / 2 + floorThick, horizZ]}>
              <boxGeometry args={[doorW3D - 0.02, doorH3D - 0.02, 0.035]} />
              <meshStandardMaterial color="#f5f5f5" roughness={0.85} />
            </mesh>
            {/* Door handle */}
            <mesh position={[doorAbsX + doorW3D / 2 - 0.06, doorH3D * 0.48 + floorThick, horizZ + 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
              <meshStandardMaterial color="#aaa" roughness={0.25} metalness={0.8} />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
}

// ─── Glass pane ───────────────────────────────────────────────────────────────
function GlassPane({
  posX, posY, width, height, frameColor, hasDivider, z = 0, rotate,
}: {
  posX: number; posY: number; width: number; height: number; frameColor: string;
  hasDivider?: boolean; z?: number; rotate?: boolean;
}) {
  const fw = 0.036;
  const rotation: [number, number, number] = rotate ? [0, Math.PI / 2, 0] : [0, 0, 0];
  return (
    <group position={[posX, posY, z]} rotation={rotation}>
      {(
        [
          [0,  height / 2 - fw / 2, 0, width, fw, 0.06],
          [0, -height / 2 + fw / 2, 0, width, fw, 0.06],
          [-width / 2 + fw / 2, 0, 0, fw, height, 0.06],
          [ width / 2 - fw / 2, 0, 0, fw, height, 0.06],
          ...(hasDivider ? [[0, 0, 0.004, fw, height - fw * 2, 0.05]] : []),
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, zz, bw, bh, bd], i) => (
        <mesh key={i} position={[x, y, zz]} castShadow>
          <boxGeometry args={[bw, bh, bd]} />
          <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.65} />
        </mesh>
      ))}
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

// ─── Door pane (full height, with handle) ─────────────────────────────────────
function DoorPane({
  posX, posY, width, height, frameColor, z,
}: {
  posX: number; posY: number; width: number; height: number; frameColor: string; z: number;
}) {
  const fw = 0.036;
  return (
    <group position={[posX, posY, z]} rotation={[0, Math.PI / 2, 0]}>
      {/* Frame */}
      {([
        [0,  height / 2 - fw / 2, 0, width, fw, 0.06],
        [0, -height / 2 + fw / 2, 0, width, fw, 0.06],
        [-width / 2 + fw / 2, 0, 0, fw, height, 0.06],
        [ width / 2 - fw / 2, 0, 0, fw, height, 0.06],
      ] as [number, number, number, number, number, number][]).map(([x, y, zz, bw, bh, bd], i) => (
        <mesh key={i} position={[x, y, zz]} castShadow>
          <boxGeometry args={[bw, bh, bd]} />
          <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.65} />
        </mesh>
      ))}
      {/* Glass */}
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[width - fw * 2, height - fw * 2, 0.006]} />
        <meshPhysicalMaterial
          color="#c5d8e0" roughness={0.01} metalness={0.0}
          transmission={0.94} thickness={0.12} ior={1.52}
          transparent opacity={0.22} envMapIntensity={2} side={THREE.DoubleSide}
        />
      </mesh>
      {/* Door handle — right side, at ~1m height from bottom */}
      <group position={[width / 2 - fw - 0.06, -height / 2 + 1.0, 0.04]}>
        {/* Handle bar */}
        <mesh castShadow>
          <boxGeometry args={[0.02, 0.14, 0.04]} />
          <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Handle base plate */}
        <mesh position={[0, 0, -0.015]}>
          <boxGeometry args={[0.04, 0.2, 0.01]} />
          <meshStandardMaterial color="#777" roughness={0.25} metalness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Generic walls for FLOW / HUB / BASE ─────────────────────────────────────
function GenericWalls({
  width, height, depth, wallThick, floorThick, cornerRadius,
  winH, winBot, winTop, winCY, PILLAR_W,
  claddingProps, frameColor, floorPlan, model,
}: any) {
  const sideInset = Math.max(cornerRadius, wallThick);
  const hasDivider = floorPlan === "b";
  const roomSplit = hasDivider ? 55 : 100;
  const flatStartX = -width / 2 + cornerRadius;
  const flatEndX = width / 2 - cornerRadius;
  const flatWidth = flatEndX - flatStartX;
  const usableWidth = flatWidth - PILLAR_W;
  const room1Width = usableWidth * (roomSplit / 100);
  const room2Width = usableWidth * (1 - roomSplit / 100);
  const room1CX = flatStartX + PILLAR_W + room1Width / 2;
  const room2StartX = flatStartX + PILLAR_W + room1Width;
  const DOOR_W = 1.05;
  const sideFlatD = depth - sideInset * 2;

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, height / 2 + floorThick, -depth / 2 + wallThick / 2]} castShadow>
        <boxGeometry args={[width - cornerRadius * 2, height, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2 - wallThick / 2, height / 2 + floorThick, 0]} castShadow>
        <boxGeometry args={[wallThick, height, sideFlatD]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2 + wallThick / 2, height / 2 + floorThick, 0]} castShadow>
        <boxGeometry args={[wallThick, height, sideFlatD]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      {/* Interior back wall */}
      <mesh position={[0, height / 2 + floorThick, -depth / 2 + wallThick + 0.01]}>
        <boxGeometry args={[width - wallThick * 2, height, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Front facade */}
      <group position={[0, floorThick, depth / 2 - wallThick / 2]}>
        <mesh position={[flatStartX + PILLAR_W / 2, height / 2, 0]} castShadow>
          <boxGeometry args={[PILLAR_W, height, wallThick]} />
          <meshStandardMaterial {...claddingProps} />
        </mesh>

        {roomSplit < 100 ? (
          <>
            <mesh position={[room1CX, winBot / 2, 0]} castShadow>
              <boxGeometry args={[room1Width, winBot, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            <mesh position={[room1CX, winTop + (height - winTop) / 2, 0]} castShadow>
              <boxGeometry args={[room1Width, height - winTop, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            <GlassPane posX={room1CX} posY={winCY} width={room1Width} height={winH} frameColor={frameColor} hasDivider />
            <mesh position={[room2StartX + PILLAR_W / 2, height / 2, 0]} castShadow>
              <boxGeometry args={[PILLAR_W, height, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            <Room2Facade
              room2StartX={room2StartX} room2Width={room2Width}
              height={height} wallThick={wallThick}
              winBot={winBot} winTop={winTop} winCY={winCY} winH={winH}
              flatEndX={flatEndX} PILLAR_W={PILLAR_W} DOOR_W={DOOR_W}
              frameColor={frameColor} claddingProps={claddingProps} floorThick={floorThick}
            />
          </>
        ) : (
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
            <mesh position={[flatEndX - PILLAR_W / 2, height / 2, 0]} castShadow>
              <boxGeometry args={[PILLAR_W, height, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
          </>
        )}
      </group>

      {/* Room divider */}
      {hasDivider && (
        <mesh position={[room2StartX + PILLAR_W / 2, height / 2 + floorThick, 0]}>
          <boxGeometry args={[0.06, height, depth - wallThick * 2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.92} />
        </mesh>
      )}
    </group>
  );
}

// ─── Room 2 facade ────────────────────────────────────────────────────────────
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
      <mesh position={[doorCX, winBot / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_W, winBot, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      <mesh position={[doorCX, winTop + (height - winTop) / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_W, height - winTop, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      <GlassPane posX={doorCX} posY={winCY} width={DOOR_W} height={winH} frameColor={frameColor} />
      <mesh position={[doorCX, -floorThick * 0.5, wallThick + 0.18]} castShadow>
        <boxGeometry args={[DOOR_W + 0.15, floorThick, 0.32]} />
        <meshStandardMaterial color="#c0bbb5" roughness={0.6} />
      </mesh>

      <mesh position={[room2StartX + PILLAR_W + DOOR_W + PILLAR_W / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[PILLAR_W, height, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>

      <mesh position={[win2CX, winBot / 2, 0]} castShadow>
        <boxGeometry args={[win2W, winBot, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      <mesh position={[win2CX, winTop + (height - winTop) / 2, 0]} castShadow>
        <boxGeometry args={[win2W, height - winTop, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
      <GlassPane posX={win2CX} posY={winCY} width={win2W} height={winH} frameColor={frameColor} hasDivider />

      <mesh position={[flatEndX - PILLAR_W / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[PILLAR_W, height, wallThick]} />
        <meshStandardMaterial {...claddingProps} />
      </mesh>
    </>
  );
}
