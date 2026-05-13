import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const err = sp.error;

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[radial-gradient(circle_at_30%_-10%,rgba(249,115,22,0.35),transparent_45%),#020202] px-4 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(120deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative z-10 w-full max-w-md space-y-6 text-center">
        {err === "forbidden" && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            This account is not marked as admin. Ask an owner to run{" "}
            <code className="rounded bg-black/40 px-1">update profiles set role = &apos;admin&apos;</code> for your
            Clerk user id.
          </div>
        )}
        {err === "no_db" && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            DATABASE_URL is missing. Add your Vercel Postgres / Neon connection string to the environment.
          </div>
        )}
        <SignIn
          fallbackRedirectUrl="/admin"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "border border-white/10 bg-black/70 shadow-2xl",
            },
          }}
        />
        <p className="text-sm text-zinc-500">
          <Link href="/" className="text-orange-300 underline-offset-4 hover:underline">
            ← Back to Prize Hub
          </Link>
        </p>
      </div>
    </div>
  );
}
