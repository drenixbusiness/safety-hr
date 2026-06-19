import {
  AdminPageTemplate,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { CalendarPlus } from "lucide-react";

export default function InspectionSchedulePage() {
  return (
    <AdminPageTemplate
      eyebrow="Inspections"
      title="Inspection schedule"
      description="Create calendar, assignment, recurring inspection, and due-date workflows here."
      actions={
        <TemplateAction variant="primary">
          <CalendarPlus className="size-4" aria-hidden="true" />
          Add schedule
        </TemplateAction>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <TemplateCard title="Schedule calendar" />
        <TemplateCard title="Inspector availability" />
      </div>
    </AdminPageTemplate>
  );
}
