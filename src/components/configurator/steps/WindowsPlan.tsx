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
    a: { label: "Open indeling", desc: "Volledig open zonder scheidingswand" },
    b: { label: "Met scheidingswand", desc: "Opgedeeld in twee zones" },
  },
  base: {
    a: { label: "Casco", desc: "Lege ruimte, zelf in te delen" },
    b: { label: "Ingedeeld", desc: "Volledig ingedeelde layout" },
  },
};

/* ── Inline SVG floorplan diagrams ─────────────────────────────────── */
function FloorPlanSVG({ model, plan, mirrored }: { model: ConfigState["model"]; plan: "a" | "b"; mirrored: boolean }) {
  const wallColor = "hsl(var(--foreground))";
  const winColor = "hsl(var(--accent))";

  if (model === "start") {
    return <StartPlanSVG plan={plan} mirrored={mirrored} wallColor={wallColor} winColor={winColor} />;
  }
  if (model === "flow") {
    return <FlowPlanSVG plan={plan} mirrored={mirrored} wallColor={wallColor} winColor={winColor} />;
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
        {plan === "b" && model === "hub" && (
          <line x1={w / 2} y1={4} x2={w / 2} y2={h - 4} stroke={wallColor} strokeWidth={1.5} opacity={0.5} />
        )}
        {plan === "b" && model === "base" && (
          <>
            <line x1={60} y1={4} x2={60} y2={h - 4} stroke={wallColor} strokeWidth={1.5} opacity={0.5} />
            <line x1={110} y1={4} x2={110} y2={60} stroke={wallColor} strokeWidth={1.5} opacity={0.5} />
          </>
        )}
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

    // Toilet door: ~70cm = 30 SVG, on LEFT side (near partition)
    const toiletDoorW = 30;
    const toiletDoorCx = partX + iw + toiletDoorW / 2 + 3; // left-aligned

    return (
      <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto" style={{ maxHeight: 110 }}>
        <g transform={transform}>
          {/* Outer walls */}
          <rect x={0} y={0} width={vw} height={wt} fill={wallColor} opacity={0.85} />
          <rect x={0} y={vh - wt} width={vw} height={wt} fill={wallColor} opacity={0.85} />
          <rect x={0} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />
          <rect x={vw - wt} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />

          {/* Front window: 200cm wide */}
          <rect x={winStart} y={vh - wt} width={winW} height={wt} fill="hsl(var(--background))" />
          <line x1={winStart} y1={vh - wt / 2} x2={winStart + winW} y2={vh - wt / 2} stroke={winColor} strokeWidth={2.5} />

          {/* Front entrance door: 100cm wide */}
          <rect x={doorStart} y={vh - wt} width={doorW} height={wt} fill="hsl(var(--background))" />
          {/* Door swing arc */}
          <path d={`M ${doorStart} ${vh - wt} A ${doorW} ${doorW} 0 0 0 ${doorStart + doorW} ${vh - wt - doorW}`}
            fill="none" stroke={wallColor} strokeWidth={0.6} opacity={0.25} />

          {/* Vertical partition wall (toilet/storage strip) */}
          <rect x={partX} y={wt} width={iw} height={toiletDepth} fill={wallColor} opacity={0.7} />

          {/* Horizontal toilet wall */}
          <rect x={partX} y={toiletBottomY} width={vw - wt - partX} height={iw} fill={wallColor} opacity={0.7} />

          {/* Toilet door */}
          <rect x={toiletDoorCx - toiletDoorW / 2} y={toiletBottomY} width={toiletDoorW} height={iw} fill="hsl(var(--background))" />
          <path d={`M ${toiletDoorCx - toiletDoorW / 2} ${toiletBottomY + iw} A ${toiletDoorW} ${toiletDoorW} 0 0 1 ${toiletDoorCx + toiletDoorW / 2} ${toiletBottomY + iw + toiletDoorW}`}
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
              <FloorPlanSVG model={config.model} plan={plan} mirrored={config.mirrorPlan} />
              <p className="font-medium text-sm mt-2">{plans[plan].label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{plans[plan].desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Tilt-turn toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Draai-kiepraam</p>
            <p className="text-xs text-muted-foreground">Vervang vast raam door draai-kiepraam · +€450</p>
          </div>
          <button
            onClick={() => updateConfig("tiltTurnWindow", !config.tiltTurnWindow)}
            className={cn(
              "w-12 h-7 rounded-full transition-all duration-200 relative",
              config.tiltTurnWindow ? "bg-accent" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-transform duration-200",
              config.tiltTurnWindow ? "translate-x-5" : "translate-x-0.5"
            )} />
          </button>
        </div>

        {/* Mirror toggle */}
        <button
          onClick={() => updateConfig("mirrorPlan", !config.mirrorPlan)}
          className={cn(
            "w-full option-card flex items-center justify-between",
            config.mirrorPlan && "option-card-active"
          )}
        >
          <div className="flex items-center gap-3">
            <FlipHorizontal className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <p className="font-medium text-sm">Spiegel grondplan</p>
              <p className="text-xs text-muted-foreground">Draai de layout horizontaal om</p>
            </div>
          </div>
          <div className={cn(
            "w-5 h-5 rounded-full border-2 transition-colors",
            config.mirrorPlan ? "bg-accent border-accent" : "border-muted-foreground/30"
          )} />
        </button>
      </div>
    </motion.div>
  );
}
