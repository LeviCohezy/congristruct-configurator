import { useState, useRef, useCallback, useEffect } from "react";
import { Check, X, ImageIcon, Upload, Trash2 } from "lucide-react";

// Import all existing interior images to check availability
import brownImg1 from "@/assets/start-interior-brown-1.avif";
import lightoakImg1 from "@/assets/start-interior-lightoak-1.avif";
import whiteImg1 from "@/assets/start-interior-white-1.avif";
import instapklaarImg1 from "@/assets/start-interior-instapklaar-1.avif";
import instapklaarImg2 from "@/assets/start-interior-instapklaar-2.avif";
import furnishedShared from "@/assets/start-interior-furnished-shared.avif";
import cascoImg1 from "@/assets/start-interior-casco-1.avif";
import cascoImg2 from "@/assets/start-interior-casco-2.avif";
import cascoToiletImg1 from "@/assets/start-interior-casco-toilet-1.avif";
import cascoToiletImg2 from "@/assets/start-interior-casco-toilet-2.avif";
import toiletBrown1 from "@/assets/start-interior-toilet-brown-1.avif";
import toiletBrown2 from "@/assets/start-interior-toilet-brown-2.avif";
import toiletLightoak1 from "@/assets/start-interior-toilet-lightoak-1.avif";
import toiletLightoak2 from "@/assets/start-interior-toilet-lightoak-2.avif";
import toiletWhite1 from "@/assets/start-interior-toilet-white-1.avif";
import toiletWhite2 from "@/assets/start-interior-toilet-white-2.avif";
import toiletInstapklaar1 from "@/assets/start-interior-toilet-instapklaar-1.avif";
import toiletInstapklaar2 from "@/assets/start-interior-toilet-instapklaar-2.avif";
import darkFinished1 from "@/assets/start-interior-darkfloor-finished-1.png";
import darkFinished2 from "@/assets/start-interior-darkfloor-finished-2.png";
import darkBrown1 from "@/assets/start-interior-darkfloor-brown-1.png";
import darkBrown2 from "@/assets/start-interior-darkfloor-brown-2.png";
import darkLightoak1 from "@/assets/start-interior-darkfloor-lightoak-1.png";
import darkLightoak2 from "@/assets/start-interior-darkfloor-lightoak-2.png";
import darkWhite1 from "@/assets/start-interior-darkfloor-white-1.png";
import darkWhite2 from "@/assets/start-interior-darkfloor-white-2.png";
import stoneFinished1 from "@/assets/start-interior-stonefloor-finished-1.png";
import stoneFinished2 from "@/assets/start-interior-stonefloor-finished-2.png";
import stoneBrown1 from "@/assets/start-interior-stonefloor-brown-1.png";
import stoneBrown2 from "@/assets/start-interior-stonefloor-brown-2.png";
import stoneLightoak1 from "@/assets/start-interior-stonefloor-lightoak-1.png";
import stoneLightoak2 from "@/assets/start-interior-stonefloor-lightoak-2.png";
import stoneWhite1 from "@/assets/start-interior-stonefloor-white-1.png";
import stoneWhite2 from "@/assets/start-interior-stonefloor-white-2.png";

type Model = "start" | "flow" | "hub" | "base";
type Plan = "a" | "b";
type Floor = "light-vinyl" | "dark-vinyl" | "stone-vinyl";
type Kast = "brown" | "light-oak" | "white";

const models: { id: Model; label: string }[] = [
  { id: "start", label: "BLOQ START" },
  { id: "flow", label: "BLOQ FLOW" },
  { id: "hub", label: "BLOQ HUB" },
  { id: "base", label: "BLOQ BASE" },
];

const plans: { id: Plan; label: string }[] = [
  { id: "a", label: "Plan A (open)" },
  { id: "b", label: "Plan B (toilet)" },
];

const floors: { id: Floor; label: string }[] = [
  { id: "light-vinyl", label: "Licht hout" },
  { id: "dark-vinyl", label: "Donker hout" },
  { id: "stone-vinyl", label: "Steenlook" },
];

const kastColors: { id: Kast; label: string }[] = [
  { id: "brown", label: "Walnoot bruin" },
  { id: "light-oak", label: "Licht eiken" },
  { id: "white", label: "Wit" },
];

function makeKey(model: Model, plan: Plan, finish: string, floor?: Floor, kast?: Kast): string {
  return [model, plan, finish, floor ?? "", kast ?? ""].join(":");
}

