"use client";

import { usePathname } from "next/navigation";

interface Props {
  top?: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  extras?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wraps every page in the public site chrome (announcement bar, navbar, footer, floating bars),
 * except under /admin, which has its own layout.
 */
export default function SiteChrome({ top, header, footer, extras, children }: Props) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      {top}
      {header}
      <main>{children}</main>
      {footer}
      {extras}
    </>
  );
}