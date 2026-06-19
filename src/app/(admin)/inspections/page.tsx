import {
  AdminPageTemplate,
  TablePlaceholder,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { CalendarPlus, SlidersHorizontal } from "lucide-react";

export default function InspectionsPage() {
  return (
    <AdminPageTemplate
      eyebrow="Inspections"
      title="Inspections"
      description="Use this route for inspection schedules, checklists, assignments, field notes, and approval states."
      actions={
        <>
          <TemplateAction>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
          </TemplateAction>
          <TemplateAction variant="primary">
            <CalendarPlus className="size-4" aria-hidden="true" />
            Schedule
          </TemplateAction>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-3">
          <TemplateCard title="Today" />
          <TemplateCard title="Upcoming" />
          <TemplateCard title="Blocked" />
        </div>
        <TablePlaceholder />
      </div>
    </AdminPageTemplate>
  );
}
