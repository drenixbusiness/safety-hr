import {
  AdminPageTemplate,
  TablePlaceholder,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { Plus, SlidersHorizontal } from "lucide-react";

export default function CrewsPage() {
  return (
    <AdminPageTemplate
      eyebrow="Crews"
      title="Crews"
      description="Use this route for team rosters, certifications, site assignments, availability, and safety readiness."
      actions={
        <>
          <TemplateAction>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
          </TemplateAction>
          <TemplateAction variant="primary">
            <Plus className="size-4" aria-hidden="true" />
            Add crew
          </TemplateAction>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TablePlaceholder />
        <TemplateCard title="Crew detail panel" />
      </div>
    </AdminPageTemplate>
  );
}
