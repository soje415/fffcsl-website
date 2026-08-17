import { ArrowRight, ArrowDown } from "lucide-react";
import { STRUCTURE_LEVELS } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";

export function StructureDiagram() {
  return (
    <div className="flex flex-col items-stretch gap-1 lg:flex-row lg:items-center lg:gap-0">
      {STRUCTURE_LEVELS.map((level, i) => (
        <Reveal key={level} delay={i * 0.06} className="flex flex-1 items-center gap-1 lg:flex-col">
          <div className="flex-1 rounded-xl border border-line bg-white px-4 py-4 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">
              Level {i + 1}
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-forest-dark">
              {level}
            </p>
          </div>
          {i < STRUCTURE_LEVELS.length - 1 && (
            <>
              <ArrowDown size={18} className="my-1 shrink-0 text-walnut lg:hidden" />
              <ArrowRight size={18} className="mx-1 hidden shrink-0 text-walnut lg:block" />
            </>
          )}
        </Reveal>
      ))}
    </div>
  );
}
