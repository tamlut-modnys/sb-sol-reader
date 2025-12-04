import { AggregatorAccount, SwitchboardProgram } from "@switchboard-xyz/solana.js";
import { Command } from "commander";
import dotenv from "dotenv";
import {
  Commitment,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

dotenv.config();

const DEFAULT_CLUSTER = "mainnet-beta";
const DEFAULT_COMMITMENT: Commitment =
  (process.env.SOLANA_COMMITMENT as Commitment) ?? "confirmed";
const DEFAULT_RPC_URL =
  process.env.SOLANA_RPC_URL ?? clusterApiUrl(DEFAULT_CLUSTER);
const DEFAULT_FEED = process.env.SOL_USD_FEED;

type CliOptions = {
  wallet: string;
  feed?: string;
  rpc?: string;
  commitment?: Commitment;
};

async function getSolBalance(
  connection: Connection,
  wallet: PublicKey,
): Promise<number> {
  const lamports = await connection.getBalance(wallet, DEFAULT_COMMITMENT);
  return lamports / LAMPORTS_PER_SOL;
}

async function getSolUsdPrice(
  connection: Connection,
  feedAddress: PublicKey,
): Promise<number> {
  const program = await SwitchboardProgram.load(connection);
  const aggregatorAccount = new AggregatorAccount(program, feedAddress);
  const latestValue = await aggregatorAccount.fetchLatestValue();

  if (!latestValue) {
    throw new Error("No latest value found on the SOL/USD Switchboard feed.");
  }

  return latestValue.toNumber();
}

function formatUsd(amount: number): string {
  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

async function main() {
  const program = new Command()
    .name("sol-reader")
    .description(
      "Read a Solana wallet's SOL balance and show its USD value using a Switchboard price feed.",
    )
    .requiredOption(
      "-w, --wallet <address>",
      "Public Solana wallet address to read",
    )
    .option(
      "-f, --feed <address>",
      "Switchboard SOL/USD feed (aggregator account) public key",
      DEFAULT_FEED,
    )
    .option(
      "-r, --rpc <url>",
      `Solana RPC URL (default: ${DEFAULT_RPC_URL})`,
      DEFAULT_RPC_URL,
    )
    .option(
      "-c, --commitment <level>",
      `Solana commitment level (processed|confirmed|finalized). Default: ${DEFAULT_COMMITMENT}`,
      DEFAULT_COMMITMENT,
    );

  program.parse();
  const options = program.opts<CliOptions>();

  if (!options.feed) {
    throw new Error(
      "No Switchboard SOL/USD feed provided. Pass --feed <pubkey> or set SOL_USD_FEED in your environment.",
    );
  }

  const walletKey = new PublicKey(options.wallet);
  const feedKey = new PublicKey(options.feed);
  const rpcUrl = options.rpc ?? DEFAULT_RPC_URL;
  const commitment = options.commitment ?? DEFAULT_COMMITMENT;

  const connection = new Connection(rpcUrl, { commitment });

  console.log(`RPC: ${rpcUrl}`);
  console.log(`Wallet: ${walletKey.toBase58()}`);
  console.log(`Switchboard feed: ${feedKey.toBase58()}\n`);

  const solBalance = await getSolBalance(connection, walletKey);
  const solUsdPrice = await getSolUsdPrice(connection, feedKey);
  const usdValue = solBalance * solUsdPrice;

  console.log(`SOL balance: ${solBalance.toLocaleString()} SOL`);
  console.log(`SOL/USD price (Switchboard): ${solUsdPrice.toFixed(4)}`);
  console.log(`Wallet value: ${formatUsd(usdValue)}`);
}

main().catch((error) => {
  console.error(`\nError: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
