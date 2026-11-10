import PageHeader from "@/components/ui/PageHeader";
import ResourcesHub from "@/components/resources/ResourcesHub";
import CertificateVerify from "@/components/resources/CertificateVerify";
import Newsletter from "@/components/sections/Newsletter";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { ResourceItem } from "@/lib/types";

export async function generateMetadata() {
  return pageMetadata("resources");
}

export default async function ResourcesPage() {
  const c = await getContent();
  const s = c.resourcesSection;
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
      <section className="section-y pt-6">
        <div className="container-x">
          <ResourcesHub items={c.resources as unknown as ResourceItem[]} />
        </div>
      </section>
      {c.certificatesSection.enabled !== false ? (
        <section className="section-y bg-bg-soft/60" id="certificates">
          <div className="container-x">
            <CertificateVerify cfg={c.certificatesSection} />
          </div>
        </section>
      ) : null}
      <Newsletter />
    </>
  );
}