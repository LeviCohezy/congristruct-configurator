import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import spotWit from "@/assets/lighting-spot-wit.avif";
import spotZwart from "@/assets/lighting-spot-zwart.avif";
import opbouwSpotZwart from "@/assets/lighting-opbouw-spot-zwart.avif";
import opbouwSpotWit from "@/assets/lighting-opbouw-spot-wit.avif";
import railVastWit from "@/assets/lighting-rail-vast-wit.avif";
import railVastZwart from "@/assets/lighting-rail-vast-zwart.avif";
import railWitHangend from "@/assets/lighting-rail-wit-hangend.avif";
import railZwartHangend from "@/assets/lighting-rail-zwart-hangend.avif";
import wcSpotWit from "@/assets/lighting-wc-spot-wit.avif";
import wcSpotZwart from "@/assets/lighting-wc-spot-zwart.avif";
import keukenLedImg from "@/assets/lighting-keuken-led.avif";
import kastLedImg from "@/assets/lighting-kast-led.avif";

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
  onPriceClick?: () => void;
}

const spotOptions = [
  { id: "spot-wit" as const, label: "Inbouwspot wit", img: spotWit, price: 5 },
  { id: "spot-zwart" as const, label: "Inbouwspot zwart", img: spotZwart, price: 5 },
  { id: "opbouw-spot-wit" as const, label: "Opbouwspot wit", img: opbouwSpotWit, price: 10 },
  { id: "opbouw-spot-zwart" as const, label: "Opbouwspot zwart", img: opbouwSpotZwart, price: 10 },
];

const railOptions = [
  { id: "rail-vast-wit" as const, label: "Vaste rail wit", img: railVastWit, price: 5 },
  { id: "rail-vast-zwart" as const, label: "Vaste rail zwart", img: railVastZwart, price: 5 },
  { id: "rail-wit-hangend" as const, label: "Hangende rail wit", img: railWitHangend, price: 5 },
  { id: "rail-zwart-hangend" as const, label: "Hangende rail zwart", img: railZwartHangend, price: 5 },
];

const toiletOptions = [
  { id: "wc-spot-wit" as const, label: "WC spot wit", img: wcSpotWit, price: 0 },
  { id: "wc-spot-zwart" as const, label: "WC spot zwart", img: wcSpotZwart, price: 0 },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-11 h-6 rounded-full transition-all duration-200 relative shrink-0",
        on ? "bg-accent" : "bg-muted"
      )}
    >
      <span className={cn(
        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform duration-200",
        on ? "translate-x-5" : "translate-x-0"
      )} />
    </button>
  );
}

