import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lightbulb, Zap } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const packages = [
  {
    id: "base" as const,
    label: "Base package",
    icon: Zap,
    desc: "3 lighting points · prepared cable connections",
    price: "included",
  },
  {
    id: "full" as const,
    label: "Full lighting",
    icon: Lightbulb,
    desc: "Complete LED package · dimming · matched to your unit",
    price: "+€1.800",
  },
];

export function LightingElectrical({ config, updateConfig }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <h3 className="text-lg font-display font-semibold mb-1">Lighting & electrical</h3>
      <p className="text-sm text-muted-foreground mb-4">Choose your lighting setup</p>
      <div className="grid gap-3">
        {packages.map((p) => (
          <button
            key={p.id}
            onClick={() => updateConfig("lightingPackage", p.id)}
            className={cn("option-card text-left", config.lightingPackage === p.id && "option-card-active")}
          >
            <div className="flex items-start gap-3">
              <p.icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-medium">{p.label}</p>
                  <p className="text-sm font-medium">{p.price}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{p.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
