"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CircleAlert,
  CircleSlash2,
  DollarSign,
  Fingerprint,
  LineChart as LineChartIcon,
  Search,
  ShieldAlert,
  Truck,
} from "lucide-react";
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { useMemo, useState, type ReactNode } from "react";
import { useSafetyCompliance } from "@/components/admin/safety-compliance/safety-compliance-context";
import {
  aggregateCategories,
  aggregateChargesByCategory,
  aggregateChargesByDriver,
  aggregateChargesByReason,
  aggregateDriverSummaries,
  aggregateFleetByExpenseType,
  aggregateFleetByPlate,
  aggregateFleetByUnit,
  aggregateMonthlyFleetData,
  aggregateMonthlyInspectionData,
  aggregateFleetCostByYear,
  buildMonthlyCategoryTrend,
  aggregateRiskLevels,
  aggregateSafetyLossByCategory,
  formatCurrency,
  formatDate,
  formatTrend,
  mostExpensiveItemName,
  topDriversByCharges,
  topInspectionsByPoints,
  type CategorySummary,
  type DriverSummary,
} from "@/components/admin/safety-compliance/safety-compliance-analytics";
import {
  type FleetCostRecord,
  type InspectionRecord,
  type RiskLevel,
} from "@/lib/safety-compliance-data";

type TableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
};

type SortDirection = "asc" | "desc";

