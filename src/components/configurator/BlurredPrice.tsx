import { Eye } from "lucide-react";

interface Props {
  text: string;
  revealed: boolean;
  onClick?: () => void;
  className?: string;
  prefix?: string;
}

export function BlurredPrice({ text, revealed, onClick, className = "", prefix = "€" }: Props) {
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
