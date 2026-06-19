import {
  AdminPageTemplate,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { Save } from "lucide-react";

export default function NewIncidentPage() {
  return (
    <AdminPageTemplate
      eyebrow="Incidents"
      title="New incident"
      description="Build the incident intake form, attachments, severity selection, and assignment workflow here."
      actions={
        <TemplateAction variant="primary">
          <Save className="size-4" aria-hidden="true" />
          Save incident
        </TemplateAction>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TemplateCard title="Incident form" />
        <TemplateCard title="Context panel" />
      </div>
    </AdminPageTemplate>
  );
}
