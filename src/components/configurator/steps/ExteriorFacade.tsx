import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

type FacadeId = ConfigState["facade"];

interface MaterialFamily {
  id: string;
  label: string;
  desc: string;
  variants: { id: FacadeId; label: string; color: string }[];
}

const materials: MaterialFamily[] = [
  {
    id: "thermowood-black",
    label: "Thermowood Zwart Den",
    desc: "Zwart gebrand hout",
    variants: [{ id: "thermowood-black", label: "Zwart", color: "hsl(0,0%,12%)" }],
  },
  {
    id: "thermowood-natural",
    label: "Thermowood Ayous",
    desc: "Natuurlijke houtlook",
    variants: [{ id: "thermowood-natural", label: "Naturel", color: "hsl(32,50%,55%)" }],
  },
  {
    id: "composite",
    label: "Composiet gevelplaten",
    desc: "Vlakke platen 1,22 m · verticale voeg ± 5 mm",
    variants: [
      { id: "composite-white", label: "Wit", color: "hsl(0,0%,95%)" },
      { id: "composite-black", label: "Zwart", color: "hsl(0,0%,8%)" },
    ],
  },
  {
    id: "aluminium",
    label: "Aluminium gevelbekleding",
    desc: "Voeglijnen om de ± 1,5 m · alle kleuren mogelijk",
    variants: [
      { id: "aluminium-anthracite", label: "Antraciet", color: "hsl(210,5%,30%)" },
      { id: "aluminium-bronze", label: "Brons", color: "hsl(30,30%,40%)" },
      { id: "aluminium-white", label: "Wit", color: "hsl(0,0%,92%)" },
    ],
  },
  {
    id: "brick",
    label: "Gevelsteen strips",
    desc: "Grijze steenstrips look",
    variants: [{ id: "brick-grey", label: "Grijs", color: "hsl(0,0%,55%)" }],
  },
];

function getActiveFamily(facade: FacadeId): string {
  for (const m of materials) {
    if (m.variants.some((v) => v.id === facade)) return m.id;
  }
  return materials[0].id;
}

export function ExteriorFacade({ config, updateConfig }: Props) {
  const [expandedFamily, setExpandedFamily] = useState(() => getActiveFamily(config.facade));

  const selectFamily = (family: MaterialFamily) => {
    setExpandedFamily(family.id);
    // Auto-select first variant if current facade isn't in this family
    if (!family.variants.some((v) => v.id === config.facade)) {
      updateConfig("facade", family.variants[0].id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Gevelmateriaal</h3>
        <p className="text-sm text-muted-foreground mb-4">Kies je buitenbekleding</p>
        <div className="grid gap-3">
          {materials.map((family) => {
            const isActive = expandedFamily === family.id;
            const hasMultiple = family.variants.length > 1;
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
                      className="w-10 h-10 rounded-lg shrink-0 border border-border"
                      style={{ backgroundColor: family.variants[0].color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{family.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{family.desc}</p>
                    </div>
                  </div>
                </button>
                {/* Color sub-swatches */}
                {isActive && hasMultiple && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex gap-2 mt-2 ml-2"
                  >
                    {family.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => updateConfig("facade", v.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors",
                          config.facade === v.id
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-md border border-border"
                          style={{ backgroundColor: v.color }}
                        />
                        <span className="text-[10px] font-medium">{v.label}</span>
                      </button>
                    ))}
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
