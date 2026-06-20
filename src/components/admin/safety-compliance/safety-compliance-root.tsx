"use client";

import {
  CalendarRange,
  ChevronDown,
  Filter,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  safetyComplianceSectionNav,
  SafetyComplianceProvider,
  useSafetyCompliance,
} from "@/components/admin/safety-compliance/safety-compliance-context";
import type {
  DriverChargeRecord,
  FleetCostRecord,
  InspectionRecord,
} from "@/lib/safety-compliance-data";

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | string[];
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <div className="relative">
        <select
          className="h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 pr-9 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">All</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
      </div>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <div className="relative">
        <CalendarRange
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function HeaderStats() {
  const { stats } = useSafetyCompliance();

  return (
      <div className="flex gap-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 min-w-[120px]">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Inspections
          </p>
          <p className="text-lg font-semibold text-zinc-950">
            {stats.inspectionCount}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 min-w-[120px]">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Drivers
          </p>
          <p className="text-lg font-semibold text-zinc-950">
            {stats.driverCount}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 min-w-[120px]">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Source
          </p>
          <p className="text-lg font-semibold text-zinc-950">
            {stats.dataSource}
          </p>
        </div>
      </div>
  );
}

// function FilterBar() {
//   const { filters, options, setFilter, resetFilters } = useSafetyCompliance();
//
//   return (
//     <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
//       <div className="mb-4 flex items-center justify-between gap-3">
//         <div className="flex items-center gap-2">
//           <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
//             <Filter className="size-4" aria-hidden="true" />
//           </div>
//           <div>
//             <h2 className="text-sm font-semibold text-zinc-950">Filters</h2>
//             <p className="text-sm text-zinc-500">
//               Apply shared filters across all six subsections.
//             </p>
//           </div>
//         </div>
//
//         <button
//           type="button"
//           onClick={resetFilters}
//           className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
//         >
//           <RotateCcw className="size-4" aria-hidden="true" />
//           Reset
//         </button>
//       </div>
//
//       <div className="grid gap-3 xl:grid-cols-5">
//         <DateField
//           label="Date range start"
//           value={filters.startDate}
//           onChange={(value) => setFilter("startDate", value)}
//         />
//         <DateField
//           label="Date range end"
//           value={filters.endDate}
//           onChange={(value) => setFilter("endDate", value)}
//         />
//         <SelectField
//           label="Driver"
//           value={filters.driver}
//           onChange={(value) => setFilter("driver", value)}
//           options={options.drivers}
//         />
//         <SelectField
//           label="Status"
//           value={filters.status}
//           onChange={(value) => setFilter("status", value)}
//           options={options.statuses}
//         />
//         <SelectField
//           label="Inspection level"
//           value={filters.inspectionLevel}
//           onChange={(value) => setFilter("inspectionLevel", value)}
//           options={options.inspectionLevels}
//         />
//         <SelectField
//           label="Risk level"
//           value={filters.riskLevel}
//           onChange={(value) => setFilter("riskLevel", value)}
//           options={options.riskLevels}
//         />
//         <SelectField
//           label="Vehicle plate"
//           value={filters.vehiclePlate}
//           onChange={(value) => setFilter("vehiclePlate", value)}
//           options={options.vehiclePlates}
//         />
//         <SelectField
//           label="Unit"
//           value={filters.unit}
//           onChange={(value) => setFilter("unit", value)}
//           options={options.units}
//         />
//         <SelectField
//           label="Violation category"
//           value={filters.violationCategory}
//           onChange={(value) => setFilter("violationCategory", value)}
//           options={options.violationCategories}
//         />
//         <SelectField
//           label="Expense type"
//           value={filters.expenseType}
//           onChange={(value) => setFilter("expenseType", value)}
//           options={options.expenseTypes}
//         />
//       </div>
//     </section>
//   );
// }

function SectionNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {safetyComplianceSectionNav.map((item) => {
        const active =
          item.href === "/safety-compliance"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
              active
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SafetyComplianceRoot({
  children,
  inspectionRecords,
  driverChargeRecords,
  fleetCostRecords,
}: {
  children: ReactNode;
  inspectionRecords: InspectionRecord[];
  driverChargeRecords: DriverChargeRecord[];
  fleetCostRecords: FleetCostRecord[];
}) {
  return (
    <SafetyComplianceProvider
      inspectionRecords={inspectionRecords}
      driverChargeRecords={driverChargeRecords}
      fleetCostRecords={fleetCostRecords}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                <ShieldAlert className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-700">
                  Safety & Compliance
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                  Company safety and compliance intelligence
                </h2>
                <p className="max-w-3xl text-sm text-zinc-500">
                  Track inspections, driver risk, violations, financial impact,
                  and fleet costs from one shared filter set.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <HeaderStats />
            </div>
          </div>
        </section>

        <SectionNav />
        {/*<FilterBar />*/}

        <div className="space-y-6">{children}</div>
      </div>
    </SafetyComplianceProvider>
  );
}
