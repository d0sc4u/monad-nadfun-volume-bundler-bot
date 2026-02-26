/**
 * Simulation mode: poll snapshot, update indicators, run strategy, log actions (no real orders)
 * Log format matches Rust version: Strategy cfg, 🎮 started, token_id lines, 📊 price line, [SIM] 📈 INDEX.
 */
import type { MarketSnapshot, PricePoint } from "./types.js";
import type { Config as AppConfig } from "./config.js";
import { RollingRSI, RollingMACD, RollingMomentum } from "./indicators.js";
import { decide, strategyContextFromConfig } from "./strategies.js";

const MAX_HISTORY = 100;
const INITIAL_EQUITY = 1000;

function formatRemainingTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}m ${String(rem).padStart(2, "0")}s`;
}

function formatTokenPrice(bid: number | undefined, ask: number | undefined): string {
  if (bid === undefined && ask === undefined) return "$--/--";
  return `$${(bid ?? 0).toFixed(2)}/$${(ask ?? 0).toFixed(2)}`;
}

function strategyDisplayName(mode: string): string {
  const m = (mode || "rsi").toLowerCase();
  if (m === "rsi") return "MomentumHedgeStrategy (RSI)";
  if (m === "macd") return "MomentumHedgeStrategy (MACD)";
  if (m === "macd_signal" || m === "macdsignal") return "MomentumHedgeStrategy (MACD Signal)";
  if (m === "momentum") return "MomentumHedgeStrategy (Momentum)";
  return "MomentumHedgeStrategy (" + mode + ")";
}

function indexName(mode: string): string {
  const m = (mode || "rsi").toLowerCase();
  if (m === "macd" || m === "macd_signal" || m === "macdsignal") return "MACD";
  if (m === "momentum") return "Momentum";
  return "RSI";
}

function snapshotToPricePoint(snapshot: MarketSnapshot, asset: string): PricePoint | null {
  const data =
    asset === "ETH"
      ? snapshot.eth_market
      : asset === "BTC"
        ? snapshot.btc_market
        : null;
  if (!data?.up_token || !data?.down_token) return null;
  const upPrice = data.up_token.ask ?? data.up_token.bid ?? 0;
  const downPrice = data.down_token.ask ?? data.down_token.bid ?? 0;
  return {
    timestamp: snapshot.timestamp,
    up_price: upPrice,
    down_price: downPrice,
    asset,
  };
}

export async function runSimulation(
  getSnapshot: () => Promise<MarketSnapshot>,
  config: AppConfig
): Promise<void> {
  const ti = config.trending_index;
  const tr = config.trading;
  const strategyConfig = {
    mode: ti.mode,
    threshold: ti.threshold,
    lookback: ti.lookback,
    macd_fast_period: ti.macd_fast_period,
    macd_slow_period: ti.macd_slow_period,
    macd_signal_period: ti.macd_signal_period,
    position_size: tr.position_size,
  };
  const ctx = strategyContextFromConfig(strategyConfig);

  const useSignal = ti.mode === "macd_signal" || ti.mode === "macdsignal";
  function makeIndicators() {
    const rsiUp = new RollingRSI(ti.lookback);
    const macdUp = new RollingMACD(ti.macd_fast_period, ti.macd_slow_period, useSignal ? ti.macd_signal_period : null);
    const momentumUp = new RollingMomentum(ti.lookback);
    const rsiDown = new RollingRSI(ti.lookback);
    const macdDown = new RollingMACD(ti.macd_fast_period, ti.macd_slow_period, useSignal ? ti.macd_signal_period : null);
    const momentumDown = new RollingMomentum(ti.lookback);
    rsiUp.resetToNeutral();
    macdUp.resetToNeutral();
    rsiDown.resetToNeutral();
    macdDown.resetToNeutral();
    return { rsiUp, macdUp, momentumUp, rsiDown, macdDown, momentumDown };
  }

  const assets = ["ETH", "BTC"].filter((a) => {
    if (a === "ETH") return tr.enable_eth_trading !== false;
    return true;
  });
  const priceHistory: Record<string, PricePoint[]> = { ETH: [], BTC: [] };
  const indicators: Record<string, ReturnType<typeof makeIndicators>> = {};
  for (const a of assets) {
    indicators[a] = makeIndicators();
  }
  const intervalMs = tr.check_interval_ms || 5000;

  // Match Rust: 🎮 Simulation mode started, Strategy, Markets, Initial equity, Check interval
  console.log("🎮 Simulation mode started");
  console.log("   Strategy      :", strategyDisplayName(ti.mode));
  console.log("   Markets       :", JSON.stringify(assets));
  console.log("   Initial equity: $" + INITIAL_EQUITY.toFixed(2));
  console.log("   Check interval:", intervalMs, "ms");

  let totalPnl = 0;
  let wins = 0;
  let losses = 0;
  let fundUsed = 0;
  const tokenIdsLogged: Record<string, { up: boolean; down: boolean }> = { ETH: { up: false, down: false }, BTC: { up: false, down: false } };

  while (true) {
    try {
      const snapshot = await getSnapshot();

      // Log token IDs once per asset when we first have them
      for (const asset of assets) {
        const data = asset === "ETH" ? snapshot.eth_market : snapshot.btc_market;
        const logged = tokenIdsLogged[asset];
        if (data?.up_token?.token_id && !logged.up) {
          console.log(`${asset} Up token_id: ${data.up_token.token_id}`);
          logged.up = true;
        }
        if (data?.down_token?.token_id && !logged.down) {
          console.log(`${asset} Down token_id: ${data.down_token.token_id}`);
          logged.down = true;
        }
      }

      // 📊 Price line per enabled asset: "BTC: U$bid/$ask D$bid/$ask | ⏱️ Xm Ys"
      const timeStr = formatRemainingTime(snapshot.time_remaining_seconds);
      for (const asset of assets) {
        const data = asset === "ETH" ? snapshot.eth_market : snapshot.btc_market;
        const uStr = data?.up_token
          ? formatTokenPrice(data.up_token.bid, data.up_token.ask)
          : "$--/--";
        const dStr = data?.down_token
          ? formatTokenPrice(data.down_token.bid, data.down_token.ask)
          : "$--/--";
        console.log(`📊 ${asset}: U${uStr} D${dStr} | ⏱️   ${timeStr}`);
      }

      for (const asset of assets) {
        const pp = snapshotToPricePoint(snapshot, asset);
        if (!pp) continue;
        const history = priceHistory[asset];
        history.push(pp);
        if (history.length > MAX_HISTORY) history.shift();

        const ind = indicators[asset];
        ind.rsiUp.addPrice(pp.up_price);
        ind.macdUp.addPrice(pp.up_price);
        ind.momentumUp.addPrice(pp.up_price);
        ind.rsiDown.addPrice(pp.down_price);
        ind.macdDown.addPrice(pp.down_price);
        ind.momentumDown.addPrice(pp.down_price);

        const idxName = indexName(ti.mode);
        const upVal = ind.rsiUp.getRSI() ?? (ind.macdUp.getMACD() ?? ind.momentumUp.getMomentum());
        const downVal = ind.rsiDown.getRSI() ?? (ind.macdDown.getMACD() ?? ind.momentumDown.getMomentum());
        const isMacd = ti.mode === "macd";
        const fmt = (v: number) => (isMacd ? v.toFixed(4) : v.toFixed(2));
        if (upVal != null && downVal != null) {
          console.log(
            `[SIM] 📈 INDEX    | asset=${asset} | ${idxName}_up=${fmt(upVal)} | ${idxName}_down=${fmt(downVal)} | pnl=${totalPnl.toFixed(4)} | wins=${wins} | losses=${losses} | fund=${fundUsed.toFixed(4)}`
          );
        } else {
          console.log(`[SIM] 📈 INDEX    | asset=${asset} | ${idxName}=n/a`);
        }

        const action = decide(
          history,
          ctx,
          ind.rsiUp,
          ind.macdUp,
          ind.momentumUp,
          ind.rsiDown,
          ind.macdDown,
          ind.momentumDown
        );
        if (action.kind !== "NoAction") {
          const msg =
            action.kind === "BuyUp"
              ? `[SIM] BUY UP  | ${asset} | price=${action.price.toFixed(4)} | shares=${action.shares}`
              : action.kind === "BuyDown"
                ? `[SIM] BUY DOWN | ${asset} | price=${action.price.toFixed(4)} | shares=${action.shares}`
                : "";
          if (msg) console.log(msg);
        }
      }
    } catch (e) {
      console.error("[SIM] Error:", e instanceof Error ? e.message : e);
    }
    await sleep(intervalMs);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
