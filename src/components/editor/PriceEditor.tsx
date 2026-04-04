import { useState, useEffect } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Model = "start" | "flow" | "hub" | "base";

const models: { id: Model; label: string }[] = [
  { id: "start", label: "BLOQ START" },
  { id: "flow", label: "BLOQ FLOW" },
  { id: "hub", label: "BLOQ HUB" },
  { id: "base", label: "BLOQ BASE" },
];

// Mirror the pricing structure from useConfigurator
interface ModelPrices {
  basePlanA: number;
  basePlanB: number;
  facades: {
    "thermowood-natural": number;
    "thermowood-black": number;
    "composite-white": number;
    "composite-black": number;
    aluminium: number;
    "brick-grey": number;
  };
  finishes: {
    shell: number;
    finished: number;
    "fully-finished": number;
  };
  shelves: {
    brown: number;
    "light-oak": number;
    white: number;
  };
  window: number;
  insulation: number;
  ledKeuken: number;
  ledKast: number;
  lightingPackage: number;
  heatPump: number;
  extraHeatPump: number;
  kitchen: number;
  roundedCorners: number;
  solarBattery: number;
  extraCloset: number;
}

const allPrices: Record<Model, ModelPrices> = {
  start: {
    basePlanA: 16700, basePlanB: 18470,
    facades: { "thermowood-natural": 0, "thermowood-black": 265, "composite-white": 335, "composite-black": 335, aluminium: 935, "brick-grey": 1335 },
    finishes: { shell: 0, finished: 3780, "fully-finished": 7500 },
    shelves: { brown: 160, "light-oak": 141, white: 0 },
    window: 180, insulation: 900, ledKeuken: 350, ledKast: 300,
    lightingPackage: 1500, heatPump: 2500, extraHeatPump: 1050,
    kitchen: 0, roundedCorners: 1500, solarBattery: 4500, extraCloset: 0,
  },
  flow: {
    basePlanA: 22550, basePlanB: 29470,
    facades: { "thermowood-natural": 0, "thermowood-black": 335, "composite-white": 335, "composite-black": 335, aluminium: 935, "brick-grey": 1335 },
    finishes: { shell: 0, finished: 6600, "fully-finished": 16180 },
    shelves: { brown: 330, "light-oak": 260, white: 0 },
    window: 300, insulation: 1450, ledKeuken: 150, ledKast: 530,
    lightingPackage: 1500, heatPump: 2500, extraHeatPump: 1050,
    kitchen: 0, roundedCorners: 1500, solarBattery: 4500, extraCloset: 0,
  },
  hub: {
    basePlanA: 31550, basePlanB: 32500,
    facades: { "thermowood-natural": 0, "thermowood-black": 475, "composite-white": 335, "composite-black": 335, aluminium: 935, "brick-grey": 1335 },
    finishes: { shell: 0, finished: 9900, "fully-finished": 16860 },
    shelves: { brown: 350, "light-oak": 200, white: 0 },
    window: 180, insulation: 1145, ledKeuken: 150, ledKast: 0,
    lightingPackage: 1990, heatPump: 3150, extraHeatPump: 1050,
    kitchen: 0, roundedCorners: 1500, solarBattery: 4500, extraCloset: 4000,
  },
  base: {
    basePlanA: 40985, basePlanB: 40985,
    facades: { "thermowood-natural": 0, "thermowood-black": 880, "composite-white": 335, "composite-black": 335, aluminium: 935, "brick-grey": 1335 },
    finishes: { shell: 0, finished: 12520, "fully-finished": 23420 },
    shelves: { brown: 590, "light-oak": 520, white: 0 },
    window: 180, insulation: 3050, ledKeuken: 150, ledKast: 50,
    lightingPackage: 3500, heatPump: 4400, extraHeatPump: 1095,
    kitchen: 595, roundedCorners: 1500, solarBattery: 4500, extraCloset: 0,
  },
};

const facadeLabels: Record<string, string> = {
  "thermowood-natural": "Thermowood Ayous",
  "thermowood-black": "Thermowood Zwart",
  "composite-white": "Composiet Wit",
  "composite-black": "Composiet Zwart",
  aluminium: "Aluminium",
  "brick-grey": "Steenstrips Grijs",
};

const finishLabels: Record<string, string> = {
  shell: "Casco",
  finished: "Instapklaar",
  "fully-finished": "Volledig ingericht",
};

const shelfLabels: Record<string, string> = {
  brown: "Walnoot bruin",
  "light-oak": "Licht eiken",
  white: "Wit",
};

function PriceField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-foreground/80">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">€</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          step={5}
        />
      </div>
    </div>
  );
}

function PriceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