function getDefaultImage(model: Model, plan: Plan, finish: string, floor?: Floor, kast?: Kast, slot?: 1 | 2): string | null {
  if (model !== "start") return null;

  if (finish === "shell") {
    if (plan === "a") return slot === 1 ? cascoImg1 : cascoImg2;
    if (plan === "b") return slot === 1 ? cascoToiletImg1 : cascoToiletImg2;
  }
  if (finish === "finished") {
    if (plan === "a") {
      if (floor === "light-vinyl") return slot === 1 ? instapklaarImg1 : instapklaarImg2;
      if (floor === "dark-vinyl") return slot === 1 ? darkFinished2 : darkFinished1;
      if (floor === "stone-vinyl") return slot === 1 ? stoneFinished1 : stoneFinished2;
    }
    if (plan === "b") {
      if (floor === "light-vinyl") return slot === 1 ? toiletInstapklaar1 : toiletInstapklaar2;
    }
  }
  if (finish === "fully-finished") {
    if (plan === "a") {
      if (floor === "light-vinyl") {
        if (kast === "brown") return slot === 1 ? brownImg1 : furnishedShared;
        if (kast === "light-oak") return slot === 1 ? lightoakImg1 : furnishedShared;
        if (kast === "white") return slot === 1 ? whiteImg1 : furnishedShared;
      }
      if (floor === "dark-vinyl") {
        if (kast === "brown") return slot === 1 ? darkBrown2 : darkBrown1;
        if (kast === "light-oak") return slot === 1 ? darkLightoak1 : darkLightoak2;
        if (kast === "white") return slot === 1 ? darkWhite2 : darkWhite1;
      }
      if (floor === "stone-vinyl") {
        if (kast === "brown") return slot === 1 ? stoneBrown2 : stoneBrown1;
        if (kast === "light-oak") return slot === 1 ? stoneLightoak2 : stoneLightoak1;
        if (kast === "white") return slot === 1 ? stoneWhite2 : stoneWhite1;
      }
    }
    if (plan === "b") {
      if (floor === "light-vinyl") {
        if (kast === "brown") return slot === 1 ? toiletBrown1 : toiletBrown2;
        if (kast === "light-oak") return slot === 1 ? toiletLightoak1 : toiletLightoak2;
        if (kast === "white") return slot === 1 ? toiletWhite1 : toiletWhite2;
      }
    }
  }
  return null;
}

// Overrides stored in localStorage
const STORAGE_KEY = "bloq-image-overrides";

