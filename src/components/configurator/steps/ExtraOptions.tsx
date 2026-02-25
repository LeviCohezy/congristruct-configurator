import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sun, Battery, Umbrella, Landmark } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const extras = [
  { key: "awning" as const, label: "Awning / canopy", icon: Umbrella, price: "€2.400", desc: "Outdoor shading" },
  { key: "solarPanels" as const, label: "Solar panels", icon: Sun, price: "€4.800", desc: "On-roof solar system" },
  { key: "batterySystem" as const, label: "Battery system", icon: Battery, price: "€3.200", desc: "Energy storage" },
  { key: "foundation" as const, label: "Foundation", icon: Landmark, price: "€3.500", desc: "Concrete screw piles" },
];

export function ExtraOptions({ config, updateConfig }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Extra opties</h3>
      <p className="text-sm text-muted-foreground mb-5">Voeg optionele features toe</p>
      <div className="grid gap-3">
        {extras.map((e) => {
          const active = config[e.key];
          return (
            <button
              key={e.key}
              onClick={() => updateConfig(e.key, !active)}
              className={cn("option-card text-left", active && "option-card-active")}
            >
              <div className="flex items-center gap-3">
                <e.icon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm">{e.label}</p>
                    <p className="text-sm font-medium">{e.price}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.desc}</p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                  active ? "bg-accent border-accent" : "border-muted-foreground/30"
                )}>
                  {active && <span className="w-2 h-2 rounded-full bg-accent-foreground" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
