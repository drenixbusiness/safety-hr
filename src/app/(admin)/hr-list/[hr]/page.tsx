import { notFound } from "next/navigation";
import { HrDashboardView } from "@/components/admin/hr-dashboard-view";
import { getHrProfileBySlug, hrProfiles } from "@/lib/hr-profiles";

export const dynamicParams = false;

export function generateStaticParams() {
  return hrProfiles.map((profile) => ({ hr: profile.slug }));
}

export default async function HrDashboardPage({
  params,
}: {
  params: Promise<{ hr: string }>;
}) {
  const { hr } = await params;
  const profile = getHrProfileBySlug(hr);

  if (!profile) {
    notFound();
  }

  return <HrDashboardView hrName={profile.name} />;
}
