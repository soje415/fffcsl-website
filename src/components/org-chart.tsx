import { ArrowDown, ArrowRight, Building2, Landmark, Users } from "lucide-react";
import { STRUCTURE_LEVELS } from "@/lib/content";

const GOVERNANCE = [
  {
    title: "National General Assembly",
    note: "Supreme decision-making body of the Federation",
  },
  {
    title: "Board of Trustees / National Advisory Council",
    note: "Oversight, governance and strategic guidance",
  },
  {
    title: "National Executive Council (NEC)",
    note: "Executive management and coordination",
  },
];

const NEC_OFFICERS = [
  "National President",
  "National Vice President",
  "Secretary General",
  "Internal Audit & Risk Management",
  "Public Relations, Communications & Protocol",
];

const DEPARTMENTS = [
  {
    name: "Administration, Finance & Corporate Services",
    units: [
      "Administration & HR",
      "Finance & Accounts",
      "Procurement",
      "ICT & Digital Services",
      "Legal & Compliance",
    ],
  },
  {
    name: "Agricultural Production & Extension Services",
    units: [
      "Crop Production",
      "Extension Services",
      "Inputs & Irrigation",
      "Mechanization",
      "Technical Field Support",
    ],
  },
  {
    name: "Livestock & Integrated Farming",
    units: [
      "Livestock Development",
      "Animal Production",
      "Dairy / Poultry / Fisheries",
      "Integrated Farming",
      "Value Chain Development",
    ],
  },
  {
    name: "Programs, Partnerships & Agribusiness",
    units: [
      "Government Programs",
      "Development Partners",
      "Financial Institutions",
      "Markets & Off-takers",
      "Farmer Clusters",
    ],
  },
  {
    name: "Membership & Cooperative Development",
    units: [
      "Membership & Mobilization",
      "Cooperative Development",
      "Women & Youth",
      "State/LGA Coordination",
    ],
  },
  {
    name: "Planning, Research, M&E & Sustainability",
    units: [
      "Planning & Research",
      "Monitoring & Evaluation",
      "Farmer Data / Profiling",
      "Climate & Environment",
      "Sustainability",
    ],
  },
];

function SectionLabel({ icon: Icon, children }: { icon: typeof Landmark; children: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-terracotta">
      <Icon size={16} className="text-forest" />
      {children}
    </p>
  );
}

export function OrgChart() {
  return (
    <div className="space-y-14">
      {/* Governance */}
      <div>
        <SectionLabel icon={Landmark}>Governance</SectionLabel>
        <div className="mt-5 flex flex-col items-center gap-1">
          {GOVERNANCE.map((level, i) => (
            <div key={level.title} className="flex w-full flex-col items-center gap-1">
              <div className="w-full max-w-md rounded-xl border border-line bg-white px-5 py-3 text-center shadow-sm">
                <p className="text-sm font-semibold text-forest-dark">{level.title}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{level.note}</p>
              </div>
              {i < GOVERNANCE.length - 1 && (
                <ArrowDown size={18} className="my-1 text-walnut" />
              )}
            </div>
          ))}

          <ArrowDown size={18} className="my-1 text-walnut" />

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {NEC_OFFICERS.map((officer) => (
              <div
                key={officer}
                className="rounded-lg border border-forest/20 bg-forest/5 px-3 py-2.5 text-center text-xs font-medium text-forest-dark"
              >
                {officer}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Departments */}
      <div>
        <SectionLabel icon={Building2}>Six Functional Departments</SectionLabel>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((dept, i) => (
            <div key={dept.name} className="rounded-2xl border border-line bg-white p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-soft font-serif text-sm font-semibold text-terracotta">
                  {i + 1}
                </span>
                <p className="text-sm font-semibold leading-snug text-forest-dark">
                  {dept.name}
                </p>
              </div>
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                {dept.units.map((unit) => (
                  <li key={unit} className="flex items-center gap-2 text-xs text-ink-soft">
                    <ArrowRight size={12} className="shrink-0 text-forest" />
                    {unit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Field & membership structure */}
      <div>
        <SectionLabel icon={Users}>Nationwide Field &amp; Membership Structure</SectionLabel>
        <div className="mt-5 flex flex-col items-stretch gap-1 lg:flex-row lg:items-center lg:gap-0">
          {STRUCTURE_LEVELS.map((level, i) => (
            <div key={level} className="flex flex-1 items-center gap-1 lg:flex-col">
              <div className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-terracotta">
                  Level {i + 1}
                </p>
                <p className="mt-0.5 text-xs font-medium leading-snug text-forest-dark">
                  {level}
                </p>
              </div>
              {i < STRUCTURE_LEVELS.length - 1 && (
                <>
                  <ArrowDown size={16} className="my-0.5 shrink-0 text-walnut lg:hidden" />
                  <ArrowRight size={16} className="mx-1 hidden shrink-0 text-walnut lg:block" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
