import { readFileSync, existsSync } from "fs";
import { join } from "path";

export type Mode = "simulation" | "live";
export type IndexType = "rsi" | "macd" | "macd_signal" | "momentum";

export interface PolymarketConfig {
  gamma_api_url: string;
  clob_api_url: string;
  api_key: string | null;
  api_secret: string | null;
  api_passphrase: string | null;
  private_key: string | null;
  proxy_wallet_address: string | null;
  signature_type: number | null;
}

export interface TrendingIndexConfig {
  mode: string;
  threshold: number;
  lookback: number;
  macd_fast_period: number;
  macd_slow_period: number;
  macd_signal_period: number;
  use_macd_sl_filter: boolean;
}

export interface TradingConfig {
  check_interval_ms: number;
  position_size: number;
  profit_threshold: number;
  stop_loss_threshold: number;
  enable_eth_trading: boolean;
  enable_solana_trading: boolean;
  enable_xrp_trading: boolean;
  trading_start_when_remaining_minutes: number | null;
}

export interface Config {
  polymarket: PolymarketConfig;
  trending_index: TrendingIndexConfig;
  trading: TradingConfig;
}

const defaultConfig: Config = {
  polymarket: {
    gamma_api_url: "https://gamma-api.polymarket.com",
    clob_api_url: "https://clob.polymarket.com",
    api_key: null,
    api_secret: null,
    api_passphrase: null,
    private_key: null,
    proxy_wallet_address: null,
    signature_type: null,
  },
  trending_index: {
    mode: "rsi",
    threshold: 70,
    lookback: 20,
    macd_fast_period: 12,
    macd_slow_period: 26,
    macd_signal_period: 9,
    use_macd_sl_filter: false,
  },
  trading: {
    check_interval_ms: 500,
    position_size: 6,
    profit_threshold: 0.05,
    stop_loss_threshold: 0.05,
    enable_eth_trading: true,
    enable_solana_trading: false,
    enable_xrp_trading: false,
    trading_start_when_remaining_minutes: null,
  },
};

function deepMerge<T>(target: T, source: Partial<T>): T {
  const out = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const v = source[key];
    if (v != null && typeof v === "object" && !Array.isArray(v) && typeof (target as Record<string, unknown>)[key as string] === "object") {
      (out as Record<string, unknown>)[key as string] = deepMerge(
        (target as Record<string, unknown>)[key as string] as object,
        v as object
      );
    } else if (v !== undefined) {
      (out as Record<string, unknown>)[key as string] = v;
    }
  }
  return out;
}

export function loadConfig(configPath: string = "config.json"): Config {
  const path = join(process.cwd(), configPath);
  if (existsSync(path)) {
    const content = readFileSync(path, "utf-8");
    const loaded = JSON.parse(content) as Partial<Config>;
    return deepMerge(defaultConfig, loaded);
  }
  return defaultConfig;
}

export function parseArgs(): { mode: Mode; configPath: string } {
  const args = process.argv.slice(2);
  let mode: Mode = "simulation";
  let configPath = "config.json";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--live") mode = "live";
    else if (args[i] === "--simulation") mode = "simulation";
    else if ((args[i] === "-c" || args[i] === "--config") && args[i + 1]) configPath = args[++i];
  }
  return { mode, configPath };
}

export function getStrategyIndexType(mode: string): IndexType {
  const m = (mode || "rsi").toLowerCase();
  if (m === "macd") return "macd";
  if (m === "macd_signal" || m === "macdsignal") return "macd_signal";
  if (m === "momentum") return "momentum";
  return "rsi";
}
