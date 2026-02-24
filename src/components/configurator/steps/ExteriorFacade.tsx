import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";
import thermowoodBlackImg from "@/assets/thermowood-black-texture.png";
import thermowoodNaturalImg from "@/assets/thermowood-natural-texture.png";
import brickStripsImg from "@/assets/brick-strips-texture.png";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

type FacadeId = ConfigState["facade"];

interface MaterialFamily {
  id: string;
  label: string;
  desc: string;
  facadeId: FacadeId;
  color: string;
  image?: string;
  hasColorPicker?: boolean;
}

const materials: MaterialFamily[] = [
  {
    id: "thermowood-black",
    label: "Thermowood Zwart Den",
    desc: "Zwart gebrand hout",
    facadeId: "thermowood-black",
    color: "hsl(0,0%,12%)",
    image: thermowoodBlackImg,
  },
  {
    id: "thermowood-natural",
    label: "Thermowood Ayous",
    desc: "Natuurlijke houtlook",
    facadeId: "thermowood-natural",
    color: "hsl(32,50%,55%)",
    image: thermowoodNaturalImg,
  },
  {
    id: "composite-white",
    label: "Composiet Wit",
    desc: "Vlakke platen 1,22 m · verticale voeg ± 5 mm",
    facadeId: "composite-white",
    color: "hsl(0,0%,95%)",
  },
  {
    id: "composite-black",
    label: "Composiet Zwart",
    desc: "Vlakke platen 1,22 m · verticale voeg ± 5 mm",
    facadeId: "composite-black",
    color: "hsl(0,0%,8%)",
  },
  {
    id: "aluminium",
    label: "Aluminium gevelbekleding",
    desc: "Geborsteld aluminium platen · voeglijnen om de 1,5 m",
    facadeId: "aluminium",
    color: "hsl(210,5%,30%)",
    hasColorPicker: true,
  },
  {
    id: "brick-grey",
    label: "Gevelsteen strips",
    desc: "Grijze steenstrips look",
    facadeId: "brick-grey",
    color: "hsl(0,0%,55%)",
    image: brickStripsImg,
  },
];

function getActiveFamily(facade: FacadeId): string {
  for (const m of materials) {
    if (m.facadeId === facade) return m.id;
  }
  return materials[0].id;
}

export function ExteriorFacade({ config, updateConfig }: Props) {
  const [expandedFamily, setExpandedFamily] = useState(() => getActiveFamily(config.facade));

  const selectFamily = (family: MaterialFamily) => {
    setExpandedFamily(family.id);
    if (config.facade !== family.facadeId) {
      updateConfig("facade", family.facadeId);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Gevelmateriaal</h3>
        <p className="text-sm text-muted-foreground mb-4">Kies je buitenbekleding</p>
        <div className="grid grid-cols-2 gap-3">
          {materials.map((family) => {
            const isActive = expandedFamily === family.id;
            return (
              <div key={family.id}>
                <button
                  onClick={() => selectFamily(family)}
                  className={cn(
                    "option-card w-full text-left",
                    isActive && "option-card-active"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 border border-border overflow-hidden bg-cover bg-center"
                      style={
                        family.image
                          ? { backgroundImage: `url(${family.image})` }
                          : { backgroundColor: family.id === "aluminium" ? config.aluminiumColor : family.color }
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{family.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{family.desc}</p>
                    </div>
                  </div>
                </button>
                {/* Color picker for aluminium */}
                {isActive && family.hasColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 ml-2 p-3 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.aluminiumColor}
                        onChange={(e) => updateConfig("aluminiumColor", e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                      />
                      <div>
                        <p className="text-xs font-medium">Kies een kleur</p>
                        <p className="text-[11px] font-mono text-muted-foreground">{config.aluminiumColor}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
