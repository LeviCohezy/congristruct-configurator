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
/* Dimensions from plan: 400×350 cm, walls 23cm thick.
   Front (bottom): 104 + 200(window) + 96 = 400
   Top: 135 + 80(window) + 185 = 400
   Left wall: door arc at bottom portion
   Plan B: toilet partition top-left corner */
function StartPlanSVG({ plan, mirrored, wallColor, winColor }: {
  plan: "a" | "b"; mirrored: boolean; wallColor: string; winColor: string;
}) {
  const vw = 200; // viewBox width (400/2 scale)
  const vh = 175; // viewBox height (350/2 scale)
  const wt = 11.5; // wall thickness (23/2)
  const transform = mirrored ? `scale(-1,1) translate(${-vw},0)` : undefined;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-auto" style={{ maxHeight: 110 }}>
      <g transform={transform}>
        {/* Outer walls — thick black rectangles */}
        {/* Top wall */}
        <rect x={0} y={0} width={vw} height={wt} fill={wallColor} opacity={0.85} />
        {/* Bottom wall */}
        <rect x={0} y={vh - wt} width={vw} height={wt} fill={wallColor} opacity={0.85} />
        {/* Left wall */}
        <rect x={0} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />
        {/* Right wall */}
        <rect x={vw - wt} y={0} width={wt} height={vh} fill={wallColor} opacity={0.85} />

        {/* Top window: 135-215 cm → 67.5-107.5 scaled */}
        <rect x={67.5} y={0} width={40} height={wt} fill="hsl(var(--background))" />
        <line x1={67.5} y1={wt / 2} x2={107.5} y2={wt / 2} stroke={winColor} strokeWidth={2.5} />

        {/* Front (bottom) windows: two sections */}
        {/* Window 1: 0-104cm → 0-52 scaled */}
        <rect x={wt} y={vh - wt} width={52 - wt} height={wt} fill="hsl(var(--background))" />
        <line x1={wt} y1={vh - wt / 2} x2={52} y2={vh - wt / 2} stroke={winColor} strokeWidth={2.5} />
        {/* Window 2: 104-304cm → 52-152 scaled (200cm wide front window) */}
        <rect x={52} y={vh - wt} width={100} height={wt} fill="hsl(var(--background))" />
        <line x1={52} y1={vh - wt / 2} x2={152} y2={vh - wt / 2} stroke={winColor} strokeWidth={2.5} />

        {/* Door on left wall — quarter circle arc */}
        {/* Door opening: bottom portion of left wall, around y=132.5 to y=175 (85cm = 42.5 scaled) */}
        <rect x={0} y={vh - wt - 42.5} width={wt} height={42.5} fill="hsl(var(--background))" />
        {/* Door arc (quarter circle swinging inward) */}
        <path
          d={`M ${wt} ${vh - wt - 42.5} A 42.5 42.5 0 0 1 ${wt + 42.5} ${vh - wt}`}
          fill="none"
          stroke={wallColor}
          strokeWidth={0.8}
          opacity={0.4}
        />
        {/* Door line */}
        <line x1={wt} y1={vh - wt - 42.5} x2={wt} y2={vh - wt} stroke={wallColor} strokeWidth={1.2} opacity={0.5} />

        {plan === "b" && (
          <>
            {/* Toilet partition — horizontal wall from left, at y≈82.5 (165/2), length ≈ 60 scaled */}
            <rect x={wt} y={77} width={55} height={wt / 1.5} fill={wallColor} opacity={0.7} />
            {/* Vertical wall segment closing the toilet room */}
            <rect x={55 + wt} y={0} width={wt / 1.5} height={77 + wt / 1.5} fill={wallColor} opacity={0.7} />
            {/* Toilet symbol */}
            <ellipse cx={35} cy={30} rx={8} ry={10} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
            <rect x={29} y={18} width={12} height={8} rx={3} fill="none" stroke={wallColor} strokeWidth={0.8} opacity={0.35} />
            {/* Sink */}
            <rect x={16} cy={60} y={55} width={10} height={8} rx={2} fill="none" stroke={wallColor} strokeWidth={0.7} opacity={0.3} />
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
