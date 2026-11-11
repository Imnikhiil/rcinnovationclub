import Script from "next/script";

/** A real GA4 measurement ID looks like G-XXXXXXXXXX. Anything else is ignored (also keeps the inline script injection-safe). */
export function validGaId(raw?: string | null): string | null {
  const id = (raw || "").trim();
  return /^G-[A-Z0-9]{4,20}$/i.test(id) ? id.toUpperCase() : null;
}

export default function GoogleAnalytics({ id }: { id: string }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}