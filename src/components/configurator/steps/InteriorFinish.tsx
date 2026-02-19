import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const finishLevels = [
  { id: "shell" as const, label: "Casco (OSB)", desc: "Basisafwerking in OSB, klaar voor verdere afwerking", price: "inbegrepen" },
  { id: "finished" as const, label: "Instapklaar", desc: "Volledig afgewerkt, maar zonder meubelinrichting", price: "+€8.500" },
  { id: "fully-finished" as const, label: "Volledig ingericht", desc: "Afgewerkt én ingericht met bureau en kasten (toestellen en stoelen niet inbegrepen)", price: "+€16.500" },
];

const floorOptions = [
  { id: "light-vinyl" as const, label: "Licht hout", color: "hsl(40,20%,85%)" },
  { id: "dark-vinyl" as const, label: "Donker hout", color: "hsl(25,15%,35%)" },
  { id: "stone-vinyl" as const, label: "Steenlook", color: "hsl(30,5%,65%)" },
];

export function InteriorFinish({ config, updateConfig }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Interieur & afwerking</h3>
        <p className="text-sm text-muted-foreground mb-4">Kies je afwerkingsniveau en vloer</p>
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
                <p className="text-sm font-medium shrink-0 ml-3">{f.price}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="config-label mb-3">Vloerkeuze (Clickvinyl)</p>
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
