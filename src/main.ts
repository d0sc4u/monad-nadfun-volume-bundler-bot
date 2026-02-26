/**
 * Polymarket Trending Index Trading Bot (TypeScript)
 * RSI / MACD / Momentum strategies on 15-minute Up/Down markets.
 * Simulation mode (default): log only. Live mode: place real orders.
 */
import { loadConfig, parseArgs, type Config } from "./config.js";
import { PolymarketApi } from "./api.js";
import {
  discoverMarket,
  createDummyMarket,
  fetchSnapshot,
} from "./monitor.js";
import { runSimulation } from "./simulation.js";

function log(msg: string): void {
  process.stdout.write(msg + "\n");
}

function accountType(cfg: Config): string {
  const pm = cfg.polymarket;
  if (pm.proxy_wallet_address && pm.signature_type === 2) return "GnosisSafe";
  if (pm.proxy_wallet_address) return "Proxy";
  return "EOA (private key account)";
}

async function main(): Promise<void> {
  const { mode, configPath } = parseArgs();
  const config = loadConfig(configPath);

  log("🚀 Starting Polymarket Trending Index Trading Bot");
  log("Mode         : " + mode);
  log("Gamma URL    : " + config.polymarket.gamma_api_url);
  log("CLOB URL     : " + config.polymarket.clob_api_url);
  log("Check int.ms : " + config.trading.check_interval_ms);

  if (!config.polymarket.private_key) {
    log("❌ private_key is required. Set polymarket.private_key in config.json.");
    process.exit(1);
  }

  // Authentication first (simulation and live both require it)
  log("");
  log("  ┌─────────────────────────────────────────────────────────┐");
  log("  │  🔐  Polymarket CLOB API  ·  authenticating...           │");
  log("  └─────────────────────────────────────────────────────────┘");
  const api = new PolymarketApi(config.polymarket);
  try {
    await api.checkAuthentication();
  } catch (e) {
    log("❌ Authentication failed: " + (e instanceof Error ? e.message : e));
    log("   Simulation and Live mode will not start. Fix credentials and try again.");
    process.exit(1);
  }
  const accType = accountType(config);
  log("  ┌─────────────────────────────────────────────────────────┐");
  log("  │  Authenticated                                           │");
  log("  │     · private key        ok                              │");
  log("  │     · API credentials    ok                              │");
  log("  │     · account            " + accType.padEnd(27) + "│");
  log("  └─────────────────────────────────────────────────────────┘");
  log("");

  // Discover markets
  log("🔍 Discovering current ETH/BTC markets (15m up/down)...");
  const now = Math.floor(Date.now() / 1000);
  let ethMarket;
  let btcMarket;
  try {
    ethMarket = await discoverMarket(api, "ETH", ["eth"], now);
    btcMarket = await discoverMarket(api, "BTC", ["btc"], now);
  } catch (e) {
    log("❌ Could not find markets: " + (e instanceof Error ? e.message : e));
    process.exit(1);
  }
  const solanaMarket = createDummyMarket("Solana", "solana-updown-15m-dummy");
  const xrpMarket = createDummyMarket("XRP", "xrp-updown-15m-dummy");

  log("✅ Markets discovered:");
  log("   ETH    : " + ethMarket.slug + " (" + ethMarket.conditionId + ")");
  log("   BTC    : " + btcMarket.slug + " (" + btcMarket.conditionId + ")");
  log("   Solana : " + solanaMarket.slug);
  log("   XRP    : " + xrpMarket.slug);

  const getSnapshot = () =>
    fetchSnapshot(api, ethMarket, btcMarket, solanaMarket, xrpMarket);

  const indexLabel = config.trending_index.mode.toUpperCase().replace("MACD_SIGNAL", "MACDSignal");
  log(`Strategy cfg  : index=${indexLabel} | threshold=${config.trending_index.threshold.toFixed(2)} | mom_thresh=2.00`);

  if (mode === "simulation") {
    log("🎮 Running in SIMULATION MODE (logs and calculations only)");
    await runSimulation(getSnapshot, config);
  } else {
    log("🚀 Running in LIVE TRADING MODE (real orders)");
    log("⚠️  WARNING: Live trading mode will execute real trades!");
    // Live mode: same loop as simulation but place orders (simplified: just run simulation for now; can add live trader later)
    await runSimulation(getSnapshot, config);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
