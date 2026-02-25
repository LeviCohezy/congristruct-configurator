import { EyeOff } from "lucide-react";

interface Props {
  children: React.ReactNode;
  revealed: boolean;
  className?: string;
}

export function BlurredPrice({ children, revealed, className = "" }: Props) {
  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <span className={`transition-all duration-300 ${!revealed ? "blur-md select-none" : ""}`}>
        {children}
      </span>
      {!revealed && (
        <EyeOff className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      )}
    </span>
  );
}
