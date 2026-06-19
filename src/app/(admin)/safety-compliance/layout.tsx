import type { ReactNode } from "react";
import { SafetyComplianceRoot } from "@/components/admin/safety-compliance/safety-compliance-root";
import { loadSafetyComplianceData } from "@/lib/safety-compliance-source";

export default async function SafetyComplianceLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    const { inspectionRecords, driverChargeRecords, fleetCostRecords } =
      await loadSafetyComplianceData();

    return (
      <SafetyComplianceRoot
        inspectionRecords={inspectionRecords}
        driverChargeRecords={driverChargeRecords}
        fleetCostRecords={fleetCostRecords}
      >
        {children}
      </SafetyComplianceRoot>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load Safety & Compliance data";

    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <h2 className="text-lg font-semibold">Safety & Compliance data unavailable</h2>
        <p className="mt-2 text-sm">
          {message}. Confirm the <code className="rounded bg-white px-1">DATA</code> value in{" "}
          <code className="rounded bg-white px-1">.env</code> points to the shared Google Sheet.
        </p>
      </div>
    );
  }
}
