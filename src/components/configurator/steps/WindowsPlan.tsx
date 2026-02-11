import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FlipHorizontal } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const windowTypes = [
  { id: "standard" as const, label: "Standard", desc: "Classic window layout", price: "included" },
  { id: "panoramic" as const, label: "Panoramic", desc: "Floor-to-ceiling glass", price: "+€2.200" },
  { id: "minimal" as const, label: "Minimal", desc: "Reduced glazing, more privacy", price: "+€1.600" },
];

export function WindowsPlan({ config, updateConfig }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Windows & plan</h3>
        <p className="text-sm text-muted-foreground mb-4">Configure glazing and floor plan orientation</p>
        <div className="grid gap-3">
          {windowTypes.map((w) => (
            <button
              key={w.id}
              onClick={() => updateConfig("windowType", w.id)}
              className={cn("option-card text-left", config.windowType === w.id && "option-card-active")}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{w.label}</p>
                  <p className="text-sm text-muted-foreground">{w.desc}</p>
                </div>
                <p className="text-sm font-medium">{w.price}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Tilt-turn window</p>
            <p className="text-xs text-muted-foreground">+€450</p>
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
              <p className="font-medium text-sm">Mirror floor plan</p>
              <p className="text-xs text-muted-foreground">Flip the layout horizontally</p>
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
