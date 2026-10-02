ALTER TABLE "test"."byx_chain_metadata" ADD COLUMN "defillama_name" text;--> statement-breakpoint
-- Hand-written backfill: drizzle-kit models schema, not data. Everything above
-- this line came from `drizzle-kit generate` and should stay byte-identical to it.
--
-- For all four configured chains the DefiLlama slug happens to equal our internal
-- chain id (ethereum/arbitrum/base/berachain, verified live). It is
-- still stored as a column rather than assumed in code: an identity that is a
-- verified data fact cannot silently become wrong when a chain is added.
--
-- Only the four chains that actually exist in byx_chain_metadata are written. The
-- testnets (base-sepolia, berachain-testnet, ethereum-holesky) have no rows, and
-- their DefiLlama slugs were never verified - writing a guess would defeat the
-- fail-safe rule that an unverified chain gets no fallback.
--
-- NULL means "no DefiLlama price fallback for this chain", which is fail-safe: the
-- token keeps GoldRush's result rather than being priced against the wrong chain.
UPDATE "test"."byx_chain_metadata" SET "defillama_name" = 'berachain' WHERE "id" = 'berachain';--> statement-breakpoint
UPDATE "test"."byx_chain_metadata" SET "defillama_name" = 'arbitrum' WHERE "id" = 'arbitrum';--> statement-breakpoint
UPDATE "test"."byx_chain_metadata" SET "defillama_name" = 'ethereum' WHERE "id" = 'ethereum';--> statement-breakpoint
UPDATE "test"."byx_chain_metadata" SET "defillama_name" = 'base' WHERE "id" = 'base';
