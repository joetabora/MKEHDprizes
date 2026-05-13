import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[radial-gradient(circle_at_30%_-10%,rgba(249,115,22,0.35),transparent_45%),#020202] px-4 py-12 text-white">
      <div className="relative z-10 w-full max-w-md space-y-6 text-center">
        <SignUp
          fallbackRedirectUrl="/admin"
          signInUrl="/sign-in"
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
