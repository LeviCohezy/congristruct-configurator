import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FlipHorizontal } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

/* ── Floorplan descriptions per model ──────────────────────────────── */
const planOptions: Record<ConfigState["model"], { a: { label: string; desc: string }; b: { label: string; desc: string } }> = {
  start: {
    a: { label: "Open plan", desc: "Eén open ruimte zonder toilet" },
    b: { label: "Met toilet", desc: "Compacte ruimte met apart toilet" },
  },
  flow: {
    a: { label: "21 m² open", desc: "Open ruimte met toilet + berging" },
    b: { label: "28 m² gesplitst", desc: "Aparte inkom + tweede ruimte" },
  },
  hub: {
    a: { label: "Open ruimte", desc: "Eén grote open ruimte met WC" },
    b: { label: "Met tussenmuur", desc: "Scheidingswand met deur, WC inbegrepen" },
  },
  base: {
    a: { label: "Casco", desc: "Lege ruimte, zelf in te delen" },
    b: { label: "Ingedeeld", desc: "Volledig ingedeelde layout" },
  },
};

/* ── Inline SVG floorplan diagrams ─────────────────────────────────── */
function FloorPlanSVG({ model, plan, mirrored, hubDoorSwap }: { model: ConfigState["model"]; plan: "a" | "b"; mirrored: boolean; hubDoorSwap?: boolean }) {
  const wallColor = "hsl(var(--foreground))";
  const winColor = "hsl(var(--accent))";

  if (model === "start") {
    return <StartPlanSVG plan={plan} mirrored={mirrored} wallColor={wallColor} winColor={winColor} />;
  }
  if (model === "flow") {
    return <FlowPlanSVG plan={plan} mirrored={mirrored} wallColor={wallColor} winColor={winColor} />;
  }
  if (model === "hub") {
    return <HubPlanSVG plan={plan} mirrored={mirrored} wallColor={wallColor} winColor={winColor} doorSwap={hubDoorSwap} />;
  }

  // Generic fallback for other models
  const w = 160;
  const h = 120;
  const transform = mirrored ? `scale(-1,1) translate(${-w},0)` : undefined;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ maxHeight: 100 }}>
      <g transform={transform}>
        <rect x={4} y={4} width={w - 8} height={h - 8} fill="none" stroke={wallColor} strokeWidth={2.5} rx={1} opacity={0.7} />
        <line x1={20} y1={h - 4} x2={70} y2={h - 4} stroke={winColor} strokeWidth={3} />
        <line x1={90} y1={h - 4} x2={w - 20} y2={h - 4} stroke={winColor} strokeWidth={3} />
        <rect x={75} y={h - 8} width={12} height={4} fill={winColor} opacity={0.5} />
        {plan === "b" && (
          <>
            <line x1={60} y1={4} x2={60} y2={h - 4} stroke={wallColor} strokeWidth={1.5} opacity={0.5} />
            <line x1={110} y1={4} x2={110} y2={60} stroke={wallColor} strokeWidth={1.5} opacity={0.5} />
          </>
        )}
      </g>
    </svg>
  );
}