export function PriceEditor() {
  const [selectedModel, setSelectedModel] = useState<Model>("start");
  const [prices, setPrices] = useState<Record<Model, ModelPrices>>(JSON.parse(JSON.stringify(allPrices)));

  const p = prices[selectedModel];

  const update = (path: string, value: number) => {
    setPrices((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Record<Model, ModelPrices>;
      const keys = path.split(".");
      let obj: any = next[selectedModel];
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = () => {
    // For now just show success - later this can persist to DB
    toast.success("Prijzen opgeslagen (lokaal)");
    console.log("Saved prices:", prices);
  };

  const [hidePrices, setHidePrices] = useState(() => {
    try {
      const stored = localStorage.getItem("bloq-hide-prices");
      if (stored === null) {
        localStorage.setItem("bloq-hide-prices", "true");
        return true;
      }
      return stored !== "false";
    } catch {
      return true;
    }
  });

  const toggleHidePrices = () => {
    const next = !hidePrices;
    setHidePrices(next);
    localStorage.setItem("bloq-hide-prices", String(next));
    toast.success(next ? "Prijzen verborgen in configurator" : "Prijzen zichtbaar in configurator");
  };

  return (
    <div>
      {/* Hide prices toggle */}
      <div className="mb-6 p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hidePrices ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-accent" />}
          <div>
            <p className="text-sm font-medium text-foreground">Prijzen in configurator</p>
            <p className="text-xs text-muted-foreground">{hidePrices ? "Verborgen voor bezoekers" : "Zichtbaar voor bezoekers"}</p>
          </div>
        </div>
        <button
          onClick={toggleHidePrices}
          className={`relative w-12 h-7 rounded-full transition-colors ${hidePrices ? "bg-muted" : "bg-accent"}`}
        >
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${hidePrices ? "left-0.5" : "left-[calc(100%-1.625rem)]"}`} />
        </button>
      </div>

      {/* Model selector */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Model</p>
        <div className="flex gap-2 flex-wrap">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedModel === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface border border-border text-foreground hover:bg-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <PriceSection title="🏗️ Basisprijs">
          <PriceField label="Plan A" value={p.basePlanA} onChange={(v) => update("basePlanA", v)} />
          <PriceField label="Plan B" value={p.basePlanB} onChange={(v) => update("basePlanB", v)} />
        </PriceSection>

        <PriceSection title="🧱 Gevelbekleding">
          {Object.entries(p.facades).map(([key, val]) => (
            <PriceField key={key} label={facadeLabels[key] ?? key} value={val} onChange={(v) => update(`facades.${key}`, v)} />
          ))}
        </PriceSection>

        <PriceSection title="🏠 Afwerkingsniveau">
          {Object.entries(p.finishes).map(([key, val]) => (
            <PriceField key={key} label={finishLabels[key] ?? key} value={val} onChange={(v) => update(`finishes.${key}`, v)} />
          ))}
        </PriceSection>

        <PriceSection title="🗄️ Kastkleur">
          {Object.entries(p.shelves).map(([key, val]) => (
            <PriceField key={key} label={shelfLabels[key] ?? key} value={val} onChange={(v) => update(`shelves.${key}`, v)} />
          ))}
        </PriceSection>

        <PriceSection title="🪟 Ramen & Bouw">
          <PriceField label="Kiepraam" value={p.window} onChange={(v) => update("window", v)} />
          <PriceField label="Afgeronde hoeken" value={p.roundedCorners} onChange={(v) => update("roundedCorners", v)} />
          <PriceField label="Houtvezelplaat" value={p.insulation} onChange={(v) => update("insulation", v)} />
        </PriceSection>

        <PriceSection title="💡 Verlichting">
          <PriceField label="Verlichtingspakket" value={p.lightingPackage} onChange={(v) => update("lightingPackage", v)} />
          <PriceField label="LED keuken" value={p.ledKeuken} onChange={(v) => update("ledKeuken", v)} />
          <PriceField label="LED kast/nis" value={p.ledKast} onChange={(v) => update("ledKast", v)} />
        </PriceSection>

        <PriceSection title="🌡️ Energie">
          <PriceField label="Warmtepomp" value={p.heatPump} onChange={(v) => update("heatPump", v)} />
          <PriceField label="Extra warmtepomp" value={p.extraHeatPump} onChange={(v) => update("extraHeatPump", v)} />
          <PriceField label="Zonnepanelen" value={p.solarBattery} onChange={(v) => update("solarBattery", v)} />
        </PriceSection>

        <PriceSection title="🧩 Extra opties">
          {p.kitchen > 0 && <PriceField label="Keuken" value={p.kitchen} onChange={(v) => update("kitchen", v)} />}
          {p.extraCloset > 0 && <PriceField label="Extra 6-deurs kast" value={p.extraCloset} onChange={(v) => update("extraCloset", v)} />}
        </PriceSection>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Save className="w-4 h-4" />
          Prijzen opslaan
        </button>
      </div>
    </div>
  );
}
