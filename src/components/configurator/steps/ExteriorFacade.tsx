import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";
import { RAL_COLORS, RAL_GROUPS } from "@/data/ralColors";
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
  desc2?: string;
  facadeId: FacadeId;
  color: string;
  image?: string;
  hasColorPicker?: boolean;
}

const materials: MaterialFamily[] = [
  {
    id: "thermowood-natural",
    label: "Thermowood Ayous",
    desc: "Natuurlijke houtlook",
    facadeId: "thermowood-natural",
    color: "hsl(32,50%,55%)",
    image: thermowoodNaturalImg,
  },
  {
    id: "thermowood-black",
    label: "Thermowood Zwart Den",
    desc: "Zwart gebrand hout",
    facadeId: "thermowood-black",
    color: "hsl(0,0%,12%)",
    image: thermowoodBlackImg,
  },
  {
    id: "composite-white",
    label: "Composiet Wit",
    desc: "Vlakke platen 1,22 m",
    desc2: "Verticale voeg ± 5 mm",
    facadeId: "composite-white",
    color: "hsl(0,0%,95%)",
  },
  {
    id: "composite-black",
    label: "Composiet Zwart",
    desc: "Vlakke platen 1,22 m",
    desc2: "Verticale voeg ± 5 mm",
    facadeId: "composite-black",
    color: "hsl(0,0%,8%)",
  },
  {
    id: "aluminium",
    label: "Aluminium gevelbekleding",
    desc: "Aluminium platen",
    desc2: "Voeglijnen om de 1,5 m",
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
function RalSwatchPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const selected = RAL_COLORS.find((c) => c.hex === value);
  const [activeGroup, setActiveGroup] = useState(() => {
    if (!selected) return RAL_GROUPS[6].label; // default to Grijs
    const code = selected.code;
    return RAL_GROUPS.find((g) => g.colors.some((c) => c.code === code))?.label ?? RAL_GROUPS[6].label;
  });

  const groupColors = RAL_GROUPS.find((g) => g.label === activeGroup)?.colors ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-2 ml-2 p-3 rounded-lg border border-border bg-card/50"
    >
      {/* Selected color display */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg shrink-0 border border-border"
          style={{ backgroundColor: value }}
        />
        <div>
          <p className="text-xs font-medium">{selected ? `RAL ${selected.code}` : "Kies een kleur"}</p>
          <p className="text-[11px] text-muted-foreground">{selected?.name ?? ""}</p>
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-1 mb-2">
        {RAL_GROUPS.map((g) => (
          <button
            key={g.label}
            onClick={() => setActiveGroup(g.label)}
            className={cn(
              "px-2 py-0.5 text-[10px] rounded-full border transition-colors",
              activeGroup === g.label
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Color swatches */}
      <div className="grid grid-cols-8 gap-1 max-h-[140px] overflow-y-auto pr-1">
        {groupColors.map((c) => (
          <button
            key={c.code}
            onClick={() => onChange(c.hex)}
            className={cn(
              "aspect-square rounded border-2 transition-all hover:scale-110",
              c.hex === value ? "border-primary ring-1 ring-primary scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: c.hex }}
            title={`RAL ${c.code} — ${c.name}`}
          />
        ))}
      </div>
    </motion.div>
  );
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
        <h3 className="text-xl font-display font-light mb-1">Gevelmateriaal</h3>
        <p className="text-sm text-muted-foreground mb-5">Kies je buitenbekleding</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                      {family.desc2 && <p className="text-xs text-muted-foreground truncate">{family.desc2}</p>}
                    </div>
                  </div>
                </button>
                {/* RAL color slider for aluminium */}
                {isActive && family.hasColorPicker && (
                  <RalColorSlider
                    value={config.aluminiumColor}
                    onChange={(hex) => updateConfig("aluminiumColor", hex)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
