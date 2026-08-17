import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_LABELS } from "@/types/registration";

export function Stepper({ current }: { current: number }) {
  return (
    <div>
      <div className="hidden items-center sm:flex">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                  i < current && "border-forest bg-forest text-cream",
                  i === current && "border-forest bg-white text-forest-dark",
                  i > current && "border-line bg-white text-ink-soft"
                )}
              >
                {i < current ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  "w-20 text-center text-[10px] font-medium leading-tight",
                  i === current ? "text-forest-dark" : "text-ink-soft/70"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px flex-1",
                  i < current ? "bg-forest" : "bg-line"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="sm:hidden">
        <p className="text-xs font-semibold text-forest-dark">
          Step {current + 1} of {STEP_LABELS.length}: {STEP_LABELS[current]}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-forest transition-all"
            style={{ width: `${((current + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
