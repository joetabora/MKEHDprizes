"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { listRedemptionsAdminAction, markRedemptionRedeemedAction } from "@/actions/prize-admin";

type Row = {
  id: string;
  code: string;
  status: string;
  claim_later: boolean;
  created_at: Date;
  prizeName: string | null;
};

export default function RedemptionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await listRedemptionsAdminAction();
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = rows.filter((r) => r.code.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase">
            Redemptions
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Search by code, mark fulfilled, keep the line moving.</p>
        </div>
        <Input
          placeholder="Filter code…"
          className="max-w-xs rounded-2xl border-white/10 bg-black/40"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Prize</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-orange-200">{r.code}</td>
                <td className="px-4 py-3">{r.prizeName ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      r.status === "redeemed"
                        ? "border-emerald-500/40 text-emerald-200"
                        : "border-amber-500/40 text-amber-200"
                    }
                  >
                    {r.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {format(new Date(r.created_at), "MMM d, h:mm a")}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "pending" && (
                    <Button
                      size="sm"
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500"
                      type="button"
                      onClick={async () => {
                        try {
                          await markRedemptionRedeemedAction(r.id);
                          toast.success("Marked redeemed");
                          await reload();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Mark redeemed
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No redemptions in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
