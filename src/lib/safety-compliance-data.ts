export type InspectionStatus = "OOS"| "Clean Inspection";
export type InspectionLevel = "DRIVER-ONLY" | "WALK-AROUND" | "FULL";
export type RiskLevel = "Low" | "Medium" | "High";
export type ViolationCategory =
  | "UNSAFE DRIVING"
  | "HOS"
  | "VEHICLE MAINTENANCE"
  | "DRIVER FITNESS"
  | "INSURANCE AND OTHER";

export type InspectionRecord = {
  status: InspectionStatus;
  reportNo: string;
  inspectionDate: string;
  fmcsaPostDate: string;
  inspectionLevel: InspectionLevel;
  incomeAmount: number;
  oosViolations: number;
  driver: string;
  vin: string;
  vehiclePlate: string;
  points: number;
  charges: number;
  totalViolationPoints: number;
  chargeAmount: number;
  violationReason: string;
  safetyLossImpact: number;
  companyExpenseImpact: number;
  riskLevel: RiskLevel;
  crashIndicator: "Yes" | "No";
  hoursOfServiceCompliance: "Pass" | "Fail";
  vehicleMaintenance: "Pass" | "Fail";
  controlledSubstancesAndAlcohol: "Pass" | "Fail";
  unsafeDrivingReason?: string;
  hosComplianceReason?: string;
  vehicleMaintenanceReason?: string;
  alcoholSubstanceReason?: string;
  crashIndicatorReason?: string;
  documentsRegistrationReason?: string;
  unsafeDrivingPoints: number;
  hosPoints: number;
  vehicleMaintenancePoints: number;
  driverFitnessPoints: number;
  insuranceAndOtherPoints: number;
  unit: string;
  year: number;
  make: string;
  plate: string;
  price: number;
  totalPrice: number;
  expenseType: "Driver Charges" | "Company Expense" | "Fleet / Plate / Registration";
  violationCategory: ViolationCategory;
  state?: string;
};

export type DriverChargeRecord = {
  inspectionDate: string;
  driver: string;
  reason: string;
  amount: number;
  rawAmount: string;
};

export type FleetCostRecord = {
  recordDate: string;
  unit: string;
  vin: string;
  year: number;
  make: string;
  plate: string;
  price: number;
  totalPrice: number;
  expenseType: "Renewal" | "Registration" | "Supplement" | "Plate" | "Fleet";
  driverName?: string;
  notes?: string;
  supplement: number;
};

export const inspectionLevels = [
  "DRIVER-ONLY",
  "WALK-AROUND",
  "FULL",
  "Level I",
  "Level II",
  "Level III",
  "Level V",
] as const;

export const riskLevels = ["Low", "Medium", "High"] as const;
export const violationCategories = [
  "UNSAFE DRIVING",
  "HOS",
  "VEHICLE MAINTENANCE",
  "DRIVER FITNESS",
  "INSURANCE AND OTHER",
] as const;

export const expenseTypes = [
  "Driver Charges",
  "Company Expense",
  "Fleet / Plate / Registration",
] as const;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  const dateValue = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(dateValue);
}

export function monthKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 7);
  }
  const dateValue = new Date(value);
  return `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabelFromKey(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

export function recentSixMonthRange(maxDate: string) {
  if (!maxDate) return { startDate: "", endDate: "" };

  const end = new Date(`${maxDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) {
    return { startDate: "", endDate: "" };
  }

  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  const endOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);

  return {
    startDate: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`,
    endDate: `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, "0")}-${String(endOfMonth.getDate()).padStart(2, "0")}`,
  };
}
export function normalizeName(value: string) {
  return (value ?? "")
      .replace(/\u00a0/g, " ")
      .toUpperCase()
      .replace(/[^A-Z ]/g, "")
      .split(" ")
      .filter((part) => part.length > 1)
      .sort()
      .join(" ");
}

export function riskLabelFromPoints(points: number): RiskLevel {
  if (points >= 61) return "High";
  if (points >= 21) return "Medium";
  return "Low";
}

export function canonicalizeFinancialReason(reason: string): string {
  const upper = (reason || "").toUpperCase();
  if (upper.includes("FAKE PLATE")) return "FAKE PLATE";
  if (upper.includes("FAKE IFTA")) return "FAKE IFTA STICKERS";
  if (upper.includes("NO VIOLATION")) return "NO VIOLATIONS";

  if (upper && upper !== "UNKNOWN" && upper !== "NONE") {
    return "CITATION";
  }

  return "NO VIOLATIONS";
}

export function categoryFromReason(reason: string): ViolationCategory {
  const value = reason.toLowerCase();
  if (
    value.includes("speed") ||
    value.includes("unsafe") ||
    value.includes("state") ||
    value.includes("local") ||
    value.includes("lane") ||
    value.includes("signal") ||
    value.includes("traffic")
  ) {
    return "UNSAFE DRIVING";
  }
  if (
    value.includes("eld") ||
    value.includes("duty") ||
    value.includes("hours") ||
    value.includes("hos") ||
    value.includes("log")
  ) {
    return "HOS";
  }
  if (
    value.includes("tire") ||
    value.includes("brake") ||
    value.includes("light") ||
    value.includes("wheel") ||
    value.includes("rim") ||
    value.includes("maint") ||
    value.includes("load") ||
    value.includes("secure") ||
    value.includes("equipment")
  ) {
    return "VEHICLE MAINTENANCE";
  }
  if (
    value.includes("medical") ||
    value.includes("fitness") ||
    value.includes("qualification") ||
    value.includes("cdl") ||
    value.includes("physic")
  ) {
    return "DRIVER FITNESS";
  }
  return "INSURANCE AND OTHER";
}
