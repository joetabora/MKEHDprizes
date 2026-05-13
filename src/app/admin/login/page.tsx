import Link from "next/link";
import { adminLoginAction } from "@/actions/admin-auth";
import { MkeLogo } from "@/components/brand/mke-logo";

const ErrorCopy: Record<string, string> = {
  config: "Admin login is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.",
  credentials: "Incorrect password.",
  no_db: "Database is not configured (DATABASE_URL).",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error;
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/admin";
  const errorMsg = error ? ErrorCopy[error] ?? "Something went wrong." : null;

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.18),transparent_50%),#050506] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex justify-center">
          <MkeLogo className="scale-90" />
        </div>
        <h1 className="mb-2 text-center font-display text-2xl font-semibold tracking-wide">
          Staff console
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-400">
          Sign in to manage prizes, analytics, and redemptions.
        </p>

        {errorMsg ? (
          <div
            className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {errorMsg}
          </div>
        ) : null}

        <form action={adminLoginAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-zinc-300">Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none ring-orange-500/40 placeholder:text-zinc-600 focus:ring-2"
              placeholder="Admin password"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-2xl bg-orange-500 py-3 font-medium text-black transition hover:bg-orange-400"
          >
            Sign in
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-zinc-500">
          <Link href="/" className="text-orange-300/80 hover:text-orange-200">
            ← Back to floor apps
          </Link>
        </p>
      </div>
    </div>
  );
}
