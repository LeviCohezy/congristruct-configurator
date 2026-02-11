import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  steps: readonly string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepProgress({ steps, currentStep, onStepClick }: StepProgressProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;

        return (
          <button
            key={label}
            onClick={() => onStepClick(i)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap",
              isCompleted && "bg-success/10 text-success",
              isActive && "bg-accent/15 text-accent",
              !isCompleted && !isActive && "bg-muted text-muted-foreground hover:bg-surface-hover"
            )}
          >
            {isCompleted ? (
              <Check className="w-3 h-3" />
            ) : (
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold",
                isActive ? "bg-accent text-accent-foreground" : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {i + 1}
              </span>
            )}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
