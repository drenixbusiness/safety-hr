import {
  AdminPageTemplate,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { Plus } from "lucide-react";

export default function SettingsIntegrationsPage() {
  return (
    <AdminPageTemplate
      eyebrow="Settings"
      title="Integrations"
      description="Connect external systems, configure API credentials, webhooks, and sync behavior here."
      actions={
        <TemplateAction variant="primary">
          <Plus className="size-4" aria-hidden="true" />
          Add integration
        </TemplateAction>
      }
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <TemplateCard title="Integration slot" />
        <TemplateCard title="Webhook slot" />
        <TemplateCard title="Sync status slot" />
      </div>
    </AdminPageTemplate>
  );
}
