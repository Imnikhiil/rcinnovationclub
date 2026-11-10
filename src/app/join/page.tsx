import { Globe, MessageCircle } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import MembershipPanel from "@/components/forms/MembershipPanel";
import Newsletter from "@/components/sections/Newsletter";
import { getContent } from "@/lib/content";
import { getNotifyConfig } from "@/lib/notify-config";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata("join");
}

export default async function JoinPage() {
  const c = await getContent();
  const j = c.join;

  return (
    <>
      <section className="section-y">
        <div className="container-x">
          <Reveal>
            <div className="card mx-auto max-w-3xl p-6 text-center sm:p-12">
              <span className="eyebrow">{j.eyebrow}</span>
              <h1 className="mt-4 font-display text-[1.75rem] font-extrabold leading-tight sm:text-4xl">{j.title}</h1>
              <p className="mx-auto mb-7 mt-4 max-w-xl leading-relaxed text-muted">{j.description}</p>

              <MembershipPanel registration={c.registration} notify={getNotifyConfig(c)} />

              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <a href={c.social.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <Globe size={18} /> {j.btnInstagram}
                </a>
                <a href={c.social.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <MessageCircle size={18} /> {j.btnWhatsapp}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <Newsletter />
    </>
  );
}