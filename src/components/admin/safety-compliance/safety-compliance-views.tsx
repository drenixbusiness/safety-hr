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
        Area,
    AreaChart,
} from "recharts";
import {useMemo, useState, type ReactNode} from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
} from "react-simple-maps";
import { geoCentroid, GeoGeometryObjects } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";
import {useSafetyCompliance} from "@/components/admin/safety-compliance/safety-compliance-context";
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
    mostExpensiveItemName,
    topDriversByCharges,
    topInspectionsByPoints,
    type DriverSummary, aggregateMonthlyDriverCharges,
    aggregateFleetByUnitPrice,
} from "@/components/admin/safety-compliance/safety-compliance-analytics";
import {
    DriverChargeRecord,
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
        case "OOS":
            return "bg-rose-50 text-rose-700 border-rose-200";
        case "NO":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
}

type ComplianceRow = {
    driver: string;
    inspectionDate: string;
    reportNo: string;
    unsafe?: string;
    crash?: string;
    hos?: string;
    maintenance?: string;
    alcohol?: string;
};

function ComplianceCell({ reason }: { reason?: string }) {
    const hasViolation = Boolean(reason && reason !== "No violations");
    return (
        <span
            className={`inline-flex max-w-44 rounded-md border px-2 py-1 text-xs font-medium ${
                hasViolation
                    ? "border-rose-200 bg-rose-50 text-rose-700 rounded-2xl"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 rounded-2xl"
            }`}
        >
      {hasViolation ? reason : "No violation"}
    </span>
    );
}

function ChargeReasonBadge({ reason }: { reason: string }) {
    const label = reason || "—";
    const isViolation = !/no violation/i.test(label) && label !== "—";
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                isViolation
                    ? "border-rose-200 bg-rose-50 text-rose-700 rounded-2xl"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 rounded-2xl"
            }`}
        >
      {label}
    </span>
    );
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
                    <div
                        className={`text-2xl font-semibold tracking-tight ${tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-rose-700" : "text-zinc-950"}`}>
                        {value}
                    </div>
                    {detail ? <p className="text-sm text-zinc-500">{detail}</p> : null}
                </div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
                    <Icon className="size-5" aria-hidden="true"/>
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
                       contentClassName = "h-72",
                       dynamicHeight
                   }: {
    title: string;
    icon: typeof BarChart3;
    children: ReactNode;
    className?: string;
    subtitle?: string;
    contentClassName?: string;
    dynamicHeight?: number;

}) {
    return (
        <section className={`w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${className}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h4 className="text-sm font-semibold text-zinc-950">{title}</h4>
                    {subtitle ? <p className="text-sm text-zinc-500">{subtitle}</p> : null}
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                    <Icon className="size-4" aria-hidden="true"/>
                </div>
            </div>
            <div
                className={`w-full min-w-0 ${contentClassName}`}
                style={dynamicHeight ? {height: dynamicHeight} : undefined}
            >{children}</div>
        </section>
    );
}

function ChartLegend({
                         items,
                     }: {
    items: Array<{ label: string; color: string }>;
}) {
    return (
        <div
            className="mx-auto flex w-fit max-w-170 flex-wrap items-center justify-center gap-3 px-2 pt-3 text-[14px] leading-none sm:text-[15px]">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap font-normal"
                    style={{color: item.color}}
                >
          <span
              className="size-2.5 border-solid"
              style={{
                  backgroundColor: item.color,
                  borderColor: item.color,
                  borderWidth: "5px",
                  marginRight: "10px",
              }}
          />
                    <span className="leading-none">{item.label}</span>
                </div>
            ))}
        </div>
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
        <div
            className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <CircleSlash2 className="size-6 animate-pulse" aria-hidden="true"/>
            </div>
            <h4 className="text-base font-semibold text-zinc-950">{title}</h4>
            <p className="mt-1 max-w-lg text-sm text-zinc-500">{description}</p>
        </div>
    );
}

function RiskBadge({risk}: { risk: RiskLevel }) {
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${riskTone(risk)}`}>
      {risk}
    </span>
    );
}

function StatusBadge({status}: { status: InspectionRecord["status"] }) {
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}>
      {status}
    </span>
    );
}

