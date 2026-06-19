"use client";

import { useState } from "react";
import { Calendar, Calendar1 } from "lucide-react";
import {
  AdminPageTemplate,
  HiredDriversTable,
  TablePlaceholder,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";

type HrDashboardViewProps = {
  hrName: string;
};

type DashboardPeriod = "weekly" | "monthly";

export function HrDashboardView({ hrName }: HrDashboardViewProps) {
  const [period, setPeriod] = useState<DashboardPeriod>("monthly");

  return (
    <AdminPageTemplate
      eyebrow={hrName}
      title={`${hrName} dashboard`}
      description={`Track ${hrName}'s active driver durations across weekly and monthly views.`}
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
        <div className="grid gap-6 xl:grid-cols-[1fr]">
          <TemplateCard title={`${hrName} summary`}>
            <HiredDriversTable hrName={hrName} />
          </TemplateCard>
        </div>
        <TablePlaceholder period={period} hrName={hrName} />
      </div>
    </AdminPageTemplate>
  );
}
