import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Providers from "@/components/ui/Providers";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileJoinBar from "@/components/layout/MobileJoinBar";
import GoogleAnalytics, { validGaId } from "@/components/layout/GoogleAnalytics";
import { getContent } from "@/lib/content";
import { assetUrl } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const seo = c.seo;
  const home = seo.pages.home;
  return {
    metadataBase: new URL(seo.siteUrl),
    title: { default: home.title, template: `%s | ${seo.siteName}` },
    description: home.description,
    keywords: home.keywords,
    openGraph: {
      siteName: seo.siteName,
      title: home.title,
      description: home.description,
      images: [assetUrl(seo.defaultImage)],
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#030712",
};

// Sets the saved theme BEFORE the page paints, so there is no light/dark flash.
const themeScript = `try{var t=localStorage.getItem('rc-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await getContent();
  const gaId = validGaId(c.analyticsSection.ga4MeasurementId);
  const bar = c.announcementBar;

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${outfit.variable} ${jakarta.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          {bar.enabled ? (
            <AnnouncementBar
              id={bar.announcementId}
              message={bar.message}
              linkUrl={bar.linkUrl}
              linkLabel={bar.linkLabel}
              dismissible={bar.dismissible}
            />
          ) : null}
          <Navbar brand={c.footer.brand} />
          <main>{children}</main>
          <Footer
            brand={c.footer.brand}
            description={c.footer.description}
            email={c.footer.email}
            copyright={c.footer.copyright}
            instagram={c.social.instagram}
            whatsapp={c.social.whatsapp}
          />
          <MobileJoinBar registration={c.registration} />
        </Providers>
        {/* Visitor + speed stats (Vercel dashboard). They render nothing visible and do nothing outside Vercel. */}
        <Analytics />
        <SpeedInsights />
        {c.analyticsSection.enabled !== false && gaId ? <GoogleAnalytics id={gaId} /> : null}
      </body>
    </html>
  );
}