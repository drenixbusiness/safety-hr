import {
  AdminPageTemplate,
  TablePlaceholder,
  TemplateAction,
} from "@/components/admin/admin-page-template";
import { Plus } from "lucide-react";

export default function SavedViewsPage() {
  return (
    <AdminPageTemplate
      eyebrow="Reports"
      title="Saved views"
      description="Store report filters, dashboard views, visibility rules, and team shortcuts here."
      actions={
        <TemplateAction variant="primary">
          <Plus className="size-4" aria-hidden="true" />
          New view
        </TemplateAction>
      }
    >
      <TablePlaceholder />
    </AdminPageTemplate>
  );
}
