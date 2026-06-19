"use client";

import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Inbox, Maximize2, Minimize2, X } from "lucide-react";

type AdminPageTemplateProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function AdminPageTemplate({
  title,
  eyebrow = "Workspace",
  description,
  actions,
  children,
}: AdminPageTemplateProps) {
  return (
    <div className="pb-24 lg:pb-0">
      <section className="flex flex-col gap-4 border-b border-zinc-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </section>

      <div className="mt-6">{children}</div>
    </div>
  );
}

type TemplateActionProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function TemplateAction({
  children,
  variant = "secondary",
  className: extraClassName = "",
  ...buttonProps
}: TemplateActionProps) {
  const variantClassName =
    variant === "primary"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50";

  return (
    <button
      className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${variantClassName} ${extraClassName}`}
      type="button"
      {...buttonProps}
    >
      {children}
    </button>
  );
}

type TemplateCardProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
};

export function TemplateCard({
  title = "HR contacts",
  description = "Here important information of HR's",
  children,
}: TemplateCardProps) {
  const hrContacts = [
    { name: "Issac", phone: "+1 (555) 014-2201" },
    { name: "Alex", phone: "+1 (555) 014-3384" },
    { name: "Alfred", phone: "+1 (555) 014-9027" },
    { name: "Winston", phone: "+1 (555) 014-6712" },
  ];

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex min-h-32 flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
        </div>
        {children ? (
          <div className="mt-5">{children}</div>
        ) : (
          <div className="mt-5 divide-y divide-zinc-100">
            {hrContacts.map((contact) => (
              <div
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                key={contact.phone}
              >
                <span className="text-sm font-medium text-zinc-800">
                  {contact.name}
                </span>
                <a
                  className="whitespace-nowrap text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                >
                  {contact.phone}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type HiredDriverRecord = {
  hr: string;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  email: string;
  tenure: string;
  penaltyPoints: number;
};

type DriverDetailTable = {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
};

const hiredDriverRecords: HiredDriverRecord[] = [
  {
    hr: "Issac",
    firstName: "Alex",
    lastName: "Morgan",
    age: 34,
    phone: "+1 (555) 014-2201",
    email: "alex.morgan@jdmfleet.com",
    tenure: "4 yr 3 mo",
    penaltyPoints: 2,
  },
  {
    hr: "Issac",
    firstName: "Taylor",
    lastName: "Kim",
    age: 29,
    phone: "+1 (555) 014-7748",
    email: "taylor.kim@jdmfleet.com",
    tenure: "2 yr 8 mo",
    penaltyPoints: 0,
  },
  {
    hr: "Alex",
    firstName: "Jordan",
    lastName: "Lee",
    age: 41,
    phone: "+1 (555) 014-3384",
    email: "jordan.lee@jdmfleet.com",
    tenure: "6 yr 1 mo",
    penaltyPoints: 1,
  },
  {
    hr: "Alfred",
    firstName: "Sam",
    lastName: "Carter",
    age: 38,
    phone: "+1 (555) 014-9027",
    email: "sam.carter@jdmfleet.com",
    tenure: "3 yr 5 mo",
    penaltyPoints: 3,
  },
];

type HiredDriversTableProps = {
  hrName: string;
};

export function HiredDriversTable({ hrName }: HiredDriversTableProps) {
  const [selectedDriver, setSelectedDriver] = useState<HiredDriverRecord | null>(
    null,
  );
  const drivers = hiredDriverRecords.filter(
    (driver) => driver.hr.toLowerCase() === hrName.toLowerCase(),
  );

  useEffect(() => {
    if (!selectedDriver) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedDriver(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDriver]);

  if (drivers.length === 0) {
    return (
      <div className="flex min-h-55 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-white text-zinc-400">
          <Inbox className="size-7 animate-pulse" aria-hidden="true" />
        </div>
        <p className="text-base font-semibold text-zinc-950">
          HR hasn`t hired any drivers yet.
        </p>
        <p className="max-w-md text-sm leading-6 text-zinc-500">
          Once HR hires drivers, they will appear in the table here.
        </p>
      </div>
    );
  }

  const details = selectedDriver ? getDriverDetails(selectedDriver) : [];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-zinc-900/5">
        <div className="overflow-x-auto">
          <table className="min-w-230 w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-50 via-white to-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">First name</th>
                <th className="px-5 py-3">Last name</th>
                <th className="px-5 py-3">Age</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Work experience</th>
                <th className="px-5 py-3">Penalty points</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr
                  className="border-t border-zinc-100/80 text-sm text-zinc-700 transition hover:bg-emerald-50/30"
                  key={`${driver.firstName}-${driver.lastName}-${driver.phone}`}
                >
                  <td className="border-t border-zinc-100 px-5 py-4 font-medium text-zinc-950">
                    <div className="flex items-center gap-2">
                      <span>{driver.firstName}</span>
                      <button
                        aria-label={`Open details for ${driver.firstName} ${driver.lastName}`}
                        className="inline-flex size-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => setSelectedDriver(driver)}
                        type="button"
                      >
                        <Maximize2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td className="border-t border-zinc-100 px-5 py-4">
                    {driver.lastName}
                  </td>
                  <td className="border-t border-zinc-100 px-5 py-4">
                    {driver.age}
                  </td>
                  <td className="border-t border-zinc-100 px-5 py-4 whitespace-nowrap">
                    {driver.phone}
                  </td>
                  <td className="border-t border-zinc-100 px-5 py-4 whitespace-nowrap">
                    {driver.email}
                  </td>
                  <td className="border-t border-zinc-100 px-5 py-4 whitespace-nowrap">
                    {driver.tenure}
                  </td>
                  <td className="border-t border-zinc-100 px-5 py-4">
                    {driver.penaltyPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDriver ? (
        <DriverDetailsModal
          driver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
          sections={details}
        />
      ) : null}
    </>
  );
}

