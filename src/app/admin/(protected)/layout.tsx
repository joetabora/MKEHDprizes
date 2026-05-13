import { redirect } from "next/navigation";
import Link from "next/link";
import { MkeLogo } from "@/components/brand/mke-logo";
import { tryGetDb } from "@/db/index";
import { adminLogoutAction } from "@/actions/admin-auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = tryGetDb();
  if (!db) {
    redirect("/admin/login?error=no_db");
  }

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.14),transparent_45%),#050506] text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/admin" className="pointer-events-auto">
            <MkeLogo className="scale-90" />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/admin"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
              >
                Overview
              </Link>
              <Link
                href="/admin/prizes"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
              >
                Prizes
              </Link>
              <Link
                href="/admin/analytics"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
              >
                Analytics
              </Link>
              <Link
                href="/"
                className="rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-orange-200 hover:bg-orange-500/20"
              >
                Floor apps
              </Link>
            </nav>
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
