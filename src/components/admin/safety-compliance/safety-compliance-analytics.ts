import {
  formatCurrency,
  formatDate,
  monthKey,
  monthLabelFromKey,
  type FleetCostRecord,
  type DriverChargeRecord,
  type InspectionRecord,
  type RiskLevel,
  type ViolationCategory,
  canonicalizeFinancialReason,
  normalizeName
} from "@/lib/safety-compliance-data";
import type { InspectionSheetSummary } from "@/lib/safety-compliance-types";

export type MonthlyPoint = {
  month: string;
  label: string;
  value: number;
};

export type DriverSummary = {
  driver: string;
  totalInspections: number;
  totalViolationPoints: number;
  totalCharges: number;
  oosViolations: number;
  repeatViolations: number;
  riskLevel: RiskLevel;
  lastInspectionDate: string;
  previousMonthPoints: number;
  monthTrend: number;
};

export type CategorySummary = {
  category: ViolationCategory;
  numberOfViolations: number;
  totalPoints: number;
  totalCharges: number;
  mostCommonReason: string;
  driversInvolved: number;
};

export type CategoryPointRow = {
  name: ViolationCategory;
  points: number;
};

export type DriverCategoryPointRow = {
  driver: string;
  unsafeDrivingPoints: number;
  hosPoints: number;
  vehicleMaintenancePoints: number;
  driverFitnessPoints: number;
  insuranceAndOtherPoints: number;
  totalPoints: number;
};

export type FleetSummary = {
  unit: string;
  vin: string;
  year: number;
  make: string;
  plate: string;
  price: number;
  totalPrice: number;
  expenseType: string;
  driverName?: string;
  notes?: string;
};

export type FinancialImpactRow = {
  driver: string;
  chargeAmount: number;
  chargeReason: string;
  safetyLossImpact: number;
  companyExpenseImpact: number;
  inspectionDate: string;
  reportNo: string;
};

type MonthlyBucket = {
  key: string;
  totalPoints: number;
  totalCharges: number;
  inspectionCount: number;
  oosCount: number;
};

function monthSort(a: string, b: string) {
  return a.localeCompare(b);
}

export function uniqueSortedMonths(records: InspectionRecord[]) {
  return Array.from(new Set(records.map((record) => monthKey(record.inspectionDate)))).sort(
    monthSort,
  );
}

export function aggregateMonthlyInspectionData(records: InspectionRecord[]) {
  const buckets = new Map<string, MonthlyBucket & { totalIncome: number }>();
  for (const record of records) {
    const key = monthKey(record.inspectionDate);
    const bucket =
      buckets.get(key) ?? {
        key,
        totalPoints: 0,
        totalCharges: 0,
        totalIncome: 0,
        inspectionCount: 0,
        oosCount: 0,
      };
    bucket.totalPoints += record.totalViolationPoints;
    bucket.totalCharges += record.charges;
    bucket.inspectionCount += 1;
    bucket.totalIncome += record.sheetCharges;
    bucket.oosCount += record.status === "OOS" ? 1 : 0;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values())
    .sort((a, b) => monthSort(a.key, b.key))
    .map((bucket) => ({
      month: bucket.key,
      label: monthLabelFromKey(bucket.key),
      points: bucket.totalPoints,
      charges: bucket.totalCharges,
      income: bucket.totalIncome,
      inspections: bucket.inspectionCount,
      oos: bucket.oosCount,
      clean: bucket.inspectionCount - bucket.oosCount,
    }));
}

export function aggregateMonthlyDriverCharges(records: DriverChargeRecord[]) {
  const buckets = new Map<string, number>();
  for (const record of records) {
    if (!record.inspectionDate) continue;
    const key = monthKey(record.inspectionDate);
    buckets.set(key, (buckets.get(key) ?? 0) + record.amount);
  }

  return Array.from(buckets.entries())
      .sort((a, b) => monthSort(a[0], b[0]))
      .map(([month, value]) => ({
        month,
        label: monthLabelFromKey(month),
        outcome: value,
      }));
}

function riskRank(level: RiskLevel) {
  switch (level) {
    case "High":
      return 3;
    case "Medium":
      return 2;
    default:
      return 1;
  }
}

