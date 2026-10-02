# BYX

Cross-chain DeFi opportunity aggregator that connects users to yield-generating opportunities across multiple blockchains through a unified interface.

## Overview

BYX abstracts away wallet and chain complexity so investors can deploy capital into a supported DeFi opportunity with a single **Invest** action, regardless of which blockchain hosts the protocol.

Users get a [Privy](https://www.privy.io/) embedded wallet and approve server-side signing once. After that, BYX signs every transaction in an investment on the user's behalf, on every supported chain. Under the hood, the platform handles bridging and token swapping so users never have to orchestrate cross-chain flows themselves.

Cross-chain swaps are powered by [Relay](https://relay.link/), through a Privy wallet adapter for Relay's SDK ([`privvyrelaylinkadapter`](https://www.npmjs.com/package/privvyrelaylinkadapter) on npm).

## Features

- **Unified opportunity discovery:** browse and invest in yield opportunities across multiple chains from one interface
- **One approval, many transactions:** the user approves once, and the server signs each transaction in the flow through Privy
- **Automatic bridging and swaps:** on invest, the exact input tokens an opportunity needs are assembled from balances on any supported chain
- **One-click Invest:** deploy capital into an opportunity without manually bridging or swapping first

## Stack

- **TypeScript** and **Next.js** (front end and API routes in one app)
- **Privy:** auth, embedded wallets and server-side signing
- **Relay** (`@reservoir0x/relay-sdk`): cross-chain swaps and bridging
- **viem:** on-chain interactions
- **Portfolio data:** GoldRush or DeBank, behind a provider-agnostic `portfolioAPI` layer
- **DefiLlama:** opportunity APYs, refreshed hourly
- **Drizzle ORM** + Postgres: data layer
- **Tailwind CSS:** UI
- **Vitest:** tests

## Status

BYX is a prototype, built in early 2025 and brought back to life in 2026. It works end to end on mainnet, but it has known limitations. Deposits are currently manual transfers to the user's BYX wallet address.

## What I'd improve next

1. **Run investments in background workers.** Today an entire investment runs inside one HTTP request and is only recorded at the end. A worker would save each step as it lands and resume after a failure.
2. **Gas sponsorship.** Users need native gas on every chain an investment touches, reserved by a conservative gas buffer. Sponsoring gas through Privy removes both the requirement and the buffer.
3. **Smarter swap planning.** Plan once for all input tokens, size swaps from live quotes instead of a single USD price snapshot, and run independent swaps in parallel.
4. **Rules on what can be signed.** Destination and token allowlists, spend limits and chain restrictions, enforced at the signer so every signing path is covered.
5. **Money-safety hardening.** Minimum outputs on liquidity operations, enforced transaction simulation on every chain, dedicated RPC endpoints, idempotent sends and receipt status checks.
6. **A finished front end.** Invest-all, available balances while investing, cached balances, live progress during an investment, and a mobile layout.

## Getting started

Requires Node 24 (see `.nvmrc`).

```sh
yarn install
cp .env.example .env.local
```

Then fill in `.env.local`. Every variable is documented in `.env.example`; the main ones:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID (public, client and server) |
| `PRIVY_APP_SECRET` | Privy app secret (server-only; auth token verification) |
| `PRIVY_DELEGATION_KEY` | Privy wallet authorization private key (server-only; signs transactions) |
| `NEXT_PUBLIC_PRIVY_SIGNER_ID` | Key quorum ID added to user wallets as a signer |
| `PORTFOLIO_API_PROVIDER` | Portfolio data provider: `debank` or `goldrush` |
| `DEBANK_API_KEY` / `GOLDRUSH_API_KEY` | Key for the selected provider |
| `DB_*` | Postgres connection; `DB_SCHEMA` is the Drizzle schema name |

Then run the dev server:

```sh
yarn dev
```

App runs at [http://localhost:9991](http://localhost:9991).

Run the tests with:

```sh
yarn test
```
