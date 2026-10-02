-- Drops the last decorative support flag. Like assets.supported_by_goldrush before it
-- (0003), supported_by_debank was never read: it is absent from the `Asset` type, so no
-- consumer could reach it, and the only other reference was selecting it into a query
-- whose callers read tokenType/address/decimals. The provider-abstraction work kept it
-- purely because that phase forbade touching DeBank columns; retaining a column nobody
-- can read is not a compatibility guarantee, so it goes now by explicit decision.
--
-- Support is a per-chain fact, and byx_chain_metadata.supported_by_goldrush carries it
-- where it is actually consumed (libs/portfolioAPI/providers/goldrushProvider.ts).
ALTER TABLE "test"."byx_assets" DROP COLUMN "supported_by_debank";
