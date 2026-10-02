ALTER TABLE "test"."byx_opportunities" ADD COLUMN "defillama_pool_id" text;--> statement-breakpoint
ALTER TABLE "test"."byx_opportunities" ADD COLUMN "current_apy_updated_at" timestamp;--> statement-breakpoint
-- Hand-written backfill: drizzle-kit models schema, not data. Everything above
-- this line came from `drizzle-kit generate` and should stay byte-identical to it.
--
-- Only UUIDs verified against a live yields.llama.fi/pools snapshot on 2026-09-30
-- are written. Rows 9, 10, 23 and 24 have a similarly-named Berapaw vault whose
-- underlying token is a DIFFERENT Island (another fee tier/version) - pinning one
-- would silently show another pool's APY, so they stay NULL. Rows 5 and 7 are
-- proxies (the raw NFT position is untracked; the Infrared vault is a different
-- contract from the Berapaw vault it wraps) and stay NULL pending an explicit
-- decision. Every remaining row has no Llama pool at all. NULL is fail-safe: an
-- unverified row keeps its stored APY instead of being pointed at a guess.
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = '747c1d2a-c668-4682-b9f9-296708a3dd90' WHERE "id" = '1';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = 'a14bd201-764c-40a5-86b8-2928b2461232' WHERE "id" = '2';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = 'e302de4d-952e-4e18-9749-0a9dc86e98bc' WHERE "id" = '3';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = 'd9fa8e14-0447-4207-9ae8-7810199dfa1f' WHERE "id" = '4';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = '7f236628-273b-49b3-a283-edb4962dbfb2' WHERE "id" = '6';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = 'b3b28743-f20b-4849-8250-1b2f3047c436' WHERE "id" = '8';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = '18329564-f261-4b1a-ac91-b77c7e8e9fb8' WHERE "id" = '11';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = 'c2184a53-1eeb-49dc-b065-a7d05e2c84bb' WHERE "id" = '15';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = '47444258-5cc2-4e33-95a7-1bc5df79b83b' WHERE "id" = '19';--> statement-breakpoint
UPDATE "test"."byx_opportunities" SET "defillama_pool_id" = '63e9c699-9eaf-4106-aaf5-653297e0b9dd' WHERE "id" = '22';
