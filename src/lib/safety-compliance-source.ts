import "server-only";

import {
  categoryFromReason,
  type DriverChargeRecord,
  type FleetCostRecord,
  type InspectionRecord,
  riskLabelFromPoints,
  type RiskLevel,
} from "@/lib/safety-compliance-data";

type CsvRow = string[];

type LoadedSafetyComplianceData = {
  inspectionRecords: InspectionRecord[];
  driverChargeRecords: DriverChargeRecord[];
  fleetCostRecords: FleetCostRecord[];
};

function parseCsv(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };

  const pushRow = () => {
    if (row.length > 0) {
      rows.push(row);
    }
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (character === '"' && next === '"') {
        cell += '"';
        index += 1;
        continue;
      }
      if (character === '"') {
        inQuotes = false;
        continue;
      }
      cell += character;
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === ",") {
      pushCell();
      continue;
    }

    if (character === "\r") {
      continue;
    }

    if (character === "\n") {
      pushCell();
      pushRow();
      continue;
    }

    cell += character;
  }

  pushCell();
  pushRow();
  return rows;
}

function clean(value: string | undefined) {
  return (value ?? "").replace(/\u00a0/g, " ").trim();
}

function parseAmount(value: string | undefined) {
  const cleaned = clean(value).replace(/[$,]/g, "").replace(/\s+/g, "");
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseInteger(value: string | undefined) {
  const numeric = Number(clean(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
}

function parseDate(value: string | undefined) {
  const cleaned = clean(value);
  if (!cleaned) return "";

  const maybe = new Date(cleaned);
  if (!Number.isNaN(maybe.getTime())) {
    return maybe.toISOString().slice(0, 10);
  }

  const [month, day, year] = cleaned.split(/[/-]/).map((part) => Number(part));
  if (month && day && year) {
    return new Date(year, month - 1, day).toISOString().slice(0, 10);
  }

  return "";
}

function normalizeName(value: string) {
  return clean(value)
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .split(" ")
    .filter((part) => part.length > 1)
    .sort()
    .join(" ");
}

function matchesDateOrName(
  inspectionDate: string,
  driver: string,
  charge: DriverChargeRecord,
) {
  return (
    (charge.inspectionDate === inspectionDate || !charge.inspectionDate) &&
    normalizeName(charge.driver) === normalizeName(driver)
  );
}

function normalizeReason(reason: string | undefined) {
  const cleaned = clean(reason);
  const upper = cleaned.toUpperCase();

  if (upper.includes("PLATE") || upper.includes("REGISTRATION")) return "Fake Plate";
  if (upper.includes("IFTA")) return "Fake IFTA Stickers";

  if (
    !upper ||
    upper === "NO VIOLATIONS" ||
    upper === "NO VIOLATION" ||
    upper === "NONE" ||
    upper === "CLEAN" ||
    upper === "NO CHARGE LISTED" ||
    upper === "NO CHARGES"
  ) {
    return "No violations";
  }

  return cleaned;
}

function loadInspectionRecords(
  rows: CsvRow[],
  driverCharges: DriverChargeRecord[],
  matchedChargeIndices: Set<number>,
  fleetLookupByVin: Map<string, { unit: string; year: number; make: string; plate: string }>,
  financialSummaries: Map<string, DriverFinancialSummary>,
  complianceSummaries: Map<string, DriverComplianceSummary>,
) {
  return rows.map((row) => {
    const reportNo = clean(row[1]);
    const inspectionDate = parseDate(row[2]);
    const driverRaw = clean(row[6]);
    const driverNormalized = normalizeName(driverRaw);

    const matchedChargeIndex = driverCharges.findIndex(
      (charge, index) =>
        !matchedChargeIndices.has(index) &&
        matchesDateOrName(inspectionDate, driverRaw, charge),
    );
    const matchedCharge =
      matchedChargeIndex >= 0 ? driverCharges[matchedChargeIndex] : undefined;
    if (matchedChargeIndex >= 0) {
      matchedChargeIndices.add(matchedChargeIndex);
    }

    // Look for compliance summary (by driver + date)
    const complianceKey = `${driverNormalized}_${inspectionDate}`;
    const compSummary = complianceSummaries.get(complianceKey);

    // Look for financial summary (by driver)
    const finSummary = financialSummaries.get(driverNormalized);

    const reason = normalizeReason(matchedCharge?.reason);
    const unsafeReason = normalizeReason(compSummary?.unsafe);
    const hosReason = normalizeReason(compSummary?.hos);
    const maintenanceReason = normalizeReason(compSummary?.maintenance);
    const alcoholReason = normalizeReason(compSummary?.alcohol);
    const crashReason = normalizeReason(compSummary?.crash);

    // Collect all unique non-empty reasons
    const detectedReasons = new Set<string>();
    if (reason !== "No violations") detectedReasons.add(reason);
    if (unsafeReason !== "No violations") detectedReasons.add(unsafeReason);
    if (hosReason !== "No violations") detectedReasons.add(hosReason);
    if (maintenanceReason !== "No violations") detectedReasons.add(maintenanceReason);
    if (alcoholReason !== "No violations") detectedReasons.add(alcoholReason);
    if (crashReason !== "No violations") detectedReasons.add(crashReason);

    // If still no reason but we have points or OOS violations
    if (detectedReasons.size === 0) {
      const points = parseInteger(row[10]);
      const oos = parseInteger(row[5]);
      if (oos > 0 || points > 0) {
        detectedReasons.add("Citation");
      }
    }

    const finalReason = detectedReasons.size > 0
      ? Array.from(detectedReasons).join("; ")
      : "No violations";

    const chargeAmount = matchedCharge?.amount ?? 0;
    const points = parseInteger(row[10]);
    const totalViolationPoints = points;
    const violationCategory = categoryFromReason(finalReason);
    const companyExpenseImpact = /registration|plate|ifta|towing|portal/i.test(finalReason)
      ? chargeAmount
      : 0;
    const safetyLossImpact = totalViolationPoints * 25 + chargeAmount;

    const vin = clean(row[7]);
    const fleetMatch = fleetLookupByVin.get(vin);

    // Compliance indicators from summary if available
    const crashIndicator = compSummary?.crash
      ? compSummary.crash.toUpperCase() === "FAIL" || compSummary.crash.toUpperCase() === "YES"
        ? "Yes"
        : "No"
      : /crash/i.test(finalReason)
        ? "Yes"
        : "No";

    const hoursOfServiceCompliance = compSummary?.hos
      ? compSummary.hos.toUpperCase() === "FAIL" ? "Fail" : "Pass"
      : /eld|duty|hours/i.test(finalReason)
        ? "Fail"
        : "Pass";

    const vehicleMaintenance = compSummary?.maintenance
      ? compSummary.maintenance.toUpperCase() === "FAIL" ? "Fail" : "Pass"
      : /tire|brake|light|wheel|rim/i.test(finalReason)
        ? "Fail"
        : "Pass";

    const controlledSubstancesAndAlcohol = compSummary?.alcohol
      ? compSummary.alcohol.toUpperCase() === "FAIL" ? "Fail" : "Pass"
      : /alcohol|controlled|substance/i.test(finalReason)
        ? "Fail"
        : "Pass";

    let riskLevel: RiskLevel = riskLabelFromPoints(totalViolationPoints);
    if (finSummary?.riskLevel) {
      const rl = finSummary.riskLevel.toLowerCase();
      if (rl.includes("high") || rl.includes("critical")) riskLevel = "High";
      else if (rl.includes("medium")) riskLevel = "Medium";
      else if (rl.includes("low") || rl.includes("lower")) riskLevel = "Low";
    }

    // Determine documents/registration reason
    const docRegReason = /plate|registration|ifta|cab card|document|license/i.test(finalReason)
      ? finalReason.split("; ").find(r => /plate|registration|ifta|cab card|document|license/i.test(r))
      : undefined;

    return {
      status: clean(row[0]) as InspectionRecord["status"],
      reportNo,
      inspectionDate,
      fmcsaPostDate: parseDate(row[3]),
      inspectionLevel: clean(row[4]) as InspectionRecord["inspectionLevel"],
      oosViolations: parseInteger(row[5]),
      driver: driverRaw,
      vin,
      vehiclePlate: clean(row[8]),
      points,
      charges: chargeAmount,
      totalViolationPoints,
      chargeAmount,
      violationReason: finalReason,
      safetyLossImpact,
      companyExpenseImpact,
      riskLevel,
      crashIndicator,
      hoursOfServiceCompliance,
      vehicleMaintenance,
      controlledSubstancesAndAlcohol,
      unsafeDrivingReason: unsafeReason !== "No violations" ? unsafeReason : undefined,
      hosComplianceReason: hosReason !== "No violations" ? hosReason : undefined,
      vehicleMaintenanceReason: maintenanceReason !== "No violations" ? maintenanceReason : undefined,
      alcoholSubstanceReason: alcoholReason !== "No violations" ? alcoholReason : undefined,
      crashIndicatorReason: crashReason !== "No violations" ? crashReason : undefined,
      documentsRegistrationReason: docRegReason,
      unit: fleetMatch?.unit ?? "",
      year: fleetMatch?.year ?? 0,
      make: fleetMatch?.make ?? "",
      plate: fleetMatch?.plate ?? clean(row[8]),
      price: chargeAmount,
      totalPrice: chargeAmount,
      expenseType: companyExpenseImpact > 0 ? "Company Expense" : "Driver Charges",
      violationCategory,
    } satisfies InspectionRecord;
  });
}

function loadDriverChargeRecords(rows: CsvRow[]) {
  return rows
    .filter((row) => /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(clean(row[0])))
    .map((row) => {
      const amountText = clean(row[3]);
      return {
        inspectionDate: parseDate(row[0]),
        driver: clean(row[1]),
        reason: normalizeReason(row[2]),
        amount: parseAmount(amountText),
        rawAmount: amountText,
      } satisfies DriverChargeRecord;
    });
}

function loadFleetCostRecords(rows: CsvRow[]) {
  const records: FleetCostRecord[] = [];
  let currentExpenseType: FleetCostRecord["expenseType"] = "Supplement";
  let currentRecordDate = new Date().toISOString().slice(0, 10);

  for (const row of rows) {
    const marker = clean(row[0]);
    let isMarker = false;

    if (/SUPPLEMENT/i.test(marker)) {
      currentExpenseType = "Supplement";
      const yearMatch = marker.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : "2026";
      currentRecordDate = `${year}-01-01`;
      isMarker = true;
    } else if (/RENEWAL/i.test(marker)) {
      currentExpenseType = "Renewal";
      const yearMatch = marker.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : "2027";
      currentRecordDate = `${year}-01-01`;
      isMarker = true;
    } else if (/^\d{4}$/.test(marker)) {
      currentRecordDate = `${marker}-01-01`;
    }

    const unit = clean(row[1]);
    const vin = clean(row[2]);
    const vehicleYear = parseInteger(row[3]);
    const make = clean(row[4]);
    const plate = clean(row[5]);
    const price = parseAmount(row[6]);
    const totalPrice = parseAmount(row[8] || row[7] || row[6]);

    // Skip headers or empty rows within sections
    // Also skip if year is clearly wrong (like the 518 from child support)
    if (!vin || (!unit && !plate && !price && !totalPrice) || vehicleYear < 1900 || vehicleYear > 2026) {
      continue;
    }

    // If it's a marker but has data (like the RENEWAL line), we don't continue, we process it.
    // However, if it's just a header like "SUPPLEMENT,UNIT,VIN..." we should skip it.
    if (isMarker && (unit === "UNIT" || unit === "Unit")) {
      continue;
    }

    records.push({
      recordDate: currentRecordDate,
      unit,
      vin,
      year: vehicleYear,
      make,
      plate,
      price,
      totalPrice,
      expenseType: currentExpenseType,
      notes: currentExpenseType,
    });
  }

  return records;
}

type DriverFinancialSummary = {
  driver: string;
  points: number;
  charges: number;
  reason: string;
  safetyImpact: string;
  expenseImpact: string;
  riskLevel: string;
};

type DriverComplianceSummary = {
  driver: string;
  unsafe: string;
  crash: string;
  hos: string;
  maintenance: string;
  alcohol: string;
  date: string;
};

export async function loadSafetyComplianceData(): Promise<LoadedSafetyComplianceData> {
  const sheetId = process.env.DATA;
  if (!sheetId) {
    throw new Error("Missing DATA env var for Safety & Compliance sheet");
  }

  const urls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
  ];

  let csvText = "";
  for (const url of urls) {
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) {
      csvText = await response.text();
      break;
    }
  }

  if (!csvText) {
    throw new Error("Unable to load Safety & Compliance sheet");
  }

  const rows = parseCsv(csvText);

  const inspectionRows: CsvRow[] = [];
  const driverChargeRows: CsvRow[] = [];
  const fleetCostRows: CsvRow[] = [];
  const financialSummaries = new Map<string, DriverFinancialSummary>();
  const complianceSummaries = new Map<string, DriverComplianceSummary>();

  let currentSection: "unknown" | "fleet" = "unknown";
  let inComplianceSummary = false;

  for (const row of rows) {
    const col0 = clean(row[0]);
    const col16 = clean(row[16]);

    // Financial Summary Island (Col 16-23)
    // Check if col16 is a driver and col17 is points or if it's the header
    if (col16 && col16 !== "Driver" && col16 !== "DRIVERS" && row.length > 17) {
      const points = parseInteger(row[17]);
      const charges = parseAmount(row[18]);
      if (!isNaN(points) || charges > 0) {
        if (!inComplianceSummary) {
          financialSummaries.set(normalizeName(col16), {
            driver: col16,
            points,
            charges,
            reason: clean(row[19]),
            safetyImpact: clean(row[20]),
            expenseImpact: clean(row[21]),
            riskLevel: clean(row[22]),
          });
        }
      }
    }

    // Identify Compliance Summary start
    if (col16 === "DRIVERS" && clean(row[17]).includes("Unsafe")) {
      inComplianceSummary = true;
      continue;
    }

    if (inComplianceSummary && col16 && row.length > 22) {
      const date = parseDate(row[22]);
      if (date) {
        complianceSummaries.set(`${normalizeName(col16)}_${date}`, {
          driver: col16,
          unsafe: clean(row[17]),
          crash: clean(row[18]),
          hos: clean(row[19]),
          maintenance: clean(row[20]),
          alcohol: clean(row[21]),
          date,
        });
      }
    }

    if (/SUPPLEMENT|RENEWAL/i.test(col0)) {
      currentSection = "fleet";
    } else if (col0 === "" && clean(row[1]) === "Spent For") {
      currentSection = "unknown"; // End of fleet section
    }

    if (currentSection === "fleet") {
      fleetCostRows.push(row);
    } else if (/^(NO|OOS|YES|REVIEW)$/i.test(col0)) {
      inspectionRows.push(row);
    } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(col0)) {
      driverChargeRows.push(row);
    }
  }

  const driverCharges = loadDriverChargeRecords(driverChargeRows);
  const fleetCostRecords = loadFleetCostRecords(fleetCostRows);

  const fleetLookupByVin = new Map(
    fleetCostRecords.map((record) => [
      record.vin,
      {
        unit: record.unit,
        year: record.year,
        make: record.make,
        plate: record.plate,
      },
    ]),
  );

  const matchedChargeIndices = new Set<number>();
  const inspectionRecords = loadInspectionRecords(
    inspectionRows,
    driverCharges,
    matchedChargeIndices,
    fleetLookupByVin,
    financialSummaries,
    complianceSummaries,
  );

  const virtualInspections: InspectionRecord[] = driverCharges
    .filter((_, i) => !matchedChargeIndices.has(i))
    .map((dc) => ({
      status: "NO",
      reportNo: "NON-INSPECTION",
      inspectionDate: dc.inspectionDate,
      fmcsaPostDate: dc.inspectionDate,
      inspectionLevel: "DRIVER-ONLY",
      oosViolations: 0,
      driver: dc.driver,
      vin: "",
      vehiclePlate: "",
      points: 0,
      charges: dc.amount,
      totalViolationPoints: 0,
      chargeAmount: dc.amount,
      violationReason: dc.reason,
      safetyLossImpact: dc.amount,
      companyExpenseImpact: /registration|plate|ifta|towing|portal/i.test(dc.reason)
        ? dc.amount
        : 0,
      riskLevel: "Low",
      crashIndicator: "No",
      hoursOfServiceCompliance: "Pass",
      vehicleMaintenance: "Pass",
      controlledSubstancesAndAlcohol: "Pass",
      unsafeDrivingReason: undefined,
      hosComplianceReason: undefined,
      vehicleMaintenanceReason: undefined,
      alcoholSubstanceReason: undefined,
      crashIndicatorReason: undefined,
      documentsRegistrationReason: /plate|registration|ifta|cab card|document|license/i.test(dc.reason) ? dc.reason : undefined,
      unit: "",
      year: 0,
      make: "",
      plate: "",
      price: dc.amount,
      totalPrice: dc.amount,
      expenseType: "Driver Charges",
      violationCategory: categoryFromReason(dc.reason),
    }));

  return {
    inspectionRecords: [...inspectionRecords, ...virtualInspections],
    driverChargeRecords: driverCharges,
    fleetCostRecords,
  };
}
