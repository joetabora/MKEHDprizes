"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssignmentWithPrize, GameType, PrizeRow, RarityTier } from "@/types/database";
import {
  loadPrizeLabDataAction,
  upsertPrizeAction,
  insertAssignmentAction,
  setAssignmentEnabledAction,
  duplicatePrizeAction,
} from "@/actions/prize-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RARITY_OPTIONS, rarityLabel } from "@/lib/rarity";
import { previewDistribution } from "@/lib/prize-engine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
const games: GameType[] = ["wheel", "plinko", "slots"];

export function PrizeLab() {
  const [prizes, setPrizes] = useState<PrizeRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PrizeRow | null>(null);
  const [previewGame, setPreviewGame] = useState<GameType>("wheel");

  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    rarity: "common" as RarityTier,
    quantity_total: 50,
    quantity_remaining: 50,
    active: true,
    redemption_instructions: "",
    internal_notes: "",
  });

  const reload = useCallback(async () => {
    try {
      const data = await loadPrizeLabDataAction();
      setPrizes(data.prizes);
      setAssignments(data.assignments);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load prizes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const previewRows = previewDistribution(
    assignments.filter((x) => x.game === previewGame),
    [],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase">
            Prize lab
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Inventory, rarity tiers, and per-game weights. Wheel visuals can diverge from probability for a premium
            slice layout.
          </p>
        </div>
        <Button
          className="h-12 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 font-semibold text-black"
          onClick={() => {
            setEditing(null);
            setForm({
              name: "",
              description: "",
              image_url: "",
              rarity: "common",
              quantity_total: 50,
              quantity_remaining: 50,
              active: true,
              redemption_instructions: "",
              internal_notes: "",
            });
            setOpen(true);
          }}
        >
          New prize
        </Button>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList className="bg-white/5">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="distribution">Distribution preview</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory" className="mt-4">
          <ScrollArea className="h-[560px] rounded-2xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Rarity</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-zinc-500">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && prizes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-zinc-500">
                      No prizes yet — seed demo data or create your first SKU.
                    </TableCell>
                  </TableRow>
                )}
                {prizes.map((p) => (
                  <TableRow key={p.id} className="border-white/10">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="capitalize">{p.rarity}</TableCell>
                    <TableCell>
                      {p.quantity_remaining}/{p.quantity_total}
                    </TableCell>
                    <TableCell>{p.active ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-white/10"
                          onClick={async () => {
                            try {
                              await duplicatePrizeAction(p.id);
                              toast.success("Prize duplicated");
                              await reload();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Duplicate failed");
                            }
                          }}
                        >
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-white/10"
                          onClick={() => {
                            setEditing(p);
                            setForm({
                              name: p.name,
                              description: p.description ?? "",
                              image_url: p.image_url ?? "",
                              rarity: p.rarity as RarityTier,
                              quantity_total: p.quantity_total,
                              quantity_remaining: p.quantity_remaining,
                              active: p.active,
                              redemption_instructions: p.redemption_instructions ?? "",
                              internal_notes: p.internal_notes ?? "",
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="distribution" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-zinc-400">Game</Label>
            <Select value={previewGame} onValueChange={(v) => setPreviewGame((v ?? "wheel") as GameType)}>
              <SelectTrigger className="w-48 rounded-xl border-white/10 bg-black/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {games.map((g) => (
                  <SelectItem key={g} value={g} className="capitalize">
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
            <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Expected blend</p>
            <div className="space-y-2">
              {previewRows.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-40 truncate font-medium text-white">{row.label}</div>
                  <div className="w-24 text-xs capitalize text-zinc-400">{rarityLabel(row.rarity)}</div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400"
                      style={{ width: `${Math.min(100, row.expectedPct).toFixed(1)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right tabular-nums text-zinc-200">
                    {row.expectedPct.toFixed(1)}%
                  </div>
                </div>
              ))}
              {previewRows.length === 0 && <p className="text-zinc-500">No active assignments for this game.</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AssignmentQuickAdd assignments={assignments} prizes={prizes} onSaved={() => void reload()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-white/10 bg-zinc-950 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-2xl uppercase">
              {editing ? "Edit prize" : "Create prize"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                className="rounded-xl border-white/10 bg-black/40"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                className="rounded-xl border-white/10 bg-black/40"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                className="rounded-xl border-white/10 bg-black/40"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select
                  value={form.rarity}
                  onValueChange={(v) => v && setForm({ ...form, rarity: v as RarityTier })}
                >
                  <SelectTrigger className="rounded-xl border-white/10 bg-black/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RARITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  <span className="text-sm text-zinc-400">Eligible on floor</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity total</Label>
                <Input
                  type="number"
                  className="rounded-xl border-white/10 bg-black/40"
                  value={form.quantity_total}
                  onChange={(e) => setForm({ ...form, quantity_total: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity remaining</Label>
                <Input
                  type="number"
                  className="rounded-xl border-white/10 bg-black/40"
                  value={form.quantity_remaining}
                  onChange={(e) => setForm({ ...form, quantity_remaining: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Redemption instructions (guest facing)</Label>
              <Textarea
                className="rounded-xl border-white/10 bg-black/40"
                value={form.redemption_instructions}
                onChange={(e) => setForm({ ...form, redemption_instructions: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Internal notes</Label>
              <Textarea
                className="rounded-xl border border-amber-500/30 bg-amber-950/20"
                value={form.internal_notes}
                onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 font-semibold text-black"
              type="button"
              onClick={async () => {
                try {
                  await upsertPrizeAction({
                    editingId: editing?.id ?? null,
                    name: form.name,
                    description: form.description,
                    image_url: form.image_url || null,
                    rarity: form.rarity,
                    quantity_total: form.quantity_total,
                    quantity_remaining: form.quantity_remaining,
                    active: form.active,
                    redemption_instructions: form.redemption_instructions,
                    internal_notes: form.internal_notes,
                  });
                  toast.success(editing ? "Prize updated" : "Prize created");
                  setOpen(false);
                  await reload();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Save failed");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignmentQuickAdd({
  prizes,
  assignments,
  onSaved,
}: {
  prizes: PrizeRow[];
  assignments: AssignmentWithPrize[];
  onSaved: () => void;
}) {
  const [prizeId, setPrizeId] = useState("");
  const [game, setGame] = useState<GameType>("wheel");
  const [probability, setProbability] = useState(10);
  const [visual, setVisual] = useState(10);
  const [wheelColor, setWheelColor] = useState("#3f3f46");
  const [glow, setGlow] = useState(false);
  const [slotIdx, setSlotIdx] = useState(0);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold uppercase">
        Game assignments
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Bind prizes to activations. Plinko requires a slot index; wheel can set slice color.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Prize</Label>
          <Select value={prizeId} onValueChange={(v) => setPrizeId(v ?? "")}>
            <SelectTrigger className="rounded-xl border-white/10 bg-black/40">
              <SelectValue placeholder="Choose prize" />
            </SelectTrigger>
            <SelectContent>
              {prizes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Game</Label>
          <Select value={game} onValueChange={(v) => setGame((v ?? "wheel") as GameType)}>
            <SelectTrigger className="rounded-xl border-white/10 bg-black/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {games.map((g) => (
                <SelectItem key={g} value={g} className="capitalize">
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Probability weight</Label>
          <Input
            type="number"
            className="rounded-xl border-white/10 bg-black/40"
            value={probability}
            onChange={(e) => setProbability(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Visual weight (wheel)</Label>
          <Input
            type="number"
            className="rounded-xl border-white/10 bg-black/40"
            value={visual}
            onChange={(e) => setVisual(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Wheel color</Label>
          <Input
            className="rounded-xl border-white/10 bg-black/40"
            value={wheelColor}
            onChange={(e) => setWheelColor(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <Switch checked={glow} onCheckedChange={setGlow} />
          <span className="text-sm text-zinc-400">Jackpot glow</span>
        </div>
        <div className="space-y-2">
          <Label>Plinko slot index</Label>
          <Input
            type="number"
            className="rounded-xl border-white/10 bg-black/40"
            value={slotIdx}
            onChange={(e) => setSlotIdx(Number(e.target.value))}
          />
        </div>
      </div>
      <Button
        className="mt-4 rounded-2xl bg-white/10 hover:bg-white/20"
        type="button"
        onClick={async () => {
          if (!prizeId) {
            toast.error("Pick a prize.");
            return;
          }
          try {
            await insertAssignmentAction({
              prizeId,
              game,
              probability,
              visual,
              wheelColor,
              glow,
              slotIdx,
              displaySort: assignments.filter((a) => a.game === game).length * 10,
            });
            toast.success("Assignment created");
            onSaved();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to add assignment");
          }
        }}
      >
        Add assignment
      </Button>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Prize</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Prob</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((a) => (
              <TableRow key={a.id} className="border-white/10">
                <TableCell className="font-medium">{a.prize?.name}</TableCell>
                <TableCell className="capitalize">{a.game}</TableCell>
                <TableCell>{a.probability_weight}</TableCell>
                <TableCell>
                  <Switch
                    checked={a.enabled}
                    onCheckedChange={async (v) => {
                      try {
                        await setAssignmentEnabledAction(a.id, v);
                        onSaved();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Update failed");
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