function loadOverrides(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function ImageSlot({
  src,
  label,
  slotKey,
  onReplace,
  onDelete,
}: {
  src: string | null;
  label: string;
  slotKey: string;
  onReplace: (key: string, dataUrl: string) => void;
  onDelete: (key: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onReplace(slotKey, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="relative group rounded-lg border border-border overflow-hidden bg-muted aspect-[4/3] flex items-center justify-center">
      {src ? (
        <>
          <img src={src} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => fileRef.current?.click()}
              className="p-2 rounded-full bg-card/90 text-foreground hover:bg-card transition-colors"
              title="Replace"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(slotKey)}
              className="p-2 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Upload className="w-6 h-6" />
          <span className="text-[10px] font-medium">Upload</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

function StatusBadge({ count }: { count: number }) {
  if (count === 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-medium">
        <Check className="w-3 h-3" /> 2/2
      </span>
    );
  }
  if (count === 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 text-[10px] font-medium">
        1/2
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-medium">
      <X className="w-3 h-3" /> 0/2
    </span>
  );
}

function CombinationRow({
  model, plan, finish, floor, kast, overrides, onReplace, onDelete,
}: {
  model: Model; plan: Plan; finish: string; floor?: Floor; kast?: Kast;
  overrides: Record<string, string>;
  onReplace: (key: string, dataUrl: string) => void;
  onDelete: (key: string) => void;
}) {
  const key1 = makeKey(model, plan, finish, floor, kast) + ":1";
  const key2 = makeKey(model, plan, finish, floor, kast) + ":2";

  const img1 = overrides[key1] ?? getDefaultImage(model, plan, finish, floor, kast, 1);
  const img2 = overrides[key2] ?? getDefaultImage(model, plan, finish, floor, kast, 2);

  // Check for deleted markers
  const src1 = overrides[key1] === "__deleted__" ? null : img1;
  const src2 = overrides[key2] === "__deleted__" ? null : img2;

  const count = (src1 ? 1 : 0) + (src2 ? 1 : 0);

  const labelParts: string[] = [];
  if (finish === "shell") labelParts.push("Casco");
  if (finish === "finished") labelParts.push("Instapklaar");
  if (finish === "fully-finished") labelParts.push("Volledig ingericht");
  if (floor) labelParts.push(floors.find(f => f.id === floor)?.label ?? floor);
  if (kast) labelParts.push(kastColors.find(k => k.id === kast)?.label ?? kast);

  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-medium text-foreground truncate">{labelParts.join(" · ")}</p>
        <StatusBadge count={count} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ImageSlot src={src1} label="Image 1" slotKey={key1} onReplace={onReplace} onDelete={onDelete} />
        <ImageSlot src={src2} label="Image 2" slotKey={key2} onReplace={onReplace} onDelete={onDelete} />
      </div>
    </div>
  );
}

export default function ImageEditor() {
  const [selectedModel, setSelectedModel] = useState<Model>("start");
  const [selectedPlan, setSelectedPlan] = useState<Plan>("a");
  const [overrides, setOverrides] = useState<Record<string, string>>(loadOverrides);

  useEffect(() => {
    saveOverrides(overrides);
  }, [overrides]);

  const handleReplace = useCallback((key: string, dataUrl: string) => {
    setOverrides(prev => ({ ...prev, [key]: dataUrl }));
  }, []);

  const handleDelete = useCallback((key: string) => {
    setOverrides(prev => ({ ...prev, [key]: "__deleted__" }));
  }, []);

  // Count filled slots
  function countFilled() {
    let filled = 0;
    const total = (1 + 3 + 9) * 2;
    const combos = getCombos();
    for (const c of combos) {
      const k1 = makeKey(selectedModel, selectedPlan, c.finish, c.floor, c.kast) + ":1";
      const k2 = makeKey(selectedModel, selectedPlan, c.finish, c.floor, c.kast) + ":2";
      const s1 = overrides[k1] === "__deleted__" ? null : (overrides[k1] ?? getDefaultImage(selectedModel, selectedPlan, c.finish, c.floor, c.kast, 1));
      const s2 = overrides[k2] === "__deleted__" ? null : (overrides[k2] ?? getDefaultImage(selectedModel, selectedPlan, c.finish, c.floor, c.kast, 2));
      if (s1) filled++;
      if (s2) filled++;
    }
    return { filled, total };
  }

  function getCombos() {
    const combos: { finish: string; floor?: Floor; kast?: Kast }[] = [];
    combos.push({ finish: "shell" });
    for (const f of floors) combos.push({ finish: "finished", floor: f.id });
    for (const f of floors) for (const k of kastColors) combos.push({ finish: "fully-finished", floor: f.id, kast: k.id });
    return combos;
  }

  const { filled, total } = countFilled();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Interior Image Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all interior image combinations per BLOQ model. Hover images to replace or delete.
          </p>
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

        {/* Plan selector */}
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Plan</p>
          <div className="flex gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlan === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface border border-border text-foreground hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Coverage</p>
            <p className="text-sm font-bold text-foreground">{filled}/{total} images</p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(filled / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <Section title="Casco" count="1 combinatie">
            <CombinationRow model={selectedModel} plan={selectedPlan} finish="shell" overrides={overrides} onReplace={handleReplace} onDelete={handleDelete} />
          </Section>

          <Section title="Instapklaar" count="3 combinaties (per vloer)">
            {floors.map((floor) => (
              <CombinationRow key={floor.id} model={selectedModel} plan={selectedPlan} finish="finished" floor={floor.id} overrides={overrides} onReplace={handleReplace} onDelete={handleDelete} />
            ))}
          </Section>

          <Section title="Volledig ingericht" count="9 combinaties (3 vloeren × 3 kastkleuren)">
            {floors.map((floor) => (
              <div key={floor.id}>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-3 mb-1">
                  {floor.label}
                </p>
                {kastColors.map((kast) => (
                  <CombinationRow key={`${floor.id}-${kast.id}`} model={selectedModel} plan={selectedPlan} finish="fully-finished" floor={floor.id} kast={kast.id} overrides={overrides} onReplace={handleReplace} onDelete={handleDelete} />
                ))}
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-[11px] text-muted-foreground">{count}</p>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}
