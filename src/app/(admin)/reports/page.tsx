import {
  AdminPageTemplate,
  TemplateAction,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { Download, Plus } from "lucide-react";

export default function ReportsPage() {
  return (
    <AdminPageTemplate
      eyebrow="Reports"
      title="Reports"
      description="Use this route for dashboards, scheduled exports, compliance reports, and saved views."
      actions={
        <>
          <TemplateAction>
            <Download className="size-4" aria-hidden="true" />
            Export
          </TemplateAction>
          <TemplateAction variant="primary">
            <Plus className="size-4" aria-hidden="true" />
            New report
          </TemplateAction>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <TemplateCard title="Report canvas" />
        <TemplateCard title="Saved views" />
        <TemplateCard title="Scheduled delivery" />
        <TemplateCard title="Compliance archive" />
      </div>
    </AdminPageTemplate>
  );
}
