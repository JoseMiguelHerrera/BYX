import dotenv from "dotenv";
dotenv.config();
import { integer, text, boolean, pgSchema } from "drizzle-orm/pg-core";


export const schema = pgSchema(process.env.DB_SCHEMA as string);

export const assets = schema.table(
  "byx_assets",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    isFundingAsset: boolean("is_funding_asset").notNull(),
    address: text("address"),
    priceUSD: text("price_usd"),
    decimals: integer("decimals").notNull(),
    tokenType: text("token_type", { enum: ["ERC20", "ERC721", "ERC1155", "NATIVE"] }).notNull(),
  }
);

export const chainMetadata = schema.table(
  "byx_chain_metadata",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    debankName: text("debank_name").notNull(),
  }
);

export const opportunities = schema.table(
  "byx_opportunities",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    chainId: text("chain_id").notNull().references(() => chainMetadata.id),
    current_apy: text("current_apy").notNull(),
    enabled: boolean("enabled").notNull(),
    withdrawalType: text("withdrawal_type", { enum: ["AMOUNT_IN", "AMOUNT_OUT", "NFT"] }).notNull(),
    immediate_withdrawal: boolean("immediate_withdrawal").notNull(),
    type: text("type", { enum: ["Lending", "LP", "Staking", "AutoLP", "Vault"] }).notNull(),
    protocolName: text("protocol_name").notNull(),
    hasCollectableRewards: boolean("has_collectable_rewards").notNull(),
  }
);


//Junction tables

//Junction table between chainMetadata and assets
export const chainAssets = schema.table(
    "byx_chain_assets",
    {
      id: text("id").primaryKey(),
      chainId: text("chain_id").notNull().references(() => chainMetadata.id),
      assetId: text("asset_id").notNull().references(() => assets.id),
    }
  );

// Junction table for opportunity assets (both input and output)
export const opportunityAssets = schema.table(
  "byx_opportunity_assets",
  {
    id: text("id").primaryKey(),
    opportunityId: text("opportunity_id").notNull().references(() => opportunities.id),
    assetId: text("asset_id").notNull().references(() => assets.id),
    role: text("role", { enum: ["input", "output"] }).notNull(),
  }
);
//Junction table for opportunity smart contracts
export const opportunitySmartContracts = schema.table(
    "byx_opportunity_smart_contracts",
    {
      id: text("id").primaryKey(),
      opportunityId: text("opportunity_id").notNull().references(() => opportunities.id),
      address: text("address").notNull(),
      type: text("type", { enum: ["invest", "divest", "UniswapV3Pool"] }).notNull(),
    }
  );
