import { motion } from "framer-motion";
import { arePricesHidden } from "./BlurredPrice";

interface PriceSummaryProps {
  totalPrice: number;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
}

export function PriceSummary({ totalPrice, currentStep, totalSteps, onNext, onPrev }: PriceSummaryProps) {
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="border-t border-border bg-card p-4 sm:p-6">
      {!arePricesHidden() && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="config-label">Price indication</p>
            <motion.p
              key={totalPrice}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-display font-bold text-foreground"
            >
              €{totalPrice.toLocaleString("nl-NL")}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-0.5">excl. VAT · indicative</p>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        {!isFirstStep && (
          <button
            onClick={onPrev}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={onNext}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isLastStep
              ? "bg-accent text-accent-foreground hover:opacity-90"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {isLastStep ? "Request quotation" : "Continue"}
        </button>
      </div>
    </div>
  );
}
