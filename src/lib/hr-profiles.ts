export type HrProfile = {
  name: string;
  slug: string;
};

export const hrProfiles: HrProfile[] = [
  { name: "Issac", slug: "issac" },
  { name: "Alex", slug: "alex" },
  { name: "Alfred", slug: "alfred" },
  { name: "Winston", slug: "winston" },
];

export function getHrProfileBySlug(slug: string) {
  return hrProfiles.find((profile) => profile.slug === slug);
}
