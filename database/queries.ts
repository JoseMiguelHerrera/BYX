import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChainMetadata, Asset, OpportunityData, OpportunityContract } from "../pages/api/dataModels";
import { eq} from "drizzle-orm";
import * as schema from "./schema";
import {Transaction} from "../pages/api/dataModels"
import dotenv from "dotenv";
import { transactions, transactionAssets, opportunityAssets } from "./schema";
dotenv.config();

let db: PostgresJsDatabase<typeof schema> | null = null;

export async function getDB(): Promise<
  PostgresJsDatabase<typeof schema>
> {
  if (db) {
    return db;
  }
  let connection: postgres.Sql<{}> | null = null;
  if (process.env.NODE_ENV === "development") {
    //local defaults for a local db instance
    console.log("connected to local database");
    connection = postgres({
      database: process.env.DB_NAME,
    });
  } else {
    console.log("connected to ", process.env.DB_HOST);
    connection = postgres({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: "prefer",
    });
  }
  db = drizzle(connection, { schema });
  console.log("database connection initialized");
  return db;
}

export async function dbCleanup(): Promise<void> {
  try {
    console.log("Starting database cleanup...");

    if (db) {
      // Get the underlying postgres connection from drizzle
      const client = (db as any).session?.config?.connection;
      if (client) {
        await client.end();
        console.log("Database connection closed");
      }
      db = null;
    }

    console.log("Database cleanup completed");
  } catch (error) {
    console.error("Error during database cleanup:", error);
    throw error;
  }
}

export async function getChainMetadata(): Promise<ChainMetadata[]> {
  const db = await getDB();
  
  // First get all chains with their associated assets through joins
  const chainAssetsResult = await db
    .select({
      chainId: schema.chainMetadata.id,
      chainName: schema.chainMetadata.name,
      debankName: schema.chainMetadata.debankName,
      assetId: schema.assets.id,
      assetName: schema.assets.name,
      assetSymbol: schema.assets.symbol,
      assetIsFundingAsset: schema.assets.isFundingAsset,
      assetAddress: schema.assets.address,
      assetPriceUSD: schema.assets.priceUSD,
      assetDecimals: schema.assets.decimals,
      assetTokenType: schema.assets.tokenType,
    })
    .from(schema.chainMetadata)
    .leftJoin(schema.chainAssets, eq(schema.chainMetadata.id, schema.chainAssets.chainId))
    .leftJoin(schema.assets, eq(schema.chainAssets.assetId, schema.assets.id));

  // Group and transform the results into the ChainMetadata structure
  const chainsMap = new Map<string, ChainMetadata>();
  
  for (const row of chainAssetsResult) {
    if (!chainsMap.has(row.chainId)) {
      chainsMap.set(row.chainId, {
        id: row.chainId,
        name: row.chainName,
        debankName: row.debankName,
        assets: [],
      });
    }

    // Only add asset if it exists (handling left join nulls)
    if (row.assetId) {
      const chain = chainsMap.get(row.chainId)!;
      chain.assets.push({
        id: row.assetId,
        name: row.assetName as string,
        symbol: row.assetSymbol as string,
        isFundingAsset: row.assetIsFundingAsset as boolean,
        address: row.assetAddress,
        priceUSD: parseFloat(row.assetPriceUSD as string),
        decimals: row.assetDecimals as number,
        type: row.assetTokenType as "ERC20" | "ERC721" | "ERC1155" | "NATIVE",
      });
    }
  }

  return Array.from(chainsMap.values());
}

