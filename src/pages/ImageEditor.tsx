import { useState } from "react";
import { Check, X, ImageIcon } from "lucide-react";

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

// Map of all currently available images
// Key format: model:plan:finishLevel:floor:kast
// For casco: model:plan:shell
// For instapklaar: model:plan:finished:floor
// For volledig: model:plan:fully-finished:floor:kast
type ImageEntry = { img1: string | null; img2: string | null };

function getImages(model: Model, plan: Plan, finish: string, floor?: Floor, kast?: Kast): ImageEntry {
  // Only START has images for now
  if (model !== "start") return { img1: null, img2: null };

  if (finish === "shell") {
    if (plan === "a") return { img1: cascoImg1, img2: cascoImg2 };
    if (plan === "b") return { img1: cascoToiletImg1, img2: cascoToiletImg2 };
  }

  if (finish === "finished") {
    if (plan === "a") {
      if (floor === "light-vinyl") return { img1: instapklaarImg1, img2: instapklaarImg2 };
      if (floor === "dark-vinyl") return { img1: darkFinished2, img2: darkFinished1 };
      if (floor === "stone-vinyl") return { img1: stoneFinished1, img2: stoneFinished2 };
    }
    if (plan === "b") {
      if (floor === "light-vinyl") return { img1: toiletInstapklaar1, img2: toiletInstapklaar2 };
      // dark & stone toilet finished: not yet uploaded
    }
  }

  if (finish === "fully-finished") {
    if (plan === "a") {
      if (floor === "light-vinyl") {
        if (kast === "brown") return { img1: brownImg1, img2: furnishedShared };
        if (kast === "light-oak") return { img1: lightoakImg1, img2: furnishedShared };
        if (kast === "white") return { img1: whiteImg1, img2: furnishedShared };
      }
      if (floor === "dark-vinyl") {
        if (kast === "brown") return { img1: darkBrown2, img2: darkBrown1 };
        if (kast === "light-oak") return { img1: darkLightoak1, img2: darkLightoak2 };
        if (kast === "white") return { img1: darkWhite2, img2: darkWhite1 };
      }
      if (floor === "stone-vinyl") {
        if (kast === "brown") return { img1: stoneBrown2, img2: stoneBrown1 };
        if (kast === "light-oak") return { img1: stoneLightoak2, img2: stoneLightoak1 };
        if (kast === "white") return { img1: stoneWhite2, img2: stoneWhite1 };
      }
    }
    if (plan === "b") {
      if (floor === "light-vinyl") {
        if (kast === "brown") return { img1: toiletBrown1, img2: toiletBrown2 };
        if (kast === "light-oak") return { img1: toiletLightoak1, img2: toiletLightoak2 };
        if (kast === "white") return { img1: toiletWhite1, img2: toiletWhite2 };
      }
      // dark & stone toilet fully-finished: not yet uploaded
    }
  }

  return { img1: null, img2: null };
}

function ImageSlot({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="relative rounded-lg border border-border overflow-hidden bg-muted aspect-[4/3] flex items-center justify-center">
      {src ? (
        <img src={src} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <ImageIcon className="w-6 h-6" />
          <span className="text-[10px]">Missing</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ has }: { has: boolean }) {
  if (has) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-medium">
        <Check className="w-3 h-3" /> 2/2
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-medium">
      <X className="w-3 h-3" /> Missing
    </span>
  );
}

function CombinationRow({ model, plan, finish, floor, kast }: {
  model: Model; plan: Plan; finish: string; floor?: Floor; kast?: Kast;
}) {
  const { img1, img2 } = getImages(model, plan, finish, floor, kast);
  const hasAll = !!img1 && !!img2;

  const labelParts: string[] = [];
  if (finish === "shell") labelParts.push("Casco");
  if (finish === "finished") labelParts.push("Instapklaar");
  if (finish === "fully-finished") labelParts.push("Volledig ingericht");
  if (floor) {
    const floorLabel = floors.find(f => f.id === floor)?.label ?? floor;
    labelParts.push(floorLabel);
  }
  if (kast) {
    const kastLabel = kastColors.find(k => k.id === kast)?.label ?? kast;
    labelParts.push(kastLabel);
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-foreground truncate">{labelParts.join(" · ")}</p>
          <StatusBadge has={hasAll} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ImageSlot src={img1} label="Image 1" />
          <ImageSlot src={img2} label="Image 2" />
        </div>
      </div>
    </div>
  );
}

export default function ImageEditor() {
  const [selectedModel, setSelectedModel] = useState<Model>("start");
  const [selectedPlan, setSelectedPlan] = useState<Plan>("a");

  // Build the combinations list
  const combinations: React.ReactNode[] = [];

  // 1. Casco — 1 combo, no floor/kast
  combinations.push(
    <CombinationRow key="shell" model={selectedModel} plan={selectedPlan} finish="shell" />
  );

  // 2. Instapklaar — 3 combos (per floor)
  for (const floor of floors) {
    combinations.push(
      <CombinationRow key={`finished-${floor.id}`} model={selectedModel} plan={selectedPlan} finish="finished" floor={floor.id} />
    );
  }

  // 3. Volledig ingericht — 9 combos (3 floors × 3 kast colors)
  for (const floor of floors) {
    for (const kast of kastColors) {
      combinations.push(
        <CombinationRow key={`full-${floor.id}-${kast.id}`} model={selectedModel} plan={selectedPlan} finish="fully-finished" floor={floor.id} kast={kast.id} />
      );
    }
  }

  // Count totals
  const totalSlots = (1 + 3 + 9) * 2; // 13 combos × 2 images
  let filledSlots = 0;
  // Casco
  const cascoImgs = getImages(selectedModel, selectedPlan, "shell");
  if (cascoImgs.img1) filledSlots++;
  if (cascoImgs.img2) filledSlots++;
  for (const floor of floors) {
    const fi = getImages(selectedModel, selectedPlan, "finished", floor.id);
    if (fi.img1) filledSlots++;
    if (fi.img2) filledSlots++;
    for (const kast of kastColors) {
      const fu = getImages(selectedModel, selectedPlan, "fully-finished", floor.id, kast.id);
      if (fu.img1) filledSlots++;
      if (fu.img2) filledSlots++;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Interior Image Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of all interior image combinations per BLOQ model
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
            <p className="text-sm font-bold text-foreground">{filledSlots}/{totalSlots} images</p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(filledSlots / totalSlots) * 100}%` }}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <Section title="Casco" count="1 combinatie">
            <CombinationRow model={selectedModel} plan={selectedPlan} finish="shell" />
          </Section>

          <Section title="Instapklaar" count="3 combinaties (per vloer)">
            {floors.map((floor) => (
              <CombinationRow key={floor.id} model={selectedModel} plan={selectedPlan} finish="finished" floor={floor.id} />
            ))}
          </Section>

          <Section title="Volledig ingericht" count="9 combinaties (3 vloeren × 3 kastkleuren)">
            {floors.map((floor) => (
              <div key={floor.id}>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-3 mb-1">
                  {floors.find(f => f.id === floor.id)?.label}
                </p>
                {kastColors.map((kast) => (
                  <CombinationRow key={`${floor.id}-${kast.id}`} model={selectedModel} plan={selectedPlan} finish="fully-finished" floor={floor.id} kast={kast.id} />
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
