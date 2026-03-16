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
  return (
    <div className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Ramen</h3>
      <p className="text-sm text-muted-foreground mb-5">Upgrade je raamtype</p>

      <div className="option-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Kiepraam</p>
            <p className="text-xs text-muted-foreground">Upgrade naar kiepramen voor betere ventilatie</p>
            <BlurredPrice text="150" revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium text-accent mt-1" prefix="+€" suffix="/stuk" />
          </div>
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
        </div>
      </div>
    </div>
  );
}
