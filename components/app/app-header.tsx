import Link from "next/link";
import { Caret } from "@/components/ui/caret";
import { site } from "@/config/site";
import type { SessionUser } from "@/lib/auth/session";
import { AccountMenu } from "./account-menu";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/journal", label: "Journal" },
];

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-black/85 backdrop-blur-md">
      <div className="container-bp flex h-14 items-center gap-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2" aria-label={`${site.name} dashboard`}>
          <Caret size={20} blink={false} />
          <span className="hidden text-[15px] font-medium sm:inline">{site.name}</span>
        </Link>
        <nav aria-label="App" className="flex flex-1 items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-1.5 t-small text-text-2 hover:bg-surface-2 hover:text-text-1">
              {l.label}
            </Link>
          ))}
        </nav>
        <AccountMenu handle={user.profile.handle} name={user.profile.name || user.profile.handle} isAdmin={user.isAdmin} />
      </div>
    </header>
  );
}