function getDriverDetails(driver: HiredDriverRecord): DriverDetailTable[] {
  const fullName = `${driver.firstName} ${driver.lastName}`;

  return [
    {
      title: "Weekly earnings",
      description: `Pay breakdown for ${fullName} over the last four weeks.`,
      columns: ["Week", "Gross", "Deductions", "Net"],
      rows: [
        ["Week 1", "$1,260", "$90", "$1,170"],
        ["Week 2", "$1,310", "$75", "$1,235"],
        ["Week 3", "$1,280", "$82", "$1,198"],
        ["Week 4", "$1,340", "$88", "$1,252"],
      ],
    },
    {
      title: "Violation log",
      description: "Recorded violations, severity, and assigned points.",
      columns: ["Date", "Violation", "Severity", "Points"],
      rows: [
        ["May 04", "Speeding", "Medium", "2"],
        ["May 11", "Missing log entry", "Low", "1"],
        ["May 18", "Late inspection", "Low", "1"],
      ],
    },
    {
      title: "Route activity",
      description: "Recent route work and service volume.",
      columns: ["Route", "Trips", "Hours", "Status"],
      rows: [
        ["West Hub", "12", "38.5", "On schedule"],
        ["North Yard", "9", "29.0", "On schedule"],
        ["City Loop", "7", "21.5", "Needs review"],
      ],
    },
    {
      title: "Compliance check",
      description: "Administrative review of required driver records.",
      columns: ["Check", "Result", "Last update"],
      rows: [
        ["License validity", "Valid", "May 19"],
        ["Medical card", "Valid", "May 12"],
        ["Background check", "Valid", "Apr 30"],
        ["Training refresh", "Pending", "Jun 02"],
      ],
    },
  ];
}

