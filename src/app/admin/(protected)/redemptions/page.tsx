"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

type Row = {
  id: string;
  code: string;
  status: string;
  claim_later: boolean;
  created_at: string;
  prize: { name: string } | null;
};

export default function RedemptionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const reload = useCallback(async () => {
    const supa = createClient();
    const { data, error } = await supa
      .from("redemptions")
      .select("id, code, status, claim_later, created_at, prize:prizes(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error(error.message);
      return;
    }
    const list = (data ?? []).map((r) => ({
      ...r,
      prize: Array.isArray(r.prize) ? r.prize[0] : r.prize,
    })) as Row[];
    setRows(list);
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
                <td className="px-4 py-3">{r.prize?.name ?? "—"}</td>
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
                        const supa = createClient();
                        const {
                          data: { user },
                        } = await supa.auth.getUser();
                        const { error } = await supa
                          .from("redemptions")
                          .update({
                            status: "redeemed",
                            redeemed_at: new Date().toISOString(),
                            redeemed_by: user?.id ?? null,
                          })
                          .eq("id", r.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Marked redeemed");
                          await reload();
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