/* ── HUB model: 1000×350cm ────────────────────────────────────────── */
function HubPlanSVG({ plan, mirrored, wallColor, winColor, doorSwap }: {
  plan: "a" | "b"; mirrored: boolean; wallColor: string; winColor: string; doorSwap?: boolean;
}) {
  // Scale: 1000cm → 500 SVG, 350cm → 175 SVG (÷2)
  const vw = 500;
  const vh = 175;
  const wt = 9;
  const iw = 5; // internal wall thickness
  const transform = mirrored ? `scale(-1,1) translate(${-vw},0)` : undefined;
  const hasTussenmuur = plan === "b";

  // Front wall segments (cm/2): 37.5 | 100 win | 100 wall | 50 win | 75 wall | 50 win | 87.5 wall
  // Segment positions
  const seg0End = 37.5;       // wall
  const seg1End = 137.5;      // window (200cm)
  const seg2End = 237.5;      // wall (200cm)
  const seg3End = 287.5;      // window (100cm) — can swap with door
  const seg4End = 362.5;      // wall (150cm)
  const seg5End = 412.5;      // window (100cm)
  const seg6End = 500;         // wall (175cm)

  // WC enclosure: always present, right side, 120cm wide × 205cm long
  const wcPartX = seg6End - wt - 60; // 120cm/2 = 60 from right inner wall
  const wcLength = 102.5; // 205cm/2

  // Tussenmuur position: middle of segment 2 (the 200cm wall between big window and first small window)
  const tussenmuurX = (seg1End + seg2End) / 2; // = 187.5

  // Door position: default on left wall, or swapped to segment 3 window position
  const doorOnFront = doorSwap;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto" style={{ maxHeight: 100 }}>
      <g transform={transform}>
        {/* Outer walls */}
        <rect x={0} y={0} width={vw} height={vh} fill="none" stroke={wallColor} strokeWidth={wt} rx={1} opacity={0.7} />

        {/* Front windows */}
        {/* Window 1: 200cm (segment 1) */}
        <line x1={seg0End} y1={vh} x2={seg1End} y2={vh} stroke={winColor} strokeWidth={4} />

        {/* Segment 3 position: window OR door depending on swap */}
        {doorOnFront ? (
          <>
            {/* Door at segment 3 position */}
            <rect x={seg2End} y={vh - wt} width={seg3End - seg2End} height={wt} fill={winColor} opacity={0.4} />
            <path d={`M ${seg2End} ${vh - wt} A ${seg3End - seg2End} ${seg3End - seg2End} 0 0 0 ${seg3End} ${vh - wt - (seg3End - seg2End)}`}
              fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
          </>
        ) : (
          /* Window at segment 3 */
          <line x1={seg2End} y1={vh} x2={seg3End} y2={vh} stroke={winColor} strokeWidth={4} />
        )}

        {/* Window 3: segment 5 */}
        <line x1={seg4End} y1={vh} x2={seg5End} y2={vh} stroke={winColor} strokeWidth={4} />

        {/* Left wall: door OR window depending on swap */}
        {doorOnFront ? (
          <>
            {/* Window on left wall (swapped from segment 3: 100cm = 50 SVG) */}
            <rect x={0} y={vh - wt - 72.5} width={wt} height={50} fill="hsl(var(--background))" />
            <line x1={wt / 2} y1={vh - wt - 72.5} x2={wt / 2} y2={vh - wt - 22.5} stroke={winColor} strokeWidth={2.5} />
          </>
        ) : (
          <>
            {/* Entrance door on left wall, 45cm from front */}
            <rect x={0} y={vh - wt - 60} width={wt} height={50} fill={winColor} opacity={0.4} />
            <path d={`M ${wt} ${vh - wt - 10} A 50 50 0 0 0 ${wt + 50} ${vh - wt - 60}`} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.4} />
          </>
        )}

        {/* WC enclosure: always present */}
        {/* Vertical partition */}
        <line x1={wcPartX} y1={wt} x2={wcPartX} y2={wt + wcLength} stroke={wallColor} strokeWidth={iw} opacity={0.6} />
        {/* Horizontal closing wall */}
        <line x1={wcPartX} y1={wt + wcLength} x2={vw - wt} y2={wt + wcLength} stroke={wallColor} strokeWidth={iw} opacity={0.6} />
        {/* WC door */}
        <rect x={wcPartX - 2} y={wt + wcLength * 0.55} width={iw} height={25} fill="hsl(var(--background))" />
        {/* Toilet icon */}
        <rect x={vw - wt - 20} y={wt + 15} width={14} height={18} rx={3} fill="none" stroke={wallColor} strokeWidth={1} opacity={0.35} />
        {/* Sink icon */}
        <rect x={wcPartX + 8} y={wt + wcLength - 20} width={10} height={10} rx={2} fill="none" stroke={wallColor} strokeWidth={1} opacity={0.35} />

        {/* Tussenmuur (Plan B only) */}
        {hasTussenmuur && (
          <>
            {/* Partition wall across the width at tussenmuurX */}
            <line x1={tussenmuurX} y1={wt} x2={tussenmuurX} y2={vh - wt} stroke={wallColor} strokeWidth={iw} opacity={0.6} />
            {/* Door in tussenmuur: 45cm from front wall (bottom), 84cm door = 42 SVG */}
            <rect x={tussenmuurX - 2} y={vh - wt - 22.5 - 42} width={iw} height={42} fill="hsl(var(--background))" />
            <path d={`M ${tussenmuurX - iw / 2} ${vh - wt - 22.5} A 42 42 0 0 0 ${tussenmuurX - iw / 2 - 42} ${vh - wt - 22.5 - 42}`}
              fill="none" stroke={wallColor} strokeWidth={0.6} opacity={0.25} />
          </>
        )}

        {/* Meeting table (centered in main room area) */}
        {(() => {
          const tableLeft = hasTussenmuur ? wt + 10 : 140;
          const tableW = hasTussenmuur ? tussenmuurX - wt - 20 : 180;
          return (
            <>
              <rect x={tableLeft} y={vh / 2 - 25} width={tableW} height={50} rx={3} fill="none" stroke={wallColor} strokeWidth={1.2} opacity={0.3} />
              {[0, 1, 2].map(i => {
                const cx = tableLeft + 30 + i * (tableW - 60) / 2;
                return (
                  <g key={i}>
                    <circle cx={cx} cy={vh / 2 - 35} r={6} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.25} />
                    <circle cx={cx} cy={vh / 2 + 35} r={6} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.25} />
                  </g>
                );
              })}
            </>
          );
        })()}
      </g>
    </svg>
  );
}

