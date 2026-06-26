"use client";

import {
  type DriverChargeRecord,
  type FleetCostRecord,
  type InspectionRecord,
  type RiskLevel,
  monthKey,
} from "@/lib/safety-compliance-data";
import type { InspectionSheetSummary } from "@/lib/safety-compliance-types";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type FilterKey =
  | "startDate"
  | "endDate"
  | "driver"
  | "status"
  | "inspectionLevel"
  | "riskLevel"
  | "vehiclePlate"
  | "unit"
  | "violationCategory"
  | "expenseType";

export type SafetyComplianceFilters = Record<FilterKey, string>;

type SafetyComplianceContextValue = {
  filters: SafetyComplianceFilters;
  setFilter: <K extends FilterKey>(key: K, value: string) => void;
  resetFilters: () => void;
  filteredInspections: InspectionRecord[];
  filteredDriverCharges: DriverChargeRecord[];
  filteredFleetCosts: FleetCostRecord[];
  inspectionSheetSummary: InspectionSheetSummary;
  dateBounds: {
    minDate: string;
    maxDate: string;
  };
  stats: {
    inspectionCount: number;
    driverCount: number;
    fleetRecordCount: number;
    chargeRecordCount: number;
    dataSource: string;
  };
  options: {
    drivers: string[];
    statuses: string[];
    inspectionLevels: string[];
    riskLevels: string[];
    vehiclePlates: string[];
    units: string[];
    violationCategories: string[];
    expenseTypes: string[];
    years: number[];
  };
};

const Context = createContext<SafetyComplianceContextValue | null>(null);

function withinRange(value: string, start: string, end: string) {
  if (!start || !end) return true;
  return value >= start && value <= end;
}

function matchesFilter(value: string, filter: string) {
  return !filter || value === filter;
}

function matchesText(value: string | undefined, filter: string) {
  return !filter || value === filter;
}

function createInitialFilters(allDates: string[]): SafetyComplianceFilters {
  const sortedDates = [...allDates].filter(Boolean).sort();
  return {
    startDate: sortedDates[0] ?? "",
    endDate: sortedDates.at(-1) ?? "",
    driver: "",
    status: "",
    inspectionLevel: "",
    riskLevel: "",
    vehiclePlate: "",
    unit: "",
    violationCategory: "",
    expenseType: "",
  };
}

function filterInspections(
  records: InspectionRecord[],
  filters: SafetyComplianceFilters,
) {
  return records.filter((record) => {
    return (
      withinRange(record.inspectionDate, filters.startDate, filters.endDate) &&
      matchesFilter(record.driver, filters.driver) &&
      matchesFilter(record.status, filters.status) &&
      matchesFilter(record.inspectionLevel, filters.inspectionLevel) &&
      matchesFilter(record.riskLevel, filters.riskLevel) &&
      matchesFilter(record.vehiclePlate, filters.vehiclePlate) &&
      matchesFilter(record.unit, filters.unit) &&
      matchesFilter(record.violationCategory, filters.violationCategory) &&
      matchesFilter(record.expenseType, filters.expenseType)
    );
  });
}

function filterFleetCosts(
  records: FleetCostRecord[],
  filters: SafetyComplianceFilters,
) {
  return records.filter((record) => {
    return (
      withinRange(record.recordDate, filters.startDate, filters.endDate) &&
      matchesText(record.driverName, filters.driver) &&
      matchesFilter(record.plate, filters.vehiclePlate) &&
      matchesFilter(record.unit, filters.unit) &&
      matchesFilter(record.expenseType, filters.expenseType)
    );
  });
}

export const safetyComplianceSectionNav = [
  { label: "Dashboard", href: "/safety-compliance" },
  { label: "Inspections", href: "/safety-compliance/inspections" },
  { label: "Driver Scorecard", href: "/safety-compliance/driver-scorecard" },
  {
    label: "Violation Categories",
    href: "/safety-compliance/violation-categories",
  },
  { label: "Financial Impact", href: "/safety-compliance/financial-impact" },
  {
    label: "Fleet & Plate Costs",
    href: "/safety-compliance/fleet-plate-costs",
  },
] as const;

