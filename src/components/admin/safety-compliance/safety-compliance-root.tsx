"use client";

import {
  ShieldAlert,
} from "lucide-react";
import { type ReactNode } from "react";
import {
  SafetyComplianceProvider,
  useSafetyCompliance,
} from "@/components/admin/safety-compliance/safety-compliance-context";
import type {
  DriverChargeRecord,
  FleetCostRecord,
  InspectionRecord,
} from "@/lib/safety-compliance-data";
import type { InspectionSheetSummary } from "@/lib/safety-compliance-types";

function HeaderStats() {
  const { stats } = useSafetyCompliance();

  return (
    <div className="flex flex-wrap items-end gap-3">
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

export function SafetyComplianceRoot({
  children,
  inspectionRecords,
  driverChargeRecords,
  fleetCostRecords,
  inspectionSheetSummary,
}: {
  children: ReactNode;
  inspectionRecords: InspectionRecord[];
  driverChargeRecords: DriverChargeRecord[];
  fleetCostRecords: FleetCostRecord[];
  inspectionSheetSummary: InspectionSheetSummary;
}) {
  return (
    <SafetyComplianceProvider
      inspectionRecords={inspectionRecords}
      driverChargeRecords={driverChargeRecords}
      fleetCostRecords={fleetCostRecords}
      inspectionSheetSummary={inspectionSheetSummary}
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
        <div className="space-y-6">{children}</div>
      </div>
    </SafetyComplianceProvider>
  );
}
