import { useMemo } from "react";
import * as THREE from "three";
import type { ConfigState } from "@/hooks/useConfigurator";
import { getRoofColor } from "@/hooks/useConfigurator";

// ─── Facade props ─────────────────────────────────────────────────────────────
function getFacadeProps(facade: ConfigState["facade"]) {
  switch (facade) {
    case "thermowood-black":
      return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
    case "thermowood-natural":
      return { color: "#cea67c", roughness: 0.78, metalness: 0.0, isWood: false };
    case "composite-white":
      return { color: "#ededea", roughness: 0.55, metalness: 0.04, isWood: false };
    case "composite-black":
      return { color: "#1c1c1e", roughness: 0.58, metalness: 0.05, isWood: false };
    case "aluminium-anthracite":
      return { color: "#383a3b", roughness: 0.28, metalness: 0.8, isWood: false };
    case "aluminium-bronze":
      return { color: "#6e4e2e", roughness: 0.26, metalness: 0.82, isWood: false };
    case "aluminium-white":
      return { color: "#e8e6e2", roughness: 0.3, metalness: 0.75, isWood: false };
    case "brick-grey":
      return { color: "#7a7a78", roughness: 0.95, metalness: 0.0, isWood: false };
    default:
      return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
  }
}

// ─── Plank texture ────────────────────────────────────────────────────────────
function createPlankTexture(baseColor: string, isWood: boolean): THREE.CanvasTexture | null {
  if (!isWood) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d")!;
  const base = new THREE.Color(baseColor);

  // 1. Background (The "gap" color)
  ctx.fillStyle = "#110d0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Plank Dimensions (Narrow vertical slats)
  const numPlanks = 42;
  const pw = canvas.width / numPlanks;
  const gapW = pw * 0.15;

  for (let i = 0; i < numPlanks; i++) {
    const x = i * pw;

    // 3. Color Variation (Scalar shift only, no hue change)
    const col = base.clone();
    const lightShift = (Math.random() - 0.5) * 0.1; // +/- 10% brightness
    col.multiplyScalar(1 + lightShift);

    // 4. Draw Slat
    ctx.fillStyle = `#${col.getHexString()}`;
    ctx.fillRect(x, 0, pw - gapW, canvas.height);

    // 5. Vertical Grain (Subtle dark lines)
    for (let g = 0; g < 12; g++) {
      const gx = x + Math.random() * (pw - gapW);
      const gw = 0.5 + Math.random() * 1.5;
      const opacity = 0.03 + Math.random() * 0.07;
      ctx.fillStyle = `rgba(0,0,0,${opacity})`;
      ctx.fillRect(gx, 0, gw, canvas.height);
    }

    // 6. 3D Edge Shadows
    // Left edge shadow
    const gradShadow = ctx.createLinearGradient(x, 0, x + pw * 0.12, 0);
    gradShadow.addColorStop(0, "rgba(0,0,0,0.25)");
    gradShadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradShadow;
    ctx.fillRect(x, 0, pw * 0.12, canvas.height);

    // Right edge highlight
    const gradLight = ctx.createLinearGradient(x + pw - gapW - pw * 0.1, 0, x + pw - gapW, 0);
    gradLight.addColorStop(0, "rgba(255,255,255,0)");
    gradLight.addColorStop(1, "rgba(255,255,255,0.1)");
    ctx.fillStyle = gradLight;
    ctx.fillRect(x + pw - gapW - pw * 0.1, 0, pw * 0.1, canvas.height);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1); // Controls the density of the vertical lines
  return tex;
}

// ─── Rounded shape ───────────────────────────────────────────────────────────
function roundedRect(w: number, d: number, r: number) {
  const s = new THREE.Shape();
  s.absarc(-w / 2 + r, -d / 2 + r, r, Math.PI, Math.PI * 1.5);
  s.absarc(w / 2 - r, -d / 2 + r, r, Math.PI * 1.5, 0);
  s.absarc(w / 2 - r, d / 2 - r, r, 0, Math.PI * 0.5);
  s.absarc(-w / 2 + r, d / 2 - r, r, Math.PI * 0.5, Math.PI);
  return s;
}

