import { motion } from "framer-motion";
import { Send, Link2, Phone } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";
import { toast } from "sonner";

interface Props {
  config: ConfigState;
  updateContact: (field: keyof ConfigState["contact"], value: string) => void;
  totalPrice: number;
}

const fields: { key: keyof ConfigState["contact"]; label: string; type: string; required: boolean; half?: boolean }[] = [
  { key: "firstName", label: "First name", type: "text", required: true, half: true },
  { key: "lastName", label: "Last name", type: "text", required: true, half: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Phone", type: "tel", required: true },
  { key: "company", label: "Company (optional)", type: "text", required: false },
  { key: "address", label: "Installation address", type: "text", required: true },
];

export function ContactForm({ config, updateContact, totalPrice }: Props) {
  const handleSubmit = () => {
    const c = config.contact;
    if (!c.firstName || !c.email || !c.phone || !c.address) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Your configuration request has been submitted!");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Contact & prijsindicatie</h3>
      <p className="text-sm text-muted-foreground mb-6">Vul je gegevens in voor een gedetailleerde offerte</p>

      <div className="bg-surface rounded-xl p-4 mb-6">
        <p className="config-label">Your price indication</p>
        <p className="text-2xl font-display font-bold mt-1">€{totalPrice.toLocaleString("nl-NL")}</p>
        <p className="text-xs text-muted-foreground mt-1">excl. VAT · subject to final configuration review</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key} className={f.half ? "col-span-1" : "col-span-2"}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
            <input
              type={f.type}
              value={config.contact[f.key]}
              onChange={(e) => updateContact(f.key, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <button
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
          Request quotation
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Save link
          </button>
          <button
            onClick={() => toast.info("Our team will contact you shortly")}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface transition-colors"
          >
            <Phone className="w-4 h-4" />
            Contact us
          </button>
        </div>
      </div>
    </motion.div>
  );
}
