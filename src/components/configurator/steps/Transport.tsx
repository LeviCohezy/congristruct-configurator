import { motion } from "framer-motion";
import { MapPin, Truck } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

export function Transport({ config, updateConfig }: Props) {
  const transportCost = config.transportDistance * 8;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Transport</h3>
      <p className="text-sm text-muted-foreground mb-6">Geschatte leveringskosten op basis van afstand</p>

      <div className="bg-surface rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-accent" />
          <p className="font-medium text-sm">Distance from production facility</p>
        </div>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={config.transportDistance}
          onChange={(e) => updateConfig("transportDistance", Number(e.target.value))}
          className="w-full accent-accent h-2 rounded-full appearance-none bg-muted cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>10 km</span>
          <span className="font-semibold text-foreground">{config.transportDistance} km</span>
          <span>500 km</span>
        </div>
      </div>

      <div className="option-card">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium text-sm">Estimated transport cost</p>
            <p className="text-xs text-muted-foreground">Includes delivery · crane setup additional</p>
          </div>
          <p className="text-lg font-display font-bold">€{transportCost.toLocaleString("nl-NL")}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Final transport cost depends on site accessibility and crane requirements. A detailed quote will be provided after site assessment.
      </p>
    </motion.div>
  );
}
