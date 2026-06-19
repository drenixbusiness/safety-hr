import {
  AdminPageTemplate,
  TablePlaceholder,
  TemplateAction,
} from "@/components/admin/admin-page-template";
import { Download } from "lucide-react";

export default function ReportExportsPage() {
  return (
    <AdminPageTemplate
      eyebrow="Reports"
      title="Exports"
      description="Configure CSV, PDF, scheduled delivery, and audit archive exports here."
      actions={
        <TemplateAction variant="primary">
          <Download className="size-4" aria-hidden="true" />
          Export
        </TemplateAction>
      }
    >
      <TablePlaceholder />
    </AdminPageTemplate>
  );
}
