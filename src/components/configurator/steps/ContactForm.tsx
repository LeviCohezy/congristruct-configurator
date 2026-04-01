import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { useState } from "react";
import type { ConfigState } from "@/hooks/useConfigurator";
import { getConfigLineItems } from "@/hooks/useConfigSummary";
import { toast } from "sonner";
import { BlurredPrice, arePricesHidden } from "@/components/configurator/BlurredPrice";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  config: ConfigState;
  updateContact: (field: keyof ConfigState["contact"], value: string) => void;
  totalPrice: number;
  onPriceClick?: () => void;
}

const modelLabels: Record<string, string> = {
  start: "BLOQ Start",
  flow: "BLOQ Flow",
  hub: "BLOQ Hub",
  base: "BLOQ Base",
};

const fields: { key: keyof ConfigState["contact"]; label: string; type: string; placeholder?: string }[] = [
  { key: "fullName", label: "Volledige naam", type: "text", placeholder: "Jan Janssens" },
  { key: "email", label: "E-mailadres", type: "email", placeholder: "jan@voorbeeld.be" },
  { key: "phone", label: "Telefoonnummer", type: "tel", placeholder: "+32 470 00 00 00" },
];

export function ContactForm({ config, updateContact, totalPrice, onPriceClick }: Props) {
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    const c = config.contact;
    if (!c.fullName || !c.email) {
      toast.error("Vul alle velden in");
      return;
    }

    setSending(true);
    try {
      const lineItems = getConfigLineItems(config);
      const { data, error } = await supabase.functions.invoke("send-quote", {
        body: {
          lineItems,
          totalPrice,
          contact: c,
          model: modelLabels[config.model] || config.model,
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success("Je offerte-aanvraag is verstuurd!");
        // Push form submit event to GTM dataLayer
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          event: "quote_request",
          form_id: "configurator-form",
          model: modelLabels[config.model] || config.model,
          totalPrice,
        });
      } else {
        throw new Error(data?.error || "Verzenden mislukt");
      }
    } catch (err: unknown) {
      console.error("Quote send error:", err);
      toast.error("Er ging iets mis bij het verzenden. Probeer opnieuw.");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="config-section">
      <h3 className="text-xl font-display font-light mb-1">Contact</h3>
      <p className="text-sm text-muted-foreground mb-4">Laat je gegevens achter voor een gedetailleerde offerte</p>

      {!arePricesHidden() && (
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
      )}

      <div className="grid gap-4 mb-6">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
            <input
              type={f.type}
              value={config.contact[f.key]}
              onChange={(e) => updateContact(f.key, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? "Versturen..." : "Offerte aanvragen"}
      </button>
    </motion.div>
  );
}
