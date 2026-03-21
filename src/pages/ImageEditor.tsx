import { useState, useRef, useCallback, useEffect } from "react";
import { Check, X, ImageIcon, Upload, Trash2, RefreshCw, Camera, Euro } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PriceEditor } from "@/components/editor/PriceEditor";

type EditorTab = "photos" | "prices";
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

interface ImageRecord {
  id: string;
  model: string;
  plan: string;
  finish_level: string;
  floor_option: string | null;
  kast_color: string | null;
  image1_url: string | null;
  image2_url: string | null;
}

function makeKey(model: string, plan: string, finish: string, floor?: string, kast?: string): string {
  return [model, plan, finish, floor ?? "", kast ?? ""].join(":");
}

function ImageSlot({
  src,
  label,
  onReplace,
  onDelete,
  uploading,
}: {
  src: string | null;
  label: string;
  onReplace: (file: File) => void;
  onDelete: () => void;
  uploading?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onReplace(file);
    e.target.value = "";
  };

  return (
    <div className="relative group rounded-lg border border-border overflow-hidden bg-muted aspect-[4/3] flex items-center justify-center">
      {uploading && (
        <div className="absolute inset-0 z-20 bg-background/80 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
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
              onClick={onDelete}
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
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-medium">
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
  model, plan, finish, floor, kast, record, onUpload, onDeleteImage,
}: {
  model: Model; plan: Plan; finish: string; floor?: Floor; kast?: Kast;
  record: ImageRecord | undefined;
  onUpload: (model: string, plan: string, finish: string, floor: string | null, kast: string | null, slot: 1 | 2, file: File) => void;
  onDeleteImage: (model: string, plan: string, finish: string, floor: string | null, kast: string | null, slot: 1 | 2) => void;
}) {
  const src1 = record?.image1_url ?? null;
  const src2 = record?.image2_url ?? null;
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
        <ImageSlot
          src={src1}
          label="Image 1"
          onReplace={(file) => onUpload(model, plan, finish, floor ?? null, kast ?? null, 1, file)}
          onDelete={() => onDeleteImage(model, plan, finish, floor ?? null, kast ?? null, 1)}
        />
        <ImageSlot
          src={src2}
          label="Image 2"
          onReplace={(file) => onUpload(model, plan, finish, floor ?? null, kast ?? null, 2, file)}
          onDelete={() => onDeleteImage(model, plan, finish, floor ?? null, kast ?? null, 2)}
        />
      </div>
    </div>
  );
}

export default function ImageEditor() {
  const [activeTab, setActiveTab] = useState<EditorTab>("photos");
  const [selectedModel, setSelectedModel] = useState<Model>("start");
  const [selectedPlan, setSelectedPlan] = useState<Plan>("a");
  const [records, setRecords] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("interior_images")
      .select("*")
      .eq("model", selectedModel)
      .eq("plan", selectedPlan);
    if (error) {
      toast.error("Failed to load images");
      console.error(error);
    } else {
      setRecords((data as ImageRecord[]) ?? []);
    }
    setLoading(false);
  }, [selectedModel, selectedPlan]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const getRecord = (finish: string, floor?: Floor, kast?: Kast) => {
    return records.find(r =>
      r.finish_level === finish &&
      (r.floor_option ?? "") === (floor ?? "") &&
      (r.kast_color ?? "") === (kast ?? "")
    );
  };

  const handleUpload = useCallback(async (
    model: string, plan: string, finish: string,
    floor: string | null, kast: string | null,
    slot: 1 | 2, file: File,
  ) => {
    const ext = file.name.split(".").pop() ?? "avif";
    const path = `${model}/${plan}-${finish}-${floor ?? "none"}-${kast ?? "none"}-${slot}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("interior-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed");
      console.error(uploadError);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("interior-images")
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;
    const field = slot === 1 ? "image1_url" : "image2_url";

    const existing = getRecord(finish, floor as Floor | undefined, kast as Kast | undefined);

    if (existing) {
      await supabase
        .from("interior_images")
        .update({ [field]: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("interior_images")
        .insert({
          model, plan, finish_level: finish,
          floor_option: floor, kast_color: kast,
          [field]: publicUrl,
        });
    }

    toast.success("Image uploaded!");
    fetchRecords();
  }, [records, fetchRecords]);

  const handleDeleteImage = useCallback(async (
    model: string, plan: string, finish: string,
    floor: string | null, kast: string | null, slot: 1 | 2,
  ) => {
    const existing = getRecord(finish, floor as Floor | undefined, kast as Kast | undefined);
    if (!existing) return;

    const field = slot === 1 ? "image1_url" : "image2_url";
    await supabase
      .from("interior_images")
      .update({ [field]: null, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    toast.success("Image removed");
    fetchRecords();
  }, [records, fetchRecords]);

  let filled = 0;
  const total = (1 + 3 + 9) * 2;
  for (const r of records) {
    if (r.image1_url) filled++;
    if (r.image2_url) filled++;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Editor</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border mb-8">
          <button
            onClick={() => setActiveTab("photos")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "photos"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="w-4 h-4" />
            Foto's
          </button>
          <button
            onClick={() => setActiveTab("prices")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "prices"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Euro className="w-4 h-4" />
            Prijzen
          </button>
        </div>

        {activeTab === "prices" ? (
          <PriceEditor />
        ) : (
          <>
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

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <div className="space-y-6">
            <Section title="Casco" count="1 combinatie">
              <CombinationRow model={selectedModel} plan={selectedPlan} finish="shell" record={getRecord("shell")} onUpload={handleUpload} onDeleteImage={handleDeleteImage} />
            </Section>

            <Section title="Instapklaar" count="3 combinaties (per vloer)">
              {floors.map((floor) => (
                <CombinationRow key={floor.id} model={selectedModel} plan={selectedPlan} finish="finished" floor={floor.id} record={getRecord("finished", floor.id)} onUpload={handleUpload} onDeleteImage={handleDeleteImage} />
              ))}
            </Section>

            <Section title="Volledig ingericht" count="9 combinaties (3 vloeren × 3 kastkleuren)">
              {floors.map((floor) => (
                <div key={floor.id}>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-3 mb-1">
                    {floor.label}
                  </p>
                  {kastColors.map((kast) => (
                    <CombinationRow key={`${floor.id}-${kast.id}`} model={selectedModel} plan={selectedPlan} finish="fully-finished" floor={floor.id} kast={kast.id} record={getRecord("fully-finished", floor.id, kast.id)} onUpload={handleUpload} onDeleteImage={handleDeleteImage} />
                  ))}
                </div>
              ))}
            </Section>
          </div>
        )}
          </>
        )}
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
