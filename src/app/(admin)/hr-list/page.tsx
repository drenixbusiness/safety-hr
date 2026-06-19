import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import {
  AdminPageTemplate,
  TemplateCard,
} from "@/components/admin/admin-page-template";
import { hrProfiles } from "@/lib/hr-profiles";

export default function HrListPage() {
  return (
    <AdminPageTemplate
      eyebrow="HR's list"
      title="HR's list"
      description="Open a dedicated dashboard for each HR and review their drivers working durations."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <TemplateCard title="Alex, Alfred, Winston, Issac">
          <div className="grid gap-3">
            {hrProfiles.map((hr) => (
              <Link
                key={hr.name}
                href={`/hr-list/${hr.slug}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-zinc-950 text-white">
                    <UserRound className="size-4" aria-hidden="true" />
                  </span>
                  {hr.name}
                </span>
                <ChevronRight className="size-4 text-zinc-400" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </TemplateCard>

        <TemplateCard
          title="Dashboard access"
          description="Select a person to open a dedicated dashboard with their timeline and durations."
        />
      </div>
    </AdminPageTemplate>
  );
}
