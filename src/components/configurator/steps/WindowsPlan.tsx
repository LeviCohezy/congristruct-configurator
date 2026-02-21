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
    a: { label: "21 m² open", desc: "Eén open ruimte" },
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
        {plan === "b" && model === "flow" && (
          <line x1={50} y1={4} x2={50} y2={h - 4} stroke={wallColor} strokeWidth={1.5} opacity={0.5} />
        )}
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
