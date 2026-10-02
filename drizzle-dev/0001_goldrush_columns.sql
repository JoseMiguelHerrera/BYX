ALTER TABLE "test"."byx_assets" ADD COLUMN "supported_by_goldrush" boolean;--> statement-breakpoint
ALTER TABLE "test"."byx_chain_metadata" ADD COLUMN "goldrush_name" text;--> statement-breakpoint
ALTER TABLE "test"."byx_chain_metadata" ADD COLUMN "supported_by_goldrush" boolean;--> statement-breakpoint
-- The statements below are hand-written: drizzle-kit models schema, not data, so it
-- cannot generate this backfill. Everything above this line came from
-- `drizzle-kit generate` and should stay byte-identical to its output.
--
-- Only the four chains that actually exist in byx_chain_metadata are populated.
-- base-sepolia, berachain-testnet and ethereum-holesky are deliberately NOT written:
-- they have no rows, so such UPDATEs would be silent no-ops that make this migration
-- look broader than it is. They survive only as dormant chainPicker.ts enum entries.
--
-- Everything else keeps NULL/falsey, which is fail-safe under the hide rule: an
-- unverified chain is hidden rather than assumed supported.
UPDATE "test"."byx_chain_metadata" SET "goldrush_name" = 'berachain-mainnet', "supported_by_goldrush" = true WHERE "id" = 'berachain';--> statement-breakpoint
UPDATE "test"."byx_chain_metadata" SET "goldrush_name" = 'arbitrum-mainnet', "supported_by_goldrush" = true WHERE "id" = 'arbitrum';--> statement-breakpoint
UPDATE "test"."byx_chain_metadata" SET "goldrush_name" = 'eth-mainnet', "supported_by_goldrush" = true WHERE "id" = 'ethereum';--> statement-breakpoint
UPDATE "test"."byx_chain_metadata" SET "goldrush_name" = 'base-mainnet', "supported_by_goldrush" = true WHERE "id" = 'base';
