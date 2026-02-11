import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const finishLevels = [
  { id: "shell" as const, label: "Shell", desc: "OSB ready · DIY finishing", price: "included" },
  { id: "finished" as const, label: "Finished", desc: "Walls & floor done, no furniture", price: "+€8.500" },
  { id: "fully-finished" as const, label: "Fully finished", desc: "Including desk & cabinets", price: "+€16.500" },
];

const floorOptions = [
  { id: "light-vinyl" as const, label: "Light click vinyl", color: "hsl(40,20%,85%)" },
  { id: "dark-vinyl" as const, label: "Dark click vinyl", color: "hsl(25,15%,35%)" },
  { id: "stone-vinyl" as const, label: "Stone look vinyl", color: "hsl(30,5%,65%)" },
];

export function InteriorFinish({ config, updateConfig }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Interior finish</h3>
        <p className="text-sm text-muted-foreground mb-4">Select your finish level and flooring</p>
        <div className="grid gap-3">
          {finishLevels.map((f) => (
            <button
              key={f.id}
              onClick={() => updateConfig("finishLevel", f.id)}
              className={cn("option-card text-left", config.finishLevel === f.id && "option-card-active")}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{f.label}</p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
                <p className="text-sm font-medium">{f.price}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="config-label mb-3">Floor material</p>
        <div className="grid grid-cols-3 gap-3">
          {floorOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => updateConfig("floorOption", f.id)}
              className={cn("option-card text-center", config.floorOption === f.id && "option-card-active")}
            >
              <div className="w-full h-10 rounded-lg mb-2" style={{ backgroundColor: f.color }} />
              <p className="text-xs font-medium">{f.label}</p>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
