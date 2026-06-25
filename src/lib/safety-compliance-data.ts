export type InspectionStatus = "OOS"| "NO";
export type InspectionLevel = "DRIVER-ONLY" | "WALK-AROUND" | "FULL";
export type RiskLevel = "Low" | "Medium" | "High";
export type ViolationCategory =
  | "Unsafe Driving"
  | "Hours-of-Service Compliance"
  | "Vehicle Maintenance"
  | "Crash Indicator"
  | "Controlled Substances and Alcohol"
  | "Documents / Registration"
  | "Other";

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
  "Unsafe Driving",
  "Hours-of-Service Compliance",
  "Vehicle Maintenance",
  "Crash Indicator",
  "Controlled Substances and Alcohol",
  "Documents / Registration",
  "Other",
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
  const upper = reason.toUpperCase();
  if (upper.includes("FAKE PLATE")) return "Fake Plate";
  if (upper.includes("FAKE IFTA")) return "Fake IFTA Stickers";
  if (upper === "NO VIOLATIONS") return "No violations";

  // Map other specific violations to Citation to match the four types in the data
  if (
    /eld|duty|hours|tire|brake|light|wheel|rim|speed|unsafe|laws|392|395|operate|failed|citation/i.test(
      upper,
    )
  ) {
    return "Citation";
  }

  return "Citation"; // Default to Citation if there's any other reason
}

export function categoryFromReason(reason: string): ViolationCategory {
  const value = reason.toLowerCase();
  if (
    value.includes("speed") ||
    value.includes("unsafe") ||
    value.includes("state") ||
    value.includes("local")
  ) {
    return "Unsafe Driving";
  }
  if (value.includes("eld") || value.includes("duty") || value.includes("hours")) {
    return "Hours-of-Service Compliance";
  }
  if (
    value.includes("tire") ||
    value.includes("brake") ||
    value.includes("light") ||
    value.includes("wheel") ||
    value.includes("rim")
  ) {
    return "Vehicle Maintenance";
  }
  if (value.includes("crash")) {
    return "Crash Indicator";
  }
  if (value.includes("alcohol") || value.includes("controlled") || value.includes("substance")) {
    return "Controlled Substances and Alcohol";
  }
  if (
    value.includes("plate") ||
    value.includes("registration") ||
    value.includes("cab card") ||
    value.includes("ifta") ||
    value.includes("documents") ||
    value.includes("driver's license")
  ) {
    return "Documents / Registration";
  }
  return "Other";
}