/* ── FLOW model: Plan A = 600×350cm, Plan B = 800×350cm ──────────── */
function FlowPlanSVG({ plan, mirrored, wallColor, winColor }: {
  plan: "a" | "b"; mirrored: boolean; wallColor: string; winColor: string;
}) {
  const wt = 11.5; // wall thickness (23cm / 2)
  const vh = 175;   // 350/2
  const furnitureColor = wallColor;

  if (plan === "a") {
    // Plan A: 600×350cm → 300×175 SVG units
    // Front: 75 wall | 200 window | 100 wall | 100 door | 125 wall
    const vw = 300;
    const iw = 5; // internal wall thickness (10cm / 2)
    const transform = mirrored ? `scale(-1,1) translate(${-vw},0)` : undefined;

    // Front layout in SVG units (cm/2): 37.5 | 100 | 50 | 50 | 62.5
    const winStart = 37.5;
    const winW = 100;
    const wallMidStart = 137.5;
    const wallMidW = 50;
    const doorStart = 187.5;
    const doorW = 50;

    // Toilet compartment: back-right corner
    // Strip width ~120cm = 60 SVG from inner right wall
    const partX = vw - wt - 60; // vertical partition x
    const toiletDepth = vh * 0.45; // 45% of depth
    const toiletBottomY = wt + toiletDepth;

    // Toilet door: ~70cm = 35 SVG, on LEFT wall (vertical partition)
    const toiletDoorH = 35;
    const toiletDoorCy = wt + toiletDepth * 0.5; // centered in toilet depth

    return (
      <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto" style={{ maxHeight: 110 }}>
        <g transform={transform}>
          {/* Outer walls */}
          <rect x={0} y={0} width={vw} height={wt} fill={wallColor} opacity={0.85} />
          <rect x={0} y={vh - wt} width={vw} height={wt} fill={wallColor} opacity={0.85} />
          <rect x={0} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />
          <rect x={vw - wt} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />

          {/* Left wall window: 200cm wide, centered */}
          {(() => {
            const leftWinH = winW; // same 200cm = 100 SVG units
            const leftWinY = (vh - leftWinH) / 2;
            return (
              <>
                <rect x={0} y={leftWinY} width={wt} height={leftWinH} fill="hsl(var(--background))" />
                <line x1={wt / 2} y1={leftWinY} x2={wt / 2} y2={leftWinY + leftWinH} stroke={winColor} strokeWidth={2.5} />
              </>
            );
          })()}

          {/* Front window: 200cm wide (single pane, no divider) */}
          <rect x={winStart} y={vh - wt} width={winW} height={wt} fill="hsl(var(--background))" />
          <line x1={winStart} y1={vh - wt / 2} x2={winStart + winW} y2={vh - wt / 2} stroke={winColor} strokeWidth={2.5} />


          {/* Front entrance door: 100cm wide */}
          <rect x={doorStart} y={vh - wt} width={doorW} height={wt} fill="hsl(var(--background))" />
          {/* Door swing arc */}
          <path d={`M ${doorStart} ${vh - wt} A ${doorW} ${doorW} 0 0 0 ${doorStart + doorW} ${vh - wt - doorW}`}
            fill="none" stroke={wallColor} strokeWidth={0.6} opacity={0.25} />

          {/* Vertical partition wall — split around door */}
          {/* Top segment (back wall to door) */}
          <rect x={partX} y={wt} width={iw} height={toiletDoorCy - toiletDoorH / 2 - wt} fill={wallColor} opacity={0.7} />
          {/* Bottom segment (door to horizontal wall) */}
          <rect x={partX} y={toiletDoorCy + toiletDoorH / 2} width={iw} height={toiletBottomY - (toiletDoorCy + toiletDoorH / 2)} fill={wallColor} opacity={0.7} />

          {/* Horizontal toilet wall — solid */}
          <rect x={partX} y={toiletBottomY} width={vw - wt - partX} height={iw} fill={wallColor} opacity={0.7} />

          {/* Toilet door swing arc (swings into main room) */}
          <path d={`M ${partX} ${toiletDoorCy - toiletDoorH / 2} A ${toiletDoorH} ${toiletDoorH} 0 0 0 ${partX - toiletDoorH} ${toiletDoorCy + toiletDoorH / 2}`}
            fill="none" stroke={wallColor} strokeWidth={0.6} opacity={0.25} />

          {/* Toilet fixture — against right wall */}
          <ellipse cx={vw - wt - 15} cy={wt + 25} rx={7} ry={9} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
          <rect x={vw - wt - 21} y={wt + 12} width={12} height={7} rx={3} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
          {/* Sink — near partition */}
          <rect x={partX + iw + 3} y={wt + 8} width={8} height={7} rx={2} fill="none" stroke={wallColor} strokeWidth={0.7} opacity={0.3} />

          {/* Storage cabinets along right wall (below toilet room) */}
          <rect x={partX + iw + 2} y={toiletBottomY + iw + 5} width={vw - wt - partX - iw - 5} height={vh - wt - toiletBottomY - iw - 8}
            fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.25} />
          {/* Shelf lines */}
          {[0.25, 0.5, 0.75].map((f, i) => {
            const sy = toiletBottomY + iw + 5 + (vh - wt - toiletBottomY - iw - 8) * f;
            return <line key={i} x1={partX + iw + 2} y1={sy} x2={vw - wt - 3} y2={sy} stroke={furnitureColor} strokeWidth={0.5} opacity={0.2} />;
          })}

          {/* Desk in main room */}
          <rect x={55} y={55} width={65} height={35} fill="none" stroke={furnitureColor} strokeWidth={1} opacity={0.35} rx={1} />
          {/* Chairs */}
          <circle cx={70} cy={100} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
          <circle cx={105} cy={100} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
        </g>
      </svg>
    );
  }

  // Plan B: 800×350cm → 400×175 SVG units
  // Internal walls: 10cm → 5 SVG units
  const vw = 400;
  const iw = 5; // internal wall thickness (10cm / 2)
  const transform = mirrored ? `scale(-1,1) translate(${-vw},0)` : undefined;

  // Front layout: 73+200+77+100+77+200+73 = 800 → /2
  const leftWinStart = 36.5;
  const winW = 100;
  const centerDoorX = 175; // (73+200+77)/2
  const centerDoorW = 50;  // 100/2
  const rightWinStart = 263.5;

  // Partition walls align with front wall sections
  const leftPartX = 175;
  const rightPartX = 225; // symmetric: 400-175

  // Toilet room: 103cm deep from back → 51.5 SVG
  const toiletBottomY = wt + 51.5;

  // Room doors: 84cm → 42 SVG
  const doorH = 42;
  const hallCx = leftPartX + (rightPartX - leftPartX + iw) / 2;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto" style={{ maxHeight: 110 }}>
      <g transform={transform}>
        {/* Outer walls */}
        <rect x={0} y={0} width={vw} height={wt} fill={wallColor} opacity={0.85} />
        <rect x={0} y={vh - wt} width={vw} height={wt} fill={wallColor} opacity={0.85} />
        <rect x={0} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />
        <rect x={vw - wt} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />

        {/* Front windows */}
        <rect x={leftWinStart} y={vh - wt} width={winW} height={wt} fill="hsl(var(--background))" />
        <line x1={leftWinStart} y1={vh - wt / 2} x2={leftWinStart + winW} y2={vh - wt / 2} stroke={winColor} strokeWidth={2.5} />
        <rect x={rightWinStart} y={vh - wt} width={winW} height={wt} fill="hsl(var(--background))" />
        <line x1={rightWinStart} y1={vh - wt / 2} x2={rightWinStart + winW} y2={vh - wt / 2} stroke={winColor} strokeWidth={2.5} />

        {/* Front entrance door */}
        <rect x={centerDoorX} y={vh - wt} width={centerDoorW} height={wt} fill="hsl(var(--background))" />

        {/* Left partition wall (full height) */}
        <rect x={leftPartX} y={wt} width={iw} height={vh - wt * 2} fill={wallColor} opacity={0.7} />
        {/* Right partition wall (full height) */}
        <rect x={rightPartX} y={wt} width={iw} height={vh - wt * 2} fill={wallColor} opacity={0.7} />

        {/* Toilet room bottom wall */}
        <rect x={leftPartX} y={toiletBottomY} width={rightPartX + iw - leftPartX} height={iw} fill={wallColor} opacity={0.7} />

        {/* Toilet fixture — attached to right partition wall */}
        <ellipse cx={rightPartX - 10} cy={wt + 25} rx={7} ry={9} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
        <rect x={rightPartX - 16} y={wt + 12} width={12} height={7} rx={3} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
        {/* Sink — near left partition */}
        <rect x={leftPartX + iw + 3} y={wt + 8} width={8} height={7} rx={2} fill="none" stroke={wallColor} strokeWidth={0.7} opacity={0.3} />

        {/* Toilet door — shifted left of center */}
        {(() => {
          const toiletDoorCx = hallCx - 6;
          return (
            <>
              <rect x={toiletDoorCx - 10} y={toiletBottomY} width={20} height={iw} fill="hsl(var(--background))" />
              <path d={`M ${toiletDoorCx - 10} ${toiletBottomY + iw} A 20 20 0 0 1 ${toiletDoorCx + 10} ${toiletBottomY + iw + 20}`}
                fill="none" stroke={wallColor} strokeWidth={0.6} opacity={0.25} />
            </>
          );
        })()}

        {/* Left room door (84cm, swings into left room) */}
        <rect x={leftPartX} y={toiletBottomY + iw + 15} width={iw} height={doorH} fill="hsl(var(--background))" />
        <path d={`M ${leftPartX} ${toiletBottomY + iw + 15 + doorH} A ${doorH} ${doorH} 0 0 0 ${leftPartX - doorH} ${toiletBottomY + iw + 15}`}
          fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />

        {/* Right room door (84cm, swings into right room) */}
        <rect x={rightPartX} y={toiletBottomY + iw + 15} width={iw} height={doorH} fill="hsl(var(--background))" />
        <path d={`M ${rightPartX + iw} ${toiletBottomY + iw + 15 + doorH} A ${doorH} ${doorH} 0 0 1 ${rightPartX + iw + doorH} ${toiletBottomY + iw + 15}`}
          fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />

        {/* Left room: storage along back wall */}
        <rect x={wt + 3} y={wt + 3} width={leftPartX - wt - 6} height={15} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.25} />
        {/* Left room desk (300cm → fits room width) */}
        <rect x={wt + 10} y={wt + 52} width={130} height={18} fill="none" stroke={furnitureColor} strokeWidth={1} opacity={0.35} rx={1} />
        <circle cx={wt + 75} cy={wt + 80} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />

        {/* Right room: storage along back wall */}
        <rect x={rightPartX + iw + 3} y={wt + 3} width={vw - wt - rightPartX - iw - 6} height={15} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.25} />
        {/* Right room desk */}
        <rect x={rightPartX + iw + 10} y={wt + 52} width={130} height={18} fill="none" stroke={furnitureColor} strokeWidth={1} opacity={0.35} rx={1} />
        <circle cx={rightPartX + iw + 75} cy={wt + 80} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
      </g>
    </svg>
  );
}

