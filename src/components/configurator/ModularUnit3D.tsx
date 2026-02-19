import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { ConfigState } from "@/hooks/useConfigurator";

interface ModularUnit3DProps {
  config: ConfigState;
}

// Facade → material properties
function getFacadeMaterial(facade: ConfigState["facade"]) {
  switch (facade) {
    case "thermowood-black":
      return { color: "#1a1814", roughness: 0.92, metalness: 0.0, woodGrain: true };
    case "thermowood-natural":
      return { color: "#8a6637", roughness: 0.88, metalness: 0.0, woodGrain: true };
    case "composite-white":
      return { color: "#f0eeec", roughness: 0.55, metalness: 0.05, woodGrain: false };
    case "composite-black":
      return { color: "#1c1c1e", roughness: 0.60, metalness: 0.05, woodGrain: false };
    case "aluminium-anthracite":
      return { color: "#3a3b3c", roughness: 0.30, metalness: 0.75, woodGrain: false };
    case "aluminium-bronze":
      return { color: "#7a5c3a", roughness: 0.28, metalness: 0.80, woodGrain: false };
    default:
      return { color: "#1a1814", roughness: 0.9, metalness: 0.0, woodGrain: true };
  }
}

function getRoofColor(roofEdge: ConfigState["roofEdge"]) {
  return roofEdge === "white" ? "#e8e6e4" : "#111110";
}

// Wood-grain texture via canvas
function useWoodTexture(color: string, enabled: boolean) {
  return useMemo(() => {
    if (!enabled) return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const base = new THREE.Color(color);
    ctx.fillStyle = `#${base.getHexString()}`;
    ctx.fillRect(0, 0, size, size);

    // Vertical grain lines
    const lighter = base.clone().lerp(new THREE.Color("#ffffff"), 0.12);
    const darker = base.clone().lerp(new THREE.Color("#000000"), 0.18);

    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const w = 1 + Math.random() * 3;
      ctx.fillStyle = Math.random() > 0.5
        ? `#${lighter.getHexString()}`
        : `#${darker.getHexString()}`;
      ctx.globalAlpha = 0.25 + Math.random() * 0.3;
      ctx.fillRect(x, 0, w, size);
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    return tex;
  }, [color, enabled]);
}

