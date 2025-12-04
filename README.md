# sol-reader

CLI that reads a Solana wallet's SOL balance and converts it to USD using a Switchboard SOL/USD price feed.

## Setup

```bash
npm install
```

Create a `.env` (optional) to avoid passing flags each time:

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOL_USD_FEED=<switchboard-aggregator-pubkey>
SOLANA_COMMITMENT=confirmed
```

> You can find the SOL/USD Switchboard aggregator public key in the Switchboard Explorer. Provide the mainnet key when using a mainnet RPC or a devnet key when testing against devnet.

## Usage

```bash
npm start -- --wallet <walletPubkey> --feed <switchboardFeedPubkey> [--rpc <url>] [--commitment confirmed]
```

Example:

```bash
npm start -- \
  --wallet 7biHbUR1a7QaZ7jGDhyXgEJfaGmXLQ6RnbFKSapX5L3t \
  --feed <switchboard-sol-usd-feed> \
  --rpc https://api.mainnet-beta.solana.com
```

The command prints the SOL balance, the latest Switchboard SOL/USD price, and the wallet value in USD.

## Notes

- The tool only reads data; no signing or mutations occur.
- Use a reliable RPC endpoint to avoid throttling when fetching balances and feed data.
- If the feed does not have a recent value (e.g., stale or incorrect feed address), the CLI will throw an error so you can swap in a valid feed public key.
