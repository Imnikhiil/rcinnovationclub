import PageHeader from "@/components/ui/PageHeader";
import ProjectsGrid from "@/components/projects/ProjectsGrid";
import Newsletter from "@/components/sections/Newsletter";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { ProjectItem } from "@/lib/types";

export async function generateMetadata() {
  return pageMetadata("projects");
}

export default async function ProjectsPage() {
  const c = await getContent();
  const s = c.projectsSection;
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
      <section className="section-y pt-6">
        <div className="container-x">
          <ProjectsGrid items={c.projects as unknown as ProjectItem[]} />
        </div>
      </section>
      <Newsletter />
    </>
  );
}