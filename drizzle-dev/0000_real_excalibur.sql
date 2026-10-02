CREATE SCHEMA "test";
--> statement-breakpoint
CREATE TABLE "test"."byx_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"is_funding_asset" boolean NOT NULL,
	"address" text,
	"price_usd" text,
	"decimals" integer NOT NULL,
	"token_type" text NOT NULL,
	"supported_by_debank" boolean
);
--> statement-breakpoint
CREATE TABLE "test"."byx_chain_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"chain_id" text NOT NULL,
	"asset_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test"."byx_chain_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"debank_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test"."byx_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"chain_id" text NOT NULL,
	"current_apy" text NOT NULL,
	"enabled" boolean NOT NULL,
	"withdrawal_type" text NOT NULL,
	"immediate_withdrawal" boolean NOT NULL,
	"type" text NOT NULL,
	"protocol_name" text NOT NULL,
	"has_collectable_rewards" boolean NOT NULL,
	"supports_auto_swap" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test"."byx_opportunity_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test"."byx_opportunity_smart_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"address" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test"."byx_transaction_asset_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"direction" text NOT NULL,
	"opportunity_asset_id" text NOT NULL,
	"amount_token" text NOT NULL,
	"amount_usd_at_transaction" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test"."byx_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_address" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"opportunity_id" text NOT NULL,
	"transaction_hash" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test"."byx_chain_assets" ADD CONSTRAINT "byx_chain_assets_chain_id_byx_chain_metadata_id_fk" FOREIGN KEY ("chain_id") REFERENCES "test"."byx_chain_metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test"."byx_chain_assets" ADD CONSTRAINT "byx_chain_assets_asset_id_byx_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "test"."byx_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test"."byx_opportunities" ADD CONSTRAINT "byx_opportunities_chain_id_byx_chain_metadata_id_fk" FOREIGN KEY ("chain_id") REFERENCES "test"."byx_chain_metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test"."byx_opportunity_assets" ADD CONSTRAINT "byx_opportunity_assets_opportunity_id_byx_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "test"."byx_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test"."byx_opportunity_assets" ADD CONSTRAINT "byx_opportunity_assets_asset_id_byx_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "test"."byx_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test"."byx_opportunity_smart_contracts" ADD CONSTRAINT "byx_opportunity_smart_contracts_opportunity_id_byx_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "test"."byx_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test"."byx_transaction_asset_movements" ADD CONSTRAINT "byx_transaction_asset_movements_transaction_id_byx_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "test"."byx_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test"."byx_transaction_asset_movements" ADD CONSTRAINT "byx_transaction_asset_movements_opportunity_asset_id_byx_opportunity_assets_id_fk" FOREIGN KEY ("opportunity_asset_id") REFERENCES "test"."byx_opportunity_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test"."byx_transactions" ADD CONSTRAINT "byx_transactions_opportunity_id_byx_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "test"."byx_opportunities"("id") ON DELETE no action ON UPDATE no action;