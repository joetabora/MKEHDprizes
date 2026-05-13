import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const rarityTierEnum = pgEnum("rarity_tier", [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "jackpot",
]);

export const gameTypeEnum = pgEnum("game_type", ["wheel", "plinko", "slots"]);

/** Opaque user id (legacy external auth ids allowed) */
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email"),
  full_name: text("full_name"),
  role: text("role").notNull().default("staff"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default(sql`'{}'::jsonb`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prizes = pgTable("prizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").default(""),
  image_url: text("image_url"),
  rarity: rarityTierEnum("rarity").notNull().default("common"),
  quantity_total: integer("quantity_total").notNull().default(0),
  quantity_remaining: integer("quantity_remaining").notNull().default(0),
  active: boolean("active").notNull().default(true),
  redemption_instructions: text("redemption_instructions").default(""),
  internal_notes: text("internal_notes").default(""),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prizeAssignments = pgTable(
  "prize_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prize_id: uuid("prize_id")
      .notNull()
      .references(() => prizes.id, { onDelete: "cascade" }),
    game: gameTypeEnum("game").notNull(),
    probability_weight: doublePrecision("probability_weight").notNull().default(1),
    visual_weight: doublePrecision("visual_weight").notNull().default(1),
    enabled: boolean("enabled").notNull().default(true),
    wheel_color: text("wheel_color"),
    wheel_glow_jackpot: boolean("wheel_glow_jackpot").notNull().default(false),
    plinko_slot_index: integer("plinko_slot_index"),
    slot_symbol_key: text("slot_symbol_key"),
    slot_payline_tier: integer("slot_payline_tier").notNull().default(0),
    display_sort: integer("display_sort").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("prize_assignments_prize_game_slot_uidx").on(
      t.prize_id,
      t.game,
      t.plinko_slot_index,
    ),
  }),
);

export const plays = pgTable("plays", {
  id: uuid("id").primaryKey().defaultRandom(),
  game: gameTypeEnum("game").notNull(),
  prize_id: uuid("prize_id").references(() => prizes.id, { onDelete: "set null" }),
  assignment_id: uuid("assignment_id").references(() => prizeAssignments.id, { onDelete: "set null" }),
  session_id: text("session_id").notNull(),
  client_meta: jsonb("client_meta").notNull().default(sql`'{}'::jsonb`),
  server_meta: jsonb("server_meta").notNull().default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const redemptions = pgTable("redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  play_id: uuid("play_id")
    .notNull()
    .references(() => plays.id, { onDelete: "cascade" }),
  prize_id: uuid("prize_id")
    .notNull()
    .references(() => prizes.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("pending"),
  claim_later: boolean("claim_later").notNull().default(false),
  redeemed_at: timestamp("redeemed_at", { withTimezone: true }),
  redeemed_by: text("redeemed_by").references(() => profiles.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PrizeSelect = typeof prizes.$inferSelect;
export type PrizeAssignmentSelect = typeof prizeAssignments.$inferSelect;
