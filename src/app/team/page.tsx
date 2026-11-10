import TeamExplorer from "@/components/team/TeamExplorer";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { AmbassadorItem, MemberName, TeamMember } from "@/lib/types";

export async function generateMetadata() {
  return pageMetadata("team");
}

export default async function TeamPage() {
  const c = await getContent();
  return (
    <>
      <h1 className="sr-only">RC Innovation Club Team</h1>
      <div className="pt-10" />
      <TeamExplorer
        hierarchyEnabled={c.teamHierarchySection.enabled !== false}
        hint={c.teamHierarchySection.hint}
        core={c.coreTeam as unknown as TeamMember[]}
        ambassadors={c.ambassadors as unknown as AmbassadorItem[]}
        membersCurrent={c.membersCurrent as unknown as MemberName[]}
        membersPrevious={c.membersPrevious as unknown as MemberName[]}
        coreText={c.coreSection}
        ambassadorsText={c.ambassadorsSection}
        membersText={c.membersSection}
      />
    </>
  );
}