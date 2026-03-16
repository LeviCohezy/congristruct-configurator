import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Archive } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";
import { RelativePrice } from "@/components/configurator/RelativePrice";

import lightWoodFloorTexture from "@/assets/light-wood-floor-texture.png";
import darkWoodFloorTexture from "@/assets/dark-wood-floor-texture.png";
import stoneFloorTexture from "@/assets/stone-floor-texture.png";
import darkCabinetTexture from "@/assets/dark-cabinet-texture.png";
import lightOakTexture from "@/assets/light-oak-texture.png";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  onPriceClick?: () => void;
}

const finishPrices: Record<string, Record<string, number>> = {
  start: { shell: 0, finished: 3780, "fully-finished": 7500 },
  flow:  { shell: 0, finished: 6600, "fully-finished": 16180 },
  hub:   { shell: 0, finished: 9900, "fully-finished": 16860 },
};

const finishLevels = [
  { id: "shell" as const, label: "Casco (OSB)", desc: "Basisafwerking in OSB, klaar voor verdere afwerking" },
  { id: "finished" as const, label: "Instapklaar", desc: "Volledig afgewerkt, maar zonder meubelinrichting" },
  { id: "fully-finished" as const, label: "Volledig ingericht", desc: "Afgewerkt én ingericht met bureau en kasten" },
];

const floorOptions = [
  { id: "light-vinyl" as const, label: "Licht hout", texture: lightWoodFloorTexture },
  { id: "dark-vinyl" as const, label: "Donker hout", texture: darkWoodFloorTexture },
  { id: "stone-vinyl" as const, label: "Steenlook", texture: stoneFloorTexture },
];

const shelfPrices: Record<string, Record<string, number>> = {
  start: { brown: 160, "light-oak": 141, white: 0 },
  flow:  { brown: 330, "light-oak": 260, white: 0 },
  hub:   { brown: 350, "light-oak": 200, white: 0 },
};

const shelfColors = [
  { id: "white" as const, label: "Wit", texture: null, color: "#f5f5f0" },
  { id: "light-oak" as const, label: "Eiken kasten", texture: lightOakTexture },
  { id: "brown" as const, label: "Donkere kasten", texture: darkCabinetTexture },
];

const showFloor = (level: ConfigState["finishLevel"]) => level === "finished" || level === "fully-finished";
const showFurnished = (level: ConfigState["finishLevel"]) => level === "fully-finished";

export function InteriorFinish({ config, updateConfig, onPriceClick }: Props) {
  const m = config.model;
  const fPrices = finishPrices[m] ?? finishPrices.start;
  const sPrices = shelfPrices[m] ?? shelfPrices.start;

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
              <RelativePrice
                prices={fPrices}
                selected={config.finishLevel}
                optionId={f.id}
                revealed={config.priceRevealed}
                onPriceClick={onPriceClick}
                className="text-sm font-medium shrink-0 ml-3"
              />
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
                      <div
                        className="w-full h-10 rounded-lg mb-2 border border-border bg-cover bg-center"
                        style={c.texture ? { backgroundImage: `url(${c.texture})` } : { backgroundColor: c.color ?? "#fff" }}
                      />
                      <p className="text-xs font-medium">{c.label}</p>
                      <RelativePrice
                        prices={sPrices}
                        selected={config.shelfColor}
                        optionId={c.id}
                        revealed={config.priceRevealed}
                        onPriceClick={onPriceClick}
                        className="text-[10px] font-medium mt-0.5"
                      />
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
