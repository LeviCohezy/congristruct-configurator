import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";

import lightWoodFloorTexture from "@/assets/light-wood-floor-texture.png";
import darkWoodFloorTexture from "@/assets/dark-wood-floor-texture.png";
import stoneFloorTexture from "@/assets/stone-floor-texture.png";
import thermowoodNaturalTexture from "@/assets/thermowood-natural-texture.png";
import lightOakTexture from "@/assets/light-oak-texture.png";
import brickStripsTexture from "@/assets/brick-strips-texture.png";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  onPriceClick?: () => void;
}

const finishLevels = [
  { id: "shell" as const, label: "Casco (OSB)", desc: "Basisafwerking in OSB, klaar voor verdere afwerking", price: "inbegrepen", priceNum: "" },
  { id: "finished" as const, label: "Instapklaar", desc: "Volledig afgewerkt, maar zonder meubelinrichting", price: "+€3.780", priceNum: "3.780" },
  { id: "fully-finished" as const, label: "Volledig ingericht", desc: "Afgewerkt én ingericht met bureau en kasten", price: "+€7.500", priceNum: "7.500" },
];

const floorOptions = [
  { id: "light-vinyl" as const, label: "Licht hout", texture: lightWoodFloorTexture },
  { id: "dark-vinyl" as const, label: "Donker hout", texture: darkWoodFloorTexture },
  { id: "stone-vinyl" as const, label: "Steenlook", texture: stoneFloorTexture },
];

const shelfColors = [
  { id: "brown" as const, label: "Donkere kasten", texture: thermowoodNaturalTexture, price: "160" },
  { id: "light-oak" as const, label: "Eiken kasten", texture: lightOakTexture, price: "141" },
  { id: "white" as const, label: "Wit", texture: brickStripsTexture, price: "" },
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
                    <div className="w-full h-10 rounded-lg mb-2 bg-cover bg-center" style={{ backgroundImage: `url(${f.texture})` }} />
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
                      <div className="w-full h-10 rounded-lg mb-2 border border-border bg-cover bg-center" style={{ backgroundImage: `url(${c.texture})` }} />
                      <p className="text-xs font-medium">{c.label}</p>
                      {c.price ? (
                        <BlurredPrice text={c.price} revealed={config.priceRevealed} onClick={onPriceClick} className="text-[10px] font-medium text-accent mt-0.5" prefix="+€" />
                      ) : (
                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5">inbegrepen</p>
                      )}
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
