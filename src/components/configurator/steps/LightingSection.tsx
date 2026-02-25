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
  { id: "spot-wit" as const, tooltip: "Inbouwspot", img: spotWit },
  { id: "spot-zwart" as const, tooltip: "Inbouwspot", img: spotZwart },
  { id: "opbouw-spot-wit" as const, tooltip: "Opbouwspot", img: opbouwSpotWit },
  { id: "opbouw-spot-zwart" as const, tooltip: "Opbouwspot", img: opbouwSpotZwart },
];

const railOptions = [
  { id: "rail-vast-wit" as const, tooltip: "Vaste rail", img: railVastWit },
  { id: "rail-vast-zwart" as const, tooltip: "Vaste rail", img: railVastZwart },
  { id: "rail-wit-hangend" as const, tooltip: "Hangende rail", img: railWitHangend },
  { id: "rail-zwart-hangend" as const, tooltip: "Hangende rail", img: railZwartHangend },
];

const toiletOptions = [
  { id: "wc-spot-wit" as const, tooltip: "WC spot wit", img: wcSpotWit },
  { id: "wc-spot-zwart" as const, tooltip: "WC spot zwart", img: wcSpotZwart },
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
}: {
  options: { id: T; tooltip: string; img: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex gap-4 flex-wrap">
        {options.map((o) => (
          <Tooltip key={o.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelect(o.id)}
                className={cn(
                  "w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-150 cursor-pointer",
                  selected === o.id
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-border/60 bg-secondary hover:border-accent/40"
                )}
              >
                <img src={o.img} alt={o.tooltip} className="w-full h-full object-cover" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {o.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export function LightingSection({ config, updateConfig, onPriceClick }: Props) {
  const isFlow = config.model === "flow";

  return (
    <div>
      <h3 className="text-xl font-display font-light mb-1">Verlichting</h3>
      <p className="text-sm text-muted-foreground mb-8">Kies je verlichtingsarmaturen</p>

      {/* Spots */}
      <div className="mb-14">
        <p className="config-label mb-4">Spots</p>
        <CircleGrid
          options={spotOptions}
          selected={config.spotType}
          onSelect={(id) => updateConfig("spotType", id)}
        />
      </div>

      {/* Rail */}
      <div className="mb-14">
        <p className="config-label mb-4">Railverlichting</p>
        <CircleGrid
          options={railOptions}
          selected={config.railType}
          onSelect={(id) => updateConfig("railType", id)}
        />
      </div>

      {/* Toiletlamp */}
      <div className="mb-14">
        <p className="config-label mb-4">Toiletlamp</p>
        <CircleGrid
          options={toiletOptions}
          selected={config.toiletLamp}
          onSelect={(id) => updateConfig("toiletLamp", id)}
        />
      </div>

      {/* LED strips — only for FLOW */}
      {isFlow && (
        <div>
          <p className="config-label mb-4">LED-strips</p>
          <div className="grid grid-cols-1 gap-4">
            {/* Keuken LED */}
            <div className={cn(
              "flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-150",
              config.keukenLedStrip
                ? "border-accent bg-card ring-1 ring-accent/30"
                : "border-transparent bg-secondary"
            )}>
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
                <img src={keukenLedImg} alt="Keuken LED" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Keuken LED</p>
                <BlurredPrice text="350" revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium text-accent mt-0.5" prefix="+€" />
              </div>
              <Toggle on={config.keukenLedStrip} onToggle={() => updateConfig("keukenLedStrip", !config.keukenLedStrip)} />
            </div>

            {/* Kast LED */}
            <div className={cn(
              "flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-150",
              config.kastLedStrip
                ? "border-accent bg-card ring-1 ring-accent/30"
                : "border-transparent bg-secondary"
            )}>
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
                <img src={kastLedImg} alt="Kast LED" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Kast LED</p>
                <BlurredPrice text="300" revealed={config.priceRevealed} onClick={onPriceClick} className="text-xs font-medium text-accent mt-0.5" prefix="+€" />
              </div>
              <Toggle on={config.kastLedStrip} onToggle={() => updateConfig("kastLedStrip", !config.kastLedStrip)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