export async function getOpportunityById(opportunityId: string): Promise<OpportunityData | null> {
  const db = await getDB();

  // First get the base opportunity data
  const opportunity = await db
    .select({
      id: schema.opportunities.id,
      name: schema.opportunities.name,
      chainId: schema.opportunities.chainId,
      apy: schema.opportunities.current_apy,
      enabled: schema.opportunities.enabled,
      withdrawalType: schema.opportunities.withdrawalType,
      immediateWithdrawal: schema.opportunities.immediate_withdrawal,
      type: schema.opportunities.type,
      protocol: schema.opportunities.protocolName,
      hasCollectableRewards: schema.opportunities.hasCollectableRewards,
    })
    .from(schema.opportunities)
    .where(eq(schema.opportunities.id, opportunityId))
    .limit(1);

  if (!opportunity.length) return null;
  if(!opportunity[0]) return null;

  // Get all assets (both input and output) for this opportunity
  const opportunityAssets = await db
    .select({
      role: schema.opportunityAssets.role,
      assetId: schema.assets.id,
      assetName: schema.assets.name,
      assetSymbol: schema.assets.symbol,
      assetIsFundingAsset: schema.assets.isFundingAsset,
      assetAddress: schema.assets.address,
      assetPriceUSD: schema.assets.priceUSD,
      assetDecimals: schema.assets.decimals,
      assetTokenType: schema.assets.tokenType,
    })
    .from(schema.opportunityAssets)
    .leftJoin(schema.assets, eq(schema.opportunityAssets.assetId, schema.assets.id))
    .where(eq(schema.opportunityAssets.opportunityId, opportunityId));

  // Get all contracts for this opportunity
  const contracts = await db
    .select({
      address: schema.opportunitySmartContracts.address,
      type: schema.opportunitySmartContracts.type,
    })
    .from(schema.opportunitySmartContracts)
    .where(eq(schema.opportunitySmartContracts.opportunityId, opportunityId));

  // Transform assets into input and output arrays
  const inputAssets: Asset[] = [];
  const outputAssets: Asset[] = [];

  for (const asset of opportunityAssets) {
    const assetObj: Asset = {
      id: asset.assetId as string,
      name: asset.assetName as string,
      symbol: asset.assetSymbol as string,
      isFundingAsset: asset.assetIsFundingAsset as boolean,
      address: asset.assetAddress,
      priceUSD: parseFloat(asset.assetPriceUSD as string),
      decimals: asset.assetDecimals as number,
      type: asset.assetTokenType as "ERC20" | "ERC721" | "ERC1155" | "NATIVE",
    };

    if (asset.role === "input") {
      inputAssets.push(assetObj);
    } else {
      outputAssets.push(assetObj);
    }
  }

  // Build the final OpportunityData object
  return {
    id: opportunity[0].id as string,
    name: opportunity[0].name as string,
    chain: opportunity[0].chainId as string, // This is the chain ID from chainMetadata
    inputAssets,
    outputAssets,
    apy: parseFloat(opportunity[0].apy as string),
    enabled: opportunity[0].enabled as boolean,
    withdrawalType: opportunity[0].withdrawalType,
    immediateWithdrawal: opportunity[0].immediateWithdrawal,
    type: opportunity[0].type,
    protocol: opportunity[0].protocol,
    hasCollectableRewards: opportunity[0].hasCollectableRewards,
    contracts: contracts.map(contract => ({
      contractAddress: contract.address,
      type: contract.type,
    })),
  };
}

