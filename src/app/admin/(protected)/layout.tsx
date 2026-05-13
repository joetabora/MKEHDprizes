import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { MkeLogo } from "@/components/brand/mke-logo";
import { ensureProfileSynced } from "@/lib/auth/ensure-profile";
import { tryGetDb } from "@/db/index";
import { profiles } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/admin"));
  }

  await ensureProfileSynced();

  const db = tryGetDb();
  if (!db) {
    redirect("/sign-in?error=no_db");
  }

  const rows = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (rows[0]?.role !== "admin") {
    redirect("/sign-in?error=forbidden");
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
                href="/admin/redemptions"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
              >
                Redemptions
              </Link>
              <Link
                href="/"
                className="rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-orange-200 hover:bg-orange-500/20"
              >
                Floor apps
              </Link>
            </nav>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