function maxRiskLevel(records: InspectionRecord[]): RiskLevel {
  return records.reduce<RiskLevel>(
    (current, record) =>
      riskRank(record.riskLevel) > riskRank(current) ? record.riskLevel : current,
    "Low",
  );
}

export function aggregateDriverSummaries(records: InspectionRecord[]) {
  const grouped = new Map<string, InspectionRecord[]>();
  for (const record of records) {
    const key = normalizeName(record.driver);
    if (!key) continue;
    const current = grouped.get(key) ?? [];
    current.push(record);
    grouped.set(key, current);
  }

  const latestMonth = records
    .map((record) => monthKey(record.inspectionDate))
    .sort(monthSort)
    .at(-1);
  const previousMonth = latestMonth
    ? new Date(Number(latestMonth.slice(0, 4)), Number(latestMonth.slice(5, 7)) - 2, 1)
    : null;
  const previousMonthKey = previousMonth
    ? `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`
    : "";

  return Array.from(grouped.entries())
    .map(([, driverRecords]) => {
      const driver = driverRecords[0].driver;
      const totalViolationPoints = driverRecords.reduce(
        (sum, record) => sum + record.totalViolationPoints,
        0,
      );
      const totalCharges = driverRecords.reduce(
        (sum, record) => sum + record.incomeAmount,
        0,
      );
      const oosViolations = driverRecords.reduce(
        (sum, record) => sum + record.oosViolations,
        0,
      );
      const realInspections = driverRecords.filter(
          (r) => r.reportNo !== "NON-INSPECTION"
      );
      const repeatViolations = Math.max(0, realInspections.length - 1);

      const lastInspectionDate = driverRecords
        .map((record) => record.inspectionDate)
        .sort(monthSort)
        .at(-1) as string;
      const currentMonthPoints = driverRecords
        .filter((record) => monthKey(record.inspectionDate) === latestMonth)
        .reduce((sum, record) => sum + record.totalViolationPoints, 0);
      const lastMonthPoints = driverRecords
        .filter((record) => monthKey(record.inspectionDate) === previousMonthKey)
        .reduce((sum, record) => sum + record.totalViolationPoints, 0);

      return {
        driver,
        totalInspections: driverRecords.length,
        totalViolationPoints,
        totalCharges,
        oosViolations,
        repeatViolations,
        riskLevel: maxRiskLevel(driverRecords),
        lastInspectionDate,
        previousMonthPoints: lastMonthPoints,
        monthTrend: currentMonthPoints - lastMonthPoints,
      } satisfies DriverSummary;
    })
    .sort((a, b) => b.totalViolationPoints - a.totalViolationPoints);
}

