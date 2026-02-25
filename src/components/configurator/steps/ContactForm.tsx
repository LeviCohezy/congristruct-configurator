import { motion } from "framer-motion";
import { Send } from "lucide-react";
import type { ConfigState } from "@/hooks/useConfigurator";
import { toast } from "sonner";
import { BlurredPrice } from "@/components/configurator/BlurredPrice";

interface Props {
  config: ConfigState;
  updateContact: (field: keyof ConfigState["contact"], value: string) => void;
  totalPrice: number;
  onPriceClick?: () => void;
}

const fields: { key: keyof ConfigState["contact"]; label: string; type: string }[] = [
  { key: "fullName", label: "Volledige naam", type: "text" },
  { key: "email", label: "E-mailadres", type: "email" },
];

export function ContactForm({ config, updateContact, totalPrice, onPriceClick }: Props) {
  const handleSubmit = () => {
    const c = config.contact;
    if (!c.fullName || !c.email) {
      toast.error("Vul alle velden in");
      return;
    }
    toast.success("Je configuratie-aanvraag is verstuurd!");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Contact</h3>
      <p className="text-sm text-muted-foreground mb-4">Laat je gegevens achter voor een gedetailleerde offerte</p>

      <div className="bg-surface rounded-xl p-4 mb-6">
        <p className="config-label">Jouw prijsindicatie</p>
        <BlurredPrice
          text={totalPrice.toLocaleString("nl-NL")}
          revealed={config.priceRevealed}
          onClick={onPriceClick}
          className="text-2xl font-display font-bold mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">excl. BTW · onder voorbehoud van finale configuratie</p>
      </div>

      <div className="grid gap-4 mb-6">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
            <input
              type={f.type}
              value={config.contact[f.key]}
              onChange={(e) => updateContact(f.key, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        <Send className="w-4 h-4" />
        Offerte aanvragen
      </button>
    </motion.div>
  );
}
