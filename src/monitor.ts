/**
 * Market discovery and snapshot (ETH/BTC 15m up/down prices)
 */
import type { PolymarketApi } from "./api.js";
import type { Market, MarketData, MarketSnapshot } from "./types.js";

const PERIOD = 900; // 15 min

function currentPeriod(nowSec: number): number {
  return Math.floor(nowSec / PERIOD) * PERIOD;
}

export async function discoverMarket(
  api: PolymarketApi,
  marketName: string,
  slugPrefixes: string[],
  currentTime: number
): Promise<Market> {
  const roundedTime = currentPeriod(currentTime);
  for (let i = 0; i < slugPrefixes.length; i++) {
    const prefix = slugPrefixes[i];
    let slug = `${prefix}-updown-15m-${roundedTime}`;
    try {
      const market = await api.getMarketBySlug(slug);
      if (market.active && !market.closed) return market;
    } catch {
      /* try previous */
    }
    for (let offset = 1; offset <= 3; offset++) {
      const tryTime = roundedTime - offset * PERIOD;
      slug = `${prefix}-updown-15m-${tryTime}`;
      try {
        const market = await api.getMarketBySlug(slug);
        if (market.active && !market.closed) return market;
      } catch {
        /* skip */
      }
    }
  }
  throw new Error(
    `Could not find active ${marketName} 15-minute up/down market (tried: ${slugPrefixes.join(", ")})`
  );
}

export function createDummyMarket(name: string, slug: string): Market {
  return {
    conditionId: `dummy_${name.toLowerCase()}_fallback`,
    question: `${name} Up/Down 15m (Dummy)`,
    slug,
    active: false,
    closed: true,
  };
}

/** Build MarketData for one asset from CLOB market details and prices. Skip if market is dummy/closed. */
export async function fetchMarketData(
  api: PolymarketApi,
  market: Market,
  marketName: string
): Promise<MarketData> {
  if (market.closed || !market.active || market.conditionId.startsWith("dummy_")) {
    return {
      condition_id: market.conditionId,
      market_name: marketName,
    };
  }
  let details: { tokens?: { outcome?: string; token_id: string }[] };
  try {
    details = await api.getMarketDetails(market.conditionId);
  } catch (e) {
    return { condition_id: market.conditionId, market_name: marketName };
  }
  const tokens = details?.tokens ?? [];
  const up = tokens.find((t) => t.outcome?.toLowerCase() === "up" || t.outcome === "Yes");
  const down = tokens.find((t) => t.outcome?.toLowerCase() === "down" || t.outcome === "No");
  let upBid: number | undefined;
  let upAsk: number | undefined;
  let downBid: number | undefined;
  let downAsk: number | undefined;
  if (up?.token_id) {
    try {
      upBid = await api.getSidePrice(up.token_id, "BUY");
      upAsk = await api.getSidePrice(up.token_id, "SELL");
    } catch {
      /* ignore */
    }
  }
  if (down?.token_id) {
    try {
      downBid = await api.getSidePrice(down.token_id, "BUY");
      downAsk = await api.getSidePrice(down.token_id, "SELL");
    } catch {
      /* ignore */
    }
  }
  return {
    condition_id: market.conditionId,
    market_name: marketName,
    up_token: up
      ? { token_id: up.token_id, bid: upBid, ask: upAsk }
      : undefined,
    down_token: down
      ? { token_id: down.token_id, bid: downBid, ask: downAsk }
      : undefined,
  };
}

/** Full snapshot for current period (ETH, BTC; Solana/XRP as dummies if disabled) */
export async function fetchSnapshot(
  api: PolymarketApi,
  ethMarket: Market,
  btcMarket: Market,
  solanaMarket: Market,
  xrpMarket: Market
): Promise<MarketSnapshot> {
  const nowSec = Math.floor(Date.now() / 1000);
  const periodTs = currentPeriod(nowSec);
  const [ethData, btcData, solanaData, xrpData] = await Promise.all([
    fetchMarketData(api, ethMarket, "ETH"),
    fetchMarketData(api, btcMarket, "BTC"),
    fetchMarketData(api, solanaMarket, "Solana"),
    fetchMarketData(api, xrpMarket, "XRP"),
  ]);
  // End of 15m period is periodTs + 900
  const timeRemaining = Math.max(0, periodTs + PERIOD - nowSec);
  return {
    eth_market: ethData,
    btc_market: btcData,
    solana_market: solanaData,
    xrp_market: xrpData,
    timestamp: nowSec,
    time_remaining_seconds: timeRemaining,
    period_timestamp: periodTs,
  };
}
