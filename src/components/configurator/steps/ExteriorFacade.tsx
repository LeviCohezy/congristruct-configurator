import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const facades = [
  { id: "thermowood-black" as const, label: "Thermowood Black", color: "hsl(0,0%,12%)", price: "included" },
  { id: "thermowood-natural" as const, label: "Thermowood Natural", color: "hsl(32,50%,55%)", price: "+€800" },
  { id: "composite-white" as const, label: "Composite White", color: "hsl(0,0%,95%)", price: "+€1.200" },
  { id: "composite-black" as const, label: "Composite Black", color: "hsl(0,0%,8%)", price: "+€1.200" },
  { id: "aluminium-anthracite" as const, label: "Aluminium Anthracite", color: "hsl(210,5%,30%)", price: "+€2.400" },
  { id: "aluminium-bronze" as const, label: "Aluminium Bronze", color: "hsl(30,30%,40%)", price: "+€2.800" },
];

export function ExteriorFacade({ config, updateConfig }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Façade material</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose your exterior cladding</p>
        <div className="grid grid-cols-2 gap-3">
          {facades.map((f) => (
            <button
              key={f.id}
              onClick={() => updateConfig("facade", f.id)}
              className={cn("option-card text-left", config.facade === f.id && "option-card-active")}
            >
              <div
                className="w-full h-12 rounded-lg mb-2"
                style={{ backgroundColor: f.color }}
              />
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.price}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="config-label mb-3">Roof edge</p>
        <div className="flex gap-3">
          {(["black", "white"] as const).map((c) => (
            <button
              key={c}
              onClick={() => updateConfig("roofEdge", c)}
              className={cn("option-card flex-1 text-center py-4", config.roofEdge === c && "option-card-active")}
            >
              <div
                className="w-8 h-3 rounded mx-auto mb-2"
                style={{ backgroundColor: c === "black" ? "hsl(0,0%,10%)" : "hsl(0,0%,92%)" }}
              />
              <p className="text-sm font-medium capitalize">{c}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Rounded corners</p>
          <p className="text-xs text-muted-foreground">+€1.500</p>
        </div>
        <button
          onClick={() => updateConfig("roundedCorners", !config.roundedCorners)}
          className={cn(
            "w-12 h-7 rounded-full transition-all duration-200 relative",
            config.roundedCorners ? "bg-accent" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-transform duration-200",
              config.roundedCorners ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
    </motion.div>
  );
}