/* ── START model: accurate architectural floorplan ────────────────── */
/* Real dimensions: 400×350 cm, walls 23cm thick.
   Back (top):    185 + 80(window) + 135 = 400
   Front (bottom): 96 + 200(big window) + 104 = 400
   Right wall:    165 + 100(door) + 85 = 350
   Door on RIGHT wall, swings inward. */
function StartPlanSVG({ plan, mirrored, wallColor, winColor }: {
  plan: "a" | "b"; mirrored: boolean; wallColor: string; winColor: string;
}) {
  // Scale: real cm / 2 = SVG units
  const vw = 200; // 400/2
  const vh = 175; // 350/2
  const wt = 11.5; // 23/2
  const transform = mirrored ? `scale(-1,1) translate(${-vw},0)` : undefined;
  const furnitureColor = wallColor;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto" style={{ maxHeight: 110 }}>
      <g transform={transform}>
        {/* ── Outer walls ── */}
        <rect x={0} y={0} width={vw} height={wt} fill={wallColor} opacity={0.85} />
        <rect x={0} y={vh - wt} width={vw} height={wt} fill={wallColor} opacity={0.85} />
        <rect x={0} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />
        <rect x={vw - wt} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />

        {/* ── Back (top) window: 185cm from left, 80cm wide → 92.5–132.5 ── */}
        <rect x={92.5} y={0} width={40} height={wt} fill="hsl(var(--background))" />
        <line x1={92.5} y1={wt / 2} x2={132.5} y2={wt / 2} stroke={winColor} strokeWidth={2.5} />

        {/* ── Front (bottom) big window: 96cm from left, 200cm wide → 48–148 ── */}
        <rect x={48} y={vh - wt} width={100} height={wt} fill="hsl(var(--background))" />
        <line x1={48} y1={vh - wt / 2} x2={148} y2={vh - wt / 2} stroke={winColor} strokeWidth={2.5} />

        {/* ── Door on RIGHT wall: 165cm from top, 100cm opening → y 82.5–132.5 ── */}
        <rect x={vw - wt} y={82.5} width={wt} height={50} fill="hsl(var(--background))" />
        {/* Door arc (quarter circle, radius 50, swings inward) */}
        <path
          d={`M ${vw - wt} ${82.5} A 50 50 0 0 0 ${vw - wt - 50} ${132.5}`}
          fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35}
        />

        {/* ── Plan A: furniture (storage + desk + chairs) ── */}
        {plan === "a" && (
          <>
            {/* Built-in storage unit along entire left wall */}
            <rect x={wt} y={wt + 4} width={18} height={vh - wt * 2 - 8} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
            {/* Shelves */}
            {[0.2, 0.4, 0.6, 0.8].map((f, i) => {
              const sy = wt + 4 + (vh - wt * 2 - 8) * f;
              return <line key={i} x1={wt} y1={sy} x2={wt + 18} y2={sy} stroke={furnitureColor} strokeWidth={0.5} opacity={0.2} />;
            })}

            {/* Desk — centered rectangle */}
            <rect x={60} y={55} width={55} height={35} fill="none" stroke={furnitureColor} strokeWidth={1} opacity={0.35} rx={1} />

            {/* 3 office chairs (circles with backrest arcs) */}
            {/* Chair 1 — left side */}
            <circle cx={70} cy={100} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
            <path d="M 63 100 A 7 7 0 0 1 77 100" fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
            {/* Chair 2 — right side */}
            <circle cx={105} cy={100} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
            <path d="M 98 100 A 7 7 0 0 1 112 100" fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
            {/* Chair 3 — top side (behind desk) */}
            <circle cx={87.5} cy={46} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
            <path d="M 80.5 46 A 7 7 0 0 0 94.5 46" fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
          </>
        )}

        {/* ── Plan B: toilet partition top-right corner ── */}
        {plan === "b" && (
          <>
            {/* Vertical partition wall */}
            <rect x={132.5} y={wt} width={wt / 1.5} height={65} fill={wallColor} opacity={0.7} />
            {/* Horizontal partition wall */}
            <rect x={132.5} y={65 + wt} width={vw - wt - 132.5} height={wt / 1.5} fill={wallColor} opacity={0.7} />
            {/* Toilet */}
            <ellipse cx={165} cy={38} rx={7} ry={9} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
            <rect x={159} y={26} width={12} height={7} rx={3} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
            {/* Sink */}
            <rect x={vw - wt - 12} y={55} width={9} height={8} rx={2} fill="none" stroke={wallColor} strokeWidth={0.7} opacity={0.3} />

            {/* Furniture in remaining space */}
            {/* Storage left wall */}
            <rect x={wt} y={wt + 4} width={18} height={vh - wt * 2 - 8} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
            {/* Desk */}
            <rect x={52} y={70} width={50} height={30} fill="none" stroke={furnitureColor} strokeWidth={1} opacity={0.35} rx={1} />
            {/* Chairs */}
            <circle cx={65} cy={110} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
            <circle cx={95} cy={110} r={7} fill="none" stroke={furnitureColor} strokeWidth={0.8} opacity={0.3} />
          </>
        )}
      </g>
    </svg>
  );
}

