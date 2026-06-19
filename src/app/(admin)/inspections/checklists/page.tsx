import {
  AdminPageTemplate,
  TablePlaceholder,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { Plus } from "lucide-react";

export default function InspectionChecklistsPage() {
  return (
    <AdminPageTemplate
      eyebrow="Inspections"
      title="Checklists"
      description="Build checklist templates, required fields, scoring rules, and version history here."
      actions={
        <TemplateAction variant="primary">
          <Plus className="size-4" aria-hidden="true" />
          New checklist
        </TemplateAction>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TemplateCard title="Checklist builder" />
        <TablePlaceholder />
      </div>
    </AdminPageTemplate>
  );
}