const chartColors = ["#0f766e", "#14b8a6", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#84cc16"];

function riskTone(risk: RiskLevel) {
  switch (risk) {
    case "Low":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Medium":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "High":
      return "bg-rose-50 text-rose-700 border-rose-200";
  }
}

function statusTone(status: InspectionRecord["status"]) {
  switch (status) {
    case "NO":
    case "Clean":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "OOS":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "YES":
    case "Review":
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h3>
      <p className="max-w-4xl text-sm text-zinc-500">{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  icon: typeof CircleAlert;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <div className={`text-2xl font-semibold tracking-tight ${tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-rose-700" : "text-zinc-950"}`}>
            {value}
          </div>
          {detail ? <p className="text-sm text-zinc-500">{detail}</p> : null}
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
  className = "",
  subtitle,
}: {
  title: string;
  icon: typeof BarChart3;
  children: ReactNode;
  className?: string;
  subtitle?: string;
}) {
  return (
    <section className={`w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-zinc-950">{title}</h4>
          {subtitle ? <p className="text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
      <div className="h-72 w-full min-w-0">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <CircleSlash2 className="size-6 animate-pulse" aria-hidden="true" />
      </div>
      <h4 className="text-base font-semibold text-zinc-950">{title}</h4>
      <p className="mt-1 max-w-lg text-sm text-zinc-500">{description}</p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${riskTone(risk)}`}>
      {risk}
    </span>
  );
}

function StatusBadge({ status }: { status: InspectionRecord["status"] }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}>
      {status}
    </span>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ArrowUpDown className="size-3.5 text-zinc-400" aria-hidden="true" />;
  return direction === "asc" ? (
    <ArrowUp className="size-3.5 text-zinc-700" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5 text-zinc-700" aria-hidden="true" />
  );
}

function DataTable<T>({
  title,
  rows,
  columns,
  searchPlaceholder = "Search table",
  searchText,
  emptyTitle,
  emptyDescription,
  initialSortKey,
}: {
  title: string;
  rows: T[];
  columns: TableColumn<T>[];
  searchPlaceholder?: string;
  searchText: (row: T) => string;
  emptyTitle: string;
  emptyDescription: string;
  initialSortKey?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(initialSortKey ?? columns[0]?.key ?? "");
  const [direction, setDirection] = useState<SortDirection>("desc");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const nextRows = normalized
      ? rows.filter((row) => searchText(row).toLowerCase().includes(normalized))
      : [...rows];

    const column = columns.find((item) => item.key === sortKey);
    if (!column?.sortValue) return nextRows;

    return nextRows.sort((a, b) => {
      const left = column.sortValue?.(a);
      const right = column.sortValue?.(b);
      if (typeof left === "number" && typeof right === "number") {
        return direction === "asc" ? left - right : right - left;
      }
      const leftText = String(left ?? "");
      const rightText = String(right ?? "");
      return direction === "asc"
        ? leftText.localeCompare(rightText)
        : rightText.localeCompare(leftText);
    });
  }, [columns, direction, query, rows, searchText, sortKey]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-zinc-950">{title}</h4>
          <p className="text-sm text-zinc-500">
            Search and sort are available in this table.
          </p>
        </div>
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Search table</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <input
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder={searchPlaceholder}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-zinc-50">
                <tr>
                  {columns.map((column) => {
                    const active = sortKey === column.key;
                    return (
                      <th
                        key={column.key}
                        className={`border-b border-zinc-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 ${column.className ?? ""}`}
                      >
                        <button
                          type="button"
                          className="inline-flex items-center gap-2"
                          onClick={() => {
                            if (active) {
                              setDirection((current) => (current === "asc" ? "desc" : "asc"));
                            } else {
                              setSortKey(column.key);
                              setDirection("desc");
                            }
                          }}
                        >
                          {column.header}
                          <SortIcon active={active} direction={direction} />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr key={index} className="transition hover:bg-zinc-50/80">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="border-b border-zinc-100 px-4 py-3 text-sm text-zinc-700"
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

type TooltipPayloadEntry = {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
  color?: string;
};

const currencyDataKeys =
  /charge|price|cost|expense|impact|amount|fee|totalprice/i;

function formatDataKeyLabel(dataKey?: string | number) {
  if (dataKey === undefined || dataKey === null || dataKey === "") return "Value";

  return String(dataKey)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function readPayloadLabel(payload?: Record<string, unknown>) {
  if (!payload) return null;

  for (const key of ["label", "month", "driver", "category", "name", "year"]) {
    const value = payload[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return null;
}

function resolveTooltipTitle(
  label: string | number | undefined,
  payload: TooltipPayloadEntry[],
) {
  if (label !== undefined && label !== null && String(label).trim() !== "") {
    return String(label);
  }

  return readPayloadLabel(payload[0]?.payload);
}

function resolveEntryLabel(entry: TooltipPayloadEntry) {
  if (entry.name && String(entry.name).trim() !== "") {
    return entry.name;
  }

  return readPayloadLabel(entry.payload) ?? formatDataKeyLabel(entry.dataKey);
}

function shouldFormatAsCurrency(dataKey?: string | number, value?: number | string) {
  if (typeof value !== "number") return false;

  const key = String(dataKey ?? "");
  if (currencyDataKeys.test(key)) return true;

  // Aggregated { name, value } charts use dollars for fleet/financial slices.
  if (key === "value" && value >= 200) return true;

  return false;
}

function formatTooltipValue(value: number | string | undefined, dataKey?: string | number) {
  if (value === undefined || value === null) return "—";
  if (typeof value === "number") {
    return shouldFormatAsCurrency(dataKey, value)
      ? formatCurrency(value)
      : value.toLocaleString("en-US");
  }

  return String(value);
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  const entries = payload.filter(
    (entry) => entry.value !== undefined && entry.value !== null,
  );
  if (!entries.length) return null;

  const title = resolveTooltipTitle(label, entries);
  const rows = entries.map((entry) => ({
    key: `${entry.dataKey ?? entry.name ?? "value"}-${entry.value}`,
    label: resolveEntryLabel(entry),
    value: formatTooltipValue(entry.value, entry.dataKey),
  }));

  const showHeader =
    title !== null &&
    !(rows.length === 1 && rows[0].label.toLowerCase() === title.toLowerCase());

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg">
      {showHeader ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </p>
      ) : null}
      <div className={showHeader ? "mt-1 space-y-1" : "space-y-1"}>
        {rows.map((entry) => (
          <p key={entry.key} className="text-sm text-zinc-700">
            <span className="font-medium">{entry.label}:</span> {entry.value}
          </p>
        ))}
      </div>
    </div>
  );
}

function PageSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <SectionHeader title={title} description={description} />
      {children}
    </section>
  );
}

function useAnalytics() {
  const { filteredInspections, filteredFleetCosts } = useSafetyCompliance();

  return useMemo(() => {
    const driverSummaries = aggregateDriverSummaries(filteredInspections);
    const categorySummaries = aggregateCategories(filteredInspections);
    const monthlyInspection = aggregateMonthlyInspectionData(filteredInspections);
    const monthlyFleet = aggregateMonthlyFleetData(filteredFleetCosts);
    const monthlyCategoryTrend = buildMonthlyCategoryTrend(filteredInspections);
    const chargesByDriver = aggregateChargesByDriver(filteredInspections);
    const chargesByReason = aggregateChargesByReason(filteredInspections);
    const chargesByCategory = aggregateChargesByCategory(filteredInspections);
    const safetyLossByCategory = aggregateSafetyLossByCategory(filteredInspections);
    const companyExpenseByType = aggregateFleetByExpenseType(filteredFleetCosts);
    const fleetByUnit = aggregateFleetByUnit(filteredFleetCosts);
    const fleetByPlate = aggregateFleetByPlate(filteredFleetCosts);
    const fleetByExpenseType = aggregateFleetByExpenseType(filteredFleetCosts);
    const fleetCostByYear = aggregateFleetCostByYear(filteredFleetCosts);
    const riskLevels = aggregateRiskLevels(filteredInspections);
    const inspectionsByLevel = filteredInspections.reduce<Record<string, number>>(
      (accumulator, record) => {
        accumulator[record.inspectionLevel] = (accumulator[record.inspectionLevel] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
    const oosVsClean = filteredInspections.reduce(
      (accumulator, record) => {
        if (record.status === "OOS") accumulator.OOS += 1;
        else accumulator.Clean += 1;
        return accumulator;
      },
      { Clean: 0, OOS: 0 },
    );

    const totalInspections = filteredInspections.length;
    const totalOosViolations = filteredInspections.reduce(
      (sum, record) => sum + record.oosViolations,
      0,
    );
    const totalViolationPoints = filteredInspections.reduce(
      (sum, record) => sum + record.totalViolationPoints,
      0,
    );
    const totalCharges = filteredInspections.reduce(
      (sum, record) => sum + record.chargeAmount,
      0,
    );
    const totalCompanyExpense = filteredFleetCosts.reduce(
      (sum, record) => sum + record.totalPrice,
      0,
    );
    const highRiskDrivers = driverSummaries.filter(
      (summary) => summary.riskLevel === "High",
    ).length;
    const repeatViolationDrivers = driverSummaries.filter(
      (summary) => summary.repeatViolations > 0,
    ).length;

    const avgPointsPerInspection = totalInspections
      ? totalViolationPoints / totalInspections
      : 0;
    const oosRate = totalInspections
      ? (filteredInspections.filter((record) => record.status === "OOS").length / totalInspections) * 100
      : 0;

    const topRiskDrivers = driverSummaries
      .filter((summary) => summary.totalViolationPoints > 0)
      .sort((a, b) => b.totalViolationPoints - a.totalViolationPoints)
      .slice(0, 5);

    const driverChargeAmount = filteredInspections
      .filter((record) => record.expenseType === "Driver Charges")
      .reduce((sum, record) => sum + record.chargeAmount, 0);
    const topChargeDriver = [...driverSummaries].sort((a, b) => b.totalCharges - a.totalCharges)[0]?.driver ?? "N/A";
    const highestExpenseType =
      [...companyExpenseByType].sort((a, b) => b.value - a.value)[0]?.name ?? "N/A";
    const avgChargePerInspection = totalInspections ? totalCharges / totalInspections : 0;

    const totalFleetCost = filteredFleetCosts.reduce(
      (sum, record) => sum + record.totalPrice,
      0,
    );
    const totalRenewalCost = filteredFleetCosts
      .filter((record) => record.expenseType === "Renewal")
      .reduce((sum, record) => sum + record.totalPrice, 0);
    const totalRegistrationCost = filteredFleetCosts
      .filter((record) => record.expenseType === "Registration")
      .reduce((sum, record) => sum + record.totalPrice, 0);
    const totalSupplementCost = filteredFleetCosts
      .filter((record) => record.expenseType === "Supplement")
      .reduce((sum, record) => sum + record.totalPrice, 0);

    return {
      monthlyInspection,
      monthlyFleet,
      monthlyCategoryTrend,
      driverSummaries,
      categorySummaries,
      chargesByDriver,
      chargesByReason,
      chargesByCategory,
      safetyLossByCategory,
      companyExpenseByType,
      fleetByUnit,
      fleetByPlate,
      fleetByExpenseType,
      fleetCostByYear,
      riskLevels,
      inspectionsByLevel,
      oosVsClean,
      topRiskDrivers,
      totalInspections,
      totalOosViolations,
      totalViolationPoints,
      totalCharges,
      totalCompanyExpense,
      highRiskDrivers,
      repeatViolationDrivers,
      avgPointsPerInspection,
      oosRate,
      driverChargeAmount,
      highestChargeDriver: topChargeDriver,
      highestExpenseType,
      avgChargePerInspection,
      totalFleetCost,
      totalRenewalCost,
      totalRegistrationCost,
      totalSupplementCost,
      topFleetUnit: mostExpensiveItemName(filteredFleetCosts),
      topFleetPlate: [...filteredFleetCosts].sort((a, b) => b.totalPrice - a.totalPrice)[0]?.plate ?? "N/A",
      topInspectionRows: topInspectionsByPoints(filteredInspections),
      topDriverCharges: topDriversByCharges(filteredInspections),
      filteredInspections,
      filteredFleetCosts,
    };
  }, [filteredFleetCosts, filteredInspections]);
}

function DashboardSection() {
  const analytics = useAnalytics();

  const violationsByCategoryChart = analytics.categorySummaries.map((item, index) => ({
    name: item.category,
    value: item.numberOfViolations,
    fill: chartColors[index % chartColors.length],
  }));

  return (
    <PageSection
      title="Dashboard"
      description="Overall safety and compliance health for the company."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Inspections" value={String(analytics.totalInspections)} icon={ShieldAlert} />
        <MetricCard label="Total OOS Violations" value={String(analytics.totalOosViolations)} icon={CircleAlert} tone="negative" />
        <MetricCard label="Total Violation Points" value={String(analytics.totalViolationPoints)} icon={Fingerprint} tone="negative" />
        <MetricCard label="Total Charges" value={formatCurrency(analytics.totalCharges)} icon={DollarSign} tone="negative" />
        <MetricCard label="High Risk Drivers" value={String(analytics.highRiskDrivers)} icon={Truck} tone="negative" />
        <MetricCard label="Total Company Expense" value={formatCurrency(analytics.totalCompanyExpense)} icon={DollarSign} tone="negative" />
        <MetricCard label="Average Points / Inspection" value={analytics.avgPointsPerInspection.toFixed(1)} icon={LineChartIcon} />
        <MetricCard label="Repeat Violation Drivers" value={String(analytics.repeatViolationDrivers)} icon={CircleAlert} tone="negative" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Monthly Trend of Violation Points" icon={LineChartIcon}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={analytics.monthlyInspection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="points" name="Violation Points" stroke="#0f766e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Trend of Charges" icon={DollarSign}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={analytics.monthlyInspection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="charges" name="Charges" stroke="#ef4444" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Drivers by Violation Points" icon={BarChart3}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.driverSummaries.slice(0, 10).reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="driver" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="totalViolationPoints" name="Violation Points" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Violations by Category" icon={ShieldAlert}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={violationsByCategoryChart}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {violationsByCategoryChart.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTable<DriverSummary>
        title="Top Risk Drivers"
        rows={analytics.topRiskDrivers}
        searchPlaceholder="Search drivers"
        searchText={(row) =>
          [row.driver, row.riskLevel, row.totalViolationPoints, row.totalCharges, row.oosViolations]
            .join(" ")
        }
        emptyTitle="No risk drivers found"
        emptyDescription="No matching drivers are available for the current filters."
        columns={[
          { key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver },
          { key: "points", header: "Total Points", sortValue: (row) => row.totalViolationPoints, render: (row) => row.totalViolationPoints },
          { key: "charges", header: "Total Charges", sortValue: (row) => row.totalCharges, render: (row) => formatCurrency(row.totalCharges) },
          { key: "oos", header: "OOS Violations", sortValue: (row) => row.oosViolations, render: (row) => row.oosViolations },
          { key: "risk", header: "Risk Level", sortValue: (row) => row.riskLevel, render: (row) => <RiskBadge risk={row.riskLevel} /> },
          { key: "last", header: "Last Inspection Date", sortValue: (row) => row.lastInspectionDate, render: (row) => formatDate(row.lastInspectionDate) },
        ]}
      />
    </PageSection>
  );
}

function InspectionsSection() {
  const analytics = useAnalytics();
  const oosPie = [
    { name: "Clean", value: analytics.oosVsClean.Clean },
    { name: "OOS", value: analytics.oosVsClean.OOS },
  ];

  return (
    <PageSection
      title="Inspections"
      description="Track inspection results and whether outcomes are improving over time."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Inspections" value={String(analytics.totalInspections)} icon={ShieldAlert} />
        <MetricCard label="OOS Inspections" value={String(analytics.oosVsClean.OOS)} icon={CircleAlert} tone="negative" />
        <MetricCard label="Clean Inspections" value={String(analytics.oosVsClean.Clean)} icon={CircleSlash2} tone="positive" />
        <MetricCard label="OOS Rate %" value={`${analytics.oosRate.toFixed(1)}%`} icon={LineChartIcon} tone={analytics.oosRate > 20 ? "negative" : "positive"} />
        <MetricCard label="Average Points / Inspection" value={analytics.avgPointsPerInspection.toFixed(1)} icon={Fingerprint} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Inspections by Month" icon={LineChartIcon}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={analytics.monthlyInspection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="inspections" name="Inspections" stroke="#2563eb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="OOS vs No Violation" icon={CircleAlert}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie data={oosPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                {oosPie.map((entry, index) => (
                  <Cell key={entry.name} fill={index === 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inspection Level Breakdown" icon={BarChart3}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={Object.entries(analytics.inspectionsByLevel).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Inspection Count" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="OOS Violations Trend by Month" icon={LineChartIcon}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={analytics.monthlyInspection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="oos" name="OOS Inspections" stroke="#ef4444" fill="#fecaca" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTable<InspectionRecord>
        title="Inspection Records"
        rows={analytics.filteredInspections}
        searchPlaceholder="Search inspections"
        searchText={(row) =>
          [
            row.status,
            row.reportNo,
            row.inspectionDate,
            row.fmcsaPostDate,
            row.inspectionLevel,
            row.oosViolations,
            row.driver,
            row.vin,
            row.vehiclePlate,
            row.points,
            row.charges,
          ].join(" ")
        }
        emptyTitle="No inspections found"
        emptyDescription="No inspection records match the current filters."
        columns={[
          { key: "status", header: "Status", sortValue: (row) => row.status, render: (row) => <StatusBadge status={row.status} /> },
          { key: "reportNo", header: "Report #", sortValue: (row) => row.reportNo, render: (row) => row.reportNo },
          { key: "inspectionDate", header: "Inspection Date", sortValue: (row) => row.inspectionDate, render: (row) => formatDate(row.inspectionDate) },
          { key: "fmcsaPostDate", header: "FMCSA Post Date", sortValue: (row) => row.fmcsaPostDate, render: (row) => formatDate(row.fmcsaPostDate) },
          { key: "inspectionLevel", header: "Inspection Level", sortValue: (row) => row.inspectionLevel, render: (row) => row.inspectionLevel },
          { key: "oosViolations", header: "OOS Violations", sortValue: (row) => row.oosViolations, render: (row) => row.oosViolations },
          { key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver },
          { key: "vin", header: "VIN", sortValue: (row) => row.vin, render: (row) => row.vin },
          { key: "plate", header: "Vehicle Plate", sortValue: (row) => row.vehiclePlate, render: (row) => row.vehiclePlate },
          { key: "points", header: "Points", sortValue: (row) => row.totalViolationPoints, render: (row) => row.totalViolationPoints },
          { key: "charges", header: "Charges", sortValue: (row) => row.chargeAmount, render: (row) => formatCurrency(row.chargeAmount) },
        ]}
      />
    </PageSection>
  );
}

function DriverScorecardSection() {
  const analytics = useAnalytics();

  const driverRiskBreakdown = analytics.driverSummaries.reduce<Record<string, number>>(
    (accumulator, row) => {
      accumulator[row.riskLevel] = (accumulator[row.riskLevel] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  return (
    <PageSection
      title="Driver Scorecard"
      description="Compare driver performance, recurring issues, and risk level."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Drivers" value={String(analytics.driverSummaries.length)} icon={Truck} />
        <MetricCard label="High Risk Drivers" value={String(analytics.driverSummaries.filter((driver) => driver.riskLevel === "High").length)} icon={CircleAlert} tone="negative" />
        <MetricCard label="Repeat Violation Drivers" value={String(analytics.repeatViolationDrivers)} icon={CircleAlert} tone="negative" />
        <MetricCard label="Average Points / Driver" value={(analytics.totalViolationPoints / Math.max(analytics.driverSummaries.length, 1)).toFixed(1)} icon={LineChartIcon} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Top 10 Drivers by Violation Points" icon={BarChart3}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.driverSummaries.slice(0, 10).reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="driver" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="totalViolationPoints" name="Violation Points" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Drivers by Charges" icon={DollarSign}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={[...analytics.driverSummaries].sort((a, b) => b.totalCharges - a.totalCharges).slice(0, 10).reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="driver" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="totalCharges" name="Total Charges" fill="#ef4444" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Drivers by Risk Level" icon={ShieldAlert}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={Object.entries(driverRiskBreakdown).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Driver Count" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Repeat Violation Drivers" icon={CircleAlert}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.driverSummaries.filter((row) => row.repeatViolations > 0).slice(0, 10).reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="driver" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="repeatViolations" name="Repeat Violations" fill="#f59e0b" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTable<DriverSummary>
        title="Driver Scorecard"
        rows={analytics.driverSummaries}
        searchPlaceholder="Search drivers"
        searchText={(row) =>
          [
            row.driver,
            row.totalInspections,
            row.totalViolationPoints,
            row.totalCharges,
            row.oosViolations,
            row.repeatViolations,
            row.riskLevel,
            row.lastInspectionDate,
            row.monthTrend,
          ].join(" ")
        }
        emptyTitle="No driver scorecards available"
        emptyDescription="No driver records match the current filters."
        columns={[
          { key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver },
          { key: "inspections", header: "Total Inspections", sortValue: (row) => row.totalInspections, render: (row) => row.totalInspections },
          { key: "points", header: "Total Violation Points", sortValue: (row) => row.totalViolationPoints, render: (row) => row.totalViolationPoints },
          { key: "charges", header: "Total Charges", sortValue: (row) => row.totalCharges, render: (row) => formatCurrency(row.totalCharges) },
          { key: "oos", header: "OOS Violations", sortValue: (row) => row.oosViolations, render: (row) => row.oosViolations },
          { key: "repeat", header: "Repeat Violations", sortValue: (row) => row.repeatViolations, render: (row) => row.repeatViolations },
          { key: "risk", header: "Safety Risk Level", sortValue: (row) => row.riskLevel, render: (row) => <RiskBadge risk={row.riskLevel} /> },
          { key: "last", header: "Last Inspection Date", sortValue: (row) => row.lastInspectionDate, render: (row) => formatDate(row.lastInspectionDate) },
          {
            key: "trend",
            header: "Trend vs Previous Month",
            sortValue: (row) => row.monthTrend,
            render: (row) => (
              <span className={row.monthTrend > 0 ? "font-semibold text-rose-700" : row.monthTrend < 0 ? "font-semibold text-emerald-700" : "text-zinc-500"}>
                {formatTrend(row.monthTrend)}
              </span>
            ),
          },
        ]}
      />
    </PageSection>
  );
}

function ViolationCategoriesSection() {
  const analytics = useAnalytics();
  const categoryTrend = analytics.monthlyCategoryTrend;

  return (
    <PageSection
      title="Violation Categories"
      description="Identify which types of violations happen most often and where the risk concentrates."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Violations by Category" icon={ShieldAlert}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.categorySummaries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="numberOfViolations" name="Violations" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Points by Category" icon={Fingerprint}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.categorySummaries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="totalPoints" name="Total Points" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Charges by Category" icon={DollarSign}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.categorySummaries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="totalCharges" name="Total Charges" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Trend by Category" icon={LineChartIcon}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart data={categoryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              {[
                "Unsafe Driving",
                "Hours-of-Service Compliance",
                "Vehicle Maintenance",
                "Crash Indicator",
                "Controlled Substances and Alcohol",
                "Documents / Registration",
                "Other",
              ].map((category, index) => (
                <Bar
                  key={category}
                  dataKey={category}
                  name={category}
                  stackId="a"
                  fill={chartColors[index % chartColors.length]}
                  radius={index === 6 ? [8, 8, 0, 0] : 0}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTable<CategorySummary>
        title="Violation Category Table"
        rows={analytics.categorySummaries}
        searchPlaceholder="Search categories"
        searchText={(row) =>
          [
            row.category,
            row.numberOfViolations,
            row.totalPoints,
            row.totalCharges,
            row.mostCommonReason,
            row.driversInvolved,
          ].join(" ")
        }
        emptyTitle="No violation categories found"
        emptyDescription="No category data matches the current filters."
        columns={[
          { key: "category", header: "Violation Category", sortValue: (row) => row.category, render: (row) => row.category },
          { key: "count", header: "Number of Violations", sortValue: (row) => row.numberOfViolations, render: (row) => row.numberOfViolations },
          { key: "points", header: "Total Points", sortValue: (row) => row.totalPoints, render: (row) => row.totalPoints },
          { key: "charges", header: "Total Charges", sortValue: (row) => row.totalCharges, render: (row) => formatCurrency(row.totalCharges) },
          { key: "reason", header: "Most Common Reason", sortValue: (row) => row.mostCommonReason, render: (row) => row.mostCommonReason },
          { key: "drivers", header: "Drivers Involved", sortValue: (row) => row.driversInvolved, render: (row) => row.driversInvolved },
        ]}
      />
    </PageSection>
  );
}

function FinancialImpactSection() {
  const analytics = useAnalytics();
  const expenseTypeTop = [...analytics.companyExpenseByType].sort((a, b) => b.value - a.value)[0];

  return (
    <PageSection
      title="Financial Impact"
      description="Measure how much the company, drivers, and operations lose because of compliance events."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total Charges" value={formatCurrency(analytics.totalCharges)} icon={DollarSign} tone="negative" />
        <MetricCard label="Driver Charge Amount" value={formatCurrency(analytics.driverChargeAmount)} icon={DollarSign} tone="negative" />
        <MetricCard label="Company Expense Impact" value={formatCurrency(analytics.totalCompanyExpense)} icon={DollarSign} tone="negative" />
        <MetricCard label="Highest Charge Driver" value={analytics.highestChargeDriver} icon={Truck} />
        <MetricCard label="Highest Expense Type" value={expenseTypeTop?.name ?? analytics.highestExpenseType} icon={BarChart3} />
        <MetricCard label="Average Charge / Inspection" value={formatCurrency(analytics.avgChargePerInspection)} icon={LineChartIcon} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Total Charges by Month" icon={LineChartIcon}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={analytics.monthlyInspection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="charges" name="Charges" stroke="#ef4444" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Charges by Driver" icon={Truck}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.chargesByDriver.slice(0, 10).reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Charges" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Charges by Reason" icon={ShieldAlert}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.chargesByReason.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Charges" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/*<ChartCard title="Company Expense Impact Breakdown" icon={DollarSign}>*/}
        {/*  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>*/}
        {/*    <PieChart>*/}
        {/*      <Pie data={analytics.companyExpenseByType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>*/}
        {/*        {analytics.companyExpenseByType.map((entry, index) => (*/}
        {/*          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />*/}
        {/*        ))}*/}
        {/*      </Pie>*/}
        {/*      <Tooltip content={<ChartTooltip />} />*/}
        {/*      <Legend />*/}
        {/*    </PieChart>*/}
        {/*  </ResponsiveContainer>*/}
        {/*</ChartCard>*/}

        <ChartCard title="Safety Loss Impact Breakdown" icon={CircleAlert}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.safetyLossByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Safety Loss Impact" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTable<InspectionRecord>
        title="Financial Impact Table"
        rows={[...analytics.filteredInspections].sort((a, b) => b.chargeAmount - a.chargeAmount)}
        searchPlaceholder="Search financial records"
        searchText={(row) =>
          [
            row.driver,
            row.chargeAmount,
            row.violationReason,
            row.safetyLossImpact,
            row.companyExpenseImpact,
            row.inspectionDate,
            row.reportNo,
          ].join(" ")
        }
        emptyTitle="No financial records found"
        emptyDescription="No financial impact records match the current filters."
        columns={[
          { key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver },
          { key: "chargeAmount", header: "Charge Amount", sortValue: (row) => row.chargeAmount, render: (row) => formatCurrency(row.chargeAmount) },
          { key: "reason", header: "Charge Reason", sortValue: (row) => row.violationReason, render: (row) => row.violationReason },
          { key: "safetyLossImpact", header: "Safety Loss Impact", sortValue: (row) => row.safetyLossImpact, render: (row) => formatCurrency(row.safetyLossImpact) },
          { key: "companyExpenseImpact", header: "Company Expense Impact", sortValue: (row) => row.companyExpenseImpact, render: (row) => formatCurrency(row.companyExpenseImpact) },
          { key: "inspectionDate", header: "Inspection Date", sortValue: (row) => row.inspectionDate, render: (row) => formatDate(row.inspectionDate) },
          { key: "reportNo", header: "Report #", sortValue: (row) => row.reportNo, render: (row) => row.reportNo },
        ]}
      />
    </PageSection>
  );
}

function FleetAndPlateCostsSection() {
  const analytics = useAnalytics();

  return (
    <PageSection
      title="Fleet & Plate Costs"
      description="Track fleet, registration, plate, renewal, and supplement costs in one place."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total Fleet Cost" value={formatCurrency(analytics.totalFleetCost)} icon={Truck} tone="negative" />
        <MetricCard label="Total Renewal Cost" value={formatCurrency(analytics.totalRenewalCost)} icon={DollarSign} tone="negative" />
        <MetricCard label="Total Registration Cost" value={formatCurrency(analytics.totalRegistrationCost)} icon={DollarSign} tone="negative" />
        <MetricCard label="Total Supplement Cost" value={formatCurrency(analytics.totalSupplementCost)} icon={DollarSign} tone="negative" />
        <MetricCard label="Most Expensive Unit" value={analytics.topFleetUnit} icon={BarChart3} />
        <MetricCard label="Most Expensive Plate" value={analytics.topFleetPlate} icon={BarChart3} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Cost by Unit" icon={Truck}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.fleetByUnit.slice(0, 10).reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Fleet Cost" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost by Plate" icon={BarChart3}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.fleetByPlate.slice(0, 10).reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Fleet Cost" fill="#0f766e" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost by Expense Type" icon={DollarSign}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.fleetByExpenseType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Fleet Cost" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fleet Cost by Year" icon={LineChartIcon}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={analytics.fleetCostByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="value" name="Fleet Cost" stroke="#8b5cf6" strokeWidth={3} dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Most Expensive Units" icon={Truck}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.fleetByUnit.slice(0, 10).reverse()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Fleet Cost" fill="#f59e0b" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTable<FleetCostRecord>
        title="Fleet and Plate Cost Table"
        rows={analytics.filteredFleetCosts}
        searchPlaceholder="Search fleet costs"
        searchText={(row) =>
          [
            row.unit,
            row.vin,
            row.year,
            row.make,
            row.plate,
            row.price,
            row.totalPrice,
            row.expenseType,
            row.driverName ?? "",
            row.notes ?? "",
          ].join(" ")
        }
        emptyTitle="No fleet costs found"
        emptyDescription="No fleet or plate records match the current filters."
        columns={[
          { key: "unit", header: "Unit", sortValue: (row) => row.unit, render: (row) => row.unit },
          { key: "vin", header: "VIN", sortValue: (row) => row.vin, render: (row) => row.vin },
          { key: "year", header: "Year", sortValue: (row) => row.year, render: (row) => row.year },
          { key: "make", header: "Make", sortValue: (row) => row.make, render: (row) => row.make },
          { key: "plate", header: "Plate", sortValue: (row) => row.plate, render: (row) => row.plate },
          { key: "price", header: "Price", sortValue: (row) => row.price, render: (row) => formatCurrency(row.price) },
          { key: "total", header: "Total Price", sortValue: (row) => row.totalPrice, render: (row) => formatCurrency(row.totalPrice) },
          { key: "expenseType", header: "Expense Type", sortValue: (row) => row.expenseType, render: (row) => row.expenseType },
          { key: "driver", header: "Driver Name", sortValue: (row) => row.driverName ?? "", render: (row) => row.driverName ?? "—" },
          { key: "notes", header: "Notes", sortValue: (row) => row.notes ?? "", render: (row) => row.notes ?? "—" },
        ]}
      />
    </PageSection>
  );
}

export function SafetyComplianceDashboardView() {
  return <DashboardSection />;
}

export function SafetyComplianceInspectionsView() {
  return <InspectionsSection />;
}

export function SafetyComplianceDriverScorecardView() {
  return <DriverScorecardSection />;
}

export function SafetyComplianceViolationCategoriesView() {
  return <ViolationCategoriesSection />;
}

export function SafetyComplianceFinancialImpactView() {
  return <FinancialImpactSection />;
}

export function SafetyComplianceFleetCostsView() {
  return <FleetAndPlateCostsSection />;
}