export function WindowsPlan({ config, updateConfig }: Props) {
  const plans = planOptions[config.model];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Ramen & grondplan</h3>
        <p className="text-sm text-muted-foreground mb-4">Kies je grondplan en pas ramen aan</p>

        {/* Floorplan cards */}
        <div className="grid grid-cols-2 gap-3">
          {(["a", "b"] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => updateConfig("floorPlan", plan)}
              className={cn("option-card text-center py-4", config.floorPlan === plan && "option-card-active")}
            >
              <FloorPlanSVG model={config.model} plan={plan} mirrored={config.mirrorPlan} hubDoorSwap={config.hubDoorSwap} />
              <p className="font-medium text-sm mt-2">{plans[plan].label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{plans[plan].desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {/* Door position toggle (HUB only) */}
        {config.model === "hub" && (
          <div className="option-card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Deur positie</p>
              <p className="text-xs text-muted-foreground">Verplaats de deur naar de voorgevel (raam wisselt mee)</p>
            </div>
            <button
              onClick={() => updateConfig("hubDoorSwap", !config.hubDoorSwap)}
              className={cn(
                "w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-3",
                config.hubDoorSwap ? "bg-accent" : "bg-muted"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform duration-200",
                config.hubDoorSwap ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>
        )}
        {/* Tilt-turn toggle */}
        <div className="option-card flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Draai-kiepraam</p>
            <p className="text-xs text-muted-foreground">Vervang vast raam door draai-kiepraam · +€450</p>
          </div>
          <div className="flex gap-1.5 ml-3">
            {([0, 1, 2] as const).map((v) => (
              <button
                key={v}
                onClick={() => updateConfig("tiltTurnWindow", v)}
                className={cn(
                  "w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150 border",
                  config.tiltTurnWindow === v
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-secondary text-foreground border-border hover:border-accent/40"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Mirror toggle */}
        <div className="option-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlipHorizontal className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Spiegel grondplan</p>
              <p className="text-xs text-muted-foreground">Draai de layout horizontaal om</p>
            </div>
          </div>
          <button
            onClick={() => updateConfig("mirrorPlan", !config.mirrorPlan)}
            className={cn(
              "w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-3",
              config.mirrorPlan ? "bg-accent" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform duration-200",
              config.mirrorPlan ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
