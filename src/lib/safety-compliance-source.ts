import "server-only";

import {
  categoryFromReason,
  type DriverChargeRecord,
  type FleetCostRecord,
  type InspectionRecord,
  riskLabelFromPoints,
  normalizeName,
  type RiskLevel,
} from "@/lib/safety-compliance-data";
import type { InspectionSheetSummary } from "@/lib/safety-compliance-types";

type CsvRow = string[];

type LoadedSafetyComplianceData = {
  inspectionRecords: InspectionRecord[];
  driverChargeRecords: DriverChargeRecord[];
  fleetCostRecords: FleetCostRecord[];
  inspectionSheetSummary: InspectionSheetSummary;
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

// Normalize a raw state value from the sheet to a 2-letter USPS abbreviation.
// Accepts both "TX" and "Texas".
const STATE_NAME_TO_ABBREV: Record<string, string> = {
  "alabama":"AL","alaska":"AK","arizona":"AZ","arkansas":"AR","california":"CA",
  "colorado":"CO","connecticut":"CT","delaware":"DE","florida":"FL","georgia":"GA",
  "hawaii":"HI","idaho":"ID","illinois":"IL","indiana":"IN","iowa":"IA",
  "kansas":"KS","kentucky":"KY","louisiana":"LA","maine":"ME","maryland":"MD",
  "massachusetts":"MA","michigan":"MI","minnesota":"MN","mississippi":"MS","missouri":"MO",
  "montana":"MT","nebraska":"NE","nevada":"NV","new hampshire":"NH","new jersey":"NJ",
  "new mexico":"NM","new york":"NY","north carolina":"NC","north dakota":"ND","ohio":"OH",
  "oklahoma":"OK","oregon":"OR","pennsylvania":"PA","rhode island":"RI","south carolina":"SC",
  "south dakota":"SD","tennessee":"TN","texas":"TX","utah":"UT","vermont":"VT",
  "virginia":"VA","washington":"WA","west virginia":"WV","wisconsin":"WI","wyoming":"WY",
  "district of columbia":"DC",
};

const VALID_STATE_ABBREVS = new Set(Object.values(STATE_NAME_TO_ABBREV));

function normalizeState(raw: string): string | undefined {
  if (!raw) return undefined;
  const upper = raw.trim().toUpperCase();
  if (VALID_STATE_ABBREVS.has(upper)) return upper;
  const fromName = STATE_NAME_TO_ABBREV[raw.trim().toLowerCase()];
  return fromName ?? undefined;
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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseDate(value: string | undefined) {
  const cleaned = clean(value);
  if (!cleaned) return "";


  const iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${pad2(Number(m))}-${pad2(Number(d))}`;
  }

  const parts = cleaned.split(/[/-]/).map((part) => Number(part));
  if (parts.length === 3) {
    const [month, day, year] = parts;
    if (month && day && year) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return "";
}

function normalizeHeader(value: string) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function findColumnIndex(headers: CsvRow, candidates: string[]) {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeHeader(candidate);
    const index = normalizedHeaders.findIndex((header) => header === normalizedCandidate);
    if (index >= 0) return index;
  }
  return -1;
}

type InspectionSheetColumns = {
  inspectionDate: number;
  reportNo: number;
  fmcsaPostDate: number;
  inspectionLevel: number;
  oosViolations: number;
  driver: number;
  vin: number;
  vehiclePlate: number;
  points: number;
  charges: number;
  unsafeDrivingPoints: number;
  hosPoints: number;
  vehicleMaintenancePoints: number;
  driverFitnessPoints: number;
  insuranceAndOtherPoints: number;
  state?: number;
};

function buildInspectionColumns(headers: CsvRow): InspectionSheetColumns {
  const required = {
    inspectionDate: findColumnIndex(headers, ["Inspection Date"]),
    reportNo: findColumnIndex(headers, ["Report #", "Report No", "Report"]),
    fmcsaPostDate: findColumnIndex(headers, ["FMCSA Post Date"]),
    inspectionLevel: findColumnIndex(headers, ["Inspection Level"]),
    oosViolations: findColumnIndex(headers, ["# OOS Violations", "OOS Violations"]),
    driver: findColumnIndex(headers, ["Driver"]),
    vin: findColumnIndex(headers, ["VIN"]),
    vehiclePlate: findColumnIndex(headers, ["Veh Plate", "Vehicle Plate"]),
    points: findColumnIndex(headers, ["Points"]),
    charges: findColumnIndex(headers, ["charges", "Charges"]),
    unsafeDrivingPoints: findColumnIndex(headers, ["UNSAFE DRIVING"]),
    hosPoints: findColumnIndex(headers, ["HOS"]),
    vehicleMaintenancePoints: findColumnIndex(headers, ["VEHICLE MAINTANCE", "VEHICLE MAINTENANCE"]),
    driverFitnessPoints: findColumnIndex(headers, ["DRIVER FITNESS"]),
    insuranceAndOtherPoints: findColumnIndex(headers, ["INURANCE AND OTHER", "INSURANCE AND OTHER"]),
  };

  const missing = Object.entries(required).filter(([, index]) => index < 0).map(([name]) => name);
  if (missing.length) {
    throw new Error(`Inspection sheet is missing expected columns: ${missing.join(", ")}`);
  }

  const stateIndex = findColumnIndex(headers, ["State", "Inspection State", "ST", "State Code"]);

  return {
    ...required,
    ...(stateIndex >= 0 ? { state: stateIndex } : {}),
  };
}

function isInspectionFooterRow(row: CsvRow, columns: InspectionSheetColumns) {
  const leadingBlank = row.slice(0, columns.points).every((cell) => clean(cell) === "");
  return (
    leadingBlank &&
    parseInteger(row[columns.points]) > 0 &&
    parseInteger(row[columns.charges]) >= 0 &&
    parseInteger(row[columns.unsafeDrivingPoints]) >= 0 &&
    parseInteger(row[columns.hosPoints]) >= 0 &&
    parseInteger(row[columns.vehicleMaintenancePoints]) >= 0 &&
    parseInteger(row[columns.driverFitnessPoints]) >= 0 &&
    parseInteger(row[columns.insuranceAndOtherPoints]) >= 0
  );
}

function parseInspectionSheetSummary(row: CsvRow, columns: InspectionSheetColumns): InspectionSheetSummary {
  const unsafeDrivingPoints = parseInteger(row[columns.unsafeDrivingPoints]);
  const hosPoints = parseInteger(row[columns.hosPoints]);
  const vehicleMaintenancePoints = parseInteger(row[columns.vehicleMaintenancePoints]);
  const driverFitnessPoints = parseInteger(row[columns.driverFitnessPoints]);
  const insuranceAndOtherPoints = parseInteger(row[columns.insuranceAndOtherPoints]);

  return {
    totalInspectionPoints: parseInteger(row[columns.points]),
    totalCharges: parseAmount(row[columns.charges]),
    unsafeDrivingPoints,
    hosPoints,
    vehicleMaintenancePoints,
    driverFitnessPoints,
    insuranceAndOtherPoints,
    categoryPointsTotal:
      parseInteger(row[columns.insuranceAndOtherPoints + 1]) ||
      unsafeDrivingPoints + hosPoints + vehicleMaintenancePoints + driverFitnessPoints + insuranceAndOtherPoints,
  };
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
  if (
    !cleaned ||
    /^(NO VIOLATION|NO VIOLATIONS|NONE|CLEAN|NO CHARGE LISTED|NO CHARGES)$/i.test(cleaned)
  ) {
    return "No violations";
  }
  return cleaned;
}

function loadInspectionRecords(
  rows: CsvRow[],
  columns: InspectionSheetColumns,
  driverCharges: DriverChargeRecord[],
  matchedChargeIndices: Set<number>,
  fleetLookupByVin: Map<string, { unit: string; year: number; make: string; plate: string }>,
  financialSummaries: Map<string, DriverFinancialSummary>,
  complianceSummaries: Map<string, DriverComplianceSummary>,
) {
  return rows
    .filter((row) => !isInspectionFooterRow(row, columns))
    .map((row) => {
      const reportNo = clean(row[columns.reportNo]);
      const inspectionDate = parseDate(row[columns.inspectionDate]);
      const driverRaw = clean(row[columns.driver]);
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

      const complianceKey = `${driverNormalized}_${inspectionDate}`;
      const compSummary = complianceSummaries.get(complianceKey);
      const finSummary = financialSummaries.get(driverNormalized);

      const reason = normalizeReason(matchedCharge?.reason);
      const unsafeReason = normalizeReason(compSummary?.unsafe);
      const hosReason = normalizeReason(compSummary?.hos);
      const maintenanceReason = normalizeReason(compSummary?.maintenance);
      const alcoholReason = normalizeReason(compSummary?.alcohol);
      const crashReason = normalizeReason(compSummary?.crash);

      const detectedReasons = new Set<string>();
      if (reason !== "No violations") detectedReasons.add(reason);
      if (unsafeReason !== "No violations") detectedReasons.add(unsafeReason);
      if (hosReason !== "No violations") detectedReasons.add(hosReason);
      if (maintenanceReason !== "No violations") detectedReasons.add(maintenanceReason);
      if (alcoholReason !== "No violations") detectedReasons.add(alcoholReason);
      if (crashReason !== "No violations") detectedReasons.add(crashReason);

      const totalViolationPoints = parseInteger(row[columns.points]);
      const oosViolations = parseInteger(row[columns.oosViolations]);
      if (detectedReasons.size === 0 && (oosViolations > 0 || totalViolationPoints > 0)) {
        detectedReasons.add("Citation");
      }

      const finalReason = detectedReasons.size > 0
        ? Array.from(detectedReasons).join("; ")
        : "No violations";

      const sheetCharges = parseAmount(row[columns.charges]);
      const chargeAmount = matchedCharge?.amount ?? sheetCharges;
      const violationCategory = categoryFromReason(finalReason);
      const companyExpenseImpact = /registration|plate|ifta|towing|portal/i.test(finalReason)
        ? chargeAmount
        : 0;
      const safetyLossImpact = totalViolationPoints * 25 + chargeAmount;
      const vin = clean(row[columns.vin]);
      const fleetMatch = fleetLookupByVin.get(vin);

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

      const docRegReason = /plate|registration|ifta|cab card|document|license/i.test(finalReason)
        ? finalReason.split("; ").find((r) => /plate|registration|ifta|cab card|document|license/i.test(r))
        : undefined;
      const unsafeDrivingPoints = parseInteger(row[columns.unsafeDrivingPoints]);
      const hosPoints = parseInteger(row[columns.hosPoints]);
      const vehicleMaintenancePoints = parseInteger(row[columns.vehicleMaintenancePoints]);
      const driverFitnessPoints = parseInteger(row[columns.driverFitnessPoints]);
      const insuranceAndOtherPoints = parseInteger(row[columns.insuranceAndOtherPoints]);

      return {
        status: oosViolations > 0 ? "OOS" : "Clean Inspection",
        reportNo,
        inspectionDate,
        fmcsaPostDate: parseDate(row[columns.fmcsaPostDate]),
        inspectionLevel: clean(row[columns.inspectionLevel]) as InspectionRecord["inspectionLevel"],
        oosViolations,
        driver: driverRaw,
        vin,
        vehiclePlate: clean(row[columns.vehiclePlate]),
        points: totalViolationPoints,
        charges: chargeAmount,
        sheetCharges,
        incomeAmount: finSummary?.charges ?? chargeAmount,
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
        unsafeDrivingPoints,
        hosPoints,
        vehicleMaintenancePoints,
        driverFitnessPoints,
        insuranceAndOtherPoints,
        unit: fleetMatch?.unit ?? "",
        year: fleetMatch?.year ?? 0,
        make: fleetMatch?.make ?? "",
        plate: fleetMatch?.plate ?? clean(row[columns.vehiclePlate]),
        price: chargeAmount,
        totalPrice: chargeAmount,
        expenseType: companyExpenseImpact > 0 ? "Company Expense" : "Driver Charges",
        violationCategory,
        state: (columns.state !== undefined && columns.state >= 0)
          ? normalizeState(clean(row[columns.state]))
          : undefined,
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
    const supplement = parseAmount(row[7]);
    const totalPrice = parseAmount(row[8]);

    if (!vin || (!unit && !plate && !price && !totalPrice) || vehicleYear < 1900) {
      continue;
    }

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
      supplement,
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

function extractSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/spreadsheets\/d\/([^/]+)/);
  if (match) return match[1];
  if (/^[A-Za-z0-9-_]+$/.test(trimmed)) return trimmed;
  throw new Error("Invalid DATA env var. Expecting full Google Sheet URL or spreadsheet ID.");
}

export async function loadSafetyComplianceData(): Promise<LoadedSafetyComplianceData> {
  const dataEnv = process.env.DATA;
  if (!dataEnv) {
    throw new Error("Missing DATA env var for Safety & Compliance sheet");
  }
  const sheetId = extractSheetId(dataEnv);

  const inspectionTabRows: CsvRow[] = [];
  const baseRows: CsvRow[] = [];

  const inspectionsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=1177354161`;
  try {
    const res = await fetch(inspectionsUrl, { cache: "no-store" });
    if (res.ok) {
      const csv = await res.text();
      inspectionTabRows.push(...parseCsv(csv));
    }
  } catch (error) {
    console.error("Failed to fetch inspections tab", error);
  }

  const baseUrls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
  ];
  for (const url of baseUrls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const csv = await res.text();
        baseRows.push(...parseCsv(csv));
        break;
      }
    } catch {
      // try next
    }
  }

  if (inspectionTabRows.length === 0) {
    throw new Error("Unable to load inspection data from Safety & Compliance sheet");
  }

  if (baseRows.length === 0) {
    throw new Error("Unable to load supporting Safety & Compliance sheet data");
  }

  const inspectionColumns = buildInspectionColumns(inspectionTabRows[0] ?? []);
  const inspectionDataRows = inspectionTabRows.slice(1);

  const inspectionRows: CsvRow[] = [];
  const driverChargeRows: CsvRow[] = [];
  const fleetCostRows: CsvRow[] = [];
  const financialSummaries = new Map<string, DriverFinancialSummary>();
  const complianceSummaries = new Map<string, DriverComplianceSummary>();

  let currentSection: "unknown" | "fleet" = "unknown";
  let inComplianceSummary = false;

  const seenChargeKeys = new Set<string>();

  for (const row of baseRows) {
    if (row.length < 2) continue;
    const col0 = clean(row[0]);
    const col1 = clean(row[1]);
    const col16 = clean(row[16]);

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
    } else if (col0 === "" && col1 === "Spent For") {
      currentSection = "unknown";
    }

    if (currentSection === "fleet") {
      fleetCostRows.push(row);
    } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(col0)) {
      const chargeKey = `${col0}_${col1}_${clean(row[2])}`;
      if (!seenChargeKeys.has(chargeKey)) {
        driverChargeRows.push(row);
        seenChargeKeys.add(chargeKey);
      }
    }
  }

  for (const row of inspectionDataRows) {
    if (isInspectionFooterRow(row, inspectionColumns)) continue;
    const reportNo = clean(row[inspectionColumns.reportNo]);
    const inspectionDate = clean(row[inspectionColumns.inspectionDate]);
    if (!reportNo || !inspectionDate) continue;
    inspectionRows.push(row);
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
    inspectionColumns,
    driverCharges,
    matchedChargeIndices,
    fleetLookupByVin,
    financialSummaries,
    complianceSummaries,
  );

  const footerRow = inspectionDataRows.find((row) => isInspectionFooterRow(row, inspectionColumns));
  const inspectionSheetSummary =
    footerRow ? parseInspectionSheetSummary(footerRow, inspectionColumns) : {
      totalInspectionPoints: inspectionRecords.reduce((sum, record) => sum + record.totalViolationPoints, 0),
      totalCharges: inspectionRecords.reduce((sum, record) => sum + record.chargeAmount, 0),
      unsafeDrivingPoints: 0,
      hosPoints: 0,
      vehicleMaintenancePoints: 0,
      driverFitnessPoints: 0,
      insuranceAndOtherPoints: 0,
      categoryPointsTotal: inspectionRecords.reduce((sum, record) => sum + record.totalViolationPoints, 0),
    };

  const virtualInspections: InspectionRecord[] = driverCharges
    .filter((_, i) => !matchedChargeIndices.has(i))
    .map((dc) => ({
      status: "Clean Inspection",
      reportNo: "NON-INSPECTION",
      inspectionDate: dc.inspectionDate,
      fmcsaPostDate: dc.inspectionDate,
      incomeAmount: 0,
      inspectionLevel: "DRIVER-ONLY",
      oosViolations: 0,
      driver: dc.driver,
      vin: "",
      vehiclePlate: "",
      points: 0,
      charges: dc.amount,
      sheetCharges: 0,
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
      unsafeDrivingPoints: 0,
      hosPoints: 0,
      vehicleMaintenancePoints: 0,
      driverFitnessPoints: 0,
      insuranceAndOtherPoints: 0,
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
    inspectionSheetSummary,
  };
}
