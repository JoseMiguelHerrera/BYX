import dotenv from "dotenv";
dotenv.config();
import {sql} from "drizzle-orm";
import { integer, text, boolean, pgSchema, timestamp } from "drizzle-orm/pg-core";

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
    // Nullable on purpose: debankName is notNull, but GoldRush cannot serve every
    // chain, so a notNull goldrushName would make those chains unrepresentable.
    goldrushName: text("goldrush_name"),
    supportedByGoldrush: boolean("supported_by_goldrush"),
    // DefiLlama's own chain slug, which is NOT GoldRush's (it says `ethereum`
    // where GoldRush says `eth-mainnet`). Null means "no DefiLlama price fallback
    // for this chain" - the slug itself carries the support fact, so unlike
    // GoldRush there is no separate supportedByDefillama flag.
    defillamaName: text("defillama_name"),
  }
);

export const opportunities = schema.table(
  "byx_opportunities",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    chainId: text("chain_id").notNull().references(() => chainMetadata.id),
    current_apy: text("current_apy").notNull(),
    /**
     * DeFi Llama pool UUID this row's APY is read from. NULL means "never
     * refreshed" - current_apy is a hand-set value and the job leaves it alone.
     * Pinned rather than matched on project/symbol at runtime so a vendor rename
     * cannot silently repoint a row at the wrong pool.
     */
    defillamaPoolId: text("defillama_pool_id"),
    /** Last successful refresh. NULL means current_apy is still the seed value. */
    currentApyUpdatedAt: timestamp("current_apy_updated_at"),
    enabled: boolean("enabled").notNull(),
    withdrawalType: text("withdrawal_type", { enum: ["AMOUNT_IN", "AMOUNT_OUT", "NFT"] }).notNull(),
    immediate_withdrawal: boolean("immediate_withdrawal").notNull(),
    type: text("type", { enum: ["Lending", "LP", "Staking", "AutoLP", "Vault"] }).notNull(),
    protocolName: text("protocol_name").notNull(),
    hasCollectableRewards: boolean("has_collectable_rewards").notNull(),
    supportsAutoSwap: boolean("supports_auto_swap").notNull(),
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

export const transactions = schema.table(
  "byx_transactions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    userAddress: text("user_address").notNull(),
    type: text("type", { enum: ["invest", "divest", "requestDivest", "collectRewards", "withdraw", "funding"] }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    opportunityId: text("opportunity_id").notNull().references(() => opportunities.id),
    transactionHash: text("transaction_hash").notNull(),
  }
);

export const transactionAssetMovements = schema.table(
  "byx_transaction_asset_movements",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    transactionId: text("transaction_id").notNull().references(() => transactions.id),
    direction: text("direction", { enum: ["in", "out"] }).notNull(),
    opportunityAssetId: text("opportunity_asset_id").notNull().references(() => opportunityAssets.id),
    amountToken: text("amount_token").notNull(),
    amountUSDAtTransaction: text("amount_usd_at_transaction").notNull(),
  },
  (table) => [
    {
      opportunityMatch: sql`check (
        (SELECT opportunity_id FROM byx_transactions WHERE id = ${table.transactionId}) = 
        (SELECT opportunity_id FROM byx_opportunity_assets WHERE id = ${table.opportunityAssetId})
      )`
    }
  ]
);