// A single vertical cladding panel strip
function CladdingStrips({
  width,
  height,
  depth,
  color,
  roughness,
  metalness,
  texture,
}: {
  width: number;
  height: number;
  depth: number;
  color: string;
  roughness: number;
  metalness: number;
  texture: THREE.Texture | null;
}) {
  const stripCount = Math.floor(width / 0.09);
  return (
    <group>
      {Array.from({ length: stripCount }).map((_, i) => {
        const x = -width / 2 + (i + 0.5) * (width / stripCount);
        return (
          <mesh key={i} position={[x, 0, depth / 2 + 0.002]}>
            <boxGeometry
              args={[width / stripCount - 0.008, height - 0.01, 0.016]}
            />
            <meshStandardMaterial
              color={color}
              roughness={roughness}
              metalness={metalness}
              map={texture}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Glass pane
function GlassPane({
  width,
  height,
  depth,
}: {
  width: number;
  height: number;
  depth: number;
}) {
  return (
    <mesh position={[0, 0, depth / 2]}>
      <boxGeometry args={[width, height, 0.012]} />
      <meshPhysicalMaterial
        color="#c8dde8"
        roughness={0.04}
        metalness={0.0}
        transmission={0.82}
        thickness={0.3}
        transparent
        opacity={0.55}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

// Window frame + glass
function Window({
  width,
  height,
  posX,
  posY,
  posZ,
  frameColor = "#111110",
  isSlidingDoor = false,
}: {
  width: number;
  height: number;
  posX: number;
  posY: number;
  posZ: number;
  frameColor?: string;
  isSlidingDoor?: boolean;
}) {
  const fw = 0.04; // frame width
  return (
    <group position={[posX, posY, posZ]}>
      {/* Frame top */}
      <mesh position={[0, height / 2 - fw / 2, 0]}>
        <boxGeometry args={[width, fw, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Frame bottom */}
      <mesh position={[0, -height / 2 + fw / 2, 0]}>
        <boxGeometry args={[width, fw, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Frame left */}
      <mesh position={[-width / 2 + fw / 2, 0, 0]}>
        <boxGeometry args={[fw, height, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Frame right */}
      <mesh position={[width / 2 - fw / 2, 0, 0]}>
        <boxGeometry args={[fw, height, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Center divider for sliding door */}
      {isSlidingDoor && (
        <mesh position={[0, 0, 0.005]}>
          <boxGeometry args={[fw, height - fw * 2, 0.04]} />
          <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.6} />
        </mesh>
      )}
      {/* Glass */}
      <GlassPane width={width - fw * 2} height={height - fw * 2} depth={0.01} />
    </group>
  );
}

// Main modular unit mesh
export function ModularUnit3D({ config }: ModularUnit3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const facadeMat = getFacadeMaterial(config.facade);
  const roofColor = getRoofColor(config.roofEdge);
  const woodTex = useWoodTexture(facadeMat.color, facadeMat.woodGrain);

  // Dimensions based on model
  const dims = useMemo(() => {
    switch (config.model) {
      case "compact":  return { w: 3.6, h: 2.7, d: 2.4 };
      case "standard": return { w: 6.0, h: 2.7, d: 2.9 };
      case "large":    return { w: 8.4, h: 2.7, d: 3.2 };
    }
  }, [config.model]);

  const { w, h, d } = dims;

  // Window layout based on windowType
  const windows = useMemo(() => {
    const list: { wx: number; wh: number; px: number; py: number; sliding?: boolean }[] = [];
    const frameY = 0.0; // center height

    if (config.windowType === "standard") {
      // Door left + single window right
      list.push({ wx: 0.95, wh: h * 0.72, px: -w * 0.28, py: frameY, sliding: false });
      list.push({ wx: w * 0.38, wh: h * 0.72, px: w * 0.18, py: frameY, sliding: true });
    } else if (config.windowType === "panoramic") {
      // Full-width panoramic
      list.push({ wx: 0.85, wh: h * 0.78, px: -w * 0.32, py: frameY, sliding: false });
      list.push({ wx: w * 0.52, wh: h * 0.78, px: w * 0.08, py: frameY, sliding: true });
    } else {
      // Minimal - smaller, more negative space
      list.push({ wx: 0.80, wh: h * 0.60, px: -w * 0.20, py: frameY, sliding: false });
      list.push({ wx: w * 0.28, wh: h * 0.60, px: w * 0.22, py: frameY, sliding: true });
    }
    return list;
  }, [config.windowType, w, h]);

  const scaleX = config.mirrorPlan ? -1 : 1;

  // Frame color based on facade
  const frameColor = facadeMat.color === "#f0eeec" ? "#2a2a2a" : "#0a0a0a";

  return (
    <group ref={groupRef} scale={[scaleX, 1, 1]}>
      {/* Base / foundation plate */}
      <mesh position={[0, -h / 2 - 0.06, 0]}>
        <boxGeometry args={[w + 0.12, 0.12, d + 0.12]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Main body – back/sides/top solid */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={facadeMat.color}
          roughness={facadeMat.roughness}
          metalness={facadeMat.metalness}
          map={woodTex}
        />
      </mesh>

      {/* Front face cladding strips */}
      <CladdingStrips
        width={w}
        height={h}
        depth={d}
        color={facadeMat.color}
        roughness={facadeMat.roughness}
        metalness={facadeMat.metalness}
        texture={woodTex}
      />

      {/* Right side cladding strips (rotated) */}
      <group rotation={[0, -Math.PI / 2, 0]} position={[w / 2, 0, 0]}>
        <CladdingStrips
          width={d}
          height={h}
          depth={0}
          color={facadeMat.color}
          roughness={facadeMat.roughness}
          metalness={facadeMat.metalness}
          texture={woodTex}
        />
      </group>

      {/* Left side cladding strips */}
      <group rotation={[0, Math.PI / 2, 0]} position={[-w / 2, 0, 0]}>
        <CladdingStrips
          width={d}
          height={h}
          depth={0}
          color={facadeMat.color}
          roughness={facadeMat.roughness}
          metalness={facadeMat.metalness}
          texture={woodTex}
        />
      </group>

      {/* Roof trim edge (thin strip on top front) */}
      <mesh position={[0, h / 2 + 0.035, d / 2 - 0.01]}>
        <boxGeometry args={[w + 0.06, 0.07, 0.06]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Roof trim full */}
      <mesh position={[0, h / 2 + 0.035, 0]}>
        <boxGeometry args={[w + 0.06, 0.07, d + 0.06]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Windows on front face */}
      {windows.map((win, i) => (
        <Window
          key={i}
          width={win.wx}
          height={win.wh}
          posX={win.px}
          posY={win.py}
          posZ={d / 2 + 0.01}
          frameColor={frameColor}
          isSlidingDoor={win.sliding}
        />
      ))}

      {/* Interior glow behind windows (warm light) */}
      <mesh position={[0, 0, d / 2 - 0.15]}>
        <boxGeometry args={[w * 0.85, h * 0.85, 0.01]} />
        <meshStandardMaterial
          color="#e8ddd0"
          roughness={1}
          metalness={0}
          emissive="#c8b89a"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}
