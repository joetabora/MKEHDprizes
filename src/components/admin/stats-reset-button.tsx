"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function StatsResetButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      disabled={busy}
      className="h-11 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 font-semibold text-black"
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/admin/stats-reset", { method: "POST" });
          const json = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok) toast.error(json.error || "Reset failed");
          else {
            toast.success("Stats window reset");
            window.location.reload();
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Resetting…" : "Reset stats window"}
    </Button>
  );
}
