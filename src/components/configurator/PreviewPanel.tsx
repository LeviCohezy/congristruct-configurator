import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ConfigState } from "@/hooks/useConfigurator";
import unitDefault from "@/assets/unit-preview-default.jpg";
import unitWood from "@/assets/unit-preview-wood.jpg";
import unitWhite from "@/assets/unit-preview-white.jpg";

interface PreviewPanelProps {
  config: ConfigState;
  currentStep: number;
}

export function PreviewPanel({ config }: PreviewPanelProps) {
  const previewImage = useMemo(() => {
    if (config.facade === "thermowood-natural") return unitWood;
    if (config.facade === "composite-white") return unitWhite;
    return unitDefault;
  }, [config.facade]);

  const modelLabel = config.model === "compact" ? "Compact · 15m²" : config.model === "standard" ? "Standard · 25m²" : "Large · 40m²";

  return (
    <div className="relative w-full h-full bg-surface flex flex-col items-center justify-center p-6 sm:p-10 overflow-hidden">
      {/* Floating model badge */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <span className="px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-xs font-medium text-foreground">
          {modelLabel}
        </span>
      </div>

      {/* Mirror indicator */}
      {config.mirrorPlan && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <span className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
            Mirrored
          </span>
        </div>
      )}

      {/* Unit image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={previewImage}
          src={previewImage}
          alt="Modular unit preview"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.4 }}
          className={`max-w-full max-h-[70vh] object-contain ${config.mirrorPlan ? "scale-x-[-1]" : ""}`}
        />
      </AnimatePresence>

      {/* Config summary chips */}
      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 flex flex-wrap gap-2 justify-center">
        <Chip label={config.facade.replace(/-/g, " ")} />
        <Chip label={config.windowType + " windows"} />
        <Chip label={config.finishLevel.replace(/-/g, " ")} />
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-1 rounded-md bg-card/70 backdrop-blur-sm border border-border text-[11px] font-medium text-muted-foreground capitalize">
      {label}
    </span>
  );
}
