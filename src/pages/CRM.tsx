import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { RefreshCw, Eye, ArrowLeft, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface LineItem {
  name: string;
  option: string;
  price: number | null;
}

interface Submission {
  id: string;
  submission_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  model: string;
  status: string;
  line_items: LineItem[];
  total_price: number;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Nieuw", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Gecontacteerd", color: "bg-yellow-100 text-yellow-800" },
  { value: "quoted", label: "Offerte", color: "bg-purple-100 text-purple-800" },
  { value: "won", label: "Gewonnen", color: "bg-green-100 text-green-800" },
  { value: "lost", label: "Verloren", color: "bg-red-100 text-red-800" },
];

function statusBadge(status: string) {
  const s = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];
  return <Badge className={`${s.color} border-0 font-medium`}>{s.label}</Badge>;
}

function fmt(n: number) {
  return "€ " + n.toLocaleString("nl-NL");
}

export default function CRM() {
  const { session, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchSubmissions();
  }, [session]);

  async function fetchSubmissions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Fout bij laden van submissions");
      console.error(error);
    } else {
      setSubmissions((data as unknown as Submission[]) ?? []);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("submissions")
      .update({ status } as any)
      .eq("id", id);
    if (error) {
      toast.error("Status update mislukt");
    } else {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <a href="/editor"><ArrowLeft className="w-4 h-4" /></a>
            </Button>
            <h1 className="text-xl font-semibold text-foreground font-['Space_Grotesk']">CRM — Leads</h1>
            <Badge variant="secondary" className="ml-2">{submissions.length}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Vernieuwen
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Nog geen leads</p>
            <p className="text-sm mt-1">Configuratie-aanvragen verschijnen hier automatisch.</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefoon</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Totaal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(sub.created_at).toLocaleDateString("nl-BE", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell className="text-sm">{sub.email}</TableCell>
                    <TableCell className="text-sm">{sub.phone || "—"}</TableCell>
                    <TableCell className="text-sm">{sub.model}</TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">{fmt(sub.total_price)}</TableCell>
                    <TableCell>
                      <Select value={sub.status} onValueChange={(v) => updateStatus(sub.id, v)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setSelected(sub)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">
              Configuratie — {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p>{selected.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Telefoon</p>
                  <p>{selected.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Model</p>
                  <p>{selected.model}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  {statusBadge(selected.status)}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Onderdeel</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Keuze</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Prijs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.line_items ?? []).map((item, i) => {
                      const indented = item.name.startsWith("  ");
                      return (
                        <tr key={i} className="border-t border-border/50">
                          <td className={`px-3 py-1.5 ${indented ? "pl-6 text-muted-foreground text-xs" : ""}`}>
                            {indented ? `↳ ${item.name.trim()}` : item.name}
                          </td>
                          <td className="px-3 py-1.5">{item.option}</td>
                          <td className="px-3 py-1.5 text-right whitespace-nowrap">
                            {item.price != null ? fmt(item.price) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-foreground/20 font-semibold">
                      <td colSpan={2} className="px-3 py-2">Totaal (excl. BTW)</td>
                      <td className="px-3 py-2 text-right">{fmt(selected.total_price)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
