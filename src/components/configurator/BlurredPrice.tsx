import { Eye } from "lucide-react";

interface Props {
  text: string;
  revealed: boolean;
  onClick?: () => void;
  className?: string;
  prefix?: string;
}

const PRICE_VISIBILITY_KEY = "bloq-hide-prices";
const PRICE_VISIBILITY_VERSION_KEY = "bloq-hide-prices-version";
const PRICE_VISIBILITY_VERSION = "2";

function readPricesHidden(): boolean {
  try {
    const version = localStorage.getItem(PRICE_VISIBILITY_VERSION_KEY);
    if (version !== PRICE_VISIBILITY_VERSION) {
      localStorage.setItem(PRICE_VISIBILITY_KEY, "true");
      localStorage.setItem(PRICE_VISIBILITY_VERSION_KEY, PRICE_VISIBILITY_VERSION);
      return true;
    }

    const value = localStorage.getItem(PRICE_VISIBILITY_KEY);
    if (value === null) {
      localStorage.setItem(PRICE_VISIBILITY_KEY, "true");
      return true;
    }

    return value !== "false";
  } catch {
    return true;
  }
}

export function setPricesHiddenInStorage(hidden: boolean) {
  try {
    localStorage.setItem(PRICE_VISIBILITY_KEY, String(hidden));
    localStorage.setItem(PRICE_VISIBILITY_VERSION_KEY, PRICE_VISIBILITY_VERSION);
  } catch {
    // Ignore storage failures and keep prices hidden by default.
  }
}

export function arePricesHidden(): boolean {
  return readPricesHidden();
}

export function BlurredPrice({ text, revealed, onClick, className = "", prefix = "€" }: Props) {
  if (arePricesHidden()) {
    return null;
  }

  if (revealed) {
    return <span className={className}>{prefix}{text}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-0.5 cursor-pointer group ${className}`}
    >
      <span>{prefix}</span>
      <span className="relative">
        <span className="blur-md select-none">{text}</span>
        <Eye className="absolute inset-0 m-auto w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
      </span>
    </button>
  );
}