function SortIcon({active, direction}: { active: boolean; direction: SortDirection }) {
    if (!active) return <ArrowUpDown className="size-3.5 text-zinc-400" aria-hidden="true"/>;
    return direction === "asc" ? (
        <ArrowUp className="size-3.5 text-zinc-700" aria-hidden="true"/>
    ) : (
        <ArrowDown className="size-3.5 text-zinc-700" aria-hidden="true"/>
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
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                        aria-hidden="true"/>
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
                <EmptyState title={emptyTitle} description={emptyDescription}/>
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
                                                <SortIcon active={active} direction={direction}/>
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

interface StateData {
    name: string;
    inspections: number;
    violations: number;
    points: number;
    levels: Record<string, number>;
}

const STATE_NAMES: Record<string, string> = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia"
};

interface GeographyFeature {
    type: "Feature";
    id: string;
    rsmKey: string;
    properties: {
        name: string;
    };
    geometry: GeoGeometryObjects;
}

function USAStateMap({inspections}: { inspections: InspectionRecord[] }) {
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [tooltipContent, setTooltipContent] = useState<StateData | null>(null);
    const [tooltipPos, setTooltipPos] = useState({x: 0, y: 0});

    const getColor = (points: number) => {
        if (points === 0) return "#dcfce7"; // Light Green (emerald-100) for zero points
        if (points < 20) return "#10b981"; // Green
        if (points < 60) return "#f59e0b"; // Yellow
        return "#ef4444"; // Red
    };

    const stateData = useMemo(() => {
        const data: Record<string, {
            name: string;
            inspections: number;
            violations: number;
            points: number;
            levels: Record<string, number>;
        }> = {};

        // Fill with fake data for all states as requested
        Object.entries(STATE_NAMES).forEach(([abbr, name]) => {
            const seed = abbr.charCodeAt(0) + abbr.charCodeAt(1);
            const fakeInspections = (seed % 15) + 5;
            const fakeViolations = seed % 4;
            const fakePoints = (seed % 80);
            
            data[abbr] = {
                name: name,
                inspections: fakeInspections,
                violations: fakeViolations,
                points: fakePoints,
                levels: {
                    "1": Math.floor(fakeInspections * 0.2),
                    "2": Math.floor(fakeInspections * 0.5),
                    "3": Math.floor(fakeInspections * 0.3)
                }
            };
        });

        // Overlay with real data
        inspections.forEach(record => {
            if (!record.state || !data[record.state]) return;
            
            const s = data[record.state];
            s.inspections += 1;
            s.violations += record.oosViolations;
            s.points += record.points;
            
            if (record.inspectionLevel) {
                const level = record.inspectionLevel.toString();
                s.levels[level] = (s.levels[level] || 0) + 1;
            }
        });

        return data;
    }, [inspections]);

    const handleMouseMove = (event: React.MouseEvent) => {
        setTooltipPos({x: event.clientX, y: event.clientY});
    };

    return (
        <div className="relative mt-8 p-6 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden" onMouseMove={handleMouseMove}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-900">Geographic Inspection Heatmap</h3>
                    <p className="text-sm text-zinc-500">State risk levels based on total violation points</p>
                </div>
            </div>

            <div className="h-100 w-full">
                <ComposableMap projection="geoAlbersUsa">
                    <Geographies geography="https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json">
                        {({geographies}: { geographies: GeographyFeature[] }) =>
                            geographies
                                .filter(geo => geo.properties.name !== "Alaska" && geo.properties.name !== "Hawaii")
                                .map((geo) => {
                                    const stateAbbr = geo.properties.name === "District of Columbia" ? "DC" : 
                                        Object.keys(STATE_NAMES).find(key => STATE_NAMES[key] === geo.properties.name);
                                    
                                    const data = stateAbbr ? stateData[stateAbbr] : null;
                                    const points = data?.points ?? 0;
                                    const isHovered = hoveredState === geo.id;
                                    const isSmallState = stateAbbr ? ['RI', 'DE', 'MD', 'DC', 'CT', 'MA', 'NJ', 'VT', 'NH'].includes(stateAbbr) : false;

                                    return (
                                        <motion.g
                                            key={geo.rsmKey}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            onMouseEnter={() => {
                                                setHoveredState(geo.id);
                                                setTooltipContent({
                                                    inspections: 0,
                                                    violations: 0,
                                                    points: 0,
                                                    levels: { "1": 0, "2": 0, "3": 0 },
                                                    ...data,
                                                    name: geo.properties.name,
                                                });
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredState(null);
                                                setTooltipContent(null);
                                            }}
                                            style={{ cursor: "pointer", outline: "none" }}
                                        >
                                            <Geography
                                                geography={geo}
                                                fill={isHovered ? "#3b82f6" : getColor(points)}
                                                stroke="#FFFFFF"
                                                strokeWidth={isHovered ? 1.5 : 0.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { outline: "none" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                            {stateAbbr && (
                                                <Marker coordinates={geoCentroid(geo)}>
                                                    <g className="pointer-events-none select-none">
                                                        <text
                                                            textAnchor="middle"
                                                            y={isSmallState ? 4 : -6}
                                                            style={{
                                                                fontFamily: "system-ui",
                                                                fill: points > 60 || isHovered ? "#fff" : "#1e293b",
                                                                fontSize: isSmallState ? "7px" : "10px",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            {stateAbbr}
                                                        </text>
                                                        {!isSmallState && (
                                                            <>
                                                                <text
                                                                    textAnchor="middle"
                                                                    y={4}
                                                                    style={{
                                                                        fontFamily: "system-ui",
                                                                        fill: points > 60 || isHovered ? "rgba(255,255,255,0.9)" : "#475569",
                                                                        fontSize: "6px",
                                                                        fontWeight: "500",
                                                                    }}
                                                                >
                                                                    Points: {points}
                                                                </text>
                                                                <text
                                                                    textAnchor="middle"
                                                                    y={12}
                                                                    style={{
                                                                        fontFamily: "system-ui",
                                                                        fill: points > 60 || isHovered ? "rgba(255,255,255,0.9)" : "#475569",
                                                                        fontSize: "6px",
                                                                        fontWeight: "500",
                                                                    }}
                                                                >
                                                                    Violations: {data?.violations ?? 0}
                                                                </text>
                                                            </>
                                                        )}
                                                    </g>
                                                </Marker>
                                            )}
                                        </motion.g>
                                    );
                                })
                        }
                    </Geographies>
                </ComposableMap>
            </div>

            <AnimatePresence>
                {tooltipContent && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            position: "fixed",
                            left: tooltipPos.x + (tooltipPos.x > (typeof window !== 'undefined' ? window.innerWidth * 0.6 : 800) ? -280 : 20),
                            top: tooltipPos.y + 20,
                            pointerEvents: "none",
                            zIndex: 9999
                        }}
                        className="min-w-60 bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden"
                    >
                        <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
                            <h4 className="text-zinc-900 font-bold text-xl leading-tight">
                                {tooltipContent.name}
                            </h4>
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-0.5">State Report</p>
                        </div>
                        
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Inspections</p>
                                    <p className="text-zinc-900 text-xl font-semibold">{tooltipContent.inspections}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Violations</p>
                                    <p className="text-zinc-900 text-xl font-semibold">{tooltipContent.violations}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight mb-1">Violation Points</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${tooltipContent.points > 60 ? 'bg-rose-500' : tooltipContent.points > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(100, (tooltipContent.points / 100) * 100)}%` }}
                                        />
                                    </div>
                                    <span className={`font-bold text-lg ${tooltipContent.points > 60 ? 'text-rose-400' : tooltipContent.points > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {tooltipContent.points}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-zinc-100">
                                <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest mb-2">Inspection Breakdown</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-zinc-50 p-2 rounded-lg text-center border border-zinc-200/50">
                                        <p className="text-zinc-500 text-[10px] font-bold">Level 1</p>
                                        <p className="text-zinc-900 font-bold text-base">{tooltipContent.levels["1"] || 0}</p>
                                    </div>
                                    <div className="bg-zinc-50 p-2 rounded-lg text-center border border-zinc-200/50">
                                        <p className="text-zinc-500 text-[10px] font-bold">Level 2</p>
                                        <p className="text-zinc-900 font-bold text-base">{tooltipContent.levels["2"] || 0}</p>
                                    </div>
                                    <div className="bg-zinc-50 p-2 rounded-lg text-center border border-zinc-200/50">
                                        <p className="text-zinc-500 text-[10px] font-bold">Level 3</p>
                                        <p className="text-zinc-900 font-bold text-base">{tooltipContent.levels["3"] || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StateAnalytics({inspections}: { inspections: InspectionRecord[] }) {
    const data = useMemo(() => {
        const stateStats: Record<string, { state: string, name: string, points: number, inspections: number, violations: number }> = {};
        
        // Populate with fake data (same logic as map)
        Object.entries(STATE_NAMES).forEach(([abbr, name]) => {
            // Filter out Alaska and Hawaii to match map
            if (abbr === "AK" || abbr === "HI") return;

            const seed = abbr.charCodeAt(0) + abbr.charCodeAt(1);
            const fakeInspections = (seed % 15) + 5;
            stateStats[abbr] = {
                state: abbr,
                name: name,
                inspections: fakeInspections,
                violations: seed % 4,
                points: seed % 80
            };
        });

        // Overlay with real data
        inspections.forEach(record => {
            if (!record.state || !stateStats[record.state]) return;
            stateStats[record.state].inspections += 1;
            stateStats[record.state].violations += record.oosViolations;
            stateStats[record.state].points += record.points;
        });

        return Object.values(stateStats);
    }, [inspections]);

    const allByPoints = useMemo(() => 
        [...data].sort((a, b) => b.points - a.points)
    , [data]);

    const allByInspections = useMemo(() => 
        [...data].sort((a, b) => b.inspections - a.inspections)
    , [data]);

    return (
        <div className="grid gap-6 mt-6">
            <ChartCard title="States by Violation Points" icon={BarChart3} dynamicHeight={350}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allByPoints} layout="horizontal" margin={{ left: 0, right: 0, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                        <XAxis 
                            dataKey="state" 
                            type="category"
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                        />
                        <YAxis 
                            type="number"
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f4f4f5' }} />
                        <Bar 
                            dataKey="points" 
                            name="Violation Points" 
                            fill="#ef4444" 
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="States by Total Inspections" icon={BarChart3} dynamicHeight={350}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allByInspections} layout="horizontal" margin={{ left: 0, right: 0, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                        <XAxis 
                            dataKey="state" 
                            type="category"
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                        />
                        <YAxis 
                            type="number"
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f4f4f5' }} />
                        <Bar 
                            dataKey="inspections" 
                            name="Total Inspections" 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
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
            <SectionHeader title={title} description={description}/>
            {children}
        </section>
    );
}

function useAnalytics() {
    const {filteredInspections: rawInspections, filteredFleetCosts, filteredDriverCharges} = useSafetyCompliance();
    return useMemo(() => {
        const filteredInspections = rawInspections.filter(
            (r) => r.reportNo !== "NON-INSPECTION",
        );
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
        const fleetByUnit = aggregateFleetByUnit(filteredFleetCosts, filteredInspections);
        const fleetByPlate = aggregateFleetByPlate(filteredFleetCosts);
        const fleetByExpenseType = aggregateFleetByExpenseType(filteredFleetCosts);
        const fleetCostByYear = aggregateFleetCostByYear(filteredFleetCosts);
        const riskLevels = aggregateRiskLevels(filteredInspections);
        const fleetByUnitPrice = aggregateFleetByUnitPrice(filteredFleetCosts, filteredInspections);
        const totalSumAndSup = [
            {
                name: "Total Price of Plate",
                value: filteredFleetCosts.reduce((sum, r) => sum + r.price, 0),
            },
            {
                name: "Total 2290",
                value: filteredFleetCosts.reduce((sum, r) => sum + r.supplement, 0),
            },
        ];
        const totalOutcome = [
            {
                name: "Total Outcome",
                value: filteredDriverCharges.reduce((sum, r) => sum + r.amount, 0), // 11,866.75
            },
            {
                name: "Total Income",
                value: filteredInspections.reduce((sum, r) => sum + r.incomeAmount, 0), // 9,580
            },
        ];

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
            {Clean: 0, OOS: 0},
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
            (sum, record) => sum + record.incomeAmount,
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

        const monthlyDriverCharges = aggregateMonthlyDriverCharges(filteredDriverCharges);
        const vinToDriver = new Map<string, string>();
        for (const inspection of filteredInspections) {
            if (inspection.vin && inspection.driver) {
                vinToDriver.set(inspection.vin, inspection.driver);
            }
        }
        const fleetCostsWithDriver = filteredFleetCosts.map((record) => ({
            ...record,
            driverName: record.driverName || vinToDriver.get(record.vin) || "-",
        }));

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
            fleetByUnitPrice,
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
            totalSumAndSup,
            totalOutcome,
            monthlyDriverCharges,
            fleetCostsWithDriver,
            cleanInspections: filteredInspections.filter(
                (record) => record.totalViolationPoints === 0,
            ),
            totalIncome: filteredInspections.reduce((sum, r) => sum + r.incomeAmount, 0),
            totalDriverOutcome: filteredDriverCharges.reduce((sum, r) => sum + r.amount, 0),
            incomeByDriver: Array.from(
                filteredInspections.reduce<Map<string, number>>((map, r) => {
                    if (r.incomeAmount > 0) map.set(r.driver, (map.get(r.driver) ?? 0) + r.incomeAmount);
                    return map;
                }, new Map()),
            ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            outcomeByReason: Array.from(
                filteredDriverCharges.reduce<Map<string, number>>((map, r) => {
                    const key = r.reason || "Unknown";
                    map.set(key, (map.get(key) ?? 0) + r.amount);
                    return map;
                }, new Map()),
            ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            outcomeByDriver: Array.from(
                filteredDriverCharges.reduce<Map<string, number>>((map, r) => {
                    map.set(r.driver, (map.get(r.driver) ?? 0) + r.amount);
                    return map;
                }, new Map()),
            ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        };
    }, [filteredDriverCharges, filteredFleetCosts, rawInspections]);
}

function DashboardSection() {
    const analytics = useAnalytics();

    return (
        <PageSection
            title="Dashboard"
            description="Overall safety and compliance health for the company."
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Inspections" value={String(analytics.totalInspections)} icon={ShieldAlert}/>
                <MetricCard label="Total OOS Violations" value={String(analytics.totalOosViolations)} icon={CircleAlert}
                            tone="negative"/>
                <MetricCard label="Total Violation Points" value={String(analytics.totalViolationPoints)}
                            icon={Fingerprint} tone="negative"/>
                <MetricCard label="Total income from drivers" value={formatCurrency(analytics.totalCharges)}
                            icon={DollarSign} tone="positive"/>
                <MetricCard label="High Risk Drivers" value={String(analytics.highRiskDrivers)} icon={Truck}
                            tone="negative"/>
                <MetricCard label="Total Company Expense" value={formatCurrency(analytics.totalCompanyExpense)}
                            icon={DollarSign} tone="negative"/>
                <MetricCard label="Average Points / Inspection" value={analytics.avgPointsPerInspection.toFixed(1)}
                            icon={LineChartIcon}/>
                <MetricCard label="Repeat Violation Drivers" value={String(analytics.repeatViolationDrivers)}
                            icon={CircleAlert} tone="negative"/>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard title="Monthly Trend of Violation Points" icon={LineChartIcon}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={analytics.monthlyInspection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="label" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Line type="monotone" dataKey="points" name="Violation Points" stroke="#0f766e"
                                  strokeWidth={3} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Top 10 Drivers by Violation Points" icon={BarChart3}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={analytics.driverSummaries.slice(0, 10).reverse()} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis type="number" tick={{fontSize: 12}}/>
                            <YAxis type="category" dataKey="driver" width={120} tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar dataKey="totalViolationPoints" name="Violation Points" fill="#2563eb"
                                 radius={[0, 8, 8, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Monthly income from drivers" icon={DollarSign}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={analytics.monthlyInspection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="label" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3}
                                  dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Monthly outcome from drivers" icon={DollarSign}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={analytics.monthlyDriverCharges}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="label" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Line type="monotone" dataKey="outcome" name="Outcome" stroke="#ef4444" strokeWidth={3}
                                  dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
            <DataTable<InspectionRecord>
                title="List of No Violation drivers"
                rows={analytics.cleanInspections}
                searchPlaceholder="Search clean inspections"
                searchText={(row) =>
                    [
                        row.status,
                        row.reportNo,
                        row.inspectionDate,
                        row.fmcsaPostDate,
                        row.driver,
                    ].join(" ")
                }
                emptyTitle="No clean inspections found"
                emptyDescription="No inspections with zero violation points match the current filters."
                initialSortKey="inspectionDate"
                columns={[
                    {
                        key: "status",
                        header: "Status",
                        sortValue: (row) => row.status,
                        render: (row) => <StatusBadge status={row.status}/>
                    },
                    {
                        key: "reportNo",
                        header: "Report #",
                        sortValue: (row) => row.reportNo,
                        render: (row) => row.reportNo
                    },
                    {
                        key: "inspectionDate",
                        header: "Inspection Date",
                        sortValue: (row) => row.inspectionDate,
                        render: (row) => formatDate(row.inspectionDate)
                    },
                    {
                        key: "fmcsaPostDate",
                        header: "FMCSA Post Date",
                        sortValue: (row) => row.fmcsaPostDate,
                        render: (row) => formatDate(row.fmcsaPostDate)
                    },
                    {key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver},
                    {
                        key: "points",
                        header: "Points",
                        sortValue: (row) => row.totalViolationPoints,
                        render: (row) => row.totalViolationPoints
                    },
                ]}
            />
        </PageSection>
    );
}

function InspectionsSection() {
    const analytics = useAnalytics();
    const oosPie = [
        {name: "No", value: analytics.oosVsClean.Clean},
        {name: "OOS", value: analytics.oosVsClean.OOS},
    ];

    return (
        <PageSection
            title="Inspections"
            description="Track inspection results and whether outcomes are improving over time."
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard label="Total Inspections" value={String(analytics.totalInspections)} icon={ShieldAlert}/>
                <MetricCard label="OOS Inspections" value={String(analytics.oosVsClean.OOS)} icon={CircleAlert}
                            tone="negative"/>
                <MetricCard label="No Inspections" value={String(analytics.oosVsClean.Clean)} icon={CircleSlash2}
                            tone="positive"/>
                <MetricCard label="OOS Rate %" value={`${analytics.oosRate.toFixed(1)}%`} icon={LineChartIcon}
                            tone={analytics.oosRate > 20 ? "negative" : "positive"}/>
                <MetricCard label="Average Points / Inspection" value={analytics.avgPointsPerInspection.toFixed(1)}
                            icon={Fingerprint}/>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard title="Inspections by Month" icon={LineChartIcon}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={analytics.monthlyInspection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="label" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Line type="monotone" dataKey="inspections" name="Inspections" stroke="#2563eb"
                                  strokeWidth={3} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="OOS vs No Violation" icon={CircleAlert}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                            <Pie data={oosPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                                {oosPie.map((entry, index) => (
                                    <Cell key={entry.name} fill={index === 0 ? "#10b981" : "#ef4444"}/>
                                ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Legend/>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Inspection Level Breakdown" icon={BarChart3}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart
                            data={Object.entries(
                                analytics.filteredInspections
                                    .filter((row) => row.reportNo !== "NON-INSPECTION")
                                    .reduce<Record<string, number>>((acc, row) => {
                                        acc[row.inspectionLevel] = (acc[row.inspectionLevel] ?? 0) + 1;
                                        return acc;
                                    }, {}),
                            ).map(([name, value]) => ({name, value}))}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="name" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar dataKey="value" name="Inspection Count" fill="#0f766e" radius={[8, 8, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="OOS Violations Trend by Month" icon={LineChartIcon}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={analytics.monthlyInspection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="label" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Area type="monotone" dataKey="oos" name="OOS Inspections" stroke="#ef4444" fill="#fecaca"/>
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
            <DataTable<InspectionRecord>
                title="Inspection Records"
                rows={analytics.filteredInspections.filter(
                    (row) => row.reportNo !== "NON-INSPECTION",
                )}
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
                        row.totalViolationPoints,
                        row.incomeAmount,
                    ].join(" ")
                }
                emptyTitle="No inspections found"
                emptyDescription="No inspection records match the current filters."
                columns={[
                    {
                        key: "status",
                        header: "Status",
                        sortValue: (row) => row.status,
                        render: (row) => <StatusBadge status={row.status}/>
                    },
                    {
                        key: "reportNo",
                        header: "Report #",
                        sortValue: (row) => row.reportNo,
                        render: (row) => row.reportNo
                    },
                    {
                        key: "inspectionDate",
                        header: "Inspection Date",
                        sortValue: (row) => row.inspectionDate,
                        render: (row) => formatDate(row.inspectionDate)
                    },
                    {
                        key: "fmcsaPostDate",
                        header: "FMCSA Post Date",
                        sortValue: (row) => row.fmcsaPostDate,
                        render: (row) => formatDate(row.fmcsaPostDate)
                    },
                    {
                        key: "inspectionLevel",
                        header: "Inspection Level",
                        sortValue: (row) => row.inspectionLevel,
                        render: (row) => row.inspectionLevel
                    },
                    {
                        key: "oosViolations",
                        header: "OOS Violations",
                        sortValue: (row) => row.oosViolations,
                        render: (row) => row.oosViolations
                    },
                    {key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver},
                    {key: "vin", header: "VIN", sortValue: (row) => row.vin, render: (row) => row.vin},
                    {
                        key: "plate",
                        header: "Vehicle Plate",
                        sortValue: (row) => row.vehiclePlate,
                        render: (row) => row.vehiclePlate
                    },
                    {
                        key: "points",
                        header: "Points",
                        sortValue: (row) => row.totalViolationPoints,
                        render: (row) => row.totalViolationPoints
                    },
                    {
                        key: "charges",
                        header: "Income from drivers",
                        sortValue: (row) => row.incomeAmount,
                        render: (row) => formatCurrency(row.incomeAmount)
                    },
                ]}
                initialSortKey="inspectionDate"
            />

            <USAStateMap inspections={analytics.filteredInspections.filter(r => r.reportNo !== "NON-INSPECTION")} />
            <StateAnalytics inspections={analytics.filteredInspections.filter(r => r.reportNo !== "NON-INSPECTION")} />


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
                <MetricCard label="Drivers" value={String(analytics.driverSummaries.length)} icon={Truck}/>
                <MetricCard label="High Risk Drivers"
                            value={String(analytics.driverSummaries.filter((driver) => driver.riskLevel === "High").length)}
                            icon={CircleAlert} tone="negative"/>
                <MetricCard label="Repeat Violation Drivers" value={String(analytics.repeatViolationDrivers)}
                            icon={CircleAlert} tone="negative"/>
                <MetricCard label="Average Points / Driver"
                            value={(analytics.totalViolationPoints / Math.max(analytics.driverSummaries.length, 1)).toFixed(1)}
                            icon={LineChartIcon}/>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard title="Top 10 Drivers by Violation Points" icon={BarChart3}
                           dynamicHeight={Math.max(300, analytics.driverSummaries.length * 15)}>
                    <ResponsiveContainer width="100%" height={Math.max(300, analytics.driverSummaries.length * 15)}
                                         minWidth={0} minHeight={0}>
                        <BarChart data={analytics.driverSummaries.slice(0, 10).reverse()} layout="vertical"
                                  barSize={25}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis type="number" tick={{fontSize: 12}}/>
                            <YAxis type="category" dataKey="driver" width={120} tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar dataKey="totalViolationPoints" name="Violation Points" fill="#2563eb"
                                 radius={[0, 8, 8, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Top 10 Drivers by Charges" icon={DollarSign}
                           dynamicHeight={Math.max(300, analytics.driverSummaries.length * 15)}>
                    <ResponsiveContainer width="100%" height={Math.max(300, analytics.driverSummaries.length * 15)}
                                         minWidth={0} minHeight={0}>
                        <BarChart
                            data={[...analytics.driverSummaries].sort((a, b) => b.totalCharges - a.totalCharges).slice(0, 10).reverse()}
                            layout="vertical" barSize={25}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis type="number" tick={{fontSize: 12}}/>
                            <YAxis type="category" dataKey="driver" width={120} tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar dataKey="totalCharges" name="Total Charges" fill="#ef4444" radius={[0, 8, 8, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Drivers by Risk Level" icon={ShieldAlert}
                           dynamicHeight={Math.max(300, analytics.fleetByUnit.length * 20)}>
                    <ResponsiveContainer width="100%" height={Math.max(300, analytics.fleetByUnit.length * 20)}
                                         minWidth={0} minHeight={0}>
                        <BarChart data={Object.entries(driverRiskBreakdown).map(([name, value]) => ({name, value}))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="name" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar dataKey="value" name="Driver Count" fill="#0f766e" radius={[8, 8, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Most Inspected Drivers" icon={CircleAlert}
                           dynamicHeight={Math.max(300, analytics.driverSummaries.length * 15)}>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(300, analytics.driverSummaries.length * 15)}
                    >
                        <BarChart
                            data={
                                [...analytics.driverSummaries]
                                    .filter((row) => row.totalInspections > 1)
                                    .sort((a, b) => b.totalInspections - a.totalInspections)
                                    .slice(0, 10)
                                    .reverse()
                            }
                            layout="vertical"
                            barSize={25}
                            barCategoryGap="40%"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis type="number" tick={{fontSize: 12}} allowDecimals={false}/>
                            <YAxis type="category" dataKey="driver" width={140} tick={{fontSize: 11}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar
                                dataKey="totalInspections"
                                name="Total Inspections"
                                fill="#f59e0b"
                                radius={[0, 8, 8, 0]}
                            />
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
                    ].join(" ")
                }
                emptyTitle="No driver scorecards available"
                emptyDescription="No driver records match the current filters."
                columns={[
                    {key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver},
                    {
                        key: "inspections",
                        header: "Total Inspections",
                        sortValue: (row) => row.totalInspections,
                        render: (row) => row.totalInspections
                    },
                    {
                        key: "points",
                        header: "Total Violation Points",
                        sortValue: (row) => row.totalViolationPoints,
                        render: (row) => row.totalViolationPoints
                    },
                    {
                        key: "charges",
                        header: "Income from drivers",
                        sortValue: (row) => row.totalCharges,
                        render: (row) => formatCurrency(row.totalCharges)
                    },
                    {
                        key: "oos",
                        header: "OOS Violations",
                        sortValue: (row) => row.oosViolations,
                        render: (row) => row.oosViolations
                    },
                    {
                        key: "repeat",
                        header: "Repeat Violations",
                        sortValue: (row) => row.repeatViolations,
                        render: (row) => row.repeatViolations
                    },
                    {
                        key: "risk",
                        header: "Safety Risk Level",
                        sortValue: (row) => row.riskLevel,
                        render: (row) => <RiskBadge risk={row.riskLevel}/>
                    },
                    {
                        key: "last",
                        header: "Last Inspection Date",
                        sortValue: (row) => row.lastInspectionDate,
                        render: (row) => formatDate(row.lastInspectionDate)
                    },

                ]}
            />
        </PageSection>
    );
}

function ViolationCategoriesSection() {
    const analytics = useAnalytics();
    const { filteredDriverCharges } = useSafetyCompliance();

    const formatMoney = (value: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(value);

    const categorySummaries = analytics.categorySummaries.filter(
        (row) => row.category !== "Other",
    );

    const complianceRows: ComplianceRow[] = analytics.filteredInspections
        .filter((row) => row.reportNo !== "NON-INSPECTION")
        .filter(
            (row) =>
                row.unsafeDrivingReason ||
                row.crashIndicatorReason ||
                row.hosComplianceReason ||
                row.vehicleMaintenanceReason ||
                row.alcoholSubstanceReason,
        )
        .map((row) => ({
            driver: row.driver,
            inspectionDate: row.inspectionDate,
            reportNo: row.reportNo,
            unsafe: row.unsafeDrivingReason,
            crash: row.crashIndicatorReason,
            hos: row.hosComplianceReason,
            maintenance: row.vehicleMaintenanceReason,
            alcohol: row.alcoholSubstanceReason,
        }));

    const totalDriverCharges = filteredDriverCharges.reduce(
        (sum, row) => sum + row.amount,
        0,
    );
    const driversInvolved = new Set(complianceRows.map((row) => row.driver)).size;
    const topCategory = categorySummaries[0]?.category ?? "N/A";
    // Image 2 (driver charges) — summa bo'yicha
    const chargesByReason = Array.from(
        filteredDriverCharges.reduce<Map<string, number>>((map, row) => {
            const key = row.reason || "Unknown";
            map.set(key, (map.get(key) ?? 0) + row.amount);
            return map;
        }, new Map()),
    )
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Image 2 (driver charges) — soni bo'yicha
    const countByReason = Array.from(
        filteredDriverCharges.reduce<Map<string, number>>((map, row) => {
            const key = row.reason || "Unknown";
            map.set(key, (map.get(key) ?? 0) + 1);
            return map;
        }, new Map()),
    )
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return (
        <PageSection
            title="Violation Categories"
            description="Per-driver compliance breakdown and driver charges in one place."
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Compliance Violations" value={String(complianceRows.length)} icon={ShieldAlert} tone="negative" />
                <MetricCard label="Drivers Involved" value={String(driversInvolved)} icon={Truck} />
                <MetricCard label="Most Common Category" value={topCategory} icon={CircleAlert} />
                <MetricCard label="Total Driver Charges" value={formatMoney(totalDriverCharges)} icon={DollarSign} tone="negative" />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard title="Violations by Category" icon={ShieldAlert}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={categorySummaries}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="numberOfViolations" name="Violations" fill="#0f766e" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Charge Amount by Reason" icon={DollarSign}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={chargesByReason} layout="vertical" margin={{ left: 8, right: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="value" name="Total Charges" fill="#ef4444" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <div className="xl:col-span-2" style={{ gridColumn: "1 / -1" }}>
                    <ChartCard title="Number of Charges by Reason" icon={CircleAlert}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={countByReason} layout="vertical" margin={{ left: 8, right: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="value" name="Charge Count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            <DataTable<ComplianceRow>
                title="Driver Compliance Breakdown"
                rows={complianceRows}
                searchPlaceholder="Search compliance"
                searchText={(row) =>
                    [
                        row.driver,
                        row.inspectionDate,
                        row.unsafe ?? "",
                        row.crash ?? "",
                        row.hos ?? "",
                        row.maintenance ?? "",
                        row.alcohol ?? "",
                    ].join(" ")
                }
                emptyTitle="No compliance violations found"
                emptyDescription="No driver compliance violations match the current filters."
                initialSortKey="inspectionDate"
                columns={[
                    { key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver },
                    { key: "unsafe", header: "Unsafe Driving", sortValue: (row) => row.unsafe ?? "", render: (row) => <ComplianceCell reason={row.unsafe} /> },
                    { key: "crash", header: "Crash Indicator", sortValue: (row) => row.crash ?? "", render: (row) => <ComplianceCell reason={row.crash} /> },
                    { key: "hos", header: "Hours-of-Service", sortValue: (row) => row.hos ?? "", render: (row) => <ComplianceCell reason={row.hos} /> },
                    { key: "maintenance", header: "Vehicle Maintenance", sortValue: (row) => row.maintenance ?? "", render: (row) => <ComplianceCell reason={row.maintenance} /> },
                    { key: "alcohol", header: "Controlled Substances", sortValue: (row) => row.alcohol ?? "", render: (row) => <ComplianceCell reason={row.alcohol} /> },
                    { key: "date", header: "Inspection Date", sortValue: (row) => row.inspectionDate, render: (row) => formatDate(row.inspectionDate) },
                ]}
            />


        </PageSection>
    );
}

function FinancialImpactSection() {
    const analytics = useAnalytics();
    const { filteredDriverCharges } = useSafetyCompliance();

    const formatMoney = (value: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(value);

    const net = analytics.totalIncome - analytics.totalDriverOutcome;
    const topOutcomeReason = analytics.outcomeByReason[0]?.name ?? "N/A";
    const topOutcomeDriver = analytics.outcomeByDriver[0]?.name ?? "N/A";

    const incomeVsOutcome = [
        { name: "Income", value: analytics.totalIncome },
        { name: "Outcome", value: analytics.totalDriverOutcome },
    ];

    return (
        <PageSection
            title="Financial Impact"
            description="Money coming in from inspections versus money charged to drivers."
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Income" value={formatMoney(analytics.totalIncome)} icon={DollarSign} tone="positive" />
                <MetricCard label="Total Outcome" value={formatMoney(analytics.totalDriverOutcome)} icon={DollarSign} tone="negative" />
                <MetricCard label="Net Balance" value={formatMoney(net)} icon={LineChartIcon} tone={net >= 0 ? "positive" : "negative"} />
                <MetricCard label="Highest Outcome Driver" value={topOutcomeDriver} icon={Truck} />
                <MetricCard label="Top Outcome Reason" value={topOutcomeReason} icon={ShieldAlert} />
                <MetricCard label="Charge Records" value={String(filteredDriverCharges.length)} icon={CircleAlert} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard title="Income vs Outcome" icon={BarChart3}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={incomeVsOutcome}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="value" name="Amount" radius={[8, 8, 0, 0]}>
                                {incomeVsOutcome.map((entry) => (
                                    <Cell key={entry.name} fill={entry.name === "Income" ? "#10b981" : "#ef4444"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Monthly Income from drivers" icon={LineChartIcon}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={analytics.monthlyInspection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
                <div className="xl:col-span-2" style={{ gridColumn: "1 / -1" }}>
                    <ChartCard title="Top Outcome by Driver" icon={Truck}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={analytics.outcomeByDriver.slice(0, 10).reverse()} layout="vertical" margin={{ left: 8, right: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="value" name="Outcome" fill="#2563eb" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            <DataTable<DriverChargeRecord>
                title="Driver Charges (Outcome)"
                rows={filteredDriverCharges}
                searchPlaceholder="Search charges"
                searchText={(row) => [row.inspectionDate, row.driver, row.reason, row.amount].join(" ")}
                emptyTitle="No charges found"
                emptyDescription="No driver charges match the current filters."
                initialSortKey="amount"
                columns={[
                    { key: "date", header: "Date", sortValue: (row) => row.inspectionDate, render: (row) => formatDate(row.inspectionDate) },
                    { key: "driver", header: "Driver", sortValue: (row) => row.driver, render: (row) => row.driver },
                    { key: "reason", header: "Reason", sortValue: (row) => row.reason, render: (row) => <ChargeReasonBadge reason={row.reason} /> },
                    { key: "amount", header: "Amount", sortValue: (row) => row.amount, render: (row) => <span className="font-semibold text-rose-700">{formatMoney(row.amount)}</span> },
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard label="Total Fleet Cost" value={formatCurrency(analytics.totalFleetCost)} icon={Truck}
                            tone="negative"/>
                <MetricCard label="Total Renewal Cost" value={formatCurrency(analytics.totalRenewalCost)}
                            icon={DollarSign} tone="negative"/>
                {/*<MetricCard label="Total Registration Cost" value={formatCurrency(analytics.totalRegistrationCost)}*/}
                {/*            icon={DollarSign} tone="negative"/>*/}
                <MetricCard label="Total Supplement Cost" value={formatCurrency(analytics.totalSupplementCost)}
                            icon={DollarSign} tone="negative"/>
                <MetricCard label="Most Expensive Unit" value={analytics.topFleetUnit} icon={BarChart3}/>
                <MetricCard label="Most Expensive Plate" value={analytics.topFleetPlate} icon={BarChart3}/>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <ChartCard
                    title="Cost by Unit"
                    icon={Truck}
                    dynamicHeight={Math.max(300, analytics.fleetByUnit.length * 36)}
                >
                    <ResponsiveContainer width="100%" height={Math.max(300, analytics.fleetByUnit.length * 36)}>
                        <BarChart
                            data={[...analytics.fleetByUnit].reverse()}
                            layout="vertical"
                            margin={{top: 4, right: 16, left: 8, bottom: 4}}
                            barSize={20}
                            barCategoryGap="40%"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis type="number" tick={{fontSize: 11}}/>
                            <YAxis type="category" dataKey="name" width={50} tick={{fontSize: 14}}/>
                            <Tooltip
                                content={({active, payload}) => {
                                    if (!active || !payload?.length) return null;
                                    const data = payload[0].payload;
                                    return (
                                        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                                Unit: {data.name}
                                            </p>
                                            {data.driverName && (
                                                <p className="text-sm text-zinc-500">Driver: {data.driverName}</p>
                                            )}
                                            <p className="text-sm font-medium text-zinc-700">
                                                Cost: {formatCurrency(data.value)}
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="value" name="Fleet Cost" fill="#2563eb" radius={[0, 8, 8, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Cost by Plate" icon={BarChart3}
                           dynamicHeight={Math.max(300, analytics.fleetByPlate.length * 40)}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={[...analytics.fleetByPlate]} layout="vertical" barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis type="number" tick={{fontSize: 12}}/>
                            <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar dataKey="value" name="Fleet Cost" fill="#0f766e" radius={[0, 8, 8, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Cost by Expense Type" icon={DollarSign}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={analytics.fleetByExpenseType}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="name" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar dataKey="value" name="Fleet Cost" fill="#ef4444" radius={[8, 8, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Total Plate cost and 2290" icon={DollarSign}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={analytics.totalSumAndSup}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                            <XAxis dataKey="name" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip content={<ChartTooltip/>}/>
                            <Bar dataKey="value" name="Amount" fill="#0a8d7c" radius={[8, 8, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <div className="xl:col-span-2" style={{ gridColumn: "1 / -1" }}>
                    <ChartCard title="Top 10 Most Expensive Units" icon={Truck}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={analytics.fleetByUnitPrice.slice(0, 10).reverse()} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7"/>
                                <XAxis type="number" tick={{fontSize: 12}}/>
                                <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}}/>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                                    Unit: {data.name}
                                                </p>
                                                {data.driverName ? (
                                                    <p className="text-sm text-zinc-500">Driver: {data.driverName}</p>
                                                ) : (
                                                    <p className="text-sm text-zinc-400">Driver: —</p>
                                                )}
                                                <p className="text-sm font-medium text-zinc-700">
                                                    Price: {formatCurrency(data.value)}
                                                </p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="value" name="Price" fill="#f59e0b" radius={[0, 8, 8, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            <DataTable<FleetCostRecord>
                title="Fleet and Plate Cost Table"
                rows={analytics.fleetCostsWithDriver}
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
                        row.driverName ?? "-",
                        row.notes ?? "",
                    ].join(" ")
                }
                emptyTitle="No fleet costs found"
                emptyDescription="No fleet or plate records match the current filters."
                columns={[
                    {key: "unit", header: "Unit", sortValue: (row) => row.unit, render: (row) => row.unit},
                    {key: "vin", header: "VIN", sortValue: (row) => row.vin, render: (row) => row.vin},
                    {key: "make", header: "Make", sortValue: (row) => row.make, render: (row) => row.make},
                    {key: "plate", header: "Plate", sortValue: (row) => row.plate, render: (row) => row.plate},
                    {
                        key: "price",
                        header: "Price",
                        sortValue: (row) => row.price,
                        render: (row) => formatCurrency(row.price)
                    },
                    {
                        key: "supplement",
                        header: "2290",
                        sortValue: (row) => row.supplement,
                        render: (row) => formatCurrency(row.supplement)
                    },
                    {
                        key: "total",
                        header: "Total Price",
                        sortValue: (row) => row.totalPrice,
                        render: (row) => formatCurrency(row.totalPrice)
                    },
                    {
                        key: "expenseType",
                        header: "Expense Type",
                        sortValue: (row) => row.expenseType,
                        render: (row) => row.expenseType
                    },
                    {
                        key: "driver",
                        header: "Driver Name",
                        sortValue: (row) => row.driverName ?? "",
                        render: (row) => row.driverName ?? "—"
                    },
                    {
                        key: "notes",
                        header: "Notes",
                        sortValue: (row) => row.notes ?? "",
                        render: (row) => row.notes ?? "—"
                    },
                ]}
            />
        </PageSection>
    );
}

export function SafetyComplianceDashboardView() {
    return <DashboardSection/>;
}

export function SafetyComplianceInspectionsView() {
    return <InspectionsSection/>;
}

export function SafetyComplianceDriverScorecardView() {
    return <DriverScorecardSection/>;
}

export function SafetyComplianceViolationCategoriesView() {
    return <ViolationCategoriesSection/>;
}

export function SafetyComplianceFinancialImpactView() {
    return <FinancialImpactSection/>;
}

export function SafetyComplianceFleetCostsView() {
    return <FleetAndPlateCostsSection/>;
}
