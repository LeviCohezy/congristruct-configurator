import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import type { ConfigState } from "@/hooks/useConfigurator";
import { getRoofColor } from "@/hooks/useConfigurator";
import osbTextureUrl from "@/assets/osb-texture.png";
import thermowoodBlackTextureUrl from "@/assets/thermowood-black-texture.png";
import thermowoodNaturalTextureUrl from "@/assets/thermowood-natural-texture.png";
import lightWoodFloorTextureUrl from "@/assets/light-wood-floor-texture.png";
import darkWoodFloorTextureUrl from "@/assets/dark-wood-floor-texture.png";
import stoneFloorTextureUrl from "@/assets/stone-floor-texture.png";
import brickStripsTextureUrl from "@/assets/brick-strips-texture.png";
import lightOakTextureUrl from "@/assets/light-oak-texture.png";

// ─── Facade props ─────────────────────────────────────────────────────────────
function getFacadeProps(facade: ConfigState["facade"], aluminiumColor?: string) {
  switch (facade) {
    case "thermowood-black":
      return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
    case "thermowood-natural":
      return { color: "#ccb999", roughness: 0.82, metalness: 0.0, isWood: true };
    case "composite-white":
      return { color: "#ededea", roughness: 0.55, metalness: 0.04, isWood: false };
    case "composite-black":
      return { color: "#1c1c1e", roughness: 0.58, metalness: 0.05, isWood: false };
    case "aluminium":
      return { color: aluminiumColor || "#383a3b", roughness: 1.0, metalness: 0.0, isWood: false };
    case "brick-grey":
      return { color: "#7a7a78", roughness: 0.95, metalness: 0.0, isWood: false };
    default:
      return { color: "#18130e", roughness: 0.93, metalness: 0.0, isWood: true };
  }
}

function getShelfColors(shelfColor: ConfigState["shelfColor"]) {
  switch (shelfColor) {
    case "white":
      return { cabinet: "#e8e6e2", counterTop: "#d5d3cf", doorLine: "#cccac6" };
    case "light-oak":
      return { cabinet: "#d4be8a", counterTop: "#c4ae7a", doorLine: "#b8a270" };
    default: // brown
      return { cabinet: "#2a2118", counterTop: "#1a1510", doorLine: "#151010" };
  }
}

// ─── Plank texture ────────────────────────────────────────────────────────────
// The texture contains exactly ONE plank + gap. Repeat is set per real-world scale
// so every plank everywhere is the same width regardless of wall size.
const PLANK_WIDTH_M = 0.13; // 130mm real-world plank width
const GAP_WIDTH_M = 0.0075;  // 7.5mm gap
const CELL_M = PLANK_WIDTH_M + GAP_WIDTH_M; // one repeating cell

const COMPOSITE_PANEL_M = 1.22; // 1.22m panel width
const COMPOSITE_GAP_M = 0.005;  // 5mm joint
const COMPOSITE_CELL_M = COMPOSITE_PANEL_M + COMPOSITE_GAP_M;

const ALU_PANEL_M = 1.5;     // 1.5m aluminium panel
const ALU_GAP_M = 0.005;    // 5mm joint
const ALU_CELL_M = ALU_PANEL_M + ALU_GAP_M;

function createPlankTexture(baseColor: string, isWood: boolean, gapColor?: string): THREE.CanvasTexture | null {
  if (!isWood) return null;
  const canvas = document.createElement("canvas");
  // Single plank cell — high res for one plank
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const base = new THREE.Color(baseColor);

  // Gap on the right edge
  const gapFrac = GAP_WIDTH_M / CELL_M;
  const gapPx = Math.round(canvas.width * gapFrac);
  const slatW = canvas.width - gapPx;

  // 1. Fill entire cell with gap color
  ctx.fillStyle = gapColor || "#1a1208";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw the single plank
  const col = base.clone();
  ctx.fillStyle = `#${col.getHexString()}`;
  ctx.fillRect(0, 0, slatW, canvas.height);

  // 3. Rich wood grain pattern
  // — broad tonal variation bands (heartwood / sapwood streaks)
  for (let b = 0; b < 6; b++) {
    const bx = Math.random() * slatW;
    const bw = 4 + Math.random() * 18;
    const dark = Math.random() > 0.5;
    ctx.fillStyle = dark
      ? `rgba(0,0,0,${0.04 + Math.random() * 0.06})`
      : `rgba(255,255,255,${0.03 + Math.random() * 0.04})`;
    ctx.fillRect(bx, 0, bw, canvas.height);
  }

  // — fine grain lines running full height
  for (let g = 0; g < 12; g++) {
    const gx = 1 + Math.random() * (slatW - 2);
    const lineW = 0.4 + Math.random() * 1.2;
    ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.06})`;
    ctx.fillRect(gx, 0, lineW, canvas.height);
  }

  // — subtle knot-like oval marks (1-2 per plank)
  const knots = 1 + Math.floor(Math.random() * 2);
  for (let k = 0; k < knots; k++) {
    const kx = 8 + Math.random() * (slatW - 16);
    const ky = 40 + Math.random() * (canvas.height - 80);
    const kr = 3 + Math.random() * 6;
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr, kr * (1.5 + Math.random()), 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.06})`;
    ctx.fill();
    // lighter ring around knot
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr + 2, (kr + 2) * (1.5 + Math.random()), 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.03})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // — horizontal year-ring waviness
  for (let y = 0; y < canvas.height; y += 18 + Math.random() * 30) {
    ctx.fillStyle = `rgba(0,0,0,${0.015 + Math.random() * 0.025})`;
    ctx.fillRect(0, y, slatW, 1 + Math.random() * 1.5);
  }

  // 4. Left-edge shadow
  const grad = ctx.createLinearGradient(0, 0, slatW * 0.08, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.15)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, slatW * 0.08, canvas.height);

  // 5. Right-edge highlight
  const hl = ctx.createLinearGradient(slatW * 0.92, 0, slatW, 0);
  hl.addColorStop(0, "rgba(255,255,255,0)");
  hl.addColorStop(1, "rgba(255,255,255,0.06)");
  ctx.fillStyle = hl;
  ctx.fillRect(slatW * 0.92, 0, slatW * 0.08, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  // Don't set repeat here — it will be set per-geometry based on real-world size
  return tex;
}

// ─── Composite panel texture: single cell with a joint line on the right ───
function createCompositePanelTexture(baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const gapFrac = COMPOSITE_GAP_M / COMPOSITE_CELL_M;
  const gapPx = Math.max(1, Math.round(canvas.width * gapFrac));
  const panelW = canvas.width - gapPx;

  // Determine if panel is dark — use light gray gap for dark panels, black for light
  const c = new THREE.Color(baseColor);
  const isDark = c.r + c.g + c.b < 1.0;
  const gapCol = isDark ? "#5a5a5a" : "#0a0a0a";

  // Fill panel
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, panelW, canvas.height);

  // Joint line
  ctx.fillStyle = gapCol;
  ctx.fillRect(panelW, 0, gapPx, canvas.height);

  // Subtle edge shadow on right side of panel
  const grad = ctx.createLinearGradient(panelW - 4, 0, panelW, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = grad;
  ctx.fillRect(panelW - 4, 0, 4, canvas.height);

  // Subtle highlight on left edge
  const hl = ctx.createLinearGradient(0, 0, 3, 0);
  hl.addColorStop(0, "rgba(255,255,255,0.04)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, 3, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Aluminium panel texture: flat color plates every 1.5m ──────────────────
function createAluminiumPanelTexture(baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const base = new THREE.Color(baseColor);
  const isDark = base.r + base.g + base.b < 1.0;
  const gapCol = isDark ? "#5a5a5a" : "#0a0a0a";

  const gapFrac = ALU_GAP_M / ALU_CELL_M;
  const gapPx = Math.max(1, Math.round(canvas.width * gapFrac));
  const panelW = canvas.width - gapPx;

  // Panel fill — flat color
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, panelW, canvas.height);

  // Joint line
  ctx.fillStyle = gapCol;
  ctx.fillRect(panelW, 0, gapPx, canvas.height);

  // Subtle edge shadow
  const grad = ctx.createLinearGradient(panelW - 4, 0, panelW, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.10)");
  ctx.fillStyle = grad;
  ctx.fillRect(panelW - 4, 0, 4, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Cladding material with real-world plank repeat ─────────────────────────
// wallWidthM = how wide the wall face is in meters. The texture repeats so
// every plank is exactly CELL_M wide, and if it doesn't divide evenly it just
// gets cut off at the edge — which is exactly what real cladding looks like.
function makeCladdingMat(
  baseTex: THREE.CanvasTexture | null,
  wallWidthM: number,
  wallHeightM: number,
  color: string,
  roughness: number,
  metalness: number,
  isWood: boolean,
): THREE.MeshStandardMaterial {
  if (!baseTex || !isWood) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }
  const tex = baseTex.clone();
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(wallWidthM / CELL_M, 1);
  const bump = baseTex.clone();
  bump.needsUpdate = true;
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(wallWidthM / CELL_M, 1);
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, map: tex, bumpMap: bump, bumpScale: 0.04 });
}

// ─── CladMaterial: meshStandardMaterial with per-wall plank repeat ──────────
// photoTex: optional real photo texture (overrides baseTex procedural)
// photoTexWidthM: real-world width the photo covers (for repeat calc)
function CladMaterial({ baseTex, compositeTex, aluTex, photoTex, photoTexWidthM, photoTexHeightM, photoTint, wallWidth, wallHeight, fullWallHeight, color, roughness, metalness, isWood, ...rest }: {
  baseTex: THREE.CanvasTexture | null;
  compositeTex?: THREE.CanvasTexture | null;
  aluTex?: THREE.CanvasTexture | null;
  photoTex?: THREE.Texture | null;
  photoTexWidthM?: number;
  photoTexHeightM?: number;
  photoTint?: string;
  wallWidth: number;
  wallHeight?: number;
  fullWallHeight?: number;
  color: string;
  roughness: number;
  metalness: number;
  isWood: boolean;
  [k: string]: any;
}) {
  const actualH = wallHeight || fullWallHeight || 3;
  const yRepeat = (wallHeight && fullWallHeight && fullWallHeight > 0) ? wallHeight / fullWallHeight : 1;
  const [map, bumpMap] = useMemo(() => {
    // Photo texture takes priority
    if (photoTex) {
      const pw = photoTexWidthM || 1;
      const ph = photoTexHeightM || actualH; // if no height given, fill wall once
      const xRep = wallWidth / pw;
      const yRep = actualH / ph;
      const t = photoTex.clone();
      t.needsUpdate = true;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(xRep, yRep);
      const b = photoTex.clone();
      b.needsUpdate = true;
      b.wrapS = THREE.RepeatWrapping;
      b.wrapT = THREE.RepeatWrapping;
      b.repeat.set(xRep, yRep);
      return [t, b];
    }
    // Aluminium plank texture
    if (aluTex) {
      const t = aluTex.clone();
      t.needsUpdate = true;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(wallWidth / ALU_CELL_M, 1);
      return [t, undefined];
    }
    // Composite panel texture
    if (compositeTex && !isWood) {
      const t = compositeTex.clone();
      t.needsUpdate = true;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(wallWidth / COMPOSITE_CELL_M, 1);
      return [t, undefined];
    }
    if (!baseTex || !isWood) return [undefined, undefined];
    const t = baseTex.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(wallWidth / CELL_M, yRepeat);
    const b = baseTex.clone();
    b.needsUpdate = true;
    b.wrapS = THREE.RepeatWrapping;
    b.wrapT = THREE.RepeatWrapping;
    b.repeat.set(wallWidth / CELL_M, yRepeat);
    return [t, b];
  }, [baseTex, compositeTex, aluTex, photoTex, photoTexWidthM, wallWidth, isWood, yRepeat]);

  const useWhiteBase = (compositeTex && !isWood) || aluTex;

  return (
    <meshStandardMaterial
      color={photoTex ? (photoTint || "#ffffff") : useWhiteBase ? "#ffffff" : color}
      roughness={roughness}
      metalness={metalness}
      map={map}
      bumpMap={bumpMap}
      bumpScale={isWood ? 0.04 : 0}
      {...rest}
    />
  );
}

