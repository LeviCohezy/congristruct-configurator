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
  const w = 160;
  const h = 120;
  const wallStroke = "hsl(var(--foreground))";
  const windowStroke = "hsl(var(--accent))";
  const transform = mirrored ? `scale(-1,1) translate(${-w},0)` : undefined;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ maxHeight: 100 }}>
      <g transform={transform}>
        {/* Outer walls */}
        <rect x={4} y={4} width={w - 8} height={h - 8} fill="none" stroke={wallStroke} strokeWidth={2.5} rx={1} opacity={0.7} />

        {/* Front windows (bottom edge) */}
        <line x1={20} y1={h - 4} x2={70} y2={h - 4} stroke={windowStroke} strokeWidth={3} />
        {model !== "start" && (
          <line x1={90} y1={h - 4} x2={w - 20} y2={h - 4} stroke={windowStroke} strokeWidth={3} />
        )}

        {/* Door */}
        <rect x={75} y={h - 8} width={12} height={4} fill={windowStroke} opacity={0.5} />

        {/* Interior walls based on plan */}
        {plan === "b" && model === "start" && (
          <>
            {/* Toilet partition */}
            <line x1={w - 40} y1={4} x2={w - 40} y2={50} stroke={wallStroke} strokeWidth={1.5} opacity={0.5} />
            <text x={w - 25} y={30} fontSize={8} fill={wallStroke} opacity={0.4} textAnchor="middle">WC</text>
          </>
        )}
        {plan === "b" && model === "flow" && (
          <>
            {/* Entry partition */}
            <line x1={50} y1={4} x2={50} y2={h - 4} stroke={wallStroke} strokeWidth={1.5} opacity={0.5} />
          </>
        )}
        {plan === "b" && model === "hub" && (
          <>
            {/* Center divider */}
            <line x1={w / 2} y1={4} x2={w / 2} y2={h - 4} stroke={wallStroke} strokeWidth={1.5} opacity={0.5} />
          </>
        )}
        {plan === "b" && model === "base" && (
          <>
            {/* Multi-room layout */}
            <line x1={60} y1={4} x2={60} y2={h - 4} stroke={wallStroke} strokeWidth={1.5} opacity={0.5} />
            <line x1={110} y1={4} x2={110} y2={60} stroke={wallStroke} strokeWidth={1.5} opacity={0.5} />
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
