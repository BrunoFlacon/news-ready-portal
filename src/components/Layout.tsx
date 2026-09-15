import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="min-w-0 flex-1 max-w-full overflow-x-clip">{children}</main>
      <SiteFooter />
    </div>
  );
}