export async function getOpportunities(): Promise<OpportunityData[]> {
  const db = await getDB();

  // Get all base opportunity data
  const opportunities = await db
    .select({
      id: schema.opportunities.id,
      name: schema.opportunities.name,
      chainId: schema.opportunities.chainId,
      apy: schema.opportunities.current_apy,
      enabled: schema.opportunities.enabled,
      withdrawalType: schema.opportunities.withdrawalType,
      immediateWithdrawal: schema.opportunities.immediate_withdrawal,
      type: schema.opportunities.type,
      protocol: schema.opportunities.protocolName,
      hasCollectableRewards: schema.opportunities.hasCollectableRewards,
    })
    .from(schema.opportunities);

  // Get all assets for all opportunities
  const allOpportunityAssets = await db
    .select({
      opportunityId: schema.opportunityAssets.opportunityId,
      role: schema.opportunityAssets.role,
      assetId: schema.assets.id,
      assetName: schema.assets.name,
      assetSymbol: schema.assets.symbol,
      assetIsFundingAsset: schema.assets.isFundingAsset,
      assetAddress: schema.assets.address,
      assetPriceUSD: schema.assets.priceUSD,
      assetDecimals: schema.assets.decimals,
      assetTokenType: schema.assets.tokenType,
    })
    .from(schema.opportunityAssets)
    .leftJoin(schema.assets, eq(schema.opportunityAssets.assetId, schema.assets.id));

  // Get all contracts for all opportunities
  const allContracts = await db
    .select({
      opportunityId: schema.opportunitySmartContracts.opportunityId,
      address: schema.opportunitySmartContracts.address,
      type: schema.opportunitySmartContracts.type,
    })
    .from(schema.opportunitySmartContracts);

  // Create maps for assets and contracts by opportunity ID
  const assetsMap = new Map<string, { input: Asset[], output: Asset[] }>();
  const contractsMap = new Map<string, OpportunityContract[]>();

  // Organize assets by opportunity ID and role
  for (const asset of allOpportunityAssets) {
    if (!assetsMap.has(asset.opportunityId)) {
      assetsMap.set(asset.opportunityId, { input: [], output: [] });
    }
    
    const assetObj: Asset = {
      id: asset.assetId as string,
      name: asset.assetName as string,
      symbol: asset.assetSymbol as string,
      isFundingAsset: asset.assetIsFundingAsset as boolean,
      address: asset.assetAddress,
      priceUSD: parseFloat(asset.assetPriceUSD as string),
      decimals: asset.assetDecimals as number,
      type: asset.assetTokenType as "ERC20" | "ERC721" | "ERC1155" | "NATIVE",
    };

    const opportunityAssets = assetsMap.get(asset.opportunityId)!;
    if (asset.role === "input") {
      opportunityAssets.input.push(assetObj);
    } else {
      opportunityAssets.output.push(assetObj);
    }
  }

  // Organize contracts by opportunity ID
  for (const contract of allContracts) {
    if (!contractsMap.has(contract.opportunityId)) {
      contractsMap.set(contract.opportunityId, []);
    }
    contractsMap.get(contract.opportunityId)!.push({
      contractAddress: contract.address,
      type: contract.type,
    });
  }

  // Build final array of OpportunityData objects
  return opportunities.map(opp => ({
    id: opp.id,
    name: opp.name,
    chain: opp.chainId,
    inputAssets: assetsMap.get(opp.id)?.input || [],
    outputAssets: assetsMap.get(opp.id)?.output || [],
    apy: parseFloat(opp.apy),
    enabled: opp.enabled,
    withdrawalType: opp.withdrawalType,
    immediateWithdrawal: opp.immediateWithdrawal,
    type: opp.type,
    protocol: opp.protocol,
    hasCollectableRewards: opp.hasCollectableRewards,
    contracts: contractsMap.get(opp.id) || [],
  }));
}


//TODO: to fix this, I need to better align the models and the database schema -> more specifically, the Assets need to have an ID in the model.
//Work in progress
export async function writeTransactions(transactions: Transaction[]) {
  const db = await getDB();

  return await db.transaction(async (tx) => {
    // First insert all transactions
    await tx.insert(schema.transactions).values(transactions.map(tx => ({
      id: tx.id,
      userId: tx.userId,
      userAddress: tx.userAddress,
      type: tx.type,
      opportunityId: tx.opportunityId,
      transactionHash: tx.transactionHash,
      createdAt: new Date(tx.createdAt),
    })));

    // Get all opportunity asset IDs we need
    const opportunityAssetRows = await tx
      .select({
        id: opportunityAssets.id,
        opportunityId: opportunityAssets.opportunityId,
        assetId: opportunityAssets.assetId,
        role: opportunityAssets.role
      })
      .from(opportunityAssets);

    // Map opportunity asset IDs to their corresponding transactions
    const assetValues = transactions.flatMap(tx => [
      ...tx.inputAssets.map(asset => ({
        transactionId: tx.id,
        opportunityAssetId:opportunityAssetRows.find(row => 
          row.opportunityId === tx.opportunityId && 
          row.assetId === asset.asset.id && 
          row.role === 'input'
        )?.id as string,
        amount: asset.amount,
      })),
      ...tx.outputAssets.map(asset => ({
        transactionId: tx.id,
        opportunityAssetId: opportunityAssetRows.find(row => 
          row.opportunityId === tx.opportunityId && 
          row.assetId === asset.asset.id && 
          row.role === 'output'
        )?.id as string,
        amount: asset.amount,
      }))
    ]);

    // Insert all transaction assets
    if (assetValues.length > 0) {
      await tx.insert(schema.transactionAssets).values(assetValues);
    }
  });
}

