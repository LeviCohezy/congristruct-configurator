import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const models = [
  { id: "start" as const, label: "BLOQ START", size: "14 m²", people: "1 pers.", desc: "Geschikt als thuiskantoor of kleine vergaderruimte", price: "€29.500" },
  { id: "flow" as const, label: "BLOQ FLOW", size: "21–28 m²", people: "1–2 pers.", desc: "Ideaal als praktijkruimte of refter voor meerdere personen", price: "€42.000" },
  { id: "hub" as const, label: "BLOQ HUB", size: "35 m²", people: "4–6 pers.", desc: "Voor kleine teams of gedeelde kantoren. Functioneel en goed ingedeeld.", price: "€58.500" },
  { id: "base" as const, label: "BLOQ BASE", size: "50 m²", people: "6 pers.", desc: "Onze grootste unit. Stevig, uitbreidbaar en klaar voor intensief gebruik.", price: "€79.000" },
];

export function UnitSelection({ config, updateConfig }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <div>
        <h3 className="text-xl font-display font-light mb-1">Kies je model</h3>
        <p className="text-sm text-muted-foreground mb-5">Selecteer de unit die bij jouw project past</p>
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
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs text-muted-foreground">{m.size} · {m.people}</p>
                  <p className="text-sm font-semibold mt-1">{m.price}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="config-label mb-3">Hoekafwerking</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateConfig("roundedCorners", false)}
            className={cn("option-card text-center py-5", !config.roundedCorners && "option-card-active")}
          >
            <svg className="mx-auto mb-2" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="6" y="6" width="24" height="24" rx="0" stroke="currentColor" strokeWidth="2.2" fill="none"/>
            </svg>
            <p className="font-medium text-sm">Recht</p>
            <p className="text-[11px] text-muted-foreground mt-1">Scherpe hoeken</p>
          </button>
          <button
            onClick={() => updateConfig("roundedCorners", true)}
            className={cn("option-card text-center py-5", config.roundedCorners && "option-card-active")}
          >
            <svg className="mx-auto mb-2" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="6" y="6" width="24" height="24" rx="7" stroke="currentColor" strokeWidth="2.2" fill="none"/>
            </svg>
            <p className="font-medium text-sm">Afgerond</p>
            <p className="text-[11px] text-muted-foreground mt-1">Zachte ronde hoeken</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