export function SafetyComplianceProvider({
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
  const allDates = useMemo(
    () =>
      [
        ...inspectionRecords.map((record) => record.inspectionDate),
        ...driverChargeRecords.map((record) => record.inspectionDate),
        ...fleetCostRecords.map((record) => record.recordDate),
      ]
        .filter(Boolean)
        .sort(),
    [driverChargeRecords, fleetCostRecords, inspectionRecords],
  );

  const defaultFilters = useMemo(() => createInitialFilters(allDates), [allDates]);
  const [filters, setFilters] = useState<SafetyComplianceFilters>(defaultFilters);

  const inspectionStatuses = useMemo(
    () => Array.from(new Set(inspectionRecords.map((record) => record.status))).sort(),
    [inspectionRecords],
  );

  const drivers = useMemo(
    () =>
      Array.from(
        new Set([
          ...inspectionRecords.map((record) => record.driver),
          ...driverChargeRecords.map((record) => record.driver),
          ...fleetCostRecords.map((record) => record.driverName ?? ""),
        ].filter(Boolean)),
      ).sort(),
    [driverChargeRecords, fleetCostRecords, inspectionRecords],
  );

  const vehiclePlates = useMemo(
    () =>
      Array.from(
        new Set([
          ...inspectionRecords.map((record) => record.vehiclePlate),
          ...fleetCostRecords.map((record) => record.plate),
        ].filter(Boolean)),
      ).sort(),
    [fleetCostRecords, inspectionRecords],
  );

  const units = useMemo(
    () =>
      Array.from(
        new Set([
          ...inspectionRecords.map((record) => record.unit),
          ...fleetCostRecords.map((record) => record.unit),
        ].filter(Boolean)),
      ).sort(),
    [fleetCostRecords, inspectionRecords],
  );

  const inspectionLevelOptions = useMemo(
    () =>
      Array.from(new Set(inspectionRecords.map((record) => record.inspectionLevel))).sort(),
    [inspectionRecords],
  );

  const riskLevelOptions = useMemo(() => {
    const rank: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2 };
    return Array.from(new Set(inspectionRecords.map((record) => record.riskLevel))).sort(
      (a, b) => rank[a] - rank[b],
    );
  }, [inspectionRecords]);

  const violationCategoryOptions = useMemo(
    () =>
      Array.from(new Set(inspectionRecords.map((record) => record.violationCategory))).sort(),
    [inspectionRecords],
  );

  const expenseTypeOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...inspectionRecords.map((record) => record.expenseType),
          ...fleetCostRecords.map((record) => record.expenseType),
        ].filter(Boolean)),
      ).sort(),
    [fleetCostRecords, inspectionRecords],
  );

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          allDates
            .map((date) => Number(monthKey(date).slice(0, 4)))
            .filter((year) => Number.isFinite(year)),
        ),
      ).sort((a, b) => a - b),
    [allDates],
  );

  const filteredInspections = useMemo(
    () => filterInspections(inspectionRecords, filters),
    [filters, inspectionRecords],
  );

  const filteredDriverCharges = useMemo(
    () =>
      driverChargeRecords.filter((record) => {
        return (
          withinRange(record.inspectionDate, filters.startDate, filters.endDate) &&
          matchesText(record.driver, filters.driver)
        );
      }),
    [driverChargeRecords, filters],
  );

  const filteredFleetCosts = useMemo(
    () => filterFleetCosts(fleetCostRecords, filters),
    [fleetCostRecords, filters],
  );

  const value = useMemo<SafetyComplianceContextValue>(
    () => ({
      filters,
      setFilter: (key, value) =>
        setFilters((current) => ({ ...current, [key]: value })),
      resetFilters: () => setFilters(defaultFilters),
      filteredInspections,
      filteredDriverCharges,
      filteredFleetCosts,
      inspectionSheetSummary,
      dateBounds: {
        minDate: allDates[0] ?? "",
        maxDate: allDates.at(-1) ?? "",
      },
      stats: {
        inspectionCount: inspectionRecords.length,
        driverCount: drivers.length,
        fleetRecordCount: fleetCostRecords.length,
        chargeRecordCount: driverChargeRecords.length,
        dataSource: "Google Sheet",
      },
      options: {
        drivers,
        statuses: inspectionStatuses,
        inspectionLevels: inspectionLevelOptions,
        riskLevels: riskLevelOptions,
        vehiclePlates,
        units,
        violationCategories: violationCategoryOptions,
        expenseTypes: expenseTypeOptions,
        years,
      },
    }),
    [
      allDates,
      defaultFilters,
      driverChargeRecords.length,
      drivers,
      expenseTypeOptions,
      filteredDriverCharges,
      filteredFleetCosts,
      filteredInspections,
      inspectionSheetSummary,
      filters,
      fleetCostRecords.length,
      inspectionLevelOptions,
      inspectionRecords.length,
      inspectionStatuses,
      riskLevelOptions,
      units,
      vehiclePlates,
      violationCategoryOptions,
      years,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSafetyCompliance() {
  const value = useContext(Context);
  if (!value) {
    throw new Error(
      "useSafetyCompliance must be used within SafetyComplianceProvider",
    );
  }
  return value;
}
