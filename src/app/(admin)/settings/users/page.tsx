import {
  AdminPageTemplate,
  TablePlaceholder,
  TemplateAction,
} from "@/components/admin/admin-page-template";
import { UserPlus } from "lucide-react";

export default function SettingsUsersPage() {
  return (
    <AdminPageTemplate
      eyebrow="Settings"
      title="Users"
      description="Manage users, roles, invitations, access groups, and account state here."
      actions={
        <TemplateAction variant="primary">
          <UserPlus className="size-4" aria-hidden="true" />
          Invite user
        </TemplateAction>
      }
    >
      <TablePlaceholder />
    </AdminPageTemplate>
  );
}
