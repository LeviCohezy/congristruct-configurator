import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const planOptions: Record<ConfigState["model"], { a: { label: string; desc: string }; b: { label: string; desc: string } }> = {
  start: {
    a: { label: "Open plan", desc: "Eén open ruimte zonder toilet" },
    b: { label: "Met toilet", desc: "Compacte ruimte met apart toilet" },
  },
  flow: {
    a: { label: "21 m² open", desc: "Open ruimte met toilet + berging" },
    b: { label: "28 m² gesplitst", desc: "Aparte inkom + tweede ruimte" },
  },
  hub: {
    a: { label: "Open ruimte", desc: "Eén grote open ruimte met WC" },
    b: { label: "Met tussenmuur", desc: "Scheidingswand met deur, WC inbegrepen" },
  },
  base: {
    a: { label: "Casco", desc: "Lege ruimte, zelf in te delen" },
    b: { label: "Ingedeeld", desc: "Volledig ingedeelde layout" },
  },
};

export function FloorPlanSection({ config, updateConfig }: Props) {
  const plans = planOptions[config.model];

  return (
    <div className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Indeling</h3>
      <p className="text-sm text-muted-foreground mb-5">Kies je grondplan</p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {(["a", "b"] as const).map((plan) => (
          <button
            key={plan}
            onClick={() => updateConfig("floorPlan", plan)}
            className={cn("option-card text-left", config.floorPlan === plan && "option-card-active")}
          >
            <p className="font-semibold text-sm mb-1">{plans[plan].label}</p>
            <p className="text-xs text-muted-foreground">{plans[plan].desc}</p>
          </button>
        ))}
      </div>

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

      {/* Door position swap toggle (HUB only) */}
      {config.model === "hub" && (
        <div className="option-card flex items-center justify-between mt-4">
          <div>
            <p className="text-sm font-medium">Deur positie</p>
            <p className="text-xs text-muted-foreground">Verplaats de deur naar de voorgevel</p>
          </div>
          <button
            onClick={() => updateConfig("hubDoorSwap", !config.hubDoorSwap)}
            className={cn(
              "w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-3",
              config.hubDoorSwap ? "bg-accent" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform duration-200",
              config.hubDoorSwap ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>
      )}

      {/* Kitchen toggle (BASE Plan B only) */}
      {config.model === "base" && config.floorPlan === "b" && (
        <div className="option-card flex items-center justify-between mt-4">
          <div>
            <p className="text-sm font-medium">Keuken</p>
            <p className="text-xs text-muted-foreground">Voeg een keuken toe tegen de toiletmuur</p>
          </div>
          <button
            onClick={() => updateConfig("hasKitchen", !config.hasKitchen)}
            className={cn(
              "w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-3",
              config.hasKitchen ? "bg-accent" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform duration-200",
              config.hasKitchen ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>
      )}
    </div>
  );
}
