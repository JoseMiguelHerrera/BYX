CREATE SCHEMA "drizzle";
--> statement-breakpoint
CREATE TABLE "drizzle"."byx_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"is_funding_asset" boolean NOT NULL,
	"address" text,
	"price_usd" text,
	"decimals" integer NOT NULL,
	"token_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drizzle"."byx_chain_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"chain_id" text NOT NULL,
	"asset_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drizzle"."byx_chain_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"debank_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drizzle"."byx_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"chain_id" text NOT NULL,
	"current_apy" text NOT NULL,
	"enabled" boolean NOT NULL,
	"withdrawal_type" text NOT NULL,
	"immediate_withdrawal" boolean NOT NULL,
	"type" text NOT NULL,
	"protocol_name" text NOT NULL,
	"has_collectable_rewards" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drizzle"."byx_opportunity_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drizzle"."byx_opportunity_smart_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"address" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drizzle"."byx_transaction_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"opportunity_asset_id" text NOT NULL,
	"amount" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drizzle"."byx_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_address" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"opportunity_id" text NOT NULL,
	"transaction_hash" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drizzle"."byx_chain_assets" ADD CONSTRAINT "byx_chain_assets_chain_id_byx_chain_metadata_id_fk" FOREIGN KEY ("chain_id") REFERENCES "drizzle"."byx_chain_metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drizzle"."byx_chain_assets" ADD CONSTRAINT "byx_chain_assets_asset_id_byx_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "drizzle"."byx_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drizzle"."byx_opportunities" ADD CONSTRAINT "byx_opportunities_chain_id_byx_chain_metadata_id_fk" FOREIGN KEY ("chain_id") REFERENCES "drizzle"."byx_chain_metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drizzle"."byx_opportunity_assets" ADD CONSTRAINT "byx_opportunity_assets_opportunity_id_byx_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "drizzle"."byx_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drizzle"."byx_opportunity_assets" ADD CONSTRAINT "byx_opportunity_assets_asset_id_byx_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "drizzle"."byx_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drizzle"."byx_opportunity_smart_contracts" ADD CONSTRAINT "byx_opportunity_smart_contracts_opportunity_id_byx_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "drizzle"."byx_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drizzle"."byx_transaction_assets" ADD CONSTRAINT "byx_transaction_assets_transaction_id_byx_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "drizzle"."byx_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drizzle"."byx_transaction_assets" ADD CONSTRAINT "byx_transaction_assets_opportunity_asset_id_byx_opportunity_assets_id_fk" FOREIGN KEY ("opportunity_asset_id") REFERENCES "drizzle"."byx_opportunity_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drizzle"."byx_transactions" ADD CONSTRAINT "byx_transactions_opportunity_id_byx_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "drizzle"."byx_opportunities"("id") ON DELETE no action ON UPDATE no action;