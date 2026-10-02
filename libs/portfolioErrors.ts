/**
 * Single source of truth for the "portfolio provider is unavailable" contract.
 *
 * Provider-backed routes return this code alongside a user-facing message, and
 * the client matches on the code to distinguish "the provider is down" (gate
 * the dependent features) from "something else broke" (leave the gate alone).
 * Both live here so the two sides cannot drift apart.
 *
 * This module must stay dependency-free: it is imported by both server routes
 * and client components.
 */

export const PORTFOLIO_UNAVAILABLE_CODE = "PORTFOLIO_UNAVAILABLE";

/**
 * Returned by provider-backed API routes when the provider cannot be reached.
 * Deliberately reassures the user that nothing was changed, because an outage
 * must never read as an empty portfolio or as a completed operation.
 */
export const PORTFOLIO_UNAVAILABLE_MESSAGE =
  "Balances are temporarily unavailable because the portfolio data provider could not be reached. Your funds are safe and nothing was changed. Please try again in a moment.";

/**
 * Returned by the transaction route when the provider cannot be reached.
 *
 * Deliberately does NOT claim that nothing was changed. `createTransaction`
 * broadcasts on-chain before capturing its post-transaction snapshot, so a
 * provider failure in that window can leave a trade that executed while no
 * record was written. The reassurance in the message above would be false
 * here, and telling the user to "try again" risks a second submission of an
 * operation that may already have gone through.
 */
export const PORTFOLIO_UNAVAILABLE_TRANSACTION_MESSAGE =
  "The portfolio data provider could not be reached while processing this request, so the outcome could not be confirmed. Your transaction may already have been submitted. Check your positions and transaction history before retrying.";

/**
 * Shown where a feature is gated in the UI. Distinct from the API message
 * above because the gated feature is not always balances, and it points the
 * user at the one control that can clear the gate.
 */
export const PORTFOLIO_UNAVAILABLE_UI_MESSAGE =
  "Portfolio data is temporarily unavailable. Refresh your balances on the main page to try again.";
