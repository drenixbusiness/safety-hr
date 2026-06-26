"use client";

import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { hrProfiles } from "@/lib/hr-profiles";

type NavChild = {
  label: string;
  href: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  {
    label: "Safety & Compliance",
    href: "/safety-compliance",
    icon: ShieldAlert,
    children: [
      { label: "Dashboard", href: "/safety-compliance" },
      { label: "Inspections", href: "/safety-compliance/inspections" },
      {
        label: "Driver Scorecard",
        href: "/safety-compliance/driver-scorecard",
      },
      {
        label: "Violation Categories",
        href: "/safety-compliance/violation-categories",
      },
      {
        label: "Financial Impact",
        href: "/safety-compliance/financial-impact",
      },
      {
        label: "Fleet & Plate Costs",
        href: "/safety-compliance/fleet-plate-costs",
      },
    ],
  },
  {
    label: "List of HR's",
    href: "/hr-list",
    icon: Users,
    children: hrProfiles.map((hr) => ({
      label: hr.name,
      href: `/hr-list/${hr.slug}`,
    })),
  },

];

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isSafetyCompliance = pathname.startsWith("/safety-compliance");
  const currentPage =
    navItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ) ?? navItems[0];

  return (
    <div className="h-screen overflow-hidden bg-zinc-100 text-zinc-950">
      <Sidebar />

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-zinc-950/40"
            onClick={() => setMobileNavOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-80 max-w-[88vw] flex-col border-r border-zinc-200 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
              <Brand />
              <button
                aria-label="Close navigation"
                className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600"
                onClick={() => setMobileNavOpen(false)}
                type="button"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <Navigation onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex h-full min-h-0 flex-col lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6 xl:px-8">
            <button
              aria-label="Open navigation"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              type="button"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>

            {isSafetyCompliance ? (
              <div id="sc-header-slot" className="flex min-w-0 flex-1 flex-wrap items-center gap-3" />
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-500">Admin workspace</p>
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                    {currentPage.label}
                  </h1>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
                    type="button"
                    aria-label="View notifications"
                    title="Notifications"
                  >
                    <Bell className="size-5" aria-hidden="true" />
                  </button>
                  <div className="flex h-10 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                      AD
                    </div>
                    <span className="text-sm font-medium text-zinc-700">Admin</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 [scrollbar-color:#a1a1aa_transparent] scrollbar-thin [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb:hover]:bg-zinc-400 sm:px-6 lg:py-8 xl:px-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-zinc-200 bg-white px-2 py-2 lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium ${
                active ? "text-emerald-700" : "text-zinc-500"
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-19.25 items-center border-b border-zinc-200 px-6">
        <Brand />
      </div>
      <Navigation />
    </aside>
  );
}

function Brand() {
  return (
    <Link className="flex items-center gap-3" href="/">
      <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          JM
        </p>
        <p className="text-base font-semibold text-zinc-950">Safety and HR</p>
      </div>
    </Link>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
      {navItems.map((item) => (
        <NavItem key={item.href} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function NavItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const [open, setOpen] = useState(active);

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
          active
            ? "bg-zinc-950 text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        aria-expanded={open}
        className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
          active
            ? "bg-zinc-950 text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
        }`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Icon className="size-5" aria-hidden="true" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={`size-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="mt-1 space-y-1 pl-8">
          {item.children?.map((child) => {
            const childActive = pathname === child.href;

            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  childActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
