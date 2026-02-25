import { cn } from "@/lib/utils";
import type { ConfigState } from "@/hooks/useConfigurator";

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

interface Props {
  config: ConfigState;
  updateConfig: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void;
}

const spotOptions = [
  { id: "spot-wit" as const, label: "Spot wit", img: spotWit },
  { id: "spot-zwart" as const, label: "Spot zwart", img: spotZwart },
  { id: "opbouw-spot-wit" as const, label: "Opbouw spot wit", img: opbouwSpotWit },
  { id: "opbouw-spot-zwart" as const, label: "Opbouw spot zwart", img: opbouwSpotZwart },
];

const railOptions = [
  { id: "rail-vast-wit" as const, label: "Rail vast wit", img: railVastWit },
  { id: "rail-vast-zwart" as const, label: "Rail vast zwart", img: railVastZwart },
  { id: "rail-wit-hangend" as const, label: "Rail wit hangend", img: railWitHangend },
  { id: "rail-zwart-hangend" as const, label: "Rail zwart hangend", img: railZwartHangend },
];

const toiletOptions = [
  { id: "wc-spot-wit" as const, label: "WC spot wit", img: wcSpotWit },
  { id: "wc-spot-zwart" as const, label: "WC spot zwart", img: wcSpotZwart },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-3",
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

function ImageGrid<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { id: T; label: string; img: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  // Desktop: all side-by-side. Mobile: 2-col grid
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onSelect(o.id)}
          className={cn("option-card text-center p-2", selected === o.id && "option-card-active")}
        >
          <div className="aspect-square rounded-lg overflow-hidden mb-2">
            <img src={o.img} alt={o.label} className="w-full h-full object-cover" />
          </div>
          <p className="text-xs font-medium">{o.label}</p>
        </button>
      ))}
    </div>
  );
}

export function LightingSection({ config, updateConfig }: Props) {
  const isFlow = config.model === "flow";

  return (
    <div>
      <h3 className="text-xl font-display font-light mb-1">Verlichting</h3>
      <p className="text-sm text-muted-foreground mb-8">Kies je verlichtingsarmaturen</p>

      {/* Spots */}
      <div className="mb-14">
        <p className="config-label mb-4">Spots</p>
        <ImageGrid
          options={spotOptions}
          selected={config.spotType}
          onSelect={(id) => updateConfig("spotType", id)}
        />
      </div>

      {/* Rail */}
      <div className="mb-14">
        <p className="config-label mb-4">Railverlichting</p>
        <ImageGrid
          options={railOptions}
          selected={config.railType}
          onSelect={(id) => updateConfig("railType", id)}
        />
      </div>

      {/* Toiletlamp */}
      <div className="mb-14">
        <p className="config-label mb-4">Toiletlamp</p>
        <ImageGrid
          options={toiletOptions}
          selected={config.toiletLamp}
          onSelect={(id) => updateConfig("toiletLamp", id)}
        />
      </div>

      {/* LED strips — only for FLOW */}
      {isFlow && (
        <div className="space-y-4">
          <p className="config-label mb-4">LED-strips</p>

          <div className="option-card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Keuken LED-strip</p>
              <p className="text-xs text-muted-foreground">LED-strip onder keukenkastjes</p>
              <p className="text-xs font-medium text-accent mt-1">+€350</p>
            </div>
            <Toggle on={config.keukenLedStrip} onToggle={() => updateConfig("keukenLedStrip", !config.keukenLedStrip)} />
          </div>

          <div className="option-card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Kast LED-strip</p>
              <p className="text-xs text-muted-foreground">LED-strips achter kastplanken</p>
              <p className="text-xs font-medium text-accent mt-1">+€300</p>
            </div>
            <Toggle on={config.kastLedStrip} onToggle={() => updateConfig("kastLedStrip", !config.kastLedStrip)} />
          </div>
        </div>
      )}
    </div>
  );
}