// ─── Interior material: OSB texture when shell, plain color otherwise ────────
function InteriorMat({ osbTex, isShell, color, roughness, side, ...rest }: {
  osbTex: THREE.Texture | null;
  isShell: boolean;
  color: string;
  roughness: number;
  side?: THREE.Side;
  [k: string]: any;
}) {
  return (
    <meshStandardMaterial
      color={isShell && osbTex ? "#ffffff" : color}
      roughness={roughness}
      map={isShell ? osbTex : undefined}
      side={side}
      {...rest}
    />
  );
}

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
  const anyConfig = config as any;
  const woodColorOverride = anyConfig.__woodColor as string | undefined;
  const gapColorOverride = anyConfig.__gapColor as string | undefined;
  const fp = getFacadeProps(config.facade, config.aluminiumColor);
  // Use override color for wood facades
  const effectiveColor = fp.isWood && woodColorOverride ? woodColorOverride : fp.color;
  const roofColor = getRoofColor(config.facade);
  const frameColor = fp.color === "#ededea" || fp.color === "#e8e6e2" ? "#1a1a1a" : "#080807";

  // Load real photo textures for thermowood
  const twBlackTexRaw = useLoader(THREE.TextureLoader, thermowoodBlackTextureUrl);
  const twNaturalTexRaw = useLoader(THREE.TextureLoader, thermowoodNaturalTextureUrl);
  const brickTexRaw = useLoader(THREE.TextureLoader, brickStripsTextureUrl);
  const isThermowoodBlack = config.facade === "thermowood-black";
  const isThermowoodNatural = config.facade === "thermowood-natural";
  const isBrick = config.facade === "brick-grey";
  const isPhotoTex = isThermowoodBlack || isThermowoodNatural || isBrick;

  const plankTex = useMemo(() => {
    if (isPhotoTex) return null; // use photo texture instead
    return createPlankTexture(effectiveColor, fp.isWood, gapColorOverride);
  }, [effectiveColor, fp.isWood, gapColorOverride, isThermowoodBlack]);

  const isComposite = config.facade === "composite-white" || config.facade === "composite-black";
  const compositeTex = useMemo(() => {
    if (!isComposite) return null;
    return createCompositePanelTexture(effectiveColor);
  }, [effectiveColor, isComposite]);

  const isAluminium = config.facade === "aluminium";
  const aluTex = useMemo(() => {
    if (!isAluminium) return null;
    return createAluminiumPanelTexture(effectiveColor);
  }, [effectiveColor, isAluminium]);

  // Dimensions — all 4m depth, variable width
  const { width, height, depth } = useMemo(() => {
    switch (config.model) {
      case "start":
        return { width: 3.5, height: 3.0, depth: 4.0 };
      case "flow":
        return { width: config.floorPlan === "b" ? 8.0 : 6.0, height: 3.0, depth: 4.0 };
      case "hub":
        return { width: 10.0, height: 3.0, depth: 3.5 };
      case "base":
        return { width: 12.5, height: 3.0, depth: 4.0 };
    }
  }, [config.model, config.floorPlan]);

  const cornerRadius = config.roundedCorners ? 0.45 : 0.0;
  const wallThick = 0.18;
  const roofThick = 0.07;
  const floorThick = 0.18;
  const PILLAR_W = 0.38;
  // Exterior walls extend down to cover floor slab (no visible black strip)
  const extWallH = height + floorThick; // full exterior wall height
  const extWallCY = extWallH / 2;       // center Y for exterior walls

  // Window heights — floor-to-ceiling (same height as doors)
  const winBot = 0;
  const winH = height * 0.81;
  const winTop = winBot + winH;
  const winCY = winBot + winH / 2;

  const slabShape = useMemo(
    () => (cornerRadius > 0 ? roundedRect(width - 0.02, depth - 0.02, cornerRadius) : null),
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

  // Base cladding props (for non-wood or roof where repeat doesn't matter)
  const claddingProps = {
    color: effectiveColor,
    roughness: fp.roughness,
    metalness: fp.metalness,
  };

  // For wood walls, we need per-wall materials with correct repeat
  // Photo texture for thermowood-black: image covers ~1m of real cladding width
  const twBlackTex = useMemo(() => {
    if (!isThermowoodBlack) return null;
    const t = twBlackTexRaw.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [twBlackTexRaw, isThermowoodBlack]);

  const twNaturalTex = useMemo(() => {
    if (!isThermowoodNatural) return null;
    const t = twNaturalTexRaw.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [twNaturalTexRaw, isThermowoodNatural]);

  const brickTex = useMemo(() => {
    if (!isBrick) return null;
    const t = brickTexRaw.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [brickTexRaw, isBrick]);

  const activePhotoTex = isThermowoodBlack ? twBlackTex : isThermowoodNatural ? twNaturalTex : isBrick ? brickTex : null;

  const woodBase = {
    baseTex: plankTex,
    compositeTex,
    aluTex,
    photoTex: activePhotoTex,
    photoTint: isThermowoodBlack ? "#8a8a8a" : undefined,
    photoTexWidthM: isBrick ? 3 : 1,
    photoTexHeightM: isBrick ? 1 : undefined,
    color: effectiveColor,
    roughness: fp.roughness,
    metalness: fp.metalness,
    isWood: fp.isWood,
  };

  // Interior: OSB texture when shell (casco), white when finished
  const isShell = config.finishLevel === "shell";
  const interiorColor = isShell ? "#d4b88c" : "#f5f0ea";
  const interiorRoughness = isShell ? 0.85 : 0.9;
  const floorColor = isShell ? "#d4b88c" : config.floorOption === "dark-vinyl" ? "#5a4332" : config.floorOption === "stone-vinyl" ? "#9a9590" : "#c9a97e";

  // Load OSB texture for shell finish
  const osbTexRaw = useLoader(THREE.TextureLoader, osbTextureUrl);
  const osbTex = useMemo(() => {
    const t = osbTexRaw.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    t.needsUpdate = true;
    return t;
  }, [osbTexRaw]);

  // Load light wood floor texture
  const lightWoodTexRaw = useLoader(THREE.TextureLoader, lightWoodFloorTextureUrl);
  const lightWoodTex = useMemo(() => {
    const t = lightWoodTexRaw.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [lightWoodTexRaw]);

  const darkWoodTexRaw = useLoader(THREE.TextureLoader, darkWoodFloorTextureUrl);
  const darkWoodTex = useMemo(() => {
    const t = darkWoodTexRaw.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [darkWoodTexRaw]);

  const stoneTexRaw = useLoader(THREE.TextureLoader, stoneFloorTextureUrl);
  const stoneTex = useMemo(() => {
    const t = stoneTexRaw.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [stoneTexRaw]);

  // Light oak cabinet texture
  const lightOakTexRaw = useLoader(THREE.TextureLoader, lightOakTextureUrl);
  const lightOakTex = useMemo(() => {
    const t = lightOakTexRaw.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [lightOakTexRaw]);

  const floorTex = !isShell ? (config.floorOption === "light-vinyl" ? lightWoodTex : config.floorOption === "dark-vinyl" ? darkWoodTex : config.floorOption === "stone-vinyl" ? stoneTex : null) : null;

  const scaleX = config.mirrorPlan ? -1 : 1;

  /* ── START-specific wall/window/door layout from architectural plan ── */
  /* Back wall:  185 + 80(window) + 135 = 400cm
     Front wall: 96 + 200(window) + 104 = 400cm
     Right wall: 165 + 100(door) + 85 = 350cm
     Left wall:  solid (storage unit against it) */
  const isStart = config.model === "start";
  const isFlowA = config.model === "flow" && config.floorPlan === "a";
  const isFlowB = config.model === "flow" && config.floorPlan === "b";
  const isHub = config.model === "hub";

  // Convert cm to 3D units for the START model
  const cmToUnit = (cm: number) => (cm / 400) * width; // width maps to 400cm
  const cmToDepth = (cm: number) => (cm / 350) * depth; // depth maps to 350cm

  return (
    <group scale={[scaleX, 1, 1]}>
      {/* ── Floor slab — uses facade color to blend with walls ── */}
      {slabShape ? (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <extrudeGeometry args={[slabShape, { depth: floorThick, bevelEnabled: false }]} />
          <meshStandardMaterial color={effectiveColor} roughness={fp.roughness} metalness={fp.metalness} />
        </mesh>
      ) : (
        <mesh position={[0, floorThick / 2, 0]} receiveShadow>
          <boxGeometry args={[width - wallThick * 2, floorThick, depth - wallThick * 2]} />
          <meshStandardMaterial color={effectiveColor} roughness={fp.roughness} metalness={fp.metalness} />
        </mesh>
      )}

      {/* Walkable floor */}
      {cornerRadius > 0 ? (
        <mesh position={[0, floorThick + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <shapeGeometry args={[roundedRect(width - wallThick * 2, depth - wallThick * 2, Math.max(cornerRadius - wallThick, 0.01))]} />
          {isShell ? (
            <InteriorMat osbTex={osbTex} isShell={isShell} color={floorColor} roughness={0.85} />
          ) : floorTex ? (
            <meshStandardMaterial map={floorTex} color={config.floorOption === "stone-vinyl" ? "#9a8a7a" : "#ffe8d6"} roughness={0.85} metalness={0.0} />
          ) : (
            <meshStandardMaterial color={floorColor} roughness={0.65} />
          )}
        </mesh>
      ) : (
        <mesh position={[0, floorThick + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width - wallThick * 2, depth - wallThick * 2]} />
          {isShell ? (
            <InteriorMat osbTex={osbTex} isShell={isShell} color={floorColor} roughness={0.85} />
          ) : floorTex ? (
            <meshStandardMaterial map={floorTex} color={config.floorOption === "stone-vinyl" ? "#9a8a7a" : "#ffe8d6"} roughness={0.85} metalness={0.0} />
          ) : (
            <meshStandardMaterial color={floorColor} roughness={0.65} />
          )}
        </mesh>
      )}

      {/* ── Roof slab — black, covers full unit ── */}
      {slabShape ? (
        <mesh position={[0, height + floorThick + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <extrudeGeometry args={[slabShape, { depth: roofThick, bevelEnabled: false }]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
        </mesh>
      ) : (
        <mesh position={[0, height + floorThick + roofThick / 2 + 0.003, 0]} castShadow>
          <boxGeometry args={[width + 0.04, roofThick, depth + 0.04]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
        </mesh>
      )}

      {/* ── Warm interior lighting ── */}
      <pointLight position={[0, height * 0.8 + floorThick, 0]} intensity={0.6} distance={width} color="#ffe8cc" />

      {/* ── Rounded corners — exterior cladding ── */}
      {cornerShapes &&
        cornerShapes.map(({ shape, posX, posZ }, i) => (
          <mesh key={`ce${i}`} position={[posX, floorThick + height, posZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <extrudeGeometry args={[shape, { depth: extWallH, bevelEnabled: false }]} />
            <CladMaterial {...woodBase} wallWidth={Math.PI * 0.5 * cornerRadius} />
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
                <extrudeGeometry args={[shell, { depth: extWallH, bevelEnabled: false }]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
              </mesh>
            );
          });
        })()}

      {/* ── Interior ceiling — white box just under roof slab ── */}
      <mesh position={[0, height - 0.03, 0]}>
        <boxGeometry args={[width - wallThick * 2, 0.04, depth - wallThick * 2]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={isShell ? 0.85 : 0.95} />
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
          width={width} height={height} depth={depth}
          wallThick={wallThick} floorThick={floorThick} cornerRadius={cornerRadius}
          extWallH={extWallH} extWallCY={extWallCY}
          winH={winH} winBot={winBot} winTop={winTop} winCY={winCY}
          claddingProps={claddingProps} woodBase={woodBase} frameColor={frameColor}
          cmToUnit={cmToUnit} cmToDepth={cmToDepth}
          floorPlan={config.floorPlan} finishLevel={config.finishLevel}
          shelfColor={config.shelfColor} ledStrip={config.kastLedStrip}
          interiorColor={interiorColor} interiorRoughness={interiorRoughness}
          osbTex={osbTex} isShell={isShell}
          lightOakTex={lightOakTex}
        />
      ) : isFlowA ? (
        <FlowAWalls
          width={width} height={height} depth={depth}
          wallThick={wallThick} floorThick={floorThick} cornerRadius={cornerRadius}
          extWallH={extWallH} extWallCY={extWallCY}
          winH={winH} winBot={winBot} winTop={winTop} winCY={winCY}
          woodBase={woodBase} frameColor={frameColor}
          interiorColor={interiorColor} interiorRoughness={interiorRoughness}
          osbTex={osbTex} isShell={isShell}
          finishLevel={config.finishLevel}
          shelfColor={config.shelfColor} ledStrip={config.kastLedStrip}
          lightOakTex={lightOakTex}
        />
      ) : isFlowB ? (
        <FlowBWalls
          width={width} height={height} depth={depth}
          wallThick={wallThick} floorThick={floorThick} cornerRadius={cornerRadius}
          extWallH={extWallH} extWallCY={extWallCY}
          winH={winH} winBot={winBot} winTop={winTop} winCY={winCY}
          woodBase={woodBase} frameColor={frameColor}
          interiorColor={interiorColor} interiorRoughness={interiorRoughness}
          osbTex={osbTex} isShell={isShell}
          finishLevel={config.finishLevel}
          shelfColor={config.shelfColor} ledStrip={config.kastLedStrip}
          lightOakTex={lightOakTex}
        />
      ) : isHub ? (
        <HubWalls
          width={width} height={height} depth={depth}
          wallThick={wallThick} floorThick={floorThick} cornerRadius={cornerRadius}
          extWallH={extWallH} extWallCY={extWallCY}
          winH={winH} winBot={winBot} winTop={winTop} winCY={winCY}
          woodBase={woodBase} frameColor={frameColor}
          interiorColor={interiorColor} interiorRoughness={interiorRoughness}
          osbTex={osbTex} isShell={isShell}
          floorPlan={config.floorPlan}
          hubDoorSwap={config.hubDoorSwap}
          finishLevel={config.finishLevel}
          shelfColor={config.shelfColor}
          ledStrip={config.kastLedStrip}
          lightOakTex={lightOakTex}
        />
      ) : (
        <GenericWalls
          width={width} height={height} depth={depth}
          wallThick={wallThick} floorThick={floorThick} cornerRadius={cornerRadius}
          extWallH={extWallH} extWallCY={extWallCY}
          winH={winH} winBot={winBot} winTop={winTop} winCY={winCY}
          PILLAR_W={PILLAR_W} claddingProps={claddingProps}
          woodBase={woodBase} frameColor={frameColor}
          floorPlan={config.floorPlan} model={config.model}
          interiorColor={interiorColor} interiorRoughness={interiorRoughness}
          osbTex={osbTex} isShell={isShell}
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
  extWallH,
  extWallCY,
  winH,
  winBot,
  winTop,
  winCY,
  claddingProps,
  woodBase,
  frameColor,
  cmToUnit,
  cmToDepth,
  floorPlan,
  finishLevel,
  shelfColor,
  ledStrip,
  interiorColor,
  interiorRoughness,
  osbTex,
  isShell,
  lightOakTex,
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
      <mesh position={[-halfW + wallThick / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[wallThick, extWallH, leftFlatD]} />
        <CladMaterial {...woodBase} wallWidth={leftFlatD} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Interior left wall */}
      <mesh position={[-halfW + wallThick + 0.005, height / 2 + floorThick, 0]}>
        <boxGeometry args={[0.01, height, intLeftD]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── BACK WALL — 3 segments + window (front-priority: negative offset) ── */}
      {backLeftW > 0.01 && (
        <mesh position={[backLeftCX, extWallCY, -halfD + wallThick / 2]} castShadow>
          <boxGeometry args={[backLeftW, extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={backLeftW} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}
      {backRightW > 0.01 && (
        <mesh position={[backRightCX, extWallCY, -halfD + wallThick / 2]} castShadow>
          <boxGeometry args={[backRightW, extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={backRightW} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}
      {/* Window area — spandrel below + header above + glass */}
      <mesh position={[backWinCenterX, (winBot + floorThick) / 2, -halfD + wallThick / 2]} castShadow>
        <boxGeometry args={[backWinW, winBot + floorThick, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={backWinW} wallHeight={winBot + floorThick} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh position={[backWinCenterX, winTop + (height - winTop) / 2 + floorThick, -halfD + wallThick / 2]} castShadow>
        <boxGeometry args={[backWinW, height - winTop, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={backWinW} wallHeight={height - winTop} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
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
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
        </mesh>
      )}
      {intBackRightW > 0.01 && (
        <mesh position={[intBackRightCX, height / 2 + floorThick, -halfD + wallThick + 0.01]}>
          <boxGeometry args={[intBackRightW, height, 0.01]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
        </mesh>
      )}
      {/* Interior back wall — above & below window */}
      <mesh position={[backWinCenterX, (winBot + floorThick) / 2, -halfD + wallThick + 0.005]}>
        <boxGeometry args={[backWinW, winBot + floorThick, 0.01]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>
      <mesh position={[backWinCenterX, winTop + (height - winTop) / 2 + floorThick, -halfD + wallThick + 0.005]}>
        <boxGeometry args={[backWinW, height - winTop, 0.01]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── FRONT WALL — 2 solid segments + big window (front-priority: negative offset) ── */}
      {frontLeftW > 0.01 && (
        <mesh position={[frontLeftCX, extWallCY, halfD - wallThick / 2]} castShadow>
          <boxGeometry args={[frontLeftW, extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={frontLeftW} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}
      {frontRightW > 0.01 && (
        <mesh position={[frontRightCX, extWallCY, halfD - wallThick / 2]} castShadow>
          <boxGeometry args={[frontRightW, extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={frontRightW} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}
      {/* Window spandrel + header */}
      <mesh position={[frontWinCenterX, (winBot + floorThick) / 2, halfD - wallThick / 2]} castShadow>
        <boxGeometry args={[frontWinW, winBot + floorThick, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={frontWinW} wallHeight={winBot + floorThick} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh position={[frontWinCenterX, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick / 2]} castShadow>
        <boxGeometry args={[frontWinW, height - winTop, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={frontWinW} wallHeight={height - winTop} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
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
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
        </mesh>
      )}
      {intFrontRightW > 0.01 && (
        <mesh position={[intFrontRightCX, height / 2 + floorThick, halfD - wallThick - 0.005]}>
          <boxGeometry args={[intFrontRightW, height, 0.01]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
        </mesh>
      )}
      {/* Interior front — above & below window */}
      <mesh position={[frontWinCenterX, (winBot + floorThick) / 2, halfD - wallThick - 0.005]}>
        <boxGeometry args={[frontWinW, winBot + floorThick, 0.01]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>
      <mesh position={[frontWinCenterX, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick - 0.005]}>
        <boxGeometry args={[frontWinW, height - winTop, 0.01]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── RIGHT WALL — 2 solid segments + door opening (floor to lintel) ── */}
      {rightTopH > 0.01 && (
        <mesh position={[halfW - wallThick / 2, extWallCY, rightTopCZ]} castShadow>
          <boxGeometry args={[wallThick, extWallH, rightTopH]} />
          <CladMaterial {...woodBase} wallWidth={rightTopH} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      )}
      {rightBotH > 0.01 && (
        <mesh position={[halfW - wallThick / 2, extWallCY, rightBotCZ]} castShadow>
          <boxGeometry args={[wallThick, extWallH, rightBotH]} />
          <CladMaterial {...woodBase} wallWidth={rightBotH} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      )}
      {/* Door header above opening */}
      <mesh position={[halfW - wallThick / 2, winTop + (height - winTop) / 2 + floorThick, doorCenterZ]} castShadow>
        <boxGeometry args={[wallThick, height - winTop, doorH]} />
        <CladMaterial {...woodBase} wallWidth={doorH} wallHeight={height - winTop} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Wall below door opening — covers floor slab */}
      <mesh position={[halfW - wallThick / 2, floorThick / 2, doorCenterZ]} castShadow>
        <boxGeometry args={[wallThick, floorThick, doorH]} />
        <CladMaterial {...woodBase} wallWidth={doorH} wallHeight={floorThick} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Interior right wall segments */}
      {intRightTopH > 0.01 && (
        <mesh position={[halfW - wallThick - 0.005, height / 2 + floorThick, intRightTopCZ]}>
          <boxGeometry args={[0.01, height, intRightTopH]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
        </mesh>
      )}
      {intRightBotH > 0.01 && (
        <mesh position={[halfW - wallThick - 0.005, height / 2 + floorThick, intRightBotCZ]}>
          <boxGeometry args={[0.01, height, intRightBotH]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
        </mesh>
      )}
      {/* Interior right — door header */}
      <mesh position={[halfW - wallThick - 0.005, winTop + (height - winTop) / 2 + floorThick, doorCenterZ]}>
        <boxGeometry args={[0.01, height - winTop, doorH]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
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

      {/* ── Furniture (only when fully finished) ── */}
      {finishLevel === "fully-finished" && <>
      {/* ── Built-in bookshelf/cabinet ── */}
      {/* Open plan (A): against left wall, full wall length */}
      {/* Plan B: against back wall, left of window */}
      {(() => {
        const isLeftWall = floorPlan === "a";
        const shelfW = isLeftWall ? depth - 2 * wallThick : cmToUnit(140);
        const shelfD = 0.45;

        const shelfCenterAlongWall = isLeftWall ? 0 : -halfW + wallThick + shelfW / 2;
        const shelfCenterIntoRoom = isLeftWall ? -halfW + wallThick + shelfD / 2 : -halfD + wallThick + shelfD / 2;
        const backPanelPos = isLeftWall ? -halfW + wallThick + 0.06 : -halfD + wallThick + 0.06;

        const pos = (along: number, y: number, into: number): [number, number, number] =>
          isLeftWall ? [into, y, along] : [along, y, into];
        const geo = (along: number, h: number, into: number): [number, number, number] =>
          isLeftWall ? [into, h, along] : [along, h, into];

        const sc = getShelfColors(shelfColor);
        const matProps = { color: shelfColor === "light-oak" ? "#ffffff" : sc.cabinet, roughness: 0.75, metalness: 0.05, ...(shelfColor === "light-oak" && lightOakTex ? { map: lightOakTex } : {}) };

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

            {/* Full-height cabinet body */}
            <mesh position={pos(shelfCenterAlongWall, height / 2 + floorThick, shelfCenterIntoRoom)}>
              <boxGeometry args={geo(shelfW, height, shelfD)} />
              <meshStandardMaterial {...matProps} />
            </mesh>

            {/* Door lines: 6 doors for open plan (A), 3 doors for toilet plan (B) */}
            {(isLeftWall ? [1/6, 2/6, 3/6, 4/6, 5/6] : [1/3, 2/3]).map((frac, i) => (
              <mesh
                key={`d${i}`}
                position={doorLinePos(
                  shelfCenterAlongWall - shelfW / 2 + shelfW * frac,
                  height / 2 + floorThick,
                )}
              >
                <boxGeometry args={doorLineGeo(height - 0.02)} />
                <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
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
      </>}

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
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
              {/* Horizontal wall — left of door */}
              {leftSegW > 0.01 && (
                <mesh position={[leftSegCX, height / 2 + floorThick, horizZ]}>
                  <boxGeometry args={[leftSegW, height, partWallT]} />
                  <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
                </mesh>
              )}
              {/* Horizontal wall — right of door */}
              {rightSegW > 0.01 && (
                <mesh position={[rightSegCX, height / 2 + floorThick, horizZ]}>
                  <boxGeometry args={[rightSegW, height, partWallT]} />
                  <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
                </mesh>
              )}
              {/* Door header */}
              <mesh position={[doorAbsX, doorH3D + headerH / 2 + floorThick, horizZ]}>
                <boxGeometry args={[doorW3D, headerH, partWallT]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
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
  rotate = true,
}: {
  posX: number;
  posY: number;
  width: number;
  height: number;
  frameColor: string;
  z: number;
  rotate?: boolean;
}) {
  const fw = 0.036;
  return (
    <group position={[posX, posY, z]} rotation={rotate ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
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

/* ═══════════════════════════════════════════════════════════════════════
   FLOW model Plan A — 600×350cm, open room + toilet back-right + storage
   Front: 75 wall | 200 win | 100 wall | 100 door | 125 wall
   ═══════════════════════════════════════════════════════════════════════ */
function FlowAWalls({
  width, height, depth, wallThick, floorThick, cornerRadius,
  extWallH, extWallCY,
  winH, winBot, winTop, winCY, woodBase, frameColor,
  interiorColor, interiorRoughness, osbTex, isShell,
  finishLevel,
  shelfColor,
  ledStrip,
  lightOakTex,
}: any) {
  const halfW = width / 2;   // 3.0
  const halfD = depth / 2;   // 2.0
  const sideInset = Math.max(cornerRadius, wallThick);
  const sideFlatD = depth - sideInset * 2;
  const intWallD = depth - wallThick * 2;
  const partT = 0.10; // 10cm internal partition walls

  // Front wall segments (m): 75+200+100+100+125 = 600cm
  // When corners are rounded, trim only the outermost segments so the facade follows the curved profile.
  const segs = [0.75, 2.0, 1.0, 1.0, 1.25];
  const segTypes = ["wall", "window", "wall", "door", "wall"] as const;
  const frontEdgeInset = Math.max(0, cornerRadius);
  const frontSegs = segs.map((w, i) => (i === 0 || i === segs.length - 1 ? Math.max(0.05, w - frontEdgeInset) : w));
  let xCursor = -halfW + frontEdgeInset;
  const frontParts = frontSegs.map((w, i) => {
    const cx = xCursor + w / 2;
    xCursor += w;
    return { w, cx, type: segTypes[i] };
  });

  // Toilet compartment: back-right corner
  // ~120cm wide strip (interior), 45% of depth from back
  const toiletStripW = 1.20;
  const toiletDepth = depth * 0.45; // 45% of 3.5m = 1.575m
  const partX = halfW - wallThick - toiletStripW; // vertical partition x
  const toiletWallZ = -halfD + wallThick + toiletDepth; // horizontal wall z

  // Toilet door: 84cm wide (same as BLOQ Flow interior doors)
  const toiletDoorW = 0.84;
  const toiletDoorH = 2.1;
  // Door positioned in the vertical partition, centered vertically in the toilet room
  const toiletDoorCZ = -halfD + wallThick + toiletDepth * 0.5; // center of toilet depth

  return (
    <group>
      {/* ── BACK WALL — solid ── */}
      <mesh position={[0, extWallCY, -halfD + wallThick / 2]} castShadow>
        <boxGeometry args={[width - cornerRadius * 2, extWallH, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={width - cornerRadius * 2} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh position={[0, height / 2 + floorThick, -halfD + wallThick + 0.01]}>
        <boxGeometry args={[width - wallThick * 2, height, 0.01]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── LEFT WALL — with window (200cm, centered) ── */}
      {(() => {
        const leftWinW = 2.0; // 200cm window
        const leftWinCZ = 0; // centered on the wall
        const wallAbove = sideFlatD / 2 - leftWinW / 2; // wall segment above window (toward back)
        const wallBelow = sideFlatD / 2 - leftWinW / 2; // wall segment below window (toward front)
        const topCZ = -halfD + sideInset + wallAbove / 2;
        const botCZ = halfD - sideInset - wallBelow / 2;

        return (
          <group>
            {/* Wall segment toward back */}
            {wallAbove > 0.01 && (
              <mesh position={[-halfW + wallThick / 2, extWallCY, topCZ]} castShadow>
                <boxGeometry args={[wallThick, extWallH, wallAbove]} />
                <CladMaterial {...woodBase} wallWidth={wallAbove} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
              </mesh>
            )}
            {/* Wall segment toward front */}
            {wallBelow > 0.01 && (
              <mesh position={[-halfW + wallThick / 2, extWallCY, botCZ]} castShadow>
                <boxGeometry args={[wallThick, extWallH, wallBelow]} />
                <CladMaterial {...woodBase} wallWidth={wallBelow} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
              </mesh>
            )}
            {/* Window spandrel + header */}
            <mesh position={[-halfW + wallThick / 2, (winBot + floorThick) / 2, leftWinCZ]} castShadow>
              <boxGeometry args={[wallThick, winBot + floorThick, leftWinW]} />
              <CladMaterial {...woodBase} wallWidth={leftWinW} wallHeight={winBot + floorThick} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
            </mesh>
            <mesh position={[-halfW + wallThick / 2, winTop + (height - winTop) / 2 + floorThick, leftWinCZ]} castShadow>
              <boxGeometry args={[wallThick, height - winTop, leftWinW]} />
              <CladMaterial {...woodBase} wallWidth={leftWinW} wallHeight={height - winTop} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
            </mesh>
            <GlassPane posX={-halfW + wallThick / 2} posY={winCY + floorThick} width={leftWinW} height={winH} frameColor={frameColor} z={leftWinCZ} rotate />

            {/* Interior left wall segments */}
            {wallAbove > 0.01 && (
              <mesh position={[-halfW + wallThick + 0.005, height / 2 + floorThick, topCZ]}>
                <boxGeometry args={[0.01, height, wallAbove]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
            )}
            {wallBelow > 0.01 && (
              <mesh position={[-halfW + wallThick + 0.005, height / 2 + floorThick, botCZ]}>
                <boxGeometry args={[0.01, height, wallBelow]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
            )}
            <mesh position={[-halfW + wallThick + 0.005, (winBot + floorThick) / 2, leftWinCZ]}>
              <boxGeometry args={[0.01, winBot + floorThick, leftWinW]} />
              <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
            </mesh>
            <mesh position={[-halfW + wallThick + 0.005, winTop + (height - winTop) / 2 + floorThick, leftWinCZ]}>
              <boxGeometry args={[0.01, height - winTop, leftWinW]} />
              <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
            </mesh>
          </group>
        );
      })()}

      {/* ── RIGHT WALL — solid ── */}
      <mesh position={[halfW - wallThick / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[wallThick, extWallH, sideFlatD]} />
        <CladMaterial {...woodBase} wallWidth={sideFlatD} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <mesh position={[halfW - wallThick - 0.005, height / 2 + floorThick, 0]}>
        <boxGeometry args={[0.01, height, intWallD]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── FRONT WALL — segmented with window + entrance door ── */}
      {frontParts.map((seg, i) => {
        if (seg.type === "wall") {
          return (
            <group key={`fs${i}`}>
              <mesh position={[seg.cx, extWallCY, halfD - wallThick / 2]} castShadow>
                <boxGeometry args={[seg.w, extWallH, wallThick]} />
                <CladMaterial {...woodBase} wallWidth={seg.w} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
              </mesh>
              <mesh position={[seg.cx, height / 2 + floorThick, halfD - wallThick - 0.005]}>
                <boxGeometry args={[seg.w, height, 0.01]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
            </group>
          );
        }
        if (seg.type === "window") {
          return (
            <group key={`fs${i}`}>
              <mesh position={[seg.cx, (winBot + floorThick) / 2, halfD - wallThick / 2]} castShadow>
                <boxGeometry args={[seg.w, winBot + floorThick, wallThick]} />
                <CladMaterial {...woodBase} wallWidth={seg.w} wallHeight={winBot + floorThick} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
              </mesh>
              <mesh position={[seg.cx, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick / 2]} castShadow>
                <boxGeometry args={[seg.w, height - winTop, wallThick]} />
                <CladMaterial {...woodBase} wallWidth={seg.w} wallHeight={height - winTop} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
              </mesh>
              <GlassPane posX={seg.cx} posY={winCY + floorThick} width={seg.w} height={winH} frameColor={frameColor} z={halfD - wallThick / 2} />
              <mesh position={[seg.cx, (winBot + floorThick) / 2, halfD - wallThick - 0.005]}>
                <boxGeometry args={[seg.w, winBot + floorThick, 0.01]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
              <mesh position={[seg.cx, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick - 0.005]}>
                <boxGeometry args={[seg.w, height - winTop, 0.01]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
            </group>
          );
        }
        // Entrance door
        return (
          <group key={`fs${i}`}>
            <mesh position={[seg.cx, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick / 2]} castShadow>
              <boxGeometry args={[seg.w, height - winTop, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={seg.w} wallHeight={height - winTop} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
            </mesh>
            <DoorPane posX={seg.cx} posY={floorThick + winTop / 2} width={seg.w} height={winTop} frameColor={frameColor} z={halfD - wallThick / 2} rotate={false} />
            {/* Wall below door — covers floor slab */}
            <mesh position={[seg.cx, floorThick / 2, halfD - wallThick / 2]} castShadow>
              <boxGeometry args={[seg.w, floorThick, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={seg.w} wallHeight={floorThick} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
            </mesh>
          </group>
        );
      })}

      {/* ── TOILET COMPARTMENT — back-right corner ── */}
      {/* Vertical partition wall — split around door */}
      {(() => {
        const partFullLen = toiletDepth + partT / 2;
        const doorStartZ = toiletDoorCZ - toiletDoorW / 2;
        const doorEndZ = toiletDoorCZ + toiletDoorW / 2;
        const backWallInner = -halfD + wallThick;
        
        // Bottom segment (from back wall to door)
        const bottomLen = doorStartZ - backWallInner;
        // Top segment (from door to horizontal wall)
        const topLen = (toiletWallZ - partT / 2) - doorEndZ;

        return (
          <group>
            {/* Bottom segment of vertical partition */}
            {bottomLen > 0.01 && (
              <mesh position={[partX + partT / 2, height / 2 + floorThick, backWallInner + bottomLen / 2]}>
                <boxGeometry args={[partT, height, bottomLen]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
              </mesh>
            )}
            {/* Top segment of vertical partition */}
            {topLen > 0.01 && (
              <mesh position={[partX + partT / 2, height / 2 + floorThick, doorEndZ + topLen / 2]}>
                <boxGeometry args={[partT, height, topLen]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
              </mesh>
            )}
            {/* Header above door */}
            <mesh position={[partX + partT / 2, toiletDoorH + (height - toiletDoorH) / 2 + floorThick, toiletDoorCZ]}>
              <boxGeometry args={[partT, height - toiletDoorH, toiletDoorW]} />
              <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })()}

      {/* Horizontal toilet wall — solid (no door) */}
      <mesh position={[partX + partT + (toiletStripW - partT) / 2, height / 2 + floorThick, toiletWallZ]}>
        <boxGeometry args={[toiletStripW - partT, height, partT]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
      </mesh>

      {/* Toilet door frame */}
      <mesh position={[partX + partT / 2, toiletDoorH / 2 + floorThick, toiletDoorCZ - toiletDoorW / 2 - 0.015]}>
        <boxGeometry args={[partT + 0.01, toiletDoorH, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[partX + partT / 2, toiletDoorH / 2 + floorThick, toiletDoorCZ + toiletDoorW / 2 + 0.015]}>
        <boxGeometry args={[partT + 0.01, toiletDoorH, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[partX + partT / 2, toiletDoorH + floorThick + 0.015, toiletDoorCZ]}>
        <boxGeometry args={[partT + 0.01, 0.03, toiletDoorW + 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Toilet door panel */}
      <mesh position={[partX + partT / 2, toiletDoorH / 2 + floorThick, toiletDoorCZ]}>
        <boxGeometry args={[0.035, toiletDoorH - 0.02, toiletDoorW - 0.04]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.85} />
      </mesh>
      {/* Toilet door handle — chrome cylinder (same style as BLOQ Flow) */}
      <mesh
        position={[partX + partT / 2 + 0.04, toiletDoorH * 0.48 + floorThick, toiletDoorCZ + toiletDoorW / 2 - 0.06]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
        <meshStandardMaterial color="#aaa" roughness={0.25} metalness={0.8} />
      </mesh>

      {/* ── TOILET FIXTURES — against right exterior wall ── */}
      {(() => {
        const white = { color: "#f0f0f0", roughness: 0.15, metalness: 0.05 };
        const chrome = { color: "#c0c0c0", roughness: 0.1, metalness: 0.9 };
        const wallX = halfW - wallThick - 0.01;
        const toiletZ = -halfD + wallThick + toiletDepth * 0.35;
        const sinkZ = -halfD + wallThick + toiletDepth * 0.75;

        return (
          <group>
            {/* Wall-hung toilet */}
            <mesh position={[wallX - 0.18, 0.38 + floorThick, toiletZ]}>
              <boxGeometry args={[0.36, 0.14, 0.4]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[wallX - 0.36, 0.38 + floorThick, toiletZ]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.4, 12, 1, false, 0, Math.PI]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[wallX - 0.2, 0.46 + floorThick, toiletZ]}>
              <boxGeometry args={[0.38, 0.025, 0.42]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.02} />
            </mesh>
            <mesh position={[wallX - 0.1, 0.485 + floorThick, toiletZ]}>
              <boxGeometry args={[0.22, 0.02, 0.4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.02} />
            </mesh>
            <mesh position={[wallX - 0.02, 0.55 + floorThick, toiletZ]}>
              <boxGeometry args={[0.1, 0.35, 0.38]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            <mesh position={[wallX - 0.08, 0.78 + floorThick, toiletZ]}>
              <boxGeometry args={[0.005, 0.08, 0.14]} />
              <meshStandardMaterial {...chrome} />
            </mesh>

            {/* Small wall-mounted sink */}
            <mesh position={[wallX - 0.14, 0.8 + floorThick, sinkZ]}>
              <boxGeometry args={[0.28, 0.06, 0.32]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[wallX - 0.14, 0.81 + floorThick, sinkZ]}>
              <boxGeometry args={[0.22, 0.04, 0.26]} />
              <meshStandardMaterial color="#d8d8d8" roughness={0.1} />
            </mesh>
            <mesh position={[wallX - 0.06, 0.88 + floorThick, sinkZ]}>
              <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
              <meshStandardMaterial {...chrome} />
            </mesh>
            <mesh position={[wallX - 0.14, 0.94 + floorThick, sinkZ]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
              <meshStandardMaterial {...chrome} />
            </mesh>
          </group>
        );
      })()}

      {/* ── FURNITURE (only when fully finished) ── */}
      {finishLevel === "fully-finished" && (() => {
        const mainRoomLeft = -halfW + wallThick;
        const mainRoomRight = partX; // toilet partition x
        const mainRoomW = mainRoomRight - mainRoomLeft;
        const mainRoomCX = (mainRoomLeft + mainRoomRight) / 2;
        const backInnerZ = -halfD + wallThick;

        const white = { color: "#f5f5f0", roughness: 0.25, metalness: 0.05 };
        const darkMetal = { color: "#2a2a2a", roughness: 0.4, metalness: 0.6 };
        const sc = getShelfColors(shelfColor);
        const matProps = { color: shelfColor === "light-oak" ? "#ffffff" : sc.cabinet, roughness: 0.75, metalness: 0.05, ...(shelfColor === "light-oak" && lightOakTex ? { map: lightOakTex } : {}) };

        // ── Back wall shelf/cabinet ──
        const shelfW = mainRoomW - 0.04;
        const shelfD = 0.40;
        const shelfCX = mainRoomCX;
        const shelfCZ = backInnerZ + shelfD / 2;
        const backPanelZ = backInnerZ + 0.02; // flush against wall

        const counterTop = height * 0.25;
        const upperBottom = height * 0.65;
        const upperH = height - upperBottom;
        const nicheH = upperBottom - counterTop;

        // ── Two desks side by side (rotated 90°, no gap) ──
        const deskW = 1.92; // length along Z per desk (20% longer than 1.6)
        const deskD = 0.80; // width along X per desk
        const deskH = 0.75;
        const topT = 0.04;
        const desk1CX = mainRoomCX - deskD / 2;
        const desk2CX = mainRoomCX + deskD / 2;
        const deskCZ = backInnerZ + shelfD + deskW / 2 + 0.05;

        // ── Office chairs ──
        const chair1X = desk1CX - deskD / 2 - 0.15;
        const chair2X = desk2CX + deskD / 2 + 0.15;

        // ── Monitors ──
        const screenW = 0.54;
        const screenH = 0.34;
        const silver = { color: "#c8c8c8", roughness: 0.15, metalness: 0.7 };

        // ── Toilet room shelf ──
        const toiletShelfW = toiletStripW - 0.10;
        const toiletShelfD = 0.35;
        const toiletShelfCX = partX + partT + toiletStripW / 2;
        const toiletShelfCZ = backInnerZ + toiletShelfD / 2;
        const toiletBackZ = backInnerZ + 0.04;
        const toiletCounterH = height * 0.3;
        const toiletUpperBottom = height * 0.6;
        const toiletUpperH = height - toiletUpperBottom;

        return (
          <group>
            {/* ═══ BACK WALL SHELF/CABINET ═══ */}
            <mesh position={[shelfCX, height / 2 + floorThick, backPanelZ]}>
              <boxGeometry args={[shelfW, height, 0.04]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[shelfCX, counterTop / 2 + floorThick, shelfCZ]}>
              <boxGeometry args={[shelfW, counterTop, shelfD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[shelfCX, counterTop + 0.015 + floorThick, shelfCZ]}>
              <boxGeometry args={[shelfW + 0.02, 0.03, shelfD + 0.02]} />
              <meshStandardMaterial color={sc.counterTop} roughness={0.4} metalness={0.1} />
            </mesh>
            <mesh position={[shelfCX, upperBottom + upperH / 2 + floorThick, shelfCZ]}>
              <boxGeometry args={[shelfW, upperH, shelfD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Niche side panels */}
            <mesh position={[shelfCX - shelfW / 2 + shelfW / 12, counterTop + nicheH / 2 + floorThick, shelfCZ]}>
              <boxGeometry args={[shelfW / 6, nicheH, shelfD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[shelfCX + shelfW / 2 - shelfW / 12, counterTop + nicheH / 2 + floorThick, shelfCZ]}>
              <boxGeometry args={[shelfW / 6, nicheH, shelfD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[shelfCX, counterTop + nicheH / 2 + floorThick, backPanelZ + 0.005]}>
              <boxGeometry args={[shelfW * 4 / 6 - 0.02, nicheH - 0.06, 0.01]} />
              <meshStandardMaterial color="#0e0a08" roughness={0.95} />
            </mesh>
            <mesh position={[shelfCX, counterTop + nicheH / 2 + floorThick, shelfCZ]}>
              <boxGeometry args={[shelfW * 4 / 6 - 0.02, 0.025, shelfD - 0.02]} />
              <meshStandardMaterial color={sc.counterTop} roughness={0.4} metalness={0.1} />
            </mesh>
            {/* Door lines */}
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <mesh key={`su${i}`} position={[shelfCX - shelfW / 2 + shelfW * frac, upperBottom + upperH / 2 + floorThick, shelfCZ + shelfD / 2 + 0.002]}>
                <boxGeometry args={[0.008, upperH - 0.02, 0.004]} />
                <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
              </mesh>
            ))}
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <mesh key={`sl${i}`} position={[shelfCX - shelfW / 2 + shelfW * frac, counterTop / 2 + floorThick, shelfCZ + shelfD / 2 + 0.002]}>
                <boxGeometry args={[0.008, counterTop - 0.02, 0.004]} />
                <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
              </mesh>
            ))}
            {ledStrip && <>
            {/* LED strip under upper cabinet — at back */}
            <mesh position={[shelfCX, upperBottom - 0.005 + floorThick, backPanelZ + 0.04]}>
              <boxGeometry args={[shelfW * 4 / 6 - 0.02, 0.01, 0.015]} />
              <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
            </mesh>
            {/* LED strip under middle shelf — at back */}
            <mesh position={[shelfCX, counterTop + nicheH / 2 - 0.018 + floorThick, backPanelZ + 0.04]}>
              <boxGeometry args={[shelfW * 4 / 6 - 0.02, 0.01, 0.015]} />
              <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
            </mesh>
            {/* LED strip under countertop — at back */}
            <mesh position={[shelfCX, counterTop + 0.03 - 0.005 + floorThick, backPanelZ + 0.04]}>
              <boxGeometry args={[shelfW - 0.02, 0.01, 0.015]} />
              <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
            </mesh>
            {/* Point lights for cabinet glow */}
            <pointLight position={[shelfCX, upperBottom - 0.05 + floorThick, shelfCZ]} intensity={0.5} distance={1.0} color="#fffde8" />
            <pointLight position={[shelfCX, counterTop + nicheH / 4 + floorThick, shelfCZ]} intensity={0.4} distance={0.8} color="#fffde8" />
            </>}

            {/* ═══ DESK 1 (left, rotated 90°) ═══ */}
            <mesh position={[desk1CX, deskH + floorThick, deskCZ]} castShadow>
              <boxGeometry args={[deskD, topT, deskW]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[desk1CX, deskH / 2 + floorThick, deskCZ - deskW / 2 + 0.02]}>
              <boxGeometry args={[deskD, deskH, 0.04]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[desk1CX, deskH / 2 + floorThick, deskCZ + deskW / 2 - 0.02]}>
              <boxGeometry args={[deskD, deskH, 0.04]} />
              <meshStandardMaterial {...white} />
            </mesh>

            {/* ═══ DESK 2 (right, flush against desk 1) ═══ */}
            <mesh position={[desk2CX, deskH + floorThick, deskCZ]} castShadow>
              <boxGeometry args={[deskD, topT, deskW]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[desk2CX, deskH / 2 + floorThick, deskCZ - deskW / 2 + 0.02]}>
              <boxGeometry args={[deskD, deskH, 0.04]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[desk2CX, deskH / 2 + floorThick, deskCZ + deskW / 2 - 0.02]}>
              <boxGeometry args={[deskD, deskH, 0.04]} />
              <meshStandardMaterial {...white} />
            </mesh>

            {/* ═══ MONITOR 1 — center of desk, near shared edge, facing left chair ═══ */}
            <group position={[mainRoomCX - 0.12, 0, deskCZ]} rotation={[0, -Math.PI / 2, 0]}>
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
              <mesh position={[0, deskH + topT / 2 + 0.22 + screenH / 2 + floorThick, 0.002]}>
                <boxGeometry args={[screenW - 0.03, screenH - 0.03, 0.002]} />
                <meshStandardMaterial color="#1a1a2e" roughness={0.05} metalness={0.3} />
              </mesh>
            </group>

            {/* ═══ MONITOR 2 — center of desk, near shared edge, facing right chair ═══ */}
            <group position={[mainRoomCX + 0.12, 0, deskCZ]} rotation={[0, Math.PI / 2, 0]}>
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
              <mesh position={[0, deskH + topT / 2 + 0.22 + screenH / 2 + floorThick, 0.002]}>
                <boxGeometry args={[screenW - 0.03, screenH - 0.03, 0.002]} />
                <meshStandardMaterial color="#1a1a2e" roughness={0.05} metalness={0.3} />
              </mesh>
            </group>

            {/* ═══ KEYBOARD 1 + MOUSE 1 on desk 1 (near chair side) ═══ */}
            <mesh position={[desk1CX - 0.1, deskH + topT / 2 + 0.01 + floorThick, deskCZ + 0.1]}>
              <boxGeometry args={[0.12, 0.012, 0.35]} />
              <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[desk1CX - 0.1, deskH + topT / 2 + 0.008 + floorThick, deskCZ - 0.15]}>
              <boxGeometry args={[0.04, 0.012, 0.06]} />
              <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.4} />
            </mesh>

            {/* ═══ KEYBOARD 2 + MOUSE 2 on desk 2 (near chair side) ═══ */}
            <mesh position={[desk2CX + 0.1, deskH + topT / 2 + 0.01 + floorThick, deskCZ + 0.1]}>
              <boxGeometry args={[0.12, 0.012, 0.35]} />
              <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[desk2CX + 0.1, deskH + topT / 2 + 0.008 + floorThick, deskCZ - 0.15]}>
              <boxGeometry args={[0.04, 0.012, 0.06]} />
              <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.4} />
            </mesh>

            {/* ═══ LEFT OFFICE CHAIR — facing desk 1 (+X) ═══ */}
            <group position={[chair1X, 0, deskCZ]}>
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

            {/* ═══ RIGHT OFFICE CHAIR — facing desk 2 (-X) ═══ */}
            <group position={[chair2X, 0, deskCZ]}>
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
              <mesh position={[0.18, 0.72 + floorThick, 0]}>
                <boxGeometry args={[0.05, 0.5, 0.42]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
              </mesh>
            </group>

            {/* ═══ RIGHT WALL SHELF (between front wall and toilet wall) with integrated sink ═══ */}
            {(() => {
              const frontInnerZ = halfD - wallThick;
              const rwShelfDepth = frontInnerZ - toiletWallZ - partT / 2 - 0.04; // available space minus margins
              const rwShelfD = 0.40;
              const rwShelfCX = halfW - wallThick - rwShelfD / 2;
              const rwShelfCZ = toiletWallZ + partT / 2 + 0.02 + rwShelfDepth / 2;
              const rwShelfW = rwShelfDepth; // along Z
              const rwBackX = halfW - wallThick - 0.02; // flush against wall
              const rwCounterH = height * 0.25;
              const rwUpperBottom = height * 0.65;
              const rwUpperH = height - rwUpperBottom;

              // Sink dimensions
              const sinkW = 0.40;
              const sinkD = 0.30;
              const sinkDepth = 0.12;

              return (
                <group>
                  {/* Back panel on right wall */}
                  <mesh position={[rwBackX, height / 2 + floorThick, rwShelfCZ]}>
                    <boxGeometry args={[0.04, height, rwShelfW]} />
                    <meshStandardMaterial {...matProps} />
                  </mesh>
                  {/* Side panel — toilet wall side */}
                  <mesh position={[rwShelfCX, height / 2 + floorThick, rwShelfCZ - rwShelfW / 2 - 0.01]}>
                    <boxGeometry args={[rwShelfD, height, 0.02]} />
                    <meshStandardMaterial {...matProps} />
                  </mesh>
                  {/* Side panel — front wall side */}
                  <mesh position={[rwShelfCX, height / 2 + floorThick, rwShelfCZ + rwShelfW / 2 + 0.01]}>
                    <boxGeometry args={[rwShelfD, height, 0.02]} />
                    <meshStandardMaterial {...matProps} />
                  </mesh>
                  {/* Lower cabinet */}
                  <mesh position={[rwShelfCX, rwCounterH / 2 + floorThick, rwShelfCZ]}>
                    <boxGeometry args={[rwShelfD, rwCounterH, rwShelfW]} />
                    <meshStandardMaterial {...matProps} />
                  </mesh>
                  {/* Countertop */}
                  <mesh position={[rwShelfCX, rwCounterH + 0.015 + floorThick, rwShelfCZ]}>
                    <boxGeometry args={[rwShelfD + 0.02, 0.03, rwShelfW + 0.02]} />
              <meshStandardMaterial color={sc.counterTop} roughness={0.4} metalness={0.1} />
                  </mesh>
                  {/* Upper cabinet (no middle shelf — just upper box) */}
                  <mesh position={[rwShelfCX, rwUpperBottom + rwUpperH / 2 + floorThick, rwShelfCZ]}>
                    <boxGeometry args={[rwShelfD, rwUpperH, rwShelfW]} />
                    <meshStandardMaterial {...matProps} />
                  </mesh>
                  {/* Shelf just under upper cabinet — spans full width from toilet wall to front wall */}
                  {(() => {
                    const shelfZ = (toiletWallZ + partT / 2 + frontInnerZ) / 2;
                    const shelfLen = frontInnerZ - (toiletWallZ + partT / 2) - 0.01;
                    return (
                      <>
                        <mesh position={[rwShelfCX, rwUpperBottom - 0.30 + floorThick, shelfZ]}>
                          <boxGeometry args={[rwShelfD + 0.01, 0.02, shelfLen]} />
                          <meshStandardMaterial color={sc.counterTop} roughness={0.4} metalness={0.1} />
                        </mesh>
                        {ledStrip && <>
                        {/* LED strip under shelf — at back wall */}
                        <mesh position={[rwBackX - 0.03, rwUpperBottom - 0.30 - 0.01 + floorThick, shelfZ]}>
                          <boxGeometry args={[0.012, 0.008, shelfLen - 0.04]} />
                          <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={3} roughness={0.2} toneMapped={false} />
                        </mesh>
                        {/* LED strip under upper cabinet — at back wall */}
                        <mesh position={[rwBackX - 0.03, rwUpperBottom - 0.01 + floorThick, rwShelfCZ]}>
                          <boxGeometry args={[0.012, 0.008, rwShelfW - 0.04]} />
                          <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={3} roughness={0.2} toneMapped={false} />
                        </mesh>
                        {/* LED strip under countertop — at back wall */}
                        <mesh position={[rwBackX - 0.03, rwCounterH + 0.03 - 0.01 + floorThick, rwShelfCZ]}>
                          <boxGeometry args={[0.012, 0.008, rwShelfW - 0.04]} />
                          <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={3} roughness={0.2} toneMapped={false} />
                        </mesh>
                        {/* Point lights for LED glow */}
                        <pointLight position={[rwShelfCX, rwUpperBottom - 0.05 + floorThick, rwShelfCZ]} intensity={0.4} distance={0.8} color="#fffde8" />
                        <pointLight position={[rwShelfCX, rwUpperBottom - 0.35 + floorThick, shelfZ]} intensity={0.3} distance={0.6} color="#fffde8" />
                        <pointLight position={[rwShelfCX, rwCounterH + floorThick, rwShelfCZ]} intensity={0.25} distance={0.5} color="#fffde8" />
                        </>}
                      </>
                    );
                  })()}
                  {/* Open niche back panel */}
                  <mesh position={[rwBackX - 0.005, rwCounterH + (rwUpperBottom - rwCounterH) / 2 + floorThick, rwShelfCZ]}>
                    <boxGeometry args={[0.01, (rwUpperBottom - rwCounterH) - 0.06, rwShelfW - 0.04]} />
                    <meshStandardMaterial color="#0e0a08" roughness={0.95} />
                  </mesh>
                  {/* Door lines lower */}
                  {[0.33, 0.67].map((frac, i) => (
                    <mesh key={`rsl${i}`} position={[rwShelfCX - rwShelfD / 2 - 0.002, rwCounterH / 2 + floorThick, rwShelfCZ - rwShelfW / 2 + rwShelfW * frac]}>
                      <boxGeometry args={[0.004, rwCounterH - 0.02, 0.008]} />
                      <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
                    </mesh>
                  ))}
                  {/* Door lines upper */}
                  {[0.33, 0.67].map((frac, i) => (
                    <mesh key={`rsu${i}`} position={[rwShelfCX - rwShelfD / 2 - 0.002, rwUpperBottom + rwUpperH / 2 + floorThick, rwShelfCZ - rwShelfW / 2 + rwShelfW * frac]}>
                      <boxGeometry args={[0.004, rwUpperH - 0.02, 0.008]} />
                      <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
                    </mesh>
                  ))}
                  {/* ── Integrated sink basin ── */}
                  <mesh position={[rwShelfCX, rwCounterH + 0.03 + 0.001 + floorThick, rwShelfCZ]}>
                    <boxGeometry args={[sinkD, 0.003, sinkW]} />
                    <meshStandardMaterial color="#e8e8e8" roughness={0.1} metalness={0.6} />
                  </mesh>
                  {/* Sink basin hole (recessed) */}
                  <mesh position={[rwShelfCX, rwCounterH + 0.03 - sinkDepth / 2 + floorThick, rwShelfCZ]}>
                    <boxGeometry args={[sinkD - 0.02, sinkDepth, sinkW - 0.02]} />
                    <meshStandardMaterial color="#d0d0d0" roughness={0.15} metalness={0.5} />
                  </mesh>
                  {/* Faucet base */}
                  <mesh position={[rwShelfCX + sinkD / 2 - 0.02, rwCounterH + 0.03 + 0.01 + floorThick, rwShelfCZ]}>
                    <cylinderGeometry args={[0.015, 0.02, 0.02, 8]} />
                    <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.8} />
                  </mesh>
                  {/* Faucet stem */}
                  <mesh position={[rwShelfCX + sinkD / 2 - 0.02, rwCounterH + 0.03 + 0.12 + floorThick, rwShelfCZ]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.20, 8]} />
                    <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.8} />
                  </mesh>
                  {/* Faucet spout */}
                  <mesh position={[rwShelfCX + sinkD / 2 - 0.08, rwCounterH + 0.03 + 0.21 + floorThick, rwShelfCZ]} rotation={[0, 0, Math.PI / 6]}>
                    <cylinderGeometry args={[0.006, 0.008, 0.12, 8]} />
                    <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.8} />
                  </mesh>
                  {/* ── Coffee machine (left of sink) ── */}
                  <group position={[rwShelfCX, rwCounterH + 0.03 + floorThick, toiletWallZ + partT / 2 + 0.02 + 0.14]}>
                    {/* Base body */}
                    <mesh position={[0, 0.14, 0]}>
                      <boxGeometry args={[0.18, 0.28, 0.25]} />
                      <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
                    </mesh>
                    {/* Water reservoir (back) */}
                    <mesh position={[0.06, 0.18, 0]}>
                      <boxGeometry args={[0.06, 0.36, 0.20]} />
                      <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.1} />
                    </mesh>
                    {/* Drip tray */}
                    <mesh position={[0, 0.005, 0]}>
                      <boxGeometry args={[0.16, 0.01, 0.12]} />
                      <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.5} />
                    </mesh>
                    {/* Spout */}
                    <mesh position={[-0.02, 0.22, 0]}>
                      <boxGeometry args={[0.04, 0.04, 0.04]} />
                      <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.4} />
                    </mesh>
                    {/* Control panel / buttons */}
                    <mesh position={[-0.091, 0.20, 0]}>
                      <boxGeometry args={[0.005, 0.08, 0.10]} />
                      <meshStandardMaterial color="#444444" roughness={0.3} metalness={0.2} />
                    </mesh>
                    {/* Brand accent strip */}
                    <mesh position={[-0.092, 0.12, 0]}>
                      <boxGeometry args={[0.004, 0.02, 0.14]} />
                      <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.8} />
                    </mesh>
                  </group>
                </group>
              );
            })()}

            {/* ═══ TOILET ROOM SHELF ═══ */}
            <mesh position={[toiletShelfCX, height / 2 + floorThick, toiletBackZ]}>
              <boxGeometry args={[toiletShelfW, height, 0.02]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[toiletShelfCX, toiletCounterH / 2 + floorThick, toiletShelfCZ]}>
              <boxGeometry args={[toiletShelfW, toiletCounterH, toiletShelfD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[toiletShelfCX, toiletCounterH + 0.015 + floorThick, toiletShelfCZ]}>
              <boxGeometry args={[toiletShelfW + 0.02, 0.03, toiletShelfD + 0.02]} />
              <meshStandardMaterial color="#1a1510" roughness={0.4} metalness={0.1} />
            </mesh>
            <mesh position={[toiletShelfCX, toiletUpperBottom + toiletUpperH / 2 + floorThick, toiletShelfCZ]}>
              <boxGeometry args={[toiletShelfW, toiletUpperH, toiletShelfD]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[toiletShelfCX, toiletCounterH + (toiletUpperBottom - toiletCounterH) / 2 + floorThick, toiletBackZ + 0.005]}>
              <boxGeometry args={[toiletShelfW - 0.04, (toiletUpperBottom - toiletCounterH) - 0.06, 0.01]} />
              <meshStandardMaterial color="#0e0a08" roughness={0.95} />
            </mesh>
            <mesh position={[toiletShelfCX, toiletCounterH + (toiletUpperBottom - toiletCounterH) / 2 + floorThick, toiletShelfCZ]}>
              <boxGeometry args={[toiletShelfW - 0.04, 0.025, toiletShelfD - 0.02]} />
              <meshStandardMaterial color="#1a1510" roughness={0.4} metalness={0.1} />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
}


function FlowBWalls({
  width, height, depth, wallThick, floorThick, cornerRadius,
  extWallH, extWallCY,
  winH, winBot, winTop, winCY, woodBase, frameColor,
  interiorColor, interiorRoughness, osbTex, isShell,
  finishLevel,
  shelfColor,
  ledStrip,
  lightOakTex,
}: any) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const sideInset = Math.max(cornerRadius, wallThick);
  const sideFlatD = depth - sideInset * 2;
  const intWallD = depth - wallThick * 2;
  const partT = 0.10; // 10cm internal partition walls

  // Room dimensions: 300cm = 3.0m each
  const roomW = 3.0;
  const leftPartX = -halfW + wallThick + roomW; // -0.82
  const rightPartX = halfW - wallThick - roomW - partT; // 0.72

  // Toilet room: 103cm deep from back inner wall
  const toiletD = (103 / 350) * depth;
  const toiletWallZ = -halfD + wallThick + toiletD;

  // Front wall segments (in meters): 73+200+77+100+77+200+73 = 800cm
  // When corners are rounded, trim only the outermost segments so the facade follows the curved profile.
  const segs = [0.73, 2.0, 0.77, 1.0, 0.77, 2.0, 0.73];
  const segTypes = ["wall", "window", "wall", "door", "wall", "window", "wall"] as const;
  const frontEdgeInset = Math.max(0, cornerRadius);
  const frontSegs = segs.map((w, i) => (i === 0 || i === segs.length - 1 ? Math.max(0.05, w - frontEdgeInset) : w));
  let xCursor = -halfW + frontEdgeInset;
  const frontParts = frontSegs.map((w, i) => {
    const cx = xCursor + w / 2;
    xCursor += w;
    return { w, cx, type: segTypes[i] };
  });

  // Room door openings in partition walls: 84cm = 0.84m
  const roomDoorH = 2.1; // 210cm door height
  const roomDoorW = 0.84;
  // Center door in the hallway section (between toilet wall and front wall)
  const doorAvailStart = toiletWallZ + partT;
  const doorAvailEnd = halfD - wallThick;
  const doorCenterZ = (doorAvailStart + doorAvailEnd) / 2;

  // Partition wall segments: split around door openings
  // Section 1: back wall to toilet wall
  const partSec1D = toiletD;
  const partSec1CZ = -halfD + wallThick + partSec1D / 2;
  // Section 2: toilet wall to door start
  const partSec2Start = toiletWallZ + partT;
  const partSec2End = doorCenterZ - roomDoorW / 2;
  const partSec2D = partSec2End - partSec2Start;
  const partSec2CZ = (partSec2Start + partSec2End) / 2;
  // Section 3: door end to front wall
  const partSec3Start = doorCenterZ + roomDoorW / 2;
  const partSec3End = halfD - wallThick;
  const partSec3D = partSec3End - partSec3Start;
  const partSec3CZ = (partSec3Start + partSec3End) / 2;

  // Toilet room interior positions — offset left (mirroring flips to right)
  const hallLeft = leftPartX + partT;
  const hallRight = rightPartX;
  const hallCenterX = (hallLeft + hallRight) / 2;
  const toiletCenterX = hallCenterX - 0.15; // toilet shifted left of center

  return (
    <group>
      {/* ── BACK WALL — solid ── */}
      <mesh position={[0, extWallCY, -halfD + wallThick / 2]} castShadow>
        <boxGeometry args={[width - cornerRadius * 2, extWallH, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={width - cornerRadius * 2} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      <mesh position={[0, height / 2 + floorThick, -halfD + wallThick + 0.01]}>
        <boxGeometry args={[width - wallThick * 2, height, 0.01]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── LEFT WALL — solid ── */}
      <mesh position={[-halfW + wallThick / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[wallThick, extWallH, sideFlatD]} />
        <CladMaterial {...woodBase} wallWidth={sideFlatD} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <mesh position={[-halfW + wallThick + 0.005, height / 2 + floorThick, 0]}>
        <boxGeometry args={[0.01, height, intWallD]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── RIGHT WALL — solid ── */}
      <mesh position={[halfW - wallThick / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[wallThick, extWallH, sideFlatD]} />
        <CladMaterial {...woodBase} wallWidth={sideFlatD} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <mesh position={[halfW - wallThick - 0.005, height / 2 + floorThick, 0]}>
        <boxGeometry args={[0.01, height, intWallD]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── FRONT WALL — segmented with windows + entrance door ── */}
      {frontParts.map((seg, i) => {
        if (seg.type === "wall") {
          return (
            <group key={`fs${i}`}>
              <mesh position={[seg.cx, extWallCY, halfD - wallThick / 2]} castShadow>
                <boxGeometry args={[seg.w, extWallH, wallThick]} />
                <CladMaterial {...woodBase} wallWidth={seg.w} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
              </mesh>
              {/* Interior face */}
              <mesh position={[seg.cx, height / 2 + floorThick, halfD - wallThick - 0.005]}>
                <boxGeometry args={[seg.w, height, 0.01]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
            </group>
          );
        }
        if (seg.type === "window") {
          return (
            <group key={`fs${i}`}>
              {/* Spandrel below window */}
              <mesh position={[seg.cx, (winBot + floorThick) / 2, halfD - wallThick / 2]} castShadow>
                <boxGeometry args={[seg.w, winBot + floorThick, wallThick]} />
                <CladMaterial {...woodBase} wallWidth={seg.w} wallHeight={winBot + floorThick} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
              </mesh>
              {/* Header above window */}
              <mesh position={[seg.cx, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick / 2]} castShadow>
                <boxGeometry args={[seg.w, height - winTop, wallThick]} />
                <CladMaterial {...woodBase} wallWidth={seg.w} wallHeight={height - winTop} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
              </mesh>
              <GlassPane posX={seg.cx} posY={winCY + floorThick} width={seg.w} height={winH} frameColor={frameColor} z={halfD - wallThick / 2} />
              {/* Interior faces */}
              <mesh position={[seg.cx, (winBot + floorThick) / 2, halfD - wallThick - 0.005]}>
                <boxGeometry args={[seg.w, winBot + floorThick, 0.01]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
              <mesh position={[seg.cx, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick - 0.005]}>
                <boxGeometry args={[seg.w, height - winTop, 0.01]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
            </group>
          );
        }
        // Entrance door
        return (
          <group key={`fs${i}`}>
            {/* Header above door */}
            <mesh position={[seg.cx, winTop + (height - winTop) / 2 + floorThick, halfD - wallThick / 2]} castShadow>
              <boxGeometry args={[seg.w, height - winTop, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={seg.w} wallHeight={height - winTop} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
            </mesh>
            <DoorPane posX={seg.cx} posY={floorThick + winTop / 2} width={seg.w} height={winTop} frameColor={frameColor} z={halfD - wallThick / 2} rotate={false} />
            {/* Wall below door — covers floor slab */}
            <mesh position={[seg.cx, floorThick / 2, halfD - wallThick / 2]} castShadow>
              <boxGeometry args={[seg.w, floorThick, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={seg.w} wallHeight={floorThick} fullWallHeight={extWallH} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
            </mesh>
          </group>
        );
      })}

      {/* ── LEFT PARTITION WALL — split around door opening ── */}
      {/* Section 1: back to toilet wall */}
      <mesh position={[leftPartX + partT / 2, height / 2 + floorThick, partSec1CZ]}>
        <boxGeometry args={[partT, height, partSec1D]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
      </mesh>
      {/* Section 2: toilet wall to door */}
      {partSec2D > 0.05 && (
        <mesh position={[leftPartX + partT / 2, height / 2 + floorThick, partSec2CZ]}>
          <boxGeometry args={[partT, height, partSec2D]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Door header */}
      <mesh position={[leftPartX + partT / 2, roomDoorH + (height - roomDoorH) / 2 + floorThick, doorCenterZ]}>
        <boxGeometry args={[partT, height - roomDoorH, roomDoorW]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
      </mesh>
      {/* Section 3: door to front */}
      {partSec3D > 0.05 && (
        <mesh position={[leftPartX + partT / 2, height / 2 + floorThick, partSec3CZ]}>
          <boxGeometry args={[partT, height, partSec3D]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Left door frame */}
      <mesh position={[leftPartX + partT / 2, roomDoorH / 2 + floorThick, doorCenterZ - roomDoorW / 2 - 0.015]}>
        <boxGeometry args={[partT + 0.01, roomDoorH, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[leftPartX + partT / 2, roomDoorH / 2 + floorThick, doorCenterZ + roomDoorW / 2 + 0.015]}>
        <boxGeometry args={[partT + 0.01, roomDoorH, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[leftPartX + partT / 2, roomDoorH + floorThick + 0.015, doorCenterZ]}>
        <boxGeometry args={[partT + 0.01, 0.03, roomDoorW + 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Door panel */}
      <mesh position={[leftPartX + partT / 2, roomDoorH / 2 + floorThick, doorCenterZ]}>
        <boxGeometry args={[0.04, roomDoorH - 0.02, roomDoorW - 0.02]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.85} />
      </mesh>
      {/* Left door handle (both sides) */}
      {[-1, 1].map((side, i) => (
        <group key={`lh${i}`} position={[leftPartX + partT / 2 + side * 0.035, 1.0 + floorThick, doorCenterZ + 0.3]}>
          {/* Square rosette plate flush on door surface */}
          <mesh>
            <boxGeometry args={[0.012, 0.06, 0.06]} />
            <meshStandardMaterial color="#a8a8a8" roughness={0.2} metalness={0.85} />
          </mesh>
          {/* Lever handle extending horizontally */}
          <mesh position={[side * 0.015, 0, -side * 0.06]}>
            <boxGeometry args={[0.018, 0.018, 0.12]} />
            <meshStandardMaterial color="#b8b8b8" roughness={0.15} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ── RIGHT PARTITION WALL — split around door opening ── */}
      <mesh position={[rightPartX + partT / 2, height / 2 + floorThick, partSec1CZ]}>
        <boxGeometry args={[partT, height, partSec1D]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
      </mesh>
      {partSec2D > 0.05 && (
        <mesh position={[rightPartX + partT / 2, height / 2 + floorThick, partSec2CZ]}>
          <boxGeometry args={[partT, height, partSec2D]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh position={[rightPartX + partT / 2, roomDoorH + (height - roomDoorH) / 2 + floorThick, doorCenterZ]}>
        <boxGeometry args={[partT, height - roomDoorH, roomDoorW]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
      </mesh>
      {partSec3D > 0.05 && (
        <mesh position={[rightPartX + partT / 2, height / 2 + floorThick, partSec3CZ]}>
          <boxGeometry args={[partT, height, partSec3D]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Right door frame */}
      <mesh position={[rightPartX + partT / 2, roomDoorH / 2 + floorThick, doorCenterZ - roomDoorW / 2 - 0.015]}>
        <boxGeometry args={[partT + 0.01, roomDoorH, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[rightPartX + partT / 2, roomDoorH / 2 + floorThick, doorCenterZ + roomDoorW / 2 + 0.015]}>
        <boxGeometry args={[partT + 0.01, roomDoorH, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[rightPartX + partT / 2, roomDoorH + floorThick + 0.015, doorCenterZ]}>
        <boxGeometry args={[partT + 0.01, 0.03, roomDoorW + 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[rightPartX + partT / 2, roomDoorH / 2 + floorThick, doorCenterZ]}>
        <boxGeometry args={[0.04, roomDoorH - 0.02, roomDoorW - 0.02]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.85} />
      </mesh>
      {/* Right door handle (both sides) */}
      {[-1, 1].map((side, i) => (
        <group key={`rh${i}`} position={[rightPartX + partT / 2 + side * 0.035, 1.0 + floorThick, doorCenterZ - 0.3]}>
          {/* Square rosette plate flush on door surface */}
          <mesh>
            <boxGeometry args={[0.012, 0.06, 0.06]} />
            <meshStandardMaterial color="#a8a8a8" roughness={0.2} metalness={0.85} />
          </mesh>
          {/* Lever handle extending horizontally */}
          <mesh position={[side * 0.015, 0, side * 0.06]}>
            <boxGeometry args={[0.018, 0.018, 0.12]} />
            <meshStandardMaterial color="#b8b8b8" roughness={0.15} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ── TOILET ROOM WALL (horizontal, between partitions) ── */}
      {/* Split around toilet door opening */}
      {(() => {
        const toiletDoorW = 0.84;
        const hallW = rightPartX - leftPartX - partT;
        const toiletDoorCX = hallCenterX - 0.12; // door shifted left
        const leftSegW = toiletDoorCX - toiletDoorW / 2 - (leftPartX + partT);
        const rightSegW = rightPartX - (toiletDoorCX + toiletDoorW / 2);
        const leftSegCX = leftPartX + partT + leftSegW / 2;
        const rightSegCX = rightPartX - rightSegW / 2;

        return (
          <>
            {/* Left segment */}
            {leftSegW > 0.01 && (
              <mesh position={[leftSegCX, height / 2 + floorThick, toiletWallZ]}>
                <boxGeometry args={[leftSegW, height, partT]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
              </mesh>
            )}
            {/* Right segment */}
            {rightSegW > 0.01 && (
              <mesh position={[rightSegCX, height / 2 + floorThick, toiletWallZ]}>
                <boxGeometry args={[rightSegW, height, partT]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
              </mesh>
            )}
            {/* Header above toilet door */}
            <mesh position={[toiletDoorCX, roomDoorH + (height - roomDoorH) / 2 + floorThick, toiletWallZ]}>
              <boxGeometry args={[toiletDoorW, height - roomDoorH, partT]} />
              <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
            </mesh>
            {/* Toilet door panel */}
            <mesh position={[toiletDoorCX, roomDoorH / 2 + floorThick, toiletWallZ]}>
              <boxGeometry args={[toiletDoorW - 0.04, roomDoorH - 0.02, 0.035]} />
              <meshStandardMaterial color="#f5f5f5" roughness={0.85} />
            </mesh>
            {/* Toilet door handle (both sides) */}
            {[-1, 1].map((side, i) => (
              <group key={`th${i}`} position={[toiletDoorCX + 0.25, 1.0 + floorThick, toiletWallZ + side * 0.032]}>
                {/* Square rosette plate flush on door surface */}
                <mesh>
                  <boxGeometry args={[0.06, 0.06, 0.012]} />
                  <meshStandardMaterial color="#a8a8a8" roughness={0.2} metalness={0.85} />
                </mesh>
                {/* Lever handle extending horizontally */}
                <mesh position={[-side * 0.06, 0, side * 0.015]}>
                  <boxGeometry args={[0.12, 0.018, 0.018]} />
                  <meshStandardMaterial color="#b8b8b8" roughness={0.15} metalness={0.9} />
                </mesh>
              </group>
            ))}
          </>
        );
      })()}

      {/* ── TOILET FIXTURES ── */}
      {(() => {
        const white = { color: "#f0f0f0", roughness: 0.15, metalness: 0.05 };
        const chrome = { color: "#c0c0c0", roughness: 0.1, metalness: 0.9 };
        const backInnerZ = -halfD + wallThick + 0.01;
        const toiletZ = backInnerZ + toiletD * 0.35;
        const sinkZ = backInnerZ + toiletD * 0.7;

        return (
          <group>
            {/* Wall-hung toilet (on back wall) */}
            <mesh position={[toiletCenterX, 0.38 + floorThick, toiletZ]}>
              <boxGeometry args={[0.36, 0.14, 0.36]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[toiletCenterX, 0.46 + floorThick, toiletZ]}>
              <boxGeometry args={[0.38, 0.025, 0.38]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.02} />
            </mesh>
            <mesh position={[toiletCenterX, 0.55 + floorThick, backInnerZ + 0.05]}>
              <boxGeometry args={[0.38, 0.35, 0.1]} />
              <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
            <mesh position={[toiletCenterX, 0.78 + floorThick, backInnerZ + 0.02]}>
              <boxGeometry args={[0.14, 0.08, 0.005]} />
              <meshStandardMaterial {...chrome} />
            </mesh>

            {/* Small sink (on right partition wall) */}
            <mesh position={[rightPartX - 0.14, 0.8 + floorThick, sinkZ]}>
              <boxGeometry args={[0.28, 0.06, 0.28]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[rightPartX - 0.14, 0.81 + floorThick, sinkZ]}>
              <boxGeometry args={[0.22, 0.04, 0.22]} />
              <meshStandardMaterial color="#d8d8d8" roughness={0.1} />
            </mesh>
            {/* Faucet */}
            <mesh position={[rightPartX - 0.06, 0.88 + floorThick, sinkZ]}>
              <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
              <meshStandardMaterial {...chrome} />
            </mesh>
          </group>
        );
      })()}

      {/* ── OFFICE FURNITURE (only when fully finished) ── */}
      {finishLevel === "fully-finished" && (() => {
        const white = { color: "#ffffff", roughness: 0.25, metalness: 0.05 };
        const darkMetal = { color: "#2a2a2a", roughness: 0.4, metalness: 0.6 };
        const silver = { color: "#c8c8c8", roughness: 0.15, metalness: 0.7 };
        const gsc = getShelfColors(shelfColor);
        const matProps = { color: shelfColor === "light-oak" ? "#ffffff" : gsc.cabinet, roughness: 0.75, metalness: 0.05, ...(shelfColor === "light-oak" && lightOakTex ? { map: lightOakTex } : {}) };
        const deskW = 2.52;
        const deskD = 0.70;
        const deskH = 0.75;
        const topT = 0.04;
        const screenW = 0.54;
        const screenH = 0.34;

        const backInnerZ = -halfD + wallThick + 0.02;

        // LEFT ROOM bounds
        const leftRoomLeft = -halfW + wallThick;
        const leftRoomRight = leftPartX;
        const leftRoomW = leftRoomRight - leftRoomLeft;
        const leftRoomCX = (leftRoomLeft + leftRoomRight) / 2;

        // RIGHT ROOM bounds
        const rightRoomLeft = rightPartX + partT;
        const rightRoomRight = halfW - wallThick;
        const rightRoomW = rightRoomRight - rightRoomLeft;
        const rightRoomCX = (rightRoomLeft + rightRoomRight) / 2;

        // Shelf dimensions
        const shelfD = 0.40;
        const counterTop = height * 0.25;
        const upperBottom = height * 0.65;
        const upperH = height - upperBottom;
        const nicheH = upperBottom - counterTop;

        // Desk positions — side against partition, front edge at doorframe
        const lDeskCX = leftPartX - deskW / 2;
        const lDeskCZ = doorCenterZ - roomDoorW / 2 - deskD / 2;
        const rDeskCX = rightPartX + partT + deskW / 2;
        const rDeskCZ = doorCenterZ - roomDoorW / 2 - deskD / 2;

        // Helper to render a shelf closet across the back wall
        const renderShelf = (cx: number, sw: number) => {
          const shelfCZ = backInnerZ + shelfD / 2;
          const backPanelZ = backInnerZ + 0.02; // flush against wall
          return (
            <>
              {/* Back panel */}
              <mesh position={[cx, height / 2 + floorThick, backPanelZ]}>
                <boxGeometry args={[sw, height, 0.04]} />
                <meshStandardMaterial {...matProps} />
              </mesh>
              {/* Lower cabinet */}
              <mesh position={[cx, counterTop / 2 + floorThick, shelfCZ]}>
                <boxGeometry args={[sw, counterTop, shelfD]} />
                <meshStandardMaterial {...matProps} />
              </mesh>
              {/* Countertop */}
              <mesh position={[cx, counterTop + 0.015 + floorThick, shelfCZ]}>
                <boxGeometry args={[sw + 0.02, 0.03, shelfD + 0.02]} />
                <meshStandardMaterial color={gsc.counterTop} roughness={0.4} metalness={0.1} />
              </mesh>
              {/* Upper cabinet */}
              <mesh position={[cx, upperBottom + upperH / 2 + floorThick, shelfCZ]}>
                <boxGeometry args={[sw, upperH, shelfD]} />
                <meshStandardMaterial {...matProps} />
              </mesh>
              {/* Niche side panels */}
              <mesh position={[cx - sw / 2 + sw / 12, counterTop + nicheH / 2 + floorThick, shelfCZ]}>
                <boxGeometry args={[sw / 6, nicheH, shelfD]} />
                <meshStandardMaterial {...matProps} />
              </mesh>
              <mesh position={[cx + sw / 2 - sw / 12, counterTop + nicheH / 2 + floorThick, shelfCZ]}>
                <boxGeometry args={[sw / 6, nicheH, shelfD]} />
                <meshStandardMaterial {...matProps} />
              </mesh>
              {/* Niche back */}
              <mesh position={[cx, counterTop + nicheH / 2 + floorThick, backPanelZ + 0.005]}>
                <boxGeometry args={[sw * 4 / 6 - 0.02, nicheH - 0.06, 0.01]} />
                <meshStandardMaterial color="#0e0a08" roughness={0.95} />
              </mesh>
              {/* Middle shelf */}
              <mesh position={[cx, counterTop + nicheH / 2 + floorThick, shelfCZ]}>
                <boxGeometry args={[sw * 4 / 6 - 0.02, 0.025, shelfD - 0.02]} />
                <meshStandardMaterial color={gsc.counterTop} roughness={0.4} metalness={0.1} />
              </mesh>
              {/* Door lines upper */}
              {[0.25, 0.5, 0.75].map((frac, i) => (
                <mesh key={`su${i}`} position={[cx - sw / 2 + sw * frac, upperBottom + upperH / 2 + floorThick, shelfCZ + shelfD / 2 + 0.002]}>
                  <boxGeometry args={[0.008, upperH - 0.02, 0.004]} />
                  <meshStandardMaterial color={gsc.doorLine} roughness={0.5} />
                </mesh>
              ))}
              {/* Door lines lower */}
              {[0.25, 0.5, 0.75].map((frac, i) => (
                <mesh key={`sl${i}`} position={[cx - sw / 2 + sw * frac, counterTop / 2 + floorThick, shelfCZ + shelfD / 2 + 0.002]}>
                  <boxGeometry args={[0.008, counterTop - 0.02, 0.004]} />
                  <meshStandardMaterial color={gsc.doorLine} roughness={0.5} />
                </mesh>
              ))}
              {ledStrip && <>
              {/* LED strips */}
              <mesh position={[cx, upperBottom - 0.005 + floorThick, backPanelZ + 0.04]}>
                <boxGeometry args={[sw * 4 / 6 - 0.02, 0.01, 0.015]} />
                <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
              </mesh>
              <mesh position={[cx, counterTop + nicheH / 2 - 0.018 + floorThick, backPanelZ + 0.04]}>
                <boxGeometry args={[sw * 4 / 6 - 0.02, 0.01, 0.015]} />
                <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
              </mesh>
              <mesh position={[cx, counterTop + 0.03 - 0.005 + floorThick, backPanelZ + 0.04]}>
                <boxGeometry args={[sw - 0.02, 0.01, 0.015]} />
                <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
              </mesh>
              <pointLight position={[cx, upperBottom - 0.05 + floorThick, shelfCZ]} intensity={0.5} distance={1.0} color="#fffde8" />
              <pointLight position={[cx, counterTop + nicheH / 4 + floorThick, shelfCZ]} intensity={0.4} distance={0.8} color="#fffde8" />
              </>}
            </>
          );
        };

        // Office chair facing +Z (backrest at -Z)
        const renderChair = (cx: number, cz: number) => (
          <group position={[cx, 0, cz]}>
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
            <mesh position={[0, 0.72 + floorThick, -0.18]}>
              <boxGeometry args={[0.42, 0.5, 0.05]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
            </mesh>
          </group>
        );

        return (
          <>
            {/* ═══ LEFT ROOM SHELF CLOSET ═══ */}
            {renderShelf(leftRoomCX, leftRoomW - 0.04)}

            {/* ═══ RIGHT ROOM SHELF CLOSET ═══ */}
            {renderShelf(rightRoomCX, rightRoomW - 0.04)}

            {/* ═══ LEFT ROOM DESK ═══ */}
            <mesh position={[lDeskCX, deskH + floorThick, lDeskCZ]}>
              <boxGeometry args={[deskW, topT, deskD]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[lDeskCX - deskW / 2 + 0.02, deskH / 2 + floorThick, lDeskCZ]}>
              <boxGeometry args={[0.04, deskH, deskD]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[lDeskCX + deskW / 2 - 0.02, deskH / 2 + floorThick, lDeskCZ]}>
              <boxGeometry args={[0.04, deskH, deskD]} />
              <meshStandardMaterial {...white} />
            </mesh>

            {/* Monitor — window side (+Z), screen faces -Z */}
            <group position={[lDeskCX, 0, lDeskCZ + deskD / 2 - 0.15]}>
              <mesh position={[0, deskH + topT / 2 + 0.008 + floorThick, 0]}>
                <boxGeometry args={[0.2, 0.008, 0.18]} />
                <meshStandardMaterial {...silver} />
              </mesh>
              <mesh position={[0, deskH + 0.18 + floorThick, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.25, 8]} />
                <meshStandardMaterial {...silver} />
              </mesh>
              <mesh position={[0, deskH + 0.18 + screenH / 2 + floorThick, -0.02]}>
                <boxGeometry args={[screenW, screenH, 0.02]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.5} />
              </mesh>
              <mesh position={[0, deskH + 0.18 + screenH / 2 + floorThick, -0.021]}>
                <boxGeometry args={[screenW - 0.04, screenH - 0.04, 0.002]} />
                <meshStandardMaterial color="#1a1a2e" roughness={0.1} metalness={0.0} emissive="#0a0a15" emissiveIntensity={0.3} />
              </mesh>
            </group>
            {/* Keyboard */}
            <mesh position={[lDeskCX, deskH + topT / 2 + 0.005 + floorThick, lDeskCZ - 0.05]}>
              <boxGeometry args={[0.35, 0.01, 0.12]} />
              <meshStandardMaterial color="#d4d4d4" roughness={0.6} metalness={0.1} />
            </mesh>

            {/* Left room office chair — back wall side, facing +Z */}
            {renderChair(lDeskCX, lDeskCZ - deskD / 2 - 0.35)}

            {/* ═══ RIGHT ROOM DESK ═══ */}
            <mesh position={[rDeskCX, deskH + floorThick, rDeskCZ]}>
              <boxGeometry args={[deskW, topT, deskD]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[rDeskCX - deskW / 2 + 0.02, deskH / 2 + floorThick, rDeskCZ]}>
              <boxGeometry args={[0.04, deskH, deskD]} />
              <meshStandardMaterial {...white} />
            </mesh>
            <mesh position={[rDeskCX + deskW / 2 - 0.02, deskH / 2 + floorThick, rDeskCZ]}>
              <boxGeometry args={[0.04, deskH, deskD]} />
              <meshStandardMaterial {...white} />
            </mesh>

            {/* Monitor — window side (+Z), screen faces -Z */}
            <group position={[rDeskCX, 0, rDeskCZ + deskD / 2 - 0.15]}>
              <mesh position={[0, deskH + topT / 2 + 0.008 + floorThick, 0]}>
                <boxGeometry args={[0.2, 0.008, 0.18]} />
                <meshStandardMaterial {...silver} />
              </mesh>
              <mesh position={[0, deskH + 0.18 + floorThick, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.25, 8]} />
                <meshStandardMaterial {...silver} />
              </mesh>
              <mesh position={[0, deskH + 0.18 + screenH / 2 + floorThick, -0.02]}>
                <boxGeometry args={[screenW, screenH, 0.02]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.5} />
              </mesh>
              <mesh position={[0, deskH + 0.18 + screenH / 2 + floorThick, -0.021]}>
                <boxGeometry args={[screenW - 0.04, screenH - 0.04, 0.002]} />
                <meshStandardMaterial color="#1a1a2e" roughness={0.1} metalness={0.0} emissive="#0a0a15" emissiveIntensity={0.3} />
              </mesh>
            </group>
            {/* Keyboard */}
            <mesh position={[rDeskCX, deskH + topT / 2 + 0.005 + floorThick, rDeskCZ - 0.05]}>
              <boxGeometry args={[0.35, 0.01, 0.12]} />
              <meshStandardMaterial color="#d4d4d4" roughness={0.6} metalness={0.1} />
            </mesh>

            {/* Right room office chair — back wall side, facing +Z */}
            {renderChair(rDeskCX, rDeskCZ - deskD / 2 - 0.35)}
          </>
        );
      })()}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HUB model walls — 1000×350cm
   Front: 75 wall | 200 win | 200 wall | 100 win | 150 wall | 100 win | 175 wall (WC)
   Left wall: entrance door near front corner
   Right wall: solid
   Back wall: solid
   WC room: right side, 175cm wide partition
   ═══════════════════════════════════════════════════════════════════════ */
function HubWalls({
  width, height, depth, wallThick, floorThick, cornerRadius,
  extWallH, extWallCY,
  winH, winBot, winTop, winCY, woodBase, frameColor,
  interiorColor, interiorRoughness, osbTex, isShell,
  floorPlan, hubDoorSwap, finishLevel,
  shelfColor, ledStrip, lightOakTex,
}: any) {
  const halfW = width / 2;   // 5.0
  const halfD = depth / 2;   // 1.75
  const sideInset = Math.max(cornerRadius, wallThick);
  const sideFlatD = depth - sideInset * 2;
  const partT = 0.10; // 10cm partition wall
  const hasTussenmuur = floorPlan === "b";
  const doorSwap = !!hubDoorSwap;

  // Front wall segments scaled to fit the flat portion (between corner arcs)
  const flatW = width - cornerRadius * 2;
  const flatStartX = -halfW + cornerRadius;
  const rawSeg = [0.75, 2.00, 2.00, 1.00, 1.50, 1.00, 1.75];
  const rawTotal = rawSeg.reduce((a, b) => a + b, 0);
  const seg = rawSeg.map(s => s * flatW / rawTotal);
  const cumX: number[] = [];
  let acc = flatStartX;
  for (const s of seg) { cumX.push(acc); acc += s; }

  const frontZ = halfD - wallThick / 2;

  // Entrance door dimensions
  const DOOR_W = 1.0;
  // Default door on left wall, 45cm from front
  const doorCenterZ = halfD - wallThick - 0.45 - DOOR_W / 2;

  // WC partition: always present, 120cm wide × 205cm long, right side
  const wcWidth = 1.20;
  const wcLength = 2.05;
  const wcPartX = halfW - wallThick - wcWidth;
  const wcDoorW = 0.84;

  // Tussenmuur position: middle of segment 2
  const tussenmuurX = cumX[2] + seg[2] / 2;

  return (
    <group>
      {/* ── Back wall ── */}
      <mesh position={[0, extWallCY, -halfD + wallThick / 2]} castShadow>
        <boxGeometry args={[width - cornerRadius * 2, extWallH, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={width - cornerRadius * 2} />
      </mesh>
      {/* Interior back wall */}
      <mesh position={[0, height / 2 + floorThick, -halfD + wallThick + 0.01]}>
        <boxGeometry args={[width - wallThick * 2, height, 0.01]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── Right wall (solid) ── */}
      <mesh position={[halfW - wallThick / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[wallThick, extWallH, sideFlatD]} />
        <CladMaterial {...woodBase} wallWidth={sideFlatD} />
      </mesh>
      {/* Interior right wall */}
      <mesh position={[halfW - wallThick - 0.01, height / 2 + floorThick, 0]}>
        <boxGeometry args={[0.01, height, sideFlatD]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* ── Left wall ── */}
      {(() => {
        const wallCenterX = -halfW + wallThick / 2;
        
        if (doorSwap) {
          // Door swapped to front: left wall has a 100cm window instead (same position as where door was)
          const winW = 1.0;
          const winZ1 = halfD - wallThick - 0.45 - winW;
          const winZ2 = halfD - wallThick - 0.45;
          const backSectionD = winZ1 - (-halfD + sideInset);
          const backSectionZ = (-halfD + sideInset) + backSectionD / 2;
          const frontSectionD = (halfD - sideInset) - winZ2;
          const frontSectionZ = winZ2 + frontSectionD / 2;
          const winMidZ = (winZ1 + winZ2) / 2;
          
          return (
            <group>
              {backSectionD > 0 && (
                <mesh position={[wallCenterX, extWallCY, backSectionZ]} castShadow>
                  <boxGeometry args={[wallThick, extWallH, backSectionD]} />
                  <CladMaterial {...woodBase} wallWidth={backSectionD} />
                </mesh>
              )}
              {frontSectionD > 0 && (
                <mesh position={[wallCenterX, extWallCY, frontSectionZ]} castShadow>
                  <boxGeometry args={[wallThick, extWallH, frontSectionD]} />
                  <CladMaterial {...woodBase} wallWidth={frontSectionD} />
                </mesh>
              )}
              {/* Below window */}
              <mesh position={[wallCenterX, (winBot + floorThick) / 2, winMidZ]} castShadow>
                <boxGeometry args={[wallThick, winBot + floorThick, winW]} />
                <CladMaterial {...woodBase} wallWidth={winW} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
              </mesh>
              {/* Above window */}
              <mesh position={[wallCenterX, winTop + (height - winTop) / 2 + floorThick, winMidZ]} castShadow>
                <boxGeometry args={[wallThick, height - winTop, winW]} />
                <CladMaterial {...woodBase} wallWidth={winW} wallHeight={height - winTop} fullWallHeight={extWallH} />
              </mesh>
              <GlassPane posX={wallCenterX} posY={winCY + floorThick} width={winW} height={winH} frameColor={frameColor} z={winMidZ} rotate={true} />
            </group>
          );
        } else {
          // Default: entrance door on left wall
          const doorBot = 0;
          const doorTop = winH;
          const doorZ1 = halfD - wallThick - 0.45 - DOOR_W;
          const doorZ2 = halfD - wallThick - 0.45;
          const backSectionD = doorZ1 - (-halfD + sideInset);
          const backSectionZ = (-halfD + sideInset) + backSectionD / 2;
          const frontSectionD = (halfD - sideInset) - doorZ2;
          const frontSectionZ = doorZ2 + frontSectionD / 2;
          const aboveDoorH = extWallH - doorTop - floorThick;
          const doorMidZ = (doorZ1 + doorZ2) / 2;
          
          return (
            <group>
              {backSectionD > 0 && (
                <mesh position={[wallCenterX, extWallCY, backSectionZ]} castShadow>
                  <boxGeometry args={[wallThick, extWallH, backSectionD]} />
                  <CladMaterial {...woodBase} wallWidth={backSectionD} />
                </mesh>
              )}
              {frontSectionD > 0 && (
                <mesh position={[wallCenterX, extWallCY, frontSectionZ]} castShadow>
                  <boxGeometry args={[wallThick, extWallH, frontSectionD]} />
                  <CladMaterial {...woodBase} wallWidth={frontSectionD} />
                </mesh>
              )}
              {aboveDoorH > 0 && (
                <mesh position={[wallCenterX, doorTop + floorThick + aboveDoorH / 2, doorMidZ]} castShadow>
                  <boxGeometry args={[wallThick, aboveDoorH, DOOR_W]} />
                  <CladMaterial {...woodBase} wallWidth={DOOR_W} />
                </mesh>
              )}
              {/* Below door — covers floor slab */}
              <mesh position={[wallCenterX, floorThick / 2, doorMidZ]} castShadow>
                <boxGeometry args={[wallThick, floorThick, DOOR_W]} />
                <CladMaterial {...woodBase} wallWidth={DOOR_W} wallHeight={floorThick} fullWallHeight={extWallH} />
              </mesh>
              <DoorPane
                posX={wallCenterX}
                posY={winCY + floorThick}
                width={DOOR_W}
                height={doorTop}
                frameColor={frameColor}
                z={doorMidZ}
                rotate={true}
              />
            </group>
          );
        }
      })()}

      {/* ── Front facade ── */}
      <group position={[0, 0, frontZ]}>
        {/* Segment 0: 75cm wall pillar */}
        <mesh position={[cumX[0] + seg[0] / 2, extWallCY, 0]} castShadow>
          <boxGeometry args={[seg[0], extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={seg[0]} />
        </mesh>

        {/* Segment 1: 200cm window */}
        <mesh position={[cumX[1] + seg[1] / 2, (winBot + floorThick) / 2, 0]} castShadow>
          <boxGeometry args={[seg[1], winBot + floorThick, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={seg[1]} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
        </mesh>
        <mesh position={[cumX[1] + seg[1] / 2, winTop + (height - winTop) / 2 + floorThick, 0]} castShadow>
          <boxGeometry args={[seg[1], height - winTop, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={seg[1]} wallHeight={height - winTop} fullWallHeight={extWallH} />
        </mesh>
        <GlassPane posX={cumX[1] + seg[1] / 2} posY={winCY + floorThick} width={seg[1]} height={winH} frameColor={frameColor} />

        {/* Segment 2: 200cm solid wall */}
        <mesh position={[cumX[2] + seg[2] / 2, extWallCY, 0]} castShadow>
          <boxGeometry args={[seg[2], extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={seg[2]} />
        </mesh>

        {/* Segment 3: 100cm — window OR door (if doorSwap) */}
        {doorSwap ? (
          <>
            {/* Below door — same as below windows */}
            <mesh position={[cumX[3] + seg[3] / 2, (winBot + floorThick) / 2, 0]} castShadow>
              <boxGeometry args={[seg[3], winBot + floorThick, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={seg[3]} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
            </mesh>
            {/* Above door */}
            <mesh position={[cumX[3] + seg[3] / 2, winTop + (height - winTop) / 2 + floorThick, 0]} castShadow>
              <boxGeometry args={[seg[3], height - winTop, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={seg[3]} wallHeight={height - winTop} fullWallHeight={extWallH} />
            </mesh>
            <DoorPane
              posX={cumX[3] + seg[3] / 2}
              posY={winCY + floorThick}
              width={seg[3]}
              height={winH}
              frameColor={frameColor}
              z={0}
              rotate={false}
            />
          </>
        ) : (
          <>
            <mesh position={[cumX[3] + seg[3] / 2, (winBot + floorThick) / 2, 0]} castShadow>
              <boxGeometry args={[seg[3], winBot + floorThick, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={seg[3]} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
            </mesh>
            <mesh position={[cumX[3] + seg[3] / 2, winTop + (height - winTop) / 2 + floorThick, 0]} castShadow>
              <boxGeometry args={[seg[3], height - winTop, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={seg[3]} wallHeight={height - winTop} fullWallHeight={extWallH} />
            </mesh>
            <GlassPane posX={cumX[3] + seg[3] / 2} posY={winCY + floorThick} width={seg[3]} height={winH} frameColor={frameColor} />
          </>
        )}

        {/* Segment 4: 150cm solid wall */}
        <mesh position={[cumX[4] + seg[4] / 2, extWallCY, 0]} castShadow>
          <boxGeometry args={[seg[4], extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={seg[4]} />
        </mesh>

        {/* Segment 5: 100cm window */}
        <mesh position={[cumX[5] + seg[5] / 2, (winBot + floorThick) / 2, 0]} castShadow>
          <boxGeometry args={[seg[5], winBot + floorThick, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={seg[5]} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
        </mesh>
        <mesh position={[cumX[5] + seg[5] / 2, winTop + (height - winTop) / 2 + floorThick, 0]} castShadow>
          <boxGeometry args={[seg[5], height - winTop, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={seg[5]} wallHeight={height - winTop} fullWallHeight={extWallH} />
        </mesh>
        <GlassPane posX={cumX[5] + seg[5] / 2} posY={winCY + floorThick} width={seg[5]} height={winH} frameColor={frameColor} />

        {/* Segment 6: 175cm wall (WC area) */}
        <mesh position={[cumX[6] + seg[6] / 2, extWallCY, 0]} castShadow>
          <boxGeometry args={[seg[6], extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={seg[6]} />
        </mesh>
      </group>

      {/* Interior front wall faces — only behind solid segments (not windows) */}
      {/* When doorSwap, segment 3 becomes a door (still needs interior face for above-door area) */}
      {[0, 2, 4, 6].map((i) => (
        <mesh key={`ifw${i}`} position={[cumX[i] + seg[i] / 2, height / 2 + floorThick, halfD - wallThick - 0.01]}>
          <boxGeometry args={[seg[i], height, 0.01]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
        </mesh>
      ))}

      {/* ── WC partition (always present) ── */}
      {(
        <group>
          {/* Vertical partition wall running front-to-back, 205cm long from back wall */}
          <mesh position={[wcPartX, height / 2 + floorThick, -halfD + wallThick + wcLength / 2]}>
            <boxGeometry args={[partT, height, wcLength]} />
            <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
          </mesh>

          {/* Horizontal closing wall at front of WC — split around door opening */}
          {(() => {
            const wallZ = -halfD + wallThick + wcLength;
            const wcDoorCX = wcPartX + wcWidth / 2;
            const doorLeft = wcDoorCX - wcDoorW / 2;
            const doorRight = wcDoorCX + wcDoorW / 2;
            const wallLeft = wcPartX + partT;
            const wallRight = wcPartX + wcWidth + partT / 2;
            const leftSegW = doorLeft - wallLeft;
            const rightSegW = wallRight - doorRight;
            return (
              <>
                {leftSegW > 0.01 && (
                  <mesh position={[wallLeft + leftSegW / 2, height / 2 + floorThick, wallZ]}>
                    <boxGeometry args={[leftSegW, height, partT]} />
                    <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
                  </mesh>
                )}
                {rightSegW > 0.01 && (
                  <mesh position={[doorRight + rightSegW / 2, height / 2 + floorThick, wallZ]}>
                    <boxGeometry args={[rightSegW, height, partT]} />
                    <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
                  </mesh>
                )}
              </>
            );
          })()}

          {/* WC door — white panel with black frame (same style as BLOQ Flow) */}
          {(() => {
            const wcDoorH = 2.1;
            const wcDoorCX = wcPartX + wcWidth / 2;
            const wcDoorZ = -halfD + wallThick + wcLength;
            return (
              <>
                {/* Black door frame */}
                <mesh position={[wcDoorCX - wcDoorW / 2 - 0.015, wcDoorH / 2 + floorThick, wcDoorZ]}>
                  <boxGeometry args={[0.03, wcDoorH, partT + 0.01]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
                </mesh>
                <mesh position={[wcDoorCX + wcDoorW / 2 + 0.015, wcDoorH / 2 + floorThick, wcDoorZ]}>
                  <boxGeometry args={[0.03, wcDoorH, partT + 0.01]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
                </mesh>
                <mesh position={[wcDoorCX, wcDoorH + floorThick + 0.015, wcDoorZ]}>
                  <boxGeometry args={[wcDoorW + 0.06, 0.03, partT + 0.01]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
                </mesh>
                {/* White door panel */}
                <mesh position={[wcDoorCX, wcDoorH / 2 + floorThick, wcDoorZ]}>
                  <boxGeometry args={[wcDoorW - 0.04, wcDoorH - 0.02, 0.035]} />
                  <meshStandardMaterial color="#f5f5f5" roughness={0.85} />
                </mesh>
                {/* Header above door */}
                <mesh position={[wcDoorCX, wcDoorH + (height - wcDoorH) / 2 + floorThick, wcDoorZ]}>
                  <boxGeometry args={[wcDoorW, height - wcDoorH, partT]} />
                  <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
                </mesh>
                {/* Chrome cylinder handle (BLOQ Flow style) */}
                <mesh
                  position={[wcDoorCX + wcDoorW / 2 - 0.06, wcDoorH * 0.48 + floorThick, wcDoorZ + 0.04]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
                  <meshStandardMaterial color="#aaa" roughness={0.25} metalness={0.8} />
                </mesh>
              </>
            );
          })()}

          {/* Toilet fixture */}
          <mesh position={[halfW - wallThick - wcWidth / 2, floorThick + 0.25, -halfD + wallThick + 0.35]}>
            <boxGeometry args={[0.38, 0.45, 0.55]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
          </mesh>

          {/* Small sink */}
          <mesh position={[halfW - wallThick - wcWidth / 2, floorThick + 0.50, -halfD + wallThick + wcLength - 0.25]}>
            <boxGeometry args={[0.30, 0.08, 0.25]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* ── Tussenmuur (Plan B only) ── */}
      {hasTussenmuur && (() => {
        // Partition wall across the full depth at tussenmuurX (middle of segment 2)
        const tmDoorW = 0.84; // 84cm door
        const tmDoorH = 2.1;
        // Door positioned 45cm from the front wall (glass side)
        const tmDoorCZ = halfD - wallThick - 0.45 - tmDoorW / 2;
        const tmDoorZ1 = halfD - wallThick - 0.45 - tmDoorW; // back edge
        const tmDoorZ2 = halfD - wallThick - 0.45; // front edge

        // Wall segments: back section, door gap, front section
        const wallBackZ = -halfD + wallThick;
        const wallFrontZ = halfD - wallThick;
        const backSegD = tmDoorZ1 - wallBackZ;
        const frontSegD = wallFrontZ - tmDoorZ2;

        return (
          <group>
            {/* Back wall section (from back wall to door) */}
            {backSegD > 0.01 && (
              <mesh position={[tussenmuurX, height / 2 + floorThick, wallBackZ + backSegD / 2]}>
                <boxGeometry args={[partT, height, backSegD]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
              </mesh>
            )}
            {/* Front wall section (from door to front wall) */}
            {frontSegD > 0.01 && (
              <mesh position={[tussenmuurX, height / 2 + floorThick, tmDoorZ2 + frontSegD / 2]}>
                <boxGeometry args={[partT, height, frontSegD]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
              </mesh>
            )}
            {/* Header above door */}
            <mesh position={[tussenmuurX, tmDoorH + (height - tmDoorH) / 2 + floorThick, tmDoorCZ]}>
              <boxGeometry args={[partT, height - tmDoorH, tmDoorW]} />
              <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} side={THREE.DoubleSide} />
            </mesh>
            {/* White door panel with black frame */}
            {/* Left frame (along Z) */}
            <mesh position={[tussenmuurX, tmDoorH / 2 + floorThick, tmDoorCZ - tmDoorW / 2 - 0.015]}>
              <boxGeometry args={[partT + 0.01, tmDoorH, 0.03]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Right frame (along Z) */}
            <mesh position={[tussenmuurX, tmDoorH / 2 + floorThick, tmDoorCZ + tmDoorW / 2 + 0.015]}>
              <boxGeometry args={[partT + 0.01, tmDoorH, 0.03]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Top frame */}
            <mesh position={[tussenmuurX, tmDoorH + floorThick + 0.015, tmDoorCZ]}>
              <boxGeometry args={[partT + 0.01, 0.03, tmDoorW + 0.06]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Door panel */}
            <mesh position={[tussenmuurX, tmDoorH / 2 + floorThick, tmDoorCZ]}>
              <boxGeometry args={[0.035, tmDoorH - 0.02, tmDoorW - 0.04]} />
              <meshStandardMaterial color="#f5f5f5" roughness={0.85} />
            </mesh>
            {/* Handle */}
            <mesh
              position={[tussenmuurX + 0.04, tmDoorH * 0.48 + floorThick, tmDoorCZ - 0.04]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
              <meshStandardMaterial color="#aaa" roughness={0.25} metalness={0.8} />
            </mesh>
          </group>
        );
      })()}

      {/* Interior left wall — split around door opening */}
      {(() => {
        const ilX = -halfW + wallThick + 0.01;
        const doorZ1 = halfD - wallThick - 0.45 - DOOR_W;
        const doorZ2 = halfD - wallThick - 0.45;
        const backD = doorZ1 - (-halfD + sideInset);
        const frontD = (halfD - sideInset) - doorZ2;
        return (
          <>
            {backD > 0 && (
              <mesh position={[ilX, height / 2 + floorThick, (-halfD + sideInset) + backD / 2]}>
                <boxGeometry args={[0.01, height, backD]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
            )}
            {frontD > 0 && (
              <mesh position={[ilX, height / 2 + floorThick, doorZ2 + frontD / 2]}>
                <boxGeometry args={[0.01, height, frontD]} />
                <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
              </mesh>
            )}
          </>
        );
      })()}

      {/* ── LEFT WALL CLOSET (fully-finished, 3 doors, from back wall to door) ── */}
      {finishLevel === "fully-finished" && (() => {
        const sc = getShelfColors(shelfColor || "brown");
        const matProps = { color: shelfColor === "light-oak" ? "#ffffff" : sc.cabinet, roughness: 0.75, metalness: 0.05, ...(shelfColor === "light-oak" && lightOakTex ? { map: lightOakTex } : {}) };

        const closetD = 0.45; // 45cm deep
        const closetX = -halfW + wallThick + closetD / 2;
        const backPanelX = -halfW + wallThick + 0.06; // 4cm back panel flush against interior wall

        // Closet runs from back wall to entrance door opening
        const closetStartZ = -halfD + wallThick + 0.02;
        const doorZ1 = halfD - wallThick - 0.45 - DOOR_W; // back edge of entrance door
        const closetEndZ = doorZ1 - 0.02; // small gap before door
        const closetW = closetEndZ - closetStartZ;
        const closetCZ = (closetStartZ + closetEndZ) / 2;

        const frontFaceX = -halfW + wallThick + closetD + 0.002;

        return (
          <group>
            {/* Full-height back panel */}
            <mesh position={[backPanelX, height / 2 + floorThick, closetCZ]}>
              <boxGeometry args={[0.02, height, closetW]} />
              <meshStandardMaterial {...matProps} />
            </mesh>

            {/* Full-height cabinet body */}
            <mesh position={[closetX, height / 2 + floorThick, closetCZ]}>
              <boxGeometry args={[closetD, height, closetW]} />
              <meshStandardMaterial {...matProps} />
            </mesh>

            {/* Door lines: 3 doors → 2 dividers */}
            {[1/3, 2/3].map((frac, i) => (
              <mesh
                key={`hcd${i}`}
                position={[frontFaceX, height / 2 + floorThick, closetStartZ + closetW * frac]}
              >
                <boxGeometry args={[0.004, height - 0.02, 0.008]} />
                <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })()}

      {finishLevel === "fully-finished" && (() => {
        const sc = getShelfColors(shelfColor || "brown");
        const matProps = { color: shelfColor === "light-oak" ? "#ffffff" : sc.cabinet, roughness: 0.75, metalness: 0.05, ...(shelfColor === "light-oak" && lightOakTex ? { map: lightOakTex } : {}) };

        // Kitchen runs along the left face of the WC partition wall (205cm long)
        const kitchenBackX = wcPartX - partT / 2 - 0.02; // flush against outside of partition
        const kitchenD = 0.40; // 40cm deep cabinets
        const kitchenCX = kitchenBackX - kitchenD / 2;
        // Kitchen runs from back wall to end of WC partition
        const kitchenStartZ = -halfD + wallThick + 0.02;
        const kitchenEndZ = -halfD + wallThick + wcLength - partT;
        const kitchenW = kitchenEndZ - kitchenStartZ;
        const kitchenCZ = (kitchenStartZ + kitchenEndZ) / 2;

        const counterH = height * 0.25;
        const upperBottom = height * 0.65;
        const upperH = height - upperBottom;

        // Sink dimensions
        const sinkW = 0.40;
        const sinkD = 0.30;
        const sinkDepth = 0.12;

        return (
          <group>
            {/* Back panel on WC partition */}
            <mesh position={[kitchenBackX, height / 2 + floorThick, kitchenCZ]}>
              <boxGeometry args={[0.04, height, kitchenW]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Side panel — back wall side */}
            <mesh position={[kitchenCX, height / 2 + floorThick, kitchenStartZ - 0.01]}>
              <boxGeometry args={[kitchenD, height, 0.02]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Side panel — front side */}
            <mesh position={[kitchenCX, height / 2 + floorThick, kitchenEndZ + 0.01]}>
              <boxGeometry args={[kitchenD, height, 0.02]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Lower cabinet */}
            <mesh position={[kitchenCX, counterH / 2 + floorThick, kitchenCZ]}>
              <boxGeometry args={[kitchenD, counterH, kitchenW]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Countertop */}
            <mesh position={[kitchenCX, counterH + 0.015 + floorThick, kitchenCZ]}>
              <boxGeometry args={[kitchenD + 0.02, 0.03, kitchenW + 0.02]} />
              <meshStandardMaterial color={sc.counterTop} roughness={0.4} metalness={0.1} />
            </mesh>
            {/* Upper cabinet */}
            <mesh position={[kitchenCX, upperBottom + upperH / 2 + floorThick, kitchenCZ]}>
              <boxGeometry args={[kitchenD, upperH, kitchenW]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Open niche back panel */}
            <mesh position={[kitchenBackX - 0.005, counterH + (upperBottom - counterH) / 2 + floorThick, kitchenCZ]}>
              <boxGeometry args={[0.01, (upperBottom - counterH) - 0.06, kitchenW - 0.04]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            {/* Middle shelf in niche */}
            <mesh position={[kitchenCX, counterH + (upperBottom - counterH) / 2 + floorThick, kitchenCZ]}>
              <boxGeometry args={[kitchenD - 0.02, 0.025, kitchenW - 0.04]} />
              <meshStandardMaterial color={sc.counterTop} roughness={0.4} metalness={0.1} />
            </mesh>
            {/* Door lines lower */}
            {[0.33, 0.67].map((frac, i) => (
              <mesh key={`hkl${i}`} position={[kitchenCX - kitchenD / 2 - 0.002, counterH / 2 + floorThick, kitchenStartZ + kitchenW * frac]}>
                <boxGeometry args={[0.004, counterH - 0.02, 0.008]} />
                <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
              </mesh>
            ))}
            {/* Door lines upper */}
            {[0.33, 0.67].map((frac, i) => (
              <mesh key={`hku${i}`} position={[kitchenCX - kitchenD / 2 - 0.002, upperBottom + upperH / 2 + floorThick, kitchenStartZ + kitchenW * frac]}>
                <boxGeometry args={[0.004, upperH - 0.02, 0.008]} />
                <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
              </mesh>
            ))}
            {/* Integrated sink */}
            <mesh position={[kitchenCX, counterH + 0.03 + 0.001 + floorThick, kitchenCZ]}>
              <boxGeometry args={[sinkD, 0.003, sinkW]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.1} metalness={0.6} />
            </mesh>
            <mesh position={[kitchenCX, counterH + 0.03 - sinkDepth / 2 + floorThick, kitchenCZ]}>
              <boxGeometry args={[sinkD - 0.02, sinkDepth, sinkW - 0.02]} />
              <meshStandardMaterial color="#d0d0d0" roughness={0.15} metalness={0.5} />
            </mesh>
            {/* Faucet */}
            <mesh position={[kitchenCX + sinkD / 2 - 0.02, counterH + 0.03 + 0.01 + floorThick, kitchenCZ]}>
              <cylinderGeometry args={[0.015, 0.02, 0.02, 8]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.8} />
            </mesh>
            <mesh position={[kitchenCX + sinkD / 2 - 0.02, counterH + 0.03 + 0.12 + floorThick, kitchenCZ]}>
              <cylinderGeometry args={[0.008, 0.008, 0.20, 8]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.8} />
            </mesh>
            <mesh position={[kitchenCX + sinkD / 2 - 0.08, counterH + 0.03 + 0.21 + floorThick, kitchenCZ]} rotation={[0, 0, Math.PI / 6]}>
              <cylinderGeometry args={[0.006, 0.008, 0.12, 8]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.8} />
            </mesh>
            {/* Coffee machine */}
            <group position={[kitchenCX, counterH + 0.03 + floorThick, kitchenStartZ + 0.20]}>
              <mesh position={[0, 0.14, 0]}>
                <boxGeometry args={[0.18, 0.28, 0.25]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
              </mesh>
              <mesh position={[0.06, 0.18, 0]}>
                <boxGeometry args={[0.06, 0.36, 0.20]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.1} />
              </mesh>
              <mesh position={[0, 0.005, 0]}>
                <boxGeometry args={[0.16, 0.01, 0.12]} />
                <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.5} />
              </mesh>
              <mesh position={[-0.02, 0.22, 0]}>
                <boxGeometry args={[0.04, 0.04, 0.04]} />
                <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.4} />
              </mesh>
            </group>
            {/* Shelf under upper cabinet */}
            <mesh position={[kitchenCX, upperBottom - 0.30 + floorThick, kitchenCZ]}>
              <boxGeometry args={[kitchenD + 0.01, 0.02, kitchenW - 0.02]} />
              <meshStandardMaterial color={sc.counterTop} roughness={0.4} metalness={0.1} />
            </mesh>
            {/* LED strips */}
            {ledStrip && <>
              <mesh position={[kitchenBackX - 0.03, upperBottom - 0.01 + floorThick, kitchenCZ]}>
                <boxGeometry args={[0.012, 0.008, kitchenW - 0.04]} />
                <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
              </mesh>
              <mesh position={[kitchenBackX - 0.03, upperBottom - 0.30 - 0.01 + floorThick, kitchenCZ]}>
                <boxGeometry args={[0.012, 0.008, kitchenW - 0.04]} />
                <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
              </mesh>
              <mesh position={[kitchenBackX - 0.03, counterH + 0.03 - 0.01 + floorThick, kitchenCZ]}>
                <boxGeometry args={[0.012, 0.008, kitchenW - 0.04]} />
                <meshStandardMaterial color="#fffde8" emissive="#fffde8" emissiveIntensity={4} roughness={0.1} toneMapped={false} />
              </mesh>
              <pointLight position={[kitchenCX, upperBottom - 0.05 + floorThick, kitchenCZ]} intensity={0.4} distance={0.8} color="#fffde8" />
              <pointLight position={[kitchenCX, counterH + floorThick, kitchenCZ]} intensity={0.25} distance={0.5} color="#fffde8" />
            </>}
          </group>
        );
      })()}

      {/* ── TABLES & CHAIRS (fully-finished) ── */}
      {finishLevel === "fully-finished" && (() => {
        const sc = getShelfColors(shelfColor || "brown");
        const tableMatProps = { color: shelfColor === "light-oak" ? "#ffffff" : sc.cabinet, roughness: 0.75, metalness: 0.05, ...(shelfColor === "light-oak" && lightOakTex ? { map: lightOakTex } : {}) };
        // Desk color: 30% less white → warm light grey
        const deskColor = "#d5d5d0";
        const deskMatProps = { color: deskColor, roughness: 0.3, metalness: 0.05 };

        const chairSeatW = 0.42;
        const chairSeatD = 0.40;
        const chairSeatH = 0.02;
        const chairLegH = 0.44;
        const chairLegSize = 0.03;
        const chairBackH = 0.36;
        const chairBackThick = 0.02;

        // Helper: render a simple wooden chair facing +Z (backrest at -Z)
        const renderSimpleChair = (cx: number, cz: number, faceZ: number) => {
          const flip = faceZ < 0 ? -1 : 1;
          return (
            <group position={[cx, 0, cz]}>
              <mesh position={[0, chairLegH + chairSeatH / 2 + floorThick, 0]}>
                <boxGeometry args={[chairSeatW, chairSeatH, chairSeatD]} />
                <meshStandardMaterial {...tableMatProps} />
              </mesh>
              {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sz], li) => (
                <mesh key={li} position={[sx * (chairSeatW/2 - 0.03), chairLegH/2 + floorThick, sz * (chairSeatD/2 - 0.03)]}>
                  <boxGeometry args={[chairLegSize, chairLegH, chairLegSize]} />
                  <meshStandardMaterial {...tableMatProps} />
                </mesh>
              ))}
              <mesh position={[0, chairLegH + chairSeatH + chairBackH/2 + floorThick, flip * (-chairSeatD/2 + chairBackThick/2)]}>
                <boxGeometry args={[chairSeatW, chairBackH, chairBackThick]} />
                <meshStandardMaterial {...tableMatProps} />
              </mesh>
            </group>
          );
        };

        if (hasTussenmuur) {
          // ── Plan B: two separate desks in small & big rooms ──

          const tableH = 0.04;
          const tableLegH = 0.72;
          const tableW = 1.20; // depth of desk (Z direction)
          const legInsetX = 0.08;
          const legInsetZ = 0.06;
          const legSize = 0.05;

          // Tussenmuur door front edge (window side)
          const tmDoorW2 = 0.84;
          const tmDoorZ2 = halfD - wallThick - 0.45;

          // ── SMALL ROOM (left of tussenmuur) ──
          // Desk runs from tussenmuur toward left, ending just before start of big window
          const smallDeskStartX = tussenmuurX - partT / 2; // at tussenmuur
          const smallDeskEndX = cumX[1] + 0.05; // just past start of big window
          const smallDeskLength = smallDeskStartX - smallDeskEndX;
          const smallDeskCX = (smallDeskStartX + smallDeskEndX) / 2;
          // Centered in room Z
          const smallRoomFrontZ = halfD - wallThick;
          const smallRoomBackZ = -halfD + wallThick;
          const smallDeskCZ = (smallRoomFrontZ + smallRoomBackZ) / 2;

          // Chair offset: 50% under table
          const chairUnderOffset = tableW / 2 - chairSeatD * 0.5;

          // ── BIG ROOM (right of tussenmuur) ──
          // Table against tussenmuur, same length as small room table
          const bigDeskStartX = tussenmuurX + partT / 2;
          const bigDeskEndX = bigDeskStartX + smallDeskLength;
          const bigDeskCX = (bigDeskStartX + bigDeskEndX) / 2;
          // Table +Z edge aligns with door border (tmDoorZ2)
          const bigDeskCZ = tmDoorZ2 - tableW / 2;

          // Closet behind table (toward back wall), 60cm longer than table
          const closetLength = smallDeskLength + 0.60;
          const closetD2 = 0.45;
          const closetStartX = bigDeskStartX;
          const closetEndX = closetStartX + closetLength;
          const closetCX = (closetStartX + closetEndX) / 2;
          // Closet sits behind desk in Z (toward back wall)
          const closetCZ = bigDeskCZ - tableW / 2 - closetD2 / 2 - 0.05;
          const closetFrontX2 = closetCX; // for door lines

          // Helper: render a desk (top + 4 legs)
          const renderDesk = (cx: number, cz: number, length: number, w: number) => (
            <>
              <mesh position={[cx, tableLegH + tableH / 2 + floorThick, cz]}>
                <boxGeometry args={[length, tableH, w]} />
                <meshStandardMaterial {...deskMatProps} />
              </mesh>
              {[
                [cx - length / 2 + legInsetX, cz - w / 2 + legInsetZ],
                [cx - length / 2 + legInsetX, cz + w / 2 - legInsetZ],
                [cx + length / 2 - legInsetX, cz - w / 2 + legInsetZ],
                [cx + length / 2 - legInsetX, cz + w / 2 - legInsetZ],
              ].map(([lx, lz], i) => (
                <mesh key={`dleg${i}`} position={[lx, tableLegH / 2 + floorThick, lz]}>
                  <boxGeometry args={[legSize, tableLegH, legSize]} />
                  <meshStandardMaterial {...deskMatProps} />
                </mesh>
              ))}
            </>
          );

          // Chair spacing along desk length
          const smallChairSpacing = smallDeskLength / 3;

          return (
            <group>
              {/* Small room desk */}
              {renderDesk(smallDeskCX, smallDeskCZ, smallDeskLength, tableW)}
              {/* Small room: 2 chairs on each side (front +Z, back -Z), 50% under */}
              {[1, 2].map(i => renderSimpleChair(
                smallDeskEndX + smallChairSpacing * i,
                smallDeskCZ + chairUnderOffset,
                1
              ))}
              {[1, 2].map(i => renderSimpleChair(
                smallDeskEndX + smallChairSpacing * i,
                smallDeskCZ - chairUnderOffset,
                -1
              ))}

              {/* Big room desk (against tussenmuur) */}
              {renderDesk(bigDeskCX, bigDeskCZ, smallDeskLength, tableW)}
              {/* Big room: 2 chairs behind table (window side, +Z) */}
              {[1, 2].map(i => renderSimpleChair(
                bigDeskStartX + smallChairSpacing * i,
                bigDeskCZ + chairUnderOffset,
                1
              ))}

              {/* Closet behind desk in big room */}
              <mesh position={[closetCX, height / 2 + floorThick, closetCZ]}>
                <boxGeometry args={[closetLength, height, closetD2]} />
                <meshStandardMaterial {...tableMatProps} />
              </mesh>
              {/* Closet back panel */}
              <mesh position={[closetCX, height / 2 + floorThick, closetCZ - closetD2 / 2 - 0.01]}>
                <boxGeometry args={[closetLength, height, 0.02]} />
                <meshStandardMaterial {...tableMatProps} />
              </mesh>
              {/* Closet door lines (3 doors) */}
              {[0.33, 0.67].map((frac, i) => (
                <mesh key={`bcd${i}`} position={[closetStartX + closetLength * frac, height / 2 + floorThick, closetCZ + closetD2 / 2 + 0.002]}>
                  <boxGeometry args={[0.008, height - 0.02, 0.004]} />
                  <meshStandardMaterial color={sc.doorLine} roughness={0.5} />
                </mesh>
              ))}
            </group>
          );
        }

        // ── Plan A: original big communal table ──
        const tableStartX = cumX[1] + seg[1] / 2;
        const tableEndX = cumX[5];
        const tableLength = tableEndX - tableStartX;
        const tableCenterX = (tableStartX + tableEndX) / 2;

        const tableW2 = 1.35;
        const tableH2 = 0.04;
        const tableLegH2 = 0.72;
        const tableCenterZ = 0;
        const legInsetX = 0.08;
        const legInsetZ = 0.06;
        const legSize = 0.05;
        const chairOffset = tableW2 / 2 + chairSeatD / 2 + 0.08;

        const spacing = tableLength / 7;
        const frontChairX = [1, 3, 5].map(i => tableStartX + spacing * i);
        const backChairX = [2, 4, 6].map(i => tableStartX + spacing * i);

        return (
          <group>
            {/* Table top */}
            <mesh position={[tableCenterX, tableLegH2 + tableH2 / 2 + floorThick, tableCenterZ]}>
              <boxGeometry args={[tableLength, tableH2, tableW2]} />
              <meshStandardMaterial {...tableMatProps} />
            </mesh>
            {/* 4 legs */}
            {[
              [tableCenterX - tableLength / 2 + legInsetX, tableCenterZ - tableW2 / 2 + legInsetZ],
              [tableCenterX - tableLength / 2 + legInsetX, tableCenterZ + tableW2 / 2 - legInsetZ],
              [tableCenterX + tableLength / 2 - legInsetX, tableCenterZ - tableW2 / 2 + legInsetZ],
              [tableCenterX + tableLength / 2 - legInsetX, tableCenterZ + tableW2 / 2 - legInsetZ],
            ].map(([lx, lz], i) => (
              <mesh key={`tleg${i}`} position={[lx, tableLegH2 / 2 + floorThick, lz]}>
                <boxGeometry args={[legSize, tableLegH2, legSize]} />
                <meshStandardMaterial {...tableMatProps} />
              </mesh>
            ))}
            {/* Chairs — front side (+Z) */}
            {frontChairX.map((cx, i) => renderSimpleChair(cx, tableCenterZ + chairOffset, 1))}
            {/* Chairs — back side (-Z) */}
            {backChairX.map((cx, i) => renderSimpleChair(cx, tableCenterZ - chairOffset, -1))}
          </group>
        );
      })()}
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
  extWallH,
  extWallCY,
  winH,
  winBot,
  winTop,
  winCY,
  PILLAR_W,
  claddingProps,
  woodBase,
  frameColor,
  floorPlan,
  model,
  interiorColor,
  interiorRoughness,
  osbTex,
  isShell,
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
      <mesh position={[0, extWallCY, -depth / 2 + wallThick / 2]} castShadow>
        <boxGeometry args={[width - cornerRadius * 2, extWallH, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={width - cornerRadius * 2} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2 - wallThick / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[wallThick, extWallH, sideFlatD]} />
        <CladMaterial {...woodBase} wallWidth={sideFlatD} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2 + wallThick / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[wallThick, extWallH, sideFlatD]} />
        <CladMaterial {...woodBase} wallWidth={sideFlatD} />
      </mesh>
      {/* Interior back wall */}
      <mesh position={[0, height / 2 + floorThick, -depth / 2 + wallThick + 0.01]}>
        <boxGeometry args={[width - wallThick * 2, height, 0.01]} />
        <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
      </mesh>

      {/* Front facade */}
      <group position={[0, 0, depth / 2 - wallThick / 2]}>
        <mesh position={[flatStartX + PILLAR_W / 2, extWallCY, 0]} castShadow>
          <boxGeometry args={[PILLAR_W, extWallH, wallThick]} />
          <CladMaterial {...woodBase} wallWidth={PILLAR_W} />
        </mesh>

        {roomSplit < 100 ? (
          <>
            <mesh position={[room1CX, (winBot + floorThick) / 2, 0]} castShadow>
              <boxGeometry args={[room1Width, winBot + floorThick, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={room1Width} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
            </mesh>
            <mesh position={[room1CX, winTop + (height - winTop) / 2 + floorThick, 0]} castShadow>
              <boxGeometry args={[room1Width, height - winTop, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={room1Width} wallHeight={height - winTop} fullWallHeight={extWallH} />
            </mesh>
            <GlassPane
              posX={room1CX}
              posY={winCY + floorThick}
              width={room1Width}
              height={winH}
              frameColor={frameColor}
              hasDivider
            />
            <mesh position={[room2StartX + PILLAR_W / 2, extWallCY, 0]} castShadow>
              <boxGeometry args={[PILLAR_W, extWallH, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={PILLAR_W} />
            </mesh>
            <Room2Facade
              room2StartX={room2StartX}
              room2Width={room2Width}
              height={height}
              extWallH={extWallH}
              extWallCY={extWallCY}
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
              woodBase={woodBase}
              floorThick={floorThick}
            />
          </>
        ) : (
          <>
            <mesh position={[room1CX, (winBot + floorThick) / 2, 0]} castShadow>
              <boxGeometry args={[flatWidth - PILLAR_W, winBot + floorThick, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={flatWidth - PILLAR_W} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
            </mesh>
            <mesh position={[room1CX, winTop + (height - winTop) / 2 + floorThick, 0]} castShadow>
              <boxGeometry args={[flatWidth - PILLAR_W, height - winTop, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={flatWidth - PILLAR_W} wallHeight={height - winTop} fullWallHeight={extWallH} />
            </mesh>
            <GlassPane
              posX={room1CX}
              posY={winCY + floorThick}
              width={flatWidth - PILLAR_W}
              height={winH}
              frameColor={frameColor}
              hasDivider
            />
            <mesh position={[flatEndX - PILLAR_W / 2, extWallCY, 0]} castShadow>
              <boxGeometry args={[PILLAR_W, extWallH, wallThick]} />
              <CladMaterial {...woodBase} wallWidth={PILLAR_W} />
            </mesh>
          </>
        )}
      </group>

      {/* Room divider */}
      {hasDivider && (
        <mesh position={[room2StartX + PILLAR_W / 2, height / 2 + floorThick, 0]}>
          <boxGeometry args={[0.06, height, depth - wallThick * 2]} />
          <InteriorMat osbTex={osbTex} isShell={isShell} color={interiorColor} roughness={interiorRoughness} />
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
  extWallH,
  extWallCY,
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
  woodBase,
  floorThick,
}: any) {
  const r2Content = room2Width - PILLAR_W * 2;
  const doorCX = room2StartX + PILLAR_W + DOOR_W / 2;
  const win2W = r2Content - DOOR_W - PILLAR_W;
  const win2CX = room2StartX + PILLAR_W + DOOR_W + PILLAR_W + win2W / 2;

  return (
    <>
      <mesh position={[doorCX, (winBot + floorThick) / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_W, winBot + floorThick, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={DOOR_W} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
      </mesh>
      <mesh position={[doorCX, winTop + (height - winTop) / 2 + floorThick, 0]} castShadow>
        <boxGeometry args={[DOOR_W, height - winTop, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={DOOR_W} wallHeight={height - winTop} fullWallHeight={extWallH} />
      </mesh>
      <GlassPane posX={doorCX} posY={winCY + floorThick} width={DOOR_W} height={winH} frameColor={frameColor} />

      <mesh position={[room2StartX + PILLAR_W + DOOR_W + PILLAR_W / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[PILLAR_W, extWallH, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={PILLAR_W} />
      </mesh>

      <mesh position={[win2CX, (winBot + floorThick) / 2, 0]} castShadow>
        <boxGeometry args={[win2W, winBot + floorThick, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={win2W} wallHeight={winBot + floorThick} fullWallHeight={extWallH} />
      </mesh>
      <mesh position={[win2CX, winTop + (height - winTop) / 2 + floorThick, 0]} castShadow>
        <boxGeometry args={[win2W, height - winTop, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={win2W} wallHeight={height - winTop} fullWallHeight={extWallH} />
      </mesh>
      <GlassPane posX={win2CX} posY={winCY + floorThick} width={win2W} height={winH} frameColor={frameColor} hasDivider />

      <mesh position={[flatEndX - PILLAR_W / 2, extWallCY, 0]} castShadow>
        <boxGeometry args={[PILLAR_W, extWallH, wallThick]} />
        <CladMaterial {...woodBase} wallWidth={PILLAR_W} />
      </mesh>
    </>
  );
}