// ─── Main unit ────────────────────────────────────────────────────────────────
export function ModularUnit3D({ config }: { config: ConfigState }) {
  const fp = getFacadeProps(config.facade);
  const roofColor = getRoofColor(config.facade);
  const frameColor = fp.color === "#ededea" || fp.color === "#e8e6e2" ? "#1a1a1a" : "#080807";

  const plankTex = useMemo(() => createPlankTexture(fp.color, fp.isWood), [fp.color, fp.isWood]);

  // Dimensions — all 4m depth, variable width
  const { width, height, depth } = useMemo(() => {
    switch (config.model) {
      case "start":
        return { width: 3.5, height: 3.0, depth: 4.0 };
      case "flow":
        return { width: 6.0, height: 3.0, depth: 4.0 };
      case "hub":
        return { width: 8.75, height: 3.0, depth: 4.0 };
      case "base":
        return { width: 12.5, height: 3.0, depth: 4.0 };
    }
  }, [config.model]);

  const cornerRadius = config.roundedCorners ? 0.45 : 0.0;
  const wallThick = 0.18;
  const roofThick = 0.18;
  const floorThick = 0.18;
  const PILLAR_W = 0.38;

  // Window heights
  const winH = height * 0.72;
  const winBot = height * 0.09;
  const winTop = winBot + winH;
  const winCY = winBot + winH / 2;

  const slabShape = useMemo(
    () => (cornerRadius > 0 ? roundedRect(width, depth, cornerRadius) : null),
    [width, depth, cornerRadius],
  );

  const cornerShapes = useMemo(() => {
    if (cornerRadius <= 0) return null;
    const innerR = cornerRadius - wallThick;
    const make = (start: number, end: number) => {
      const s = new THREE.Shape();
      // Outer arc
      s.absarc(0, 0, cornerRadius, start, end, false);
      // Inner arc (reverse direction to create hollow)
      s.absarc(0, 0, innerR, end, start, true);
      s.closePath();
      return s;
    };
    return [
      { shape: make(0, Math.PI * 0.5), posX: width / 2 - cornerRadius, posZ: depth / 2 - cornerRadius },
      { shape: make(Math.PI * 0.5, Math.PI), posX: -width / 2 + cornerRadius, posZ: depth / 2 - cornerRadius },
      { shape: make(Math.PI, Math.PI * 1.5), posX: -width / 2 + cornerRadius, posZ: -depth / 2 + cornerRadius },
      { shape: make(Math.PI * 1.5, Math.PI * 2), posX: width / 2 - cornerRadius, posZ: -depth / 2 + cornerRadius },
    ];
  }, [cornerRadius, width, depth]);

  const claddingProps = {
    color: fp.color,
    roughness: fp.roughness,
    metalness: fp.metalness,
    map: plankTex ?? undefined,
    bumpMap: plankTex ?? undefined,
    bumpScale: fp.isWood ? 0.04 : 0, // Increased from 0.012 for more depth
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

      {/* ── Rounded corners — exterior cladding ── */}
      {cornerShapes &&
        cornerShapes.map(({ shape, posX, posZ }, i) => (
          <mesh key={`ce${i}`} position={[posX, floorThick + height, posZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
            <meshStandardMaterial {...claddingProps} />
          </mesh>
        ))}
      {/* ── Rounded corners — white interior face ── */}
      {cornerShapes &&
        (() => {
          const innerR = cornerRadius - wallThick;
          const arcs: { start: number; end: number; posX: number; posZ: number }[] = [
            { start: 0, end: Math.PI * 0.5, posX: width / 2 - cornerRadius, posZ: depth / 2 - cornerRadius },
            { start: Math.PI * 0.5, end: Math.PI, posX: -width / 2 + cornerRadius, posZ: depth / 2 - cornerRadius },
            { start: Math.PI, end: Math.PI * 1.5, posX: -width / 2 + cornerRadius, posZ: -depth / 2 + cornerRadius },
            { start: Math.PI * 1.5, end: Math.PI * 2, posX: width / 2 - cornerRadius, posZ: -depth / 2 + cornerRadius },
          ];
          return arcs.map(({ start, end, posX, posZ }, i) => {
            // Thin curved shell on the inner radius
            const shell = new THREE.Shape();
            const shellThick = 0.01;
            shell.absarc(0, 0, innerR, start, end, false);
            shell.absarc(0, 0, innerR - shellThick, end, start, true);
            shell.closePath();
            return (
              <mesh key={`ci${i}`} position={[posX, floorThick + height, posZ]} rotation={[Math.PI / 2, 0, 0]}>
                <extrudeGeometry args={[shell, { depth: height, bevelEnabled: false }]} />
                <meshStandardMaterial color="#ffffff" roughness={0.92} side={THREE.DoubleSide} />
              </mesh>
            );
          });
        })()}

      {/* ── Interior ceiling — white box just under roof slab ── */}
      <mesh position={[0, height - 0.03, 0]}>
        <boxGeometry args={[width - wallThick * 2, 0.04, depth - wallThick * 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>

      {/* ── Interior lighting ── */}
      <pointLight
        position={[0, height * 0.85 + floorThick, -depth * 0.1]}
        intensity={1.4}
        color="#fff8f0"
        distance={9}
        decay={2}
      />
      <pointLight
        position={[0, height * 0.85 + floorThick, depth * 0.2]}
        intensity={0.7}
        color="#fffaf5"
        distance={6}
        decay={2}
      />

      {isStart ? (
        <StartWalls
          width={width}
          height={height}
          depth={depth}
          wallThick={wallThick}
          floorThick={floorThick}
          cornerRadius={cornerRadius}
          winH={winH}
          winBot={winBot}
          winTop={winTop}
          winCY={winCY}
          claddingProps={claddingProps}
          frameColor={frameColor}
          cmToUnit={cmToUnit}
          cmToDepth={cmToDepth}
          floorPlan={config.floorPlan}
        />
      ) : (
        <GenericWalls
          width={width}
          height={height}
          depth={depth}
          wallThick={wallThick}
          floorThick={floorThick}
          cornerRadius={cornerRadius}
          winH={winH}
          winBot={winBot}
          winTop={winTop}
          winCY={winCY}
          PILLAR_W={PILLAR_W}
          claddingProps={claddingProps}
          frameColor={frameColor}
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
  width,
  height,
  depth,
  wallThick,
  floorThick,
  cornerRadius,
  winH,
  winBot,
  winTop,
  winCY,
  claddingProps,
  frameColor,
  cmToUnit,
  cmToDepth,
  floorPlan,
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
      <GlassPane
        posX={backWinCenterX}
        posY={winCY + floorThick}
        width={backWinW}
        height={winH}
        frameColor={frameColor}
        z={-halfD + wallThick / 2}
      />
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
      <GlassPane
        posX={frontWinCenterX}
        posY={winCY + floorThick}
        width={frontWinW}
        height={winH}
        frameColor={frameColor}
        z={halfD - wallThick / 2}
      />
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
        posX={halfW - wallThick / 2}
        posY={floorThick + winTop / 2}
        width={doorH}
        height={winTop}
        frameColor={frameColor}
        z={doorCenterZ}
      />
      {/* Door step */}
      <mesh position={[halfW + 0.18, floorThick / 2, doorCenterZ]} castShadow>
        <boxGeometry args={[0.32, floorThick, doorH + 0.15]} />
        <meshStandardMaterial color="#c0bbb5" roughness={0.6} />
      </mesh>

      {/* ── Built-in bookshelf/cabinet ── */}
      {/* Open plan (A): against left wall, full wall length */}
      {/* Plan B: against back wall, left of window */}
      {(() => {
        const isLeftWall = floorPlan === "a";
        const shelfW = isLeftWall ? depth - 2 * wallThick : cmToUnit(140);
        const shelfD = 0.45;

        // Along-wall center, into-room center, back-panel position
        const shelfCenterAlongWall = isLeftWall ? 0 : -halfW + wallThick + shelfW / 2;
        const shelfCenterIntoRoom = isLeftWall ? -halfW + wallThick + shelfD / 2 : -halfD + wallThick + shelfD / 2;
        const backPanelPos = isLeftWall ? -halfW + wallThick + 0.06 : -halfD + wallThick + 0.06;

        // Positions: [X, Y, Z] differ based on wall orientation
        const pos = (along: number, y: number, into: number): [number, number, number] =>
          isLeftWall ? [into, y, along] : [along, y, into];
        // Box geometry: [alongWall, height, intoRoom] → need to swap for left wall
        const geo = (along: number, h: number, into: number): [number, number, number] =>
          isLeftWall ? [into, h, along] : [along, h, into];

        const cabinetColor = "#2a2118";
        const counterTop = height * 0.3;
        const nicheH = height * 0.3;
        const nicheTop = counterTop + nicheH;
        const upperH = height - nicheTop;
        const matProps = { color: cabinetColor, roughness: 0.75, metalness: 0.05 };
        const panelW = shelfW / 6;
        const openW = shelfW - panelW * 2;

        // Front face offset (for door lines)
        const frontFace = isLeftWall ? -halfW + wallThick + shelfD + 0.002 : -halfD + wallThick + shelfD + 0.002;
        const doorLinePos = (along: number, y: number): [number, number, number] =>
          isLeftWall ? [frontFace, y, along] : [along, y, frontFace];
        const doorLineGeo = (h: number): [number, number, number] =>
          isLeftWall ? [0.004, h, 0.008] : [0.008, h, 0.004];

        return (
          <group>
            {/* Full-height back panel */}
            <mesh position={pos(shelfCenterAlongWall, height / 2 + floorThick, backPanelPos)}>
              <boxGeometry args={geo(shelfW, height, 0.02)} />
              <meshStandardMaterial {...matProps} />
            </mesh>

            {/* Lower cabinet body */}
            <mesh position={pos(shelfCenterAlongWall, counterTop / 2 + floorThick, shelfCenterIntoRoom)}>
              <boxGeometry args={geo(shelfW, counterTop, shelfD)} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Counter surface */}
            <mesh position={pos(shelfCenterAlongWall, counterTop + 0.015 + floorThick, shelfCenterIntoRoom)}>
              <boxGeometry args={geo(shelfW + 0.02, 0.03, shelfD + 0.02)} />
              <meshStandardMaterial color="#1a1510" roughness={0.4} metalness={0.1} />
            </mesh>

            {/* Upper cabinets */}
            <mesh position={pos(shelfCenterAlongWall, nicheTop + upperH / 2 + floorThick, shelfCenterIntoRoom)}>
              <boxGeometry args={geo(shelfW, upperH, shelfD)} />
              <meshStandardMaterial {...matProps} />
            </mesh>

            {/* Niche — left closed panel (1/6th) */}
            <mesh
              position={pos(
                shelfCenterAlongWall - shelfW / 2 + panelW / 2,
                counterTop + nicheH / 2 + floorThick,
                shelfCenterIntoRoom,
              )}
            >
              <boxGeometry args={geo(panelW, nicheH, shelfD)} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Niche — right closed panel (1/6th) */}
            <mesh
              position={pos(
                shelfCenterAlongWall + shelfW / 2 - panelW / 2,
                counterTop + nicheH / 2 + floorThick,
                shelfCenterIntoRoom,
              )}
            >
              <boxGeometry args={geo(panelW, nicheH, shelfD)} />
              <meshStandardMaterial {...matProps} />
            </mesh>

            {/* Niche — dark back recess */}
            <mesh
              position={pos(shelfCenterAlongWall, counterTop + 0.03 + nicheH / 2 + floorThick, backPanelPos + 0.005)}
            >
              <boxGeometry args={geo(openW - 0.02, nicheH - 0.06, 0.01)} />
              <meshStandardMaterial color="#0e0a08" roughness={0.95} />
            </mesh>

            {/* Niche — middle shelf */}
            <mesh position={pos(shelfCenterAlongWall, counterTop + nicheH / 2 + floorThick, shelfCenterIntoRoom)}>
              <boxGeometry args={geo(openW - 0.02, 0.025, shelfD - 0.02)} />
              <meshStandardMaterial color="#1a1510" roughness={0.4} metalness={0.1} />
            </mesh>

            {/* Cabinet door lines (upper) */}
            {[0.33, 0.5, 0.67].map((frac, i) => (
              <mesh
                key={`u${i}`}
                position={doorLinePos(
                  shelfCenterAlongWall - shelfW / 2 + shelfW * frac,
                  nicheTop + upperH / 2 + floorThick,
                )}
              >
                <boxGeometry args={doorLineGeo(upperH - 0.02)} />
                <meshStandardMaterial color="#151010" roughness={0.5} />
              </mesh>
            ))}
            {/* Cabinet door lines (lower) */}
            {[0.33, 0.5, 0.67].map((frac, i) => (
              <mesh
                key={`l${i}`}
                position={doorLinePos(shelfCenterAlongWall - shelfW / 2 + shelfW * frac, counterTop / 2 + floorThick)}
              >
                <boxGeometry args={doorLineGeo(counterTop - 0.02)} />
                <meshStandardMaterial color="#151010" roughness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })()}

      {/* ── Office furniture: slab desk, chairs, iMac monitor ── */}
      {(() => {
        const isToilet = floorPlan === "b";
        const deskL = 1.5; // shorter to fit inside unit
        const deskW = 0.8;
        const deskH = 0.75;
        const topT = 0.04;
        const panelT = 0.04;
        const white = { color: "#f5f5f0", roughness: 0.25, metalness: 0.05 };
        const darkMetal = { color: "#2a2a2a", roughness: 0.4, metalness: 0.6 };
        const chairFabric = { color: "#5a504a", roughness: 0.9, metalness: 0.0 };

        const groupRot: [number, number, number] = isToilet ? [0, -Math.PI / 2, 0] : [0, 0, 0];
        const groupPos: [number, number, number] = isToilet ? [-halfW + wallThick + deskL / 2, 0, 0] : [0, 0, 0];

        const deskX = 0.1;
        const deskZ = 0.0;
        // After flipping group rotation, swap chairs back so they stay in original room positions
        const officeChairX = deskX - deskW / 2 - 0.4;
        const visitorX = deskX + deskW / 2 + 0.4;

        return (
          <group position={groupPos} rotation={groupRot}>
            {/* ── Slab Desk ── */}
            <mesh position={[deskX, deskH + floorThick, deskZ]} castShadow>
              <boxGeometry args={[deskW, topT, deskL]} />
              <meshStandardMaterial {...white} />
            </mesh>
            {/* Slab panel at +Z end */}
            <mesh position={[deskX, deskH / 2 + floorThick, deskZ + deskL / 2 - panelT / 2]}>
              <boxGeometry args={[deskW, deskH, panelT]} />
              <meshStandardMaterial {...white} />
            </mesh>
            {/* Slab panel at -Z end */}
            <mesh position={[deskX, deskH / 2 + floorThick, deskZ - deskL / 2 + panelT / 2]}>
              <boxGeometry args={[deskW, deskH, panelT]} />
              <meshStandardMaterial {...white} />
            </mesh>

            {/* ── iMac Monitor — corner, diagonal ── */}
            {(() => {
              const monX = deskX + deskW / 2 - 0.15;
              const monZ = deskZ - deskL / 2 + 0.25;
              const screenW = 0.54;
              const screenH = 0.34;
              const silver = { color: "#c8c8c8", roughness: 0.15, metalness: 0.7 };
              const rot: [number, number, number] = [0, -Math.PI * 0.25, 0];
              return (
                <group position={[monX, 0, monZ]} rotation={rot}>
                  <mesh position={[0, deskH + topT / 2 + 0.008 + floorThick, 0]}>
                    <boxGeometry args={[0.2, 0.008, 0.18]} />
                    <meshStandardMaterial {...silver} />
                  </mesh>
                  <mesh position={[0, deskH + topT / 2 + 0.1 + floorThick, 0]}>
                    <boxGeometry args={[0.06, 0.18, 0.02]} />
                    <meshStandardMaterial {...silver} />
                  </mesh>
                  <mesh position={[0, deskH + topT / 2 + 0.22 + screenH / 2 + floorThick, -0.01]}>
                    <boxGeometry args={[screenW, screenH, 0.02]} />
                    <meshStandardMaterial {...silver} />
                  </mesh>
                  <mesh position={[0, deskH + topT / 2 + 0.22 + screenH / 2 + floorThick, -0.01 + 0.012]}>
                    <boxGeometry args={[screenW - 0.03, screenH - 0.03, 0.002]} />
                    <meshStandardMaterial color="#1a1a2e" roughness={0.05} metalness={0.3} />
                  </mesh>
                </group>
              );
            })()}

            {/* Keyboard */}
            <mesh position={[deskX - 0.1, deskH + topT / 2 + 0.01 + floorThick, deskZ + 0.1]}>
              <boxGeometry args={[0.12, 0.012, 0.35]} />
              <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.4} />
            </mesh>

            {/* ── Office chair (-X side, facing +X) ── */}
            <group position={[officeChairX, 0, deskZ]}>
              <mesh position={[0, 0.05 + floorThick, 0]}>
                <cylinderGeometry args={[0.28, 0.28, 0.025, 16]} />
                <meshStandardMaterial {...darkMetal} />
              </mesh>
              <mesh position={[0, 0.24 + floorThick, 0]}>
                <cylinderGeometry args={[0.02, 0.025, 0.36, 8]} />
                <meshStandardMaterial {...darkMetal} />
              </mesh>
              <mesh position={[0, 0.44 + floorThick, 0]}>
                <cylinderGeometry args={[0.22, 0.24, 0.07, 16]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
              </mesh>
              <mesh position={[-0.18, 0.72 + floorThick, 0]}>
                <boxGeometry args={[0.05, 0.5, 0.42]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
              </mesh>
            </group>

            {/* ── 2 Visitor chairs (+X side, facing -X) ── */}
            {[-0.35, 0.35].map((offsetZ, ci) => (
              <group key={`vc${ci}`} position={[visitorX, 0, deskZ + offsetZ]}>
                {[
                  [-1, -1],
                  [1, -1],
                  [-1, 1],
                  [1, 1],
                ].map(([sx, sz], li) => (
                  <mesh key={`vl${li}`} position={[sx * 0.16, 0.21 + floorThick, sz * 0.16]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.42, 6]} />
                    <meshStandardMaterial {...darkMetal} />
                  </mesh>
                ))}
                <mesh position={[0, 0.44 + floorThick, 0]}>
                  <cylinderGeometry args={[0.21, 0.22, 0.06, 16]} />
                  <meshStandardMaterial {...chairFabric} />
                </mesh>
                <mesh position={[0.16, 0.68 + floorThick, 0]}>
                  <boxGeometry args={[0.04, 0.42, 0.38]} />
                  <meshStandardMaterial {...chairFabric} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })()}

      {/* ── Plan B: toilet partition in back-right corner ── */}
      {floorPlan === "b" &&
        (() => {
          // Shift partition 15cm right of back window edge (265+15=280cm) for a gap
          const partX = -halfW + cmToUnit(280);
          const partDepth = cmToDepth(130);
          const partWallT = 0.08;
          const horizW = halfW - partX - partWallT / 2 - wallThick;
          const horizCX = partX + partWallT / 2 + horizW / 2;
          const horizZ = -halfD + wallThick + partDepth;

          // Door in horizontal wall: 70cm wide
          const doorW3D = cmToUnit(90);
          const doorH3D = winTop;
          const doorCenterLocal = horizW / 2;
          const leftSegW = doorCenterLocal - doorW3D / 2;
          const rightSegW = horizW - doorCenterLocal - doorW3D / 2;
          const leftSegCX = partX + partWallT / 2 + leftSegW / 2;
          const rightSegCX = partX + partWallT / 2 + doorCenterLocal + doorW3D / 2 + rightSegW / 2;
          const doorAbsX = partX + partWallT / 2 + doorCenterLocal;
          const headerH = height - doorH3D;

          return (
            <group>
              {/* Vertical partition wall — extended to cover corner joint */}
              <mesh position={[partX, height / 2 + floorThick, -halfD + wallThick + (partDepth + partWallT / 2) / 2]}>
                <boxGeometry args={[partWallT, height, partDepth + partWallT / 2]} />
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
              <mesh
                position={[doorAbsX + doorW3D / 2 - 0.06, doorH3D * 0.48 + floorThick, horizZ + 0.04]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
                <meshStandardMaterial color="#aaa" roughness={0.25} metalness={0.8} />
              </mesh>

              {/* ── Toilet fixtures on the right (long) wall ── */}
              {(() => {
                const wallX = halfW - wallThick - 0.01; // inner face of right wall
                const toiletZ = -halfD + wallThick + partDepth * 0.35; // toward back
                const sinkZ = -halfD + wallThick + partDepth * 0.75; // toward door
                const white = { color: "#f0f0f0", roughness: 0.15, metalness: 0.05 };
                const chrome = { color: "#c0c0c0", roughness: 0.1, metalness: 0.9 };

                return (
                  <group>
                    {/* ── Wall-hung toilet ── */}
                    {/* Bowl */}
                    <mesh position={[wallX - 0.18, 0.38 + floorThick, toiletZ]}>
                      <boxGeometry args={[0.36, 0.14, 0.4]} />
                      <meshStandardMaterial {...white} />
                    </mesh>
                    {/* Bowl front (rounded) */}
                    <mesh position={[wallX - 0.36, 0.38 + floorThick, toiletZ]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.07, 0.07, 0.4, 12, 1, false, 0, Math.PI]} />
                      <meshStandardMaterial {...white} />
                    </mesh>
                    {/* Seat */}
                    <mesh position={[wallX - 0.2, 0.46 + floorThick, toiletZ]}>
                      <boxGeometry args={[0.38, 0.025, 0.42]} />
                      <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.02} />
                    </mesh>
                    {/* Lid */}
                    <mesh position={[wallX - 0.1, 0.485 + floorThick, toiletZ]}>
                      <boxGeometry args={[0.22, 0.02, 0.4]} />
                      <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.02} />
                    </mesh>
                    {/* Cistern (concealed behind wall — visible block) */}
                    <mesh position={[wallX - 0.02, 0.55 + floorThick, toiletZ]}>
                      <boxGeometry args={[0.1, 0.35, 0.38]} />
                      <meshStandardMaterial color="#ffffff" roughness={0.9} />
                    </mesh>
                    {/* Flush button */}
                    <mesh position={[wallX - 0.08, 0.78 + floorThick, toiletZ]}>
                      <boxGeometry args={[0.005, 0.08, 0.14]} />
                      <meshStandardMaterial {...chrome} />
                    </mesh>

                    {/* ── Small wall-mounted sink ── */}
                    {/* Basin */}
                    <mesh position={[wallX - 0.14, 0.8 + floorThick, sinkZ]}>
                      <boxGeometry args={[0.28, 0.06, 0.32]} />
                      <meshStandardMaterial {...white} />
                    </mesh>
                    {/* Basin inner (dark recess) */}
                    <mesh position={[wallX - 0.14, 0.81 + floorThick, sinkZ]}>
                      <boxGeometry args={[0.22, 0.04, 0.26]} />
                      <meshStandardMaterial color="#d8d8d8" roughness={0.1} />
                    </mesh>
                    {/* Faucet stem */}
                    <mesh position={[wallX - 0.06, 0.88 + floorThick, sinkZ]}>
                      <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
                      <meshStandardMaterial {...chrome} />
                    </mesh>
                    {/* Faucet spout */}
                    <mesh position={[wallX - 0.14, 0.94 + floorThick, sinkZ]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
                      <meshStandardMaterial {...chrome} />
                    </mesh>
                  </group>
                );
              })()}
            </group>
          );
        })()}
    </group>
  );
}

// ─── Glass pane ───────────────────────────────────────────────────────────────
function GlassPane({
  posX,
  posY,
  width,
  height,
  frameColor,
  hasDivider,
  z = 0,
  rotate,
}: {
  posX: number;
  posY: number;
  width: number;
  height: number;
  frameColor: string;
  hasDivider?: boolean;
  z?: number;
  rotate?: boolean;
}) {
  const fw = 0.036;
  const rotation: [number, number, number] = rotate ? [0, Math.PI / 2, 0] : [0, 0, 0];
  return (
    <group position={[posX, posY, z]} rotation={rotation}>
      {(
        [
          [0, height / 2 - fw / 2, 0, width, fw, 0.06],
          [0, -height / 2 + fw / 2, 0, width, fw, 0.06],
          [-width / 2 + fw / 2, 0, 0, fw, height, 0.06],
          [width / 2 - fw / 2, 0, 0, fw, height, 0.06],
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
  posX,
  posY,
  width,
  height,
  frameColor,
  z,
}: {
  posX: number;
  posY: number;
  width: number;
  height: number;
  frameColor: string;
  z: number;
}) {
  const fw = 0.036;
  return (
    <group position={[posX, posY, z]} rotation={[0, Math.PI / 2, 0]}>
      {/* Frame */}
      {(
        [
          [0, height / 2 - fw / 2, 0, width, fw, 0.06],
          [0, -height / 2 + fw / 2, 0, width, fw, 0.06],
          [-width / 2 + fw / 2, 0, 0, fw, height, 0.06],
          [width / 2 - fw / 2, 0, 0, fw, height, 0.06],
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, zz, bw, bh, bd], i) => (
        <mesh key={i} position={[x, y, zz]} castShadow>
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
  width,
  height,
  depth,
  wallThick,
  floorThick,
  cornerRadius,
  winH,
  winBot,
  winTop,
  winCY,
  PILLAR_W,
  claddingProps,
  frameColor,
  floorPlan,
  model,
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
            <GlassPane
              posX={room1CX}
              posY={winCY}
              width={room1Width}
              height={winH}
              frameColor={frameColor}
              hasDivider
            />
            <mesh position={[room2StartX + PILLAR_W / 2, height / 2, 0]} castShadow>
              <boxGeometry args={[PILLAR_W, height, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
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
          <>
            <mesh position={[room1CX, winBot / 2, 0]} castShadow>
              <boxGeometry args={[flatWidth - PILLAR_W, winBot, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            <mesh position={[room1CX, winTop + (height - winTop) / 2, 0]} castShadow>
              <boxGeometry args={[flatWidth - PILLAR_W, height - winTop, wallThick]} />
              <meshStandardMaterial {...claddingProps} />
            </mesh>
            <GlassPane
              posX={room1CX}
              posY={winCY}
              width={flatWidth - PILLAR_W}
              height={winH}
              frameColor={frameColor}
              hasDivider
            />
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
  room2StartX,
  room2Width,
  height,
  wallThick,
  winBot,
  winTop,
  winCY,
  winH,
  flatEndX,
  PILLAR_W,
  DOOR_W,
  frameColor,
  claddingProps,
  floorThick,
}: any) {
  const r2Content = room2Width - PILLAR_W * 2;
  const doorCX = room2StartX + PILLAR_W + DOOR_W / 2;
  const win2W = r2Content - DOOR_W - PILLAR_W;
  const win2CX = room2StartX + PILLAR_W + DOOR_W + PILLAR_W + win2W / 2;

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