export function aggregateFleetByUnitPrice(
    records: FleetCostRecord[],
    inspectionRecords: InspectionRecord[],
) {
  const vinToDriver = new Map<string, string>();
  for (const inspection of inspectionRecords) {
    if (inspection.vin && inspection.driver) {
      vinToDriver.set(inspection.vin, inspection.driver);
    }
  }

  const grouped = new Map<string, { value: number; driverName: string }>();

  for (const record of records) {
    const existing = grouped.get(record.unit) ?? {
      value: 0,
      driverName: record.driverName ?? vinToDriver.get(record.vin) ?? "",
    };
    existing.value += record.price;
    if (!existing.driverName) {
      existing.driverName = vinToDriver.get(record.vin) ?? "";
    }
    grouped.set(record.unit, existing);
  }

  return Array.from(grouped.entries())
      .map(([name, data]) => ({
        name,
        value: data.value,
        driverName: data.driverName,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
}

export function aggregateRiskLevels(records: InspectionRecord[]) {
  const summary = {
    Low: 0,
    Medium: 0,
    High: 0,
  } satisfies Record<RiskLevel, number>;

  for (const record of records) {
    summary[record.riskLevel] += 1;
  }

  return Object.entries(summary).map(([riskLevel, value]) => ({
    riskLevel,
    value,
  }));
}

export function aggregateCategories(records: InspectionRecord[]) {
  const grouped = new Map<
    ViolationCategory,
    {
      numberOfViolations: number;
      totalPoints: number;
      totalCharges: number;
      reasons: Map<string, number>;
      drivers: Set<string>;
    }
  >();

  const ensureBucket = (cat: ViolationCategory) => {
    if (!grouped.has(cat)) {
      grouped.set(cat, {
        numberOfViolations: 0,
        totalPoints: 0,
        totalCharges: 0,
        reasons: new Map<string, number>(),
        drivers: new Set<string>(),
      });
    }
    return grouped.get(cat)!;
  };

  for (const record of records) {
    const bucket = ensureBucket(record.violationCategory);
    bucket.numberOfViolations += 1;
    bucket.drivers.add(record.driver);
    bucket.totalPoints += record.totalViolationPoints;
    bucket.totalCharges += record.chargeAmount;

    let specificReason = "Unknown";
    if (record.violationCategory === "UNSAFE DRIVING") specificReason = record.unsafeDrivingReason || "Unsafe Driving";
    else if (record.violationCategory === "HOS") specificReason = record.hosComplianceReason || "HOS Violation";
    else if (record.violationCategory === "VEHICLE MAINTENANCE") specificReason = record.vehicleMaintenanceReason || "Maintenance Issue";
    else if (record.violationCategory === "DRIVER FITNESS") specificReason = "Driver Fitness Violation";
    else specificReason = record.violationReason || "Insurance and Other";

    bucket.reasons.set(specificReason, (bucket.reasons.get(specificReason) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([category, bucket]) => {
      const mostCommonReason =
        Array.from(bucket.reasons.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "N/A";

      return {
        category,
        numberOfViolations: bucket.numberOfViolations,
        totalPoints: bucket.totalPoints,
        totalCharges: bucket.totalCharges,
        mostCommonReason,
        driversInvolved: bucket.drivers.size,
      } satisfies CategorySummary;
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export function aggregatePointsByCategory(summary: InspectionSheetSummary): CategoryPointRow[];
export function aggregatePointsByCategory(records: InspectionRecord[]): CategoryPointRow[];
export function aggregatePointsByCategory(
  input: InspectionSheetSummary | InspectionRecord[],
) {
  if (Array.isArray(input)) {
    const summary = {
      "UNSAFE DRIVING": 0,
      HOS: 0,
      "VEHICLE MAINTENANCE": 0,
      "DRIVER FITNESS": 0,
      "INSURANCE AND OTHER": 0,
    } satisfies Record<ViolationCategory, number>;

    for (const record of input) {
      summary["UNSAFE DRIVING"] += record.unsafeDrivingPoints;
      summary.HOS += record.hosPoints;
      summary["VEHICLE MAINTENANCE"] += record.vehicleMaintenancePoints;
      summary["DRIVER FITNESS"] += record.driverFitnessPoints;
      summary["INSURANCE AND OTHER"] += record.insuranceAndOtherPoints;
    }

    return Object.entries(summary)
      .map(([name, points]) => ({ name: name as ViolationCategory, points }))
      .filter((item) => item.points > 0);
  }

  return [
    { name: "UNSAFE DRIVING", points: input.unsafeDrivingPoints },
    { name: "HOS", points: input.hosPoints },
    { name: "VEHICLE MAINTENANCE", points: input.vehicleMaintenancePoints },
    { name: "DRIVER FITNESS", points: input.driverFitnessPoints },
    { name: "INSURANCE AND OTHER", points: input.insuranceAndOtherPoints },
  ].filter((item) => item.points > 0);
}

export function aggregateDriverPointsByCategory(records: InspectionRecord[]) {
  const grouped = new Map<string, DriverCategoryPointRow>();

  for (const record of records) {
    const key = record.driver.trim();
    if (!key) continue;

    const existing = grouped.get(key) ?? {
      driver: record.driver,
      unsafeDrivingPoints: 0,
      hosPoints: 0,
      vehicleMaintenancePoints: 0,
      driverFitnessPoints: 0,
      insuranceAndOtherPoints: 0,
      totalPoints: 0,
    };

    existing.unsafeDrivingPoints += record.unsafeDrivingPoints;
    existing.hosPoints += record.hosPoints;
    existing.vehicleMaintenancePoints += record.vehicleMaintenancePoints;
    existing.driverFitnessPoints += record.driverFitnessPoints;
    existing.insuranceAndOtherPoints += record.insuranceAndOtherPoints;
    existing.totalPoints +=
      record.unsafeDrivingPoints +
      record.hosPoints +
      record.vehicleMaintenancePoints +
      record.driverFitnessPoints +
      record.insuranceAndOtherPoints;

    grouped.set(key, existing);
  }

  return Array.from(grouped.values())
    .filter((item) => item.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export function aggregateFleetCosts(records: FleetCostRecord[]) {
  return [...records].sort((a, b) => b.totalPrice - a.totalPrice);
}

export function aggregateMonthlyFleetData(records: FleetCostRecord[]) {
  const buckets = new Map<string, number>();
  for (const record of records) {
    const key = monthKey(record.recordDate);
    buckets.set(key, (buckets.get(key) ?? 0) + record.totalPrice);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => monthSort(a[0], b[0]))
    .map(([month, value]) => ({
      month,
      label: monthLabelFromKey(month),
      value,
    }));
}

export function aggregateChargesByReason(records: InspectionRecord[]) {
  const grouped = new Map<string, number>();
  for (const record of records) {
    const reason = canonicalizeFinancialReason(record.violationReason);
    grouped.set(reason, (grouped.get(reason) ?? 0) + record.chargeAmount);
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateChargesByDriver(records: InspectionRecord[]) {
  const grouped = new Map<string, number>();
  for (const record of records) {
    grouped.set(record.driver, (grouped.get(record.driver) ?? 0) + record.chargeAmount);
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateChargesByCategory(records: InspectionRecord[]) {
  const grouped = new Map<ViolationCategory, number>();
  for (const record of records) {
    grouped.set(
      record.violationCategory,
      (grouped.get(record.violationCategory) ?? 0) + record.chargeAmount,
    );
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateSafetyLossByCategory(records: InspectionRecord[]) {
  const grouped = new Map<ViolationCategory, number>();
  for (const record of records) {
    grouped.set(
      record.violationCategory,
      (grouped.get(record.violationCategory) ?? 0) + record.safetyLossImpact,
    );
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildMonthlyCategoryTrend(records: InspectionRecord[]) {
  const months = Array.from(new Set(records.map((record) => monthKey(record.inspectionDate)))).sort();

  return months.map((month) => {
    const monthRecords = records.filter((r) => monthKey(r.inspectionDate) === month);
    return {
      month,
      label: monthLabelFromKey(month),
      "UNSAFE DRIVING": monthRecords.reduce((sum, r) => sum + (r.unsafeDrivingPoints || 0), 0),
      "HOS": monthRecords.reduce((sum, r) => sum + (r.hosPoints || 0), 0),
      "VEHICLE MAINTENANCE": monthRecords.reduce((sum, r) => sum + (r.vehicleMaintenancePoints || 0), 0),
      "DRIVER FITNESS": monthRecords.reduce((sum, r) => sum + (r.driverFitnessPoints || 0), 0),
      "INSURANCE AND OTHER": monthRecords.reduce((sum, r) => sum + (r.insuranceAndOtherPoints || 0), 0),
    };
  });
}

export function aggregateCompanyExpenseByType(records: InspectionRecord[]) {
  const grouped = new Map<string, number>();
  for (const record of records) {
    grouped.set(
      record.expenseType,
      (grouped.get(record.expenseType) ?? 0) + record.companyExpenseImpact,
    );
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateFleetByUnit(
    records: FleetCostRecord[],
    inspectionRecords: InspectionRecord[],
) {
  const vinToDriver = new Map<string, string>();
  for (const inspection of inspectionRecords) {
    if (inspection.vin && inspection.driver) {
      vinToDriver.set(inspection.vin, inspection.driver);
    }
  }

  const grouped = new Map<string, { value: number; driverName: string }>();

  for (const record of records) {
    const existing = grouped.get(record.unit) ?? {
      value: 0,
      driverName: record.driverName ?? vinToDriver.get(record.vin) ?? "",
    };
    existing.value += record.totalPrice;
    if (!existing.driverName) {
      existing.driverName = vinToDriver.get(record.vin) ?? "";
    }
    grouped.set(record.unit, existing);

  }

  return Array.from(grouped.entries())
      .map(([name, data]) => ({
        name,
        value: data.value,
        driverName: data.driverName,
      }))
      .sort((a, b) => b.value - a.value);
}

export function aggregateFleetByPlate(records: FleetCostRecord[]) {
//   const vinToDriver = new Map<string, string>();
//   for (const inspection of inspectionRecords) {
//     if (inspection.vin && inspection.driver) {
//       vinToDriver.set(inspection.vin, inspection.driver);
//     }
//   }
//
//   const grouped = new Map<string, { plate: string; driverName: string }>();
//
//   for (const record of records) {
//     const existing = grouped.get(record.plate) ?? {
//       plate: record.plate,
//       driverName: record.driverName ?? vinToDriver.get(record.vin) ?? "",
//     };
//     if (!existing.driverName) {
//       existing.driverName = vinToDriver.get(record.vin) ?? "";
//     }
//     grouped.set(record.plate, existing);
//
//   }
//
//   return Array.from(grouped.entries())
//       .map(([name, data]) => ({
//         name,
//         plate: data.plate,
//         driverName: data.driverName,
//       }))
// }

  const grouped = new Map<string, number>();
  for (const record of records) {
    grouped.set(record.plate, (grouped.get(record.plate) ?? 0) + record.price);
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateTotalFleetByPlateAndSuppliment(records: FleetCostRecord[]) {
  const grouped = new Map<string, { plate: string; totalPrice: number; totalSupplement: number }>();

  for (const record of records) {
    const existing = grouped.get(record.plate) ?? {
      plate: record.plate,
      totalPrice: 0,
      totalSupplement: 0,
    };

    existing.totalPrice += record.price;
    existing.totalSupplement += record.supplement;

    grouped.set(record.plate, existing);
  }

  return Array.from(grouped.values())
      .sort((a, b) => b.totalPrice - a.totalPrice);
}

export function aggregateFleetByExpenseType(records: FleetCostRecord[]) {
  const grouped = new Map<string, number>();
  for (const record of records) {
    grouped.set(record.expenseType, (grouped.get(record.expenseType) ?? 0) + record.totalPrice);
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateFleetCostByYear(records: FleetCostRecord[]) {
  const grouped = new Map<string, number>();

  for (const record of records) {
    const yearNum = Number(record.year);
    if (yearNum === 0) continue;
    const year = String(record.year);
    grouped.set(year, (grouped.get(year) ?? 0) + record.totalPrice);
  }

  return Array.from(grouped.entries())
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

export function aggregateDriverChargesByDriver(records: DriverChargeRecord[]) {
  const grouped = new Map<string, number>();
  for (const record of records) {
    grouped.set(record.driver, (grouped.get(record.driver) ?? 0) + record.amount);
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateDriverChargesByReason(records: DriverChargeRecord[]) {
  const grouped = new Map<string, number>();
  for (const record of records) {
    const reason = canonicalizeFinancialReason(record.reason);
    grouped.set(reason, (grouped.get(reason) ?? 0) + record.amount);
  }
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildFinancialImpactRows(
  inspections: InspectionRecord[],
  driverCharges: DriverChargeRecord[],
) {
  return inspections.map((inspection) => {
    const matchedCharge =
      driverCharges.find(
        (record) =>
          record.inspectionDate === inspection.inspectionDate &&
          record.driver.toUpperCase() === inspection.driver.toUpperCase(),
      ) ?? null;

    return {
      driver: inspection.driver,
      chargeAmount: matchedCharge?.amount ?? inspection.chargeAmount,
      chargeReason: canonicalizeFinancialReason(matchedCharge?.reason ?? inspection.violationReason),
      safetyLossImpact: inspection.safetyLossImpact,
      companyExpenseImpact: inspection.companyExpenseImpact,
      inspectionDate: inspection.inspectionDate,
      reportNo: inspection.reportNo,
    } satisfies FinancialImpactRow;
  });
}

export function topInspectionsByPoints(records: InspectionRecord[]) {
  return [...records]
    .sort((a, b) => b.totalViolationPoints - a.totalViolationPoints)
    .slice(0, 10);
}

export function topDriversByCharges(records: InspectionRecord[]) {
  const summaries = aggregateDriverSummaries(records);
  return [...summaries].sort((a, b) => b.totalCharges - a.totalCharges).slice(0, 10);
}

export function formatTrend(value: number) {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : ""}${value}`;
}

export function mostExpensiveItemName<T extends { totalPrice: number; unit?: string; plate?: string }>(
  records: T[],
) {
  const top = [...records].sort((a, b) => b.totalPrice - a.totalPrice)[0];
  if (!top) return "N/A";
  return top.unit ?? top.plate ?? "N/A";
}

export { formatCurrency, formatDate };
