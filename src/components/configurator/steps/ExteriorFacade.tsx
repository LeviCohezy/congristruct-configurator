import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";
import { Slider } from "@/components/ui/slider";

const RAL_COLORS: { code: string; name: string; hex: string }[] = [
  { code: "RAL 9005", name: "Gitzwart", hex: "#0e0e10" },
  { code: "RAL 7016", name: "Antracietgrijs", hex: "#383e42" },
  { code: "RAL 7021", name: "Zwartgrijs", hex: "#2f3234" },
  { code: "RAL 7039", name: "Kwartsgrijs", hex: "#6b6b5e" },
  { code: "RAL 7035", name: "Lichtgrijs", hex: "#c5c7c4" },
  { code: "RAL 9006", name: "Wit aluminium", hex: "#a1a1a0" },
  { code: "RAL 9007", name: "Grijs aluminium", hex: "#878581" },
  { code: "RAL 9010", name: "Zuiver wit", hex: "#f1ece1" },
  { code: "RAL 9016", name: "Verkeerswit", hex: "#f1f0ea" },
  { code: "RAL 8019", name: "Grijsbruin", hex: "#3b3332" },
  { code: "RAL 6009", name: "Dennengroen", hex: "#27352a" },
  { code: "RAL 5011", name: "Staalblauw", hex: "#1a2b3c" },
  { code: "RAL 3005", name: "Wijnrood", hex: "#5e2028" },
  { code: "RAL 1015", name: "Licht ivoor", hex: "#e6d2b5" },
  { code: "RAL 8014", name: "Sepiabruin", hex: "#49392d" },
];
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
