import {
  AdminPageTemplate,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <AdminPageTemplate
      eyebrow="Settings"
      title="Settings"
      description="Use this route for workspace configuration, roles, notification rules, integrations, and project defaults."
      actions={
        <TemplateAction variant="primary">
          <Save className="size-4" aria-hidden="true" />
          Save changes
        </TemplateAction>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <TemplateCard title="Settings navigation" />
        <div className="space-y-6">
          <TemplateCard title="General settings" />
          <TemplateCard title="Permissions" />
          <TemplateCard title="Integrations" />
        </div>
      </div>
    </AdminPageTemplate>
  );
}
