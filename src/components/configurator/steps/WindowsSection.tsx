import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  onPriceClick?: () => void;
}

const windowPriceDisplay: Record<string, string> = {
  start: "180",
  flow: "300",
};

export function WindowsSection({ config, updateConfig, onPriceClick }: Props) {
  const priceText = windowPriceDisplay[config.model] ?? "180";
  return (
    <div className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Ramen</h3>
      <p className="text-sm text-muted-foreground mb-5">Upgrade je raamtype</p>

      <div className="option-card flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Kiepraam</p>
          <p className="text-xs text-muted-foreground">Upgrade naar kiepramen voor betere ventilatie</p>
          <BlurredPrice text={priceText} revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium text-accent mt-1" prefix="+€" />
        </div>
        <button
          onClick={() => updateConfig("tiltTurnWindow", !config.tiltTurnWindow)}
          className={cn(
            "w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-3",
            config.tiltTurnWindow ? "bg-accent" : "bg-muted"
          )}
        >
          <span className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform duration-200",
            config.tiltTurnWindow ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
      </div>
    </div>
  );
}
