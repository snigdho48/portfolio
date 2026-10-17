import type { ReactNode } from "react";
import SiteNav from "./SiteNav";
import DeferredChrome from "./DeferredChrome";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="site-shell font-sans">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteNav />
      <main id="main-content">{children}</main>
      <DeferredChrome />
    </div>
  );
}
