import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const models = [
  { id: "compact" as const, label: "Compact", size: "15 m²", desc: "Ideal for home office or garden room", price: "€29.500" },
  { id: "standard" as const, label: "Standard", size: "25 m²", desc: "Perfect for studio or guest house", price: "€42.000" },
  { id: "large" as const, label: "Large", size: "40 m²", desc: "Spacious living or work unit", price: "€58.500" },
];

const layouts = [
  { id: "office" as const, label: "Office", desc: "Open workspace layout" },
  { id: "studio" as const, label: "Studio", desc: "Flexible multi-use space" },
  { id: "living" as const, label: "Living", desc: "Residential comfort" },
];

export function UnitSelection({ config, updateConfig }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Choose your model</h3>
        <p className="text-sm text-muted-foreground mb-4">Select the size that fits your needs</p>
        <div className="grid gap-3">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => updateConfig("model", m.id)}
              className={cn("option-card text-left", config.model === m.id && "option-card-active")}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-sm text-muted-foreground">{m.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{m.size}</p>
                  <p className="text-sm font-semibold mt-1">{m.price}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="config-label mb-3">Base layout</p>
        <div className="grid grid-cols-3 gap-3">
          {layouts.map((l) => (
            <button
              key={l.id}
              onClick={() => updateConfig("layout", l.id)}
              className={cn("option-card text-center py-5", config.layout === l.id && "option-card-active")}
            >
              <p className="font-medium text-sm">{l.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{l.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="config-label mb-3">Corner style</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateConfig("roundedCorners", false)}
            className={cn("option-card text-center py-5", !config.roundedCorners && "option-card-active")}
          >
            {/* Straight corner icon */}
            <svg className="mx-auto mb-2" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="6" y="6" width="24" height="24" rx="0" stroke="currentColor" strokeWidth="2.2" fill="none"/>
            </svg>
            <p className="font-medium text-sm">Straight</p>
            <p className="text-[11px] text-muted-foreground mt-1">Sharp angular corners</p>
          </button>
          <button
            onClick={() => updateConfig("roundedCorners", true)}
            className={cn("option-card text-center py-5", config.roundedCorners && "option-card-active")}
          >
            {/* Rounded corner icon */}
            <svg className="mx-auto mb-2" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="6" y="6" width="24" height="24" rx="7" stroke="currentColor" strokeWidth="2.2" fill="none"/>
            </svg>
            <p className="font-medium text-sm">Rounded</p>
            <p className="text-[11px] text-muted-foreground mt-1">Soft curved corners</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
