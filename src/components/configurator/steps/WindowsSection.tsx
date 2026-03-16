import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  onPriceClick?: () => void;
}

const countOptions: { value: 0 | 1 | 2; label: string }[] = [
  { value: 0, label: "0" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
];

export function WindowsSection({ config, updateConfig, onPriceClick }: Props) {
  const isFlow = config.model === "flow";
  const isHub = config.model === "hub";
  const useNumericSelector = isFlow || isHub;
  const perUnitPrice = isFlow ? "150" : "180";

  return (
    <div className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Ramen</h3>
      <p className="text-sm text-muted-foreground mb-5">Upgrade je raamtype</p>

      <div className="option-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Kiepraam</p>
            <p className="text-xs text-muted-foreground">Upgrade naar kiepramen voor betere ventilatie</p>
            {useNumericSelector ? (
              <div className="flex items-center gap-0.5 mt-1">
                <BlurredPrice text={perUnitPrice} revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium text-accent" prefix="+€" />
                <span className="text-xs text-muted-foreground">/stuk</span>
              </div>
            ) : (
              <BlurredPrice text="180" revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium text-accent mt-1" prefix="+€" />
            )}
          </div>
          {useNumericSelector ? (
            <div className="flex gap-1.5 ml-3">
              {countOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => updateConfig("tiltTurnWindow", o.value)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150 border",
                    config.tiltTurnWindow === o.value
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-secondary text-foreground border-border hover:border-accent/40"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => updateConfig("tiltTurnWindow", config.tiltTurnWindow ? 0 : 1)}
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
          )}
        </div>
      </div>
    </div>
  );
}
