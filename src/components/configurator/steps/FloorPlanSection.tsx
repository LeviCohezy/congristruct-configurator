import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

export function FloorPlanSection({ config, updateConfig }: Props) {
  return (
    <div className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Indeling</h3>
      <p className="text-sm text-muted-foreground mb-5">Spiegel je grondplan</p>

      {/* Mirror toggle */}
      <div className="option-card flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Spiegel grondplan</p>
          <p className="text-xs text-muted-foreground">Draai de indeling horizontaal om</p>
        </div>
        <button
          onClick={() => updateConfig("mirrorPlan", !config.mirrorPlan)}
          className={cn(
            "w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-3",
            config.mirrorPlan ? "bg-accent" : "bg-muted"
          )}
        >
          <span className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform duration-200",
            config.mirrorPlan ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
      </div>
    </div>
  );
}
