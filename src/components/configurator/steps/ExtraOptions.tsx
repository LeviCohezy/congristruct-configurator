import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame, Battery, Layers } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  onPriceClick?: () => void;
}

const getExtras = (model: string) => [
  { key: "heatPump" as const, label: "Luchtwarmtepomp", icon: Flame, price: "2.500", desc: "Efficiënte verwarming & koeling" },
  { key: "solarBattery" as const, label: "Solar batterij", icon: Battery, price: "4.500", desc: "Energieopslag" },
  { key: "insulation" as const, label: "Houtvezelplaat isolatie", icon: Layers, price: model === "flow" ? "1.450" : "900", desc: "Extra isolatie met houtvezelplaat" },
];

export function ExtraOptions({ config, updateConfig, onPriceClick }: Props) {
  const extras = getExtras(config.model);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Extra opties</h3>
      <p className="text-sm text-muted-foreground mb-5">Voeg optionele features toe</p>
      <div className="grid gap-6">
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
                    <BlurredPrice text={e.price} revealed={config.priceRevealed} onClick={onPriceClick} className="text-sm font-medium" prefix="+€" />
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
