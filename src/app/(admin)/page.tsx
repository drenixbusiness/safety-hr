"use client";

import {
  AdminPageTemplate,
  TablePlaceholder,
  TemplateAction, TemplateCard,
} from "@/components/admin/admin-page-template";
import {Calendar, Calendar1} from "lucide-react";
import { useState } from "react";

type DashboardPeriod = "weekly" | "monthly";

export default function OverviewPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("monthly");

  return (
    <AdminPageTemplate
      eyebrow="Overview"
      title="Dashboard of HR's and their drivers working durataion"
      description="Here you can check how effective works your HR's."
      actions={
        <>
          <TemplateAction
            aria-pressed={period === "weekly"}
            onClick={() => setPeriod("weekly")}
            variant={period === "weekly" ? "primary" : "secondary"}
          >
            <Calendar1 className="size-4" aria-hidden="true" />
            Weekly
          </TemplateAction>
          <TemplateAction
            aria-pressed={period === "monthly"}
            onClick={() => setPeriod("monthly")}
            variant={period === "monthly" ? "primary" : "secondary"}
          >
            <Calendar className="size-4" aria-hidden="true" />
            Monthly
          </TemplateAction>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols">
          <TemplateCard title="List of HR's " />
        </div>
        <TablePlaceholder period={period} />
      </div>
    </AdminPageTemplate>
  );
}