function DriverDetailsModal({
  driver,
  onClose,
  sections,
}: {
  driver: HiredDriverRecord;
  onClose: () => void;
  sections: DriverDetailTable[];
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-200 bg-gradient-to-r from-emerald-50 via-white to-zinc-50 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Driver details
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-zinc-950">
              {driver.firstName} {driver.lastName}
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Age {driver.age} | {driver.phone} | {driver.email}
            </p>
          </div>
          <button
            aria-label="Close modal"
            className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto p-6 xl:grid-cols-2">
          {sections.map((section) => (
            <DriverDetailSection key={section.title} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DriverDetailSection({ section }: { section: DriverDetailTable }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h4 className="text-sm font-semibold text-zinc-950">{section.title}</h4>
        <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {section.columns.map((column) => (
                <th className="px-5 py-3" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, rowIndex) => (
              <tr
                className="border-t border-zinc-100 text-sm text-zinc-700"
                key={`${section.title}-${rowIndex}`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    className={`border-t border-zinc-100 px-5 py-4 ${
                      cellIndex === 0 ? "font-medium text-zinc-950" : ""
                    }`}
                    key={`${section.title}-${rowIndex}-${cellIndex}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MetricGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {["Primary metric", "Secondary metric", "Pipeline", "Attention"].map(
        (label) => (
          <article
            className="rounded-lg border border-dashed border-zinc-300 bg-white p-5"
            key={label}
          >
            <p className="text-sm font-medium text-zinc-500">{label}</p>
            <div className="mt-4 h-8 w-24 rounded bg-zinc-100" />
            <div className="mt-4 h-3 w-36 rounded bg-zinc-100" />
          </article>
        ),
      )}
    </section>
  );
}

type TimelinePeriod = "weekly" | "monthly";

type TimelineDriver = {
  name: string;
  hr: string;
  tone: string;
  start: number;
  end: number;
};

type TimelineItem = {
  value: number;
  label: string;
};

type TablePlaceholderProps = {
  period?: TimelinePeriod;
  hrName?: string;
};

export function TablePlaceholder({
  period = "weekly",
  hrName,
}: TablePlaceholderProps) {
  const isWeekly = period === "weekly";
  const [weeklyScrollEnabled, setWeeklyScrollEnabled] = useState(false);
  const weeklyScrollable = isWeekly && weeklyScrollEnabled;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const timelineItems: TimelineItem[] =
    isWeekly
      ? Array.from({ length: 52 }, (_, index) => ({
          value: index + 1,
          label: `W${index + 1}`,
        }))
      : months.map((month, index) => ({
          value: index + 1,
          label: month,
        }));
  const weeklyCellWidth = 56;
  const chartColumns = isWeekly
    ? weeklyScrollable
      ? `repeat(${timelineItems.length}, ${weeklyCellWidth}px)`
      : `repeat(${timelineItems.length}, minmax(0, 1fr))`
    : `repeat(${timelineItems.length}, minmax(0, 1fr))`;
  const timelineWidth = weeklyScrollable
    ? `${timelineItems.length * weeklyCellWidth}px`
    : "100%";
  const hiddenHorizontalScrollbar =
    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
  const rowHeight = 56;
  const weeklyDrivers: TimelineDriver[] = [
    {
      name: "Alex Morgan",
      hr: "Issac",
      start: 2,
      end: 12,
      tone: "bg-emerald-500",
    },
    {
      name: "Kyle Davis",
      hr: "Alex",
      start: 2,
      end: 9,
      tone: "bg-violet-500",
    },
    {
      name: "Jordan Lee",
      hr: "Alfred",
      start: 6,
      end: 24,
      tone: "bg-sky-500",
    },
    {
      name: "Sam Carter",
      hr: "Alex",
      start: 18,
      end: 38,
      tone: "bg-amber-500",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 41,
      end: 52,
      tone: "bg-zinc-700",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 41,
      end: 52,
      tone: "bg-zinc-700",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 41,
      end: 52,
      tone: "bg-zinc-700",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 41,
      end: 52,
      tone: "bg-zinc-700",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 15,
      end: 17,
      tone: "bg-zinc-700",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 20,
      end: 30,
      tone: "bg-zinc-700",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 9,
      end: 13,
      tone: "bg-zinc-700",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 1,
      end: 32,
      tone: "bg-zinc-700",
    },
  ];
  const monthlyDrivers: TimelineDriver[] = [
    {
      name: "Alex Morgan",
      hr: "Issac",
      start: 1,
      end: 3,
      tone: "bg-emerald-500",
    },
    {
      name: "Kyle Davis",
      hr: "Alex",
      start: 1,
      end: 2,
      tone: "bg-violet-500",
    },
    {
      name: "Jordan Lee",
      hr: "Alfred",
      start: 2,
      end: 6,
      tone: "bg-sky-500",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 1,
      end: 8,
      tone: "bg-zinc-700",
    },
    {
      name: "Sam Carter",
      hr: "Alex",
      start: 5,
      end: 9,
      tone: "bg-amber-500",
    },
    {
      name: "Taylor Kim",
      hr: "Issac",
      start: 10,
      end: 12,
      tone: "bg-zinc-700",
    },
  ];
  const drivers = (period === "weekly" ? weeklyDrivers : monthlyDrivers)
    .filter((driver) =>
      hrName ? driver.hr.toLowerCase() === hrName.toLowerCase() : true,
    )
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const timelineZoneRows = Math.max(hrName ? 3.2 : 1, drivers.length);
  const timelineMaxRows = 7;
  const timelineMaxHeight =
    rowHeight * timelineMaxRows + (hrName ? rowHeight * 0.25 : 0);
  const timelineZoneHeight = rowHeight * timelineZoneRows;

  const getBarSegment = (
    driver: TimelineDriver,
    zoneItems: TimelineItem[],
  ) => {
    const zoneStart = zoneItems[0].value;
    const zoneEnd = zoneItems[zoneItems.length - 1].value;
    const driverStart = driver.start;
    const driverEnd = driver.end;
    const start = Math.max(driverStart, zoneStart);
    const end = Math.min(driverEnd, zoneEnd);

    if (start > end) {
      return null;
    }

    const midpoint = Math.ceil((driverStart + driverEnd) / 2);

    return {
      gridColumn: `${start - zoneStart + 1} / span ${end - start + 1}`,
      showDriver: start === driverStart,
      showHr: start <= midpoint && end >= midpoint,
      showArrow: end === driverEnd,
    };
  };

  const renderGridCells = (items: TimelineItem[], showFirstDivider = false) =>
    items.map((item) => (
      <div
        className={`border-l border-zinc-100/80 ${
          showFirstDivider ? "" : "first:border-l-0"
        }`}
        key={item.value}
      />
    ));

  const renderTimelineLabels = (
    items: TimelineItem[],
    showFirstDivider = false,
  ) =>
    items.map((item) => (
      <div
        className={`flex h-6 items-center justify-center border-l border-zinc-100/80 px-1 text-center text-[11px] font-medium leading-none text-zinc-500 ${
          showFirstDivider ? "" : "first:border-l-0"
        }`}
        key={item.value}
      >
        {item.label}
      </div>
    ));

  const renderTimelineZone = (
    items: TimelineItem[],
    showFirstDivider = false,
    className = "",
  ) => (
    <div
      className={`relative w-full bg-zinc-50 ${className} ${
        weeklyScrollable ? "pb-4" : ""
      }`}
      style={{ minHeight: `${timelineZoneHeight}px` }}
    >
      <div
        className="pointer-events-none absolute inset-0 grid"
        style={{
          gridTemplateColumns: chartColumns,
        }}
      >
        {renderGridCells(items, showFirstDivider)}
      </div>

      <div className="relative">
        {drivers.map((driver, index) => {
          const segment = getBarSegment(driver, items);

          return (
            <div
              className="grid border-b border-zinc-100 last:border-b-0"
              key={`${driver.name}-${driver.start}-${driver.end}-${items[0].value}-${index}`}
              style={{
                gridTemplateColumns: chartColumns,
                height: `${rowHeight}px`,
              }}
            >
              {segment ? (
                <div
                  className="relative flex items-center px-1"
                  style={{ gridColumn: segment.gridColumn }}
                >
                  {segment.showDriver ? (
                    <span className="absolute left-1 top-1 text-[11px] font-semibold text-zinc-800">
                      {driver.hr}
                    </span>
                  ) : null}
                  {segment.showHr ? (
                    <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-zinc-700">
                      {driver.name}
                    </span>
                  ) : null}
                  <div
                    className={`h-0.5 flex-1 rounded-full ${driver.tone}`}
                    title={`${driver.name}: ${timelineItems[driver.start - 1].label}-${timelineItems[driver.end - 1].label}`}
                  />
                  {segment.showArrow ? (
                    <div
                      className={`size-2 -translate-x-1 rotate-45 ${driver.tone}`}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-950">
            HR`s hired drivers working durations
          </h3>
          {isWeekly ? (
            <TemplateAction
              aria-pressed={weeklyScrollEnabled}
              className="h-9 px-3"
              onClick={() => setWeeklyScrollEnabled((value) => !value)}
              variant={weeklyScrollEnabled ? "primary" : "secondary"}
            >
              <Minimize2 className="size-4" aria-hidden="true" />
              {weeklyScrollEnabled ? "Expand" : "Collapse"}
            </TemplateAction>
          ) : null}
        </div>
        {/*<p className="mt-1 text-sm text-zinc-500">*/}
        {/*  JM HR`s*/}
        {/*</p>*/}
      </div>

      <div className="p-5">
        <div
          className="h-auto max-h-full overflow-y-auto overflow-x-hidden overscroll-contain pr-2 [scrollbar-color:#d4d4d8_transparent] scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb:hover]:bg-zinc-400"
          style={{ maxHeight: `${timelineMaxHeight}px` }}
        >
          {weeklyScrollable ? (
            <div className={`overflow-x-auto ${hiddenHorizontalScrollbar}`}>
              <div className="min-w-max" style={{ width: timelineWidth }}>
                <TimelineSurface
                  chartColumns={chartColumns}
                  items={timelineItems}
                  renderTimelineLabels={renderTimelineLabels}
                  renderTimelineZone={renderTimelineZone}
                  timelineWidth={timelineWidth}
                />
              </div>
            </div>
          ) : (
            <TimelineSurface
              chartColumns={chartColumns}
              items={timelineItems}
              renderTimelineLabels={renderTimelineLabels}
              renderTimelineZone={renderTimelineZone}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineSurface({
  chartColumns,
  items,
  renderTimelineLabels,
  renderTimelineZone,
  timelineWidth,
}: {
  chartColumns: string;
  items: TimelineItem[];
  renderTimelineLabels: (
    items: TimelineItem[],
    showFirstDivider?: boolean,
  ) => ReactNode;
  renderTimelineZone: (
    items: TimelineItem[],
    showFirstDivider?: boolean,
    className?: string,
  ) => ReactNode;
  timelineWidth?: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white px-4 py-4"
      style={timelineWidth ? { width: timelineWidth } : undefined}
    >
      <div className="overflow-hidden rounded-t-lg border-b border-dashed border-zinc-200">
        {renderTimelineZone(items)}
      </div>
      <div className="border-t border-zinc-200 px-0.5 py-2">
        <div className="grid w-full" style={{ gridTemplateColumns: chartColumns }}>
          {renderTimelineLabels(items)}
        </div>
      </div>
    </div>
  );
}
