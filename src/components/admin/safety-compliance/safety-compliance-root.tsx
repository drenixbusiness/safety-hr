"use client";

import { useMemo, useRef, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import {
  SafetyComplianceProvider,
  useSafetyCompliance,
  useViolationCategoryMonthSelection,
  ViolationCategoryMonthSelectionProvider,
} from "@/components/admin/safety-compliance/safety-compliance-context";
import type {
  DriverChargeRecord,
  FleetCostRecord,
  InspectionRecord,
} from "@/lib/safety-compliance-data";
import { monthKey } from "@/lib/safety-compliance-data";
import type { InspectionSheetSummary } from "@/lib/safety-compliance-types";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MAX_YEAR = 2026;


function CompactMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[100px] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function MonthYearPicker() {
  const { selectedMonths, setSelectedMonths, availableMonths } =
    useViolationCategoryMonthSelection();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dataMonthSet = useMemo(() => new Set(availableMonths), [availableMonths]);

  // Year range: from earliest data year to MAX_YEAR
  const minYear = useMemo(() => {
    if (!availableMonths.length) return MAX_YEAR;
    return Math.min(...availableMonths.map((m) => parseInt(m.slice(0, 4), 10)));
  }, [availableMonths]);

  const years = useMemo(
    () => Array.from({ length: MAX_YEAR - minYear + 1 }, (_, i) => minYear + i),
    [minYear],
  );

  const [activeYear, setActiveYear] = useState<number>(() => {
    if (!availableMonths.length) return MAX_YEAR;
    return Math.max(...availableMonths.map((m) => parseInt(m.slice(0, 4), 10)));
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleMonth = (key: string) => {
    setSelectedMonths(
      selectedMonths.includes(key)
        ? selectedMonths.filter((m) => m !== key)
        : [...selectedMonths, key],
    );
  };

  const selectionLabel = useMemo(() => {
    if (selectedMonths.length === 0) return "All months";
    if (selectedMonths.length === 1) {
      const [yr, mo] = selectedMonths[0].split("-").map(Number);
      return `${MONTH_NAMES[mo - 1]} ${yr}`;
    }
    return `${selectedMonths.length} months selected`;
  }, [selectedMonths]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
      >
        <CalendarDays className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <span>{selectionLabel}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
          {/* Year tabs */}
          {years.length > 1 && (
            <div className="mb-3 flex gap-1">
              {years.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setActiveYear(yr)}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
                    activeYear === yr
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}

          {/* 4×3 month grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_NAMES.map((name, idx) => {
              const key = `${activeYear}-${String(idx + 1).padStart(2, "0")}`;
              const hasData = dataMonthSet.has(key);
              const selected = selectedMonths.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleMonth(key)}
                  className={`relative flex flex-col items-center rounded-lg px-2 py-2.5 text-xs font-semibold transition ${
                    selected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : hasData
                        ? "border border-zinc-200 text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        : "text-zinc-300 hover:bg-zinc-50 hover:text-zinc-400"
                  }`}
                >
                  {name}
                  {/* Dot indicator: data exists for this month */}
                  {hasData && !selected && (
                    <span className="mt-0.5 size-1 rounded-full bg-emerald-500" />
                  )}
                  {selected && <Check className="mt-0.5 size-2.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setSelectedMonths([]);
                setOpen(false);
              }}
              className="text-xs text-zinc-500 transition hover:text-zinc-950"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedMonths([...availableMonths]);
                setOpen(false);
              }}
              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              Select all with data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function SafetyComplianceHeaderPortal() {
  const isClient = useIsClient();
  const { stats } = useSafetyCompliance();

  if (!isClient) return null;

  const slot = document.getElementById("sc-header-slot");
  if (!slot) return null;

  return createPortal(
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
      <MonthYearPicker />
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <CompactMetricCard label="Inspections" value={String(stats.inspectionCount)} />
        <CompactMetricCard label="Drivers" value={String(stats.driverCount)} />
        <CompactMetricCard label="Source" value={stats.dataSource} />
      </div>
    </div>,
    slot,
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
  const availableMonths = useMemo(
    () =>
      Array.from(
        new Set(
          inspectionRecords.map((record) => monthKey(record.inspectionDate)).filter(Boolean),
        ),
      ).sort(),
    [inspectionRecords],
  );

  return (
    <SafetyComplianceProvider
      inspectionRecords={inspectionRecords}
      driverChargeRecords={driverChargeRecords}
      fleetCostRecords={fleetCostRecords}
      inspectionSheetSummary={inspectionSheetSummary}
    >
      <ViolationCategoryMonthSelectionProvider availableMonths={availableMonths}>
        <SafetyComplianceHeaderPortal />
        <div className="space-y-6">{children}</div>
      </ViolationCategoryMonthSelectionProvider>
    </SafetyComplianceProvider>
  );
}
