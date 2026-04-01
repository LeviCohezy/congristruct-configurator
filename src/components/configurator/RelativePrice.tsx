import { BlurredPrice, arePricesHidden } from "./BlurredPrice";

interface Props {
  /** Numeric prices keyed by option id */
  prices: Record<string, number>;
  /** Currently selected option id */
  selected: string;
  /** Option id to display price for */
  optionId: string;
  revealed: boolean;
  onPriceClick?: () => void;
  className?: string;
}

/**
 * Shows relative price difference from the currently selected option.
 * Selected option shows "geselecteerd", included (0-diff) shows "inbegrepen",
 * cheaper shows "-€X", more expensive shows "+€X".
 */
export function RelativePrice({ prices, selected, optionId, revealed, onPriceClick, className = "" }: Props) {
  if (arePricesHidden()) return null;

  const currentPrice = prices[selected] ?? 0;
  const optionPrice = prices[optionId] ?? 0;
  const diff = optionPrice - currentPrice;

  if (optionId === selected) {
    return <span className={`text-muted-foreground ${className}`}>geselecteerd</span>;
  }

  if (diff === 0) {
    return <span className={`text-muted-foreground ${className}`}>inbegrepen</span>;
  }

  const absDiff = Math.abs(diff).toLocaleString("nl-NL");
  const prefix = diff > 0 ? "+ €" : "- €";

  return (
    <BlurredPrice
      text={absDiff}
      revealed={revealed}
      onClick={onPriceClick}
      className={className}
      prefix={prefix}
    />
  );
}
