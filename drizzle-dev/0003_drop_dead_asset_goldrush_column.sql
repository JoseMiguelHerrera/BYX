-- Removes a column added one migration earlier. It was declared for symmetry with
-- assets.supported_by_debank, but nothing ever read it: it is absent from the
-- `Asset` type, so no consumer could reach it without a cast. Speculative
-- generality, dropped rather than left as a decorative column. DeBank's own flag
-- is untouched.
ALTER TABLE "test"."byx_assets" DROP COLUMN "supported_by_goldrush";