function CircleGrid<T extends string>({
  options,
  selected,
  onSelect,
  disabled,
  onDisabledClick,
  priceRevealed,
  onPriceClick,
}: {
  options: { id: T; label: string; img: string; price: number }[];
  selected: T;
  onSelect: (id: T) => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
  priceRevealed?: boolean;
  onPriceClick?: () => void;
}) {
  const selectedPrice = options.find((o) => o.id === selected)?.price ?? 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex gap-4 flex-wrap", disabled && "opacity-40")}>
        {options.map((o) => {
          const diff = o.price - selectedPrice;
          const diffLabel = o.id === selected
            ? o.label
            : diff === 0
              ? o.label
              : `${o.label} (${diff > 0 ? "+" : "-"}€${Math.abs(diff)})`;

          return (
            <Tooltip key={o.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (disabled) {
                      onDisabledClick?.();
                    } else {
                      onSelect(o.id);
                    }
                  }}
                  className={cn(
                    "w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-150",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                    !disabled && selected === o.id
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border/60 bg-secondary hover:border-accent/40"
                  )}
                >
                  <img src={o.img} alt={o.label} className="w-full h-full object-cover" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {disabled ? "Activeer eerst het verlichtingspakket" : diffLabel}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export function LightingSection({ config, updateConfig, onPriceClick }: Props) {
  const isFlow = config.model === "flow";
  const isHub = config.model === "hub";
  const packageOn = config.lightingPackage === "full";
  const hasToilet = config.floorPlan === "b";
  const [flickerCard, setFlickerCard] = useState(false);

  const packagePrice = isHub ? "1.990" : "1.500";
  const keukenPrice = (isFlow || isHub) ? "150" : "350";
  const kastPrice = isFlow ? "530" : "300";

  const handleDisabledClick = () => {
    setFlickerCard(true);
    setTimeout(() => setFlickerCard(false), 1500);
  };

  return (
    <div>
      <h3 className="text-xl font-display font-light mb-1">Verlichting</h3>
      <p className="text-sm text-muted-foreground mb-2">
        <span className="flex items-center gap-2">
          Verlichtingspunten inbegrepen
          <span className="text-xs text-muted-foreground/70">|</span>
          <BlurredPrice text={packagePrice} revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium" prefix="Verlichtingspakket +€" />
        </span>
      </p>

      {/* Lighting package toggle */}
      <div className={cn(
        "option-card flex items-center justify-between mb-8 transition-all duration-300",
        flickerCard && "flicker-border-green"
      )}>
        <div>
          <p className="text-sm font-medium">Verlichtingspakket</p>
          <p className="text-xs text-muted-foreground">Inclusief alle armaturen & installatie</p>
        </div>
        <Toggle
          on={packageOn}
          onToggle={() => {
            if (packageOn) {
              updateConfig("lightingPackage", "base");
              updateConfig("keukenLedStrip", false);
              updateConfig("kastLedStrip", false);
            } else {
              updateConfig("lightingPackage", "full");
            }
          }}
        />
      </div>

      {/* Spots */}
      <div className="mb-14">
        <p className="config-label mb-4">Spots</p>
        <CircleGrid
          options={spotOptions}
          selected={config.spotType}
          onSelect={(id) => updateConfig("spotType", id)}
          disabled={!packageOn}
          onDisabledClick={handleDisabledClick}
        />
      </div>

      {/* Rail */}
      <div className="mb-14">
        <p className="config-label mb-4">Railverlichting</p>
        <CircleGrid
          options={railOptions}
          selected={config.railType}
          onSelect={(id) => updateConfig("railType", id)}
          disabled={!packageOn}
          onDisabledClick={handleDisabledClick}
        />
      </div>

      {/* Toiletlamp — only when plan B (with toilet) */}
      {hasToilet && (
        <div className="mb-14">
          <p className="config-label mb-4">Toiletlamp</p>
          <CircleGrid
            options={toiletOptions}
            selected={config.toiletLamp}
            onSelect={(id) => updateConfig("toiletLamp", id)}
            disabled={!packageOn}
            onDisabledClick={handleDisabledClick}
          />
        </div>
      )}

      {/* LED strips — only for FLOW */}
      {isFlow && (
        <div>
          <p className="config-label mb-4">LED-strips</p>
          <div className="grid grid-cols-1 gap-4">
            <div className={cn(
              "flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-150",
              !packageOn && "opacity-40",
              config.keukenLedStrip
                ? "border-accent bg-card ring-1 ring-accent/30"
                : "border-transparent bg-secondary"
            )}
              onClick={() => !packageOn && handleDisabledClick()}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
                <img src={keukenLedImg} alt="Keuken LED" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Keuken LED</p>
                <BlurredPrice text={keukenPrice} revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium text-accent mt-0.5" prefix="+€" />
              </div>
              <Toggle
                on={config.keukenLedStrip}
                onToggle={() => packageOn && updateConfig("keukenLedStrip", !config.keukenLedStrip)}
              />
            </div>

            <div className={cn(
              "flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-150",
              !packageOn && "opacity-40",
              config.kastLedStrip
                ? "border-accent bg-card ring-1 ring-accent/30"
                : "border-transparent bg-secondary"
            )}
              onClick={() => !packageOn && handleDisabledClick()}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
                <img src={kastLedImg} alt="Kast LED" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Kast LED</p>
                <BlurredPrice text={kastPrice} revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium text-accent mt-0.5" prefix="+€" />
              </div>
              <Toggle
                on={config.kastLedStrip}
                onToggle={() => packageOn && updateConfig("kastLedStrip", !config.kastLedStrip)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
