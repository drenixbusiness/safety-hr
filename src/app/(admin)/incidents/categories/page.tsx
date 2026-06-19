import {
  AdminPageTemplate,
  TablePlaceholder,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { Plus } from "lucide-react";

export default function IncidentCategoriesPage() {
  return (
    <AdminPageTemplate
      eyebrow="Incidents"
      title="Incident categories"
      description="Manage the category structure, severity mapping, routing rules, and labels used by incident records."
      actions={
        <TemplateAction variant="primary">
          <Plus className="size-4" aria-hidden="true" />
          Add category
        </TemplateAction>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <TemplateCard title="Category settings" />
        <TablePlaceholder />
      </div>
    </AdminPageTemplate>
  );
}
