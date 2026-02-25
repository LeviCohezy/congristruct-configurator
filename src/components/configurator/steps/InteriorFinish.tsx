import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  onPriceClick?: () => void;
}

const finishLevels = [
  { id: "shell" as const, label: "Casco (OSB)", desc: "Basisafwerking in OSB, klaar voor verdere afwerking", price: "inbegrepen", priceNum: "" },
  { id: "finished" as const, label: "Instapklaar", desc: "Volledig afgewerkt, maar zonder meubelinrichting", price: "+€8.500", priceNum: "8.500" },
  { id: "fully-finished" as const, label: "Volledig ingericht", desc: "Afgewerkt én ingericht met bureau en kasten", price: "+€16.500", priceNum: "16.500" },
];

const floorOptions = [
  { id: "light-vinyl" as const, label: "Licht hout", color: "hsl(40,20%,85%)" },
  { id: "dark-vinyl" as const, label: "Donker hout", color: "hsl(25,15%,35%)" },
  { id: "stone-vinyl" as const, label: "Steenlook", color: "hsl(30,5%,65%)" },
];

const shelfColors = [
  { id: "brown" as const, label: "Walnoot bruin", color: "hsl(25,30%,35%)" },
  { id: "light-oak" as const, label: "Licht eiken", color: "hsl(40,30%,72%)" },
  { id: "white" as const, label: "Wit", color: "hsl(0,0%,95%)" },
];

const showFloor = (level: ConfigState["finishLevel"]) => level === "finished" || level === "fully-finished";
const showFurnished = (level: ConfigState["finishLevel"]) => level === "fully-finished";

export function InteriorFinish({ config, updateConfig, onPriceClick }: Props) {
  return (
    <div className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Interieur & afwerking</h3>
      <p className="text-sm text-muted-foreground mb-5">Kies je afwerkingsniveau</p>

      <div className="grid gap-6">
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
              {f.priceNum ? (
                <BlurredPrice text={f.priceNum} revealed={config.priceRevealed} onClick={onPriceClick} className="text-sm font-medium shrink-0 ml-3" prefix="+€" />
              ) : (
                <p className="text-sm font-medium shrink-0 ml-3">{f.price}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Floor option */}
      <AnimatePresence>
        {showFloor(config.finishLevel) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-10">
              <p className="config-label mb-4">Vloerkeuze (Clickvinyl)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
        )}
      </AnimatePresence>

      {/* Furnished options */}
      <AnimatePresence>
        {showFurnished(config.finishLevel) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="overflow-hidden"
          >
            <div className="mt-10 space-y-6">
              <div>
                <p className="config-label mb-4">Kleur kasten & legplanken</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {shelfColors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateConfig("shelfColor", c.id)}
                      className={cn("option-card text-center", config.shelfColor === c.id && "option-card-active")}
                    >
                      <div className="w-full h-10 rounded-lg mb-2 border border-border" style={{ backgroundColor: c.color }} />
                      <p className="text-xs font-medium">{c.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
