/**
 * Strategy: compute index (RSI/MACD/Momentum) and decide BuyUp / BuyDown / NoAction
 */
import type { PricePoint, TradeAction } from "./types.js";
import type { IndexType } from "./config.js";
import {
  RollingRSI,
  RollingMACD,
  RollingMomentum,
  calculateRSI,
} from "./indicators.js";

export interface StrategyContext {
  lookback: number;
  trendThreshold: number;
  momentumThresholdPct: number;
  positionSize: number;
  indexType: IndexType;
  macdFastPeriod: number;
  macdSlowPeriod: number;
  macdSignalPeriod: number;
}

export function decide(
  prices: PricePoint[],
  ctx: StrategyContext,
  rsiUp: RollingRSI,
  macdUp: RollingMACD,
  momentumUp: RollingMomentum,
  rsiDown: RollingRSI,
  macdDown: RollingMACD,
  momentumDown: RollingMomentum
): TradeAction {
  if (prices.length === 0 || prices.length < ctx.lookback) {
    return { kind: "NoAction" };
  }

  const upIndex = calculateIndex(prices, ctx, rsiUp, macdUp, momentumUp, true);
  const downIndex = calculateIndex(prices, ctx, rsiDown, macdDown, momentumDown, false);

  const upTrending =
    upIndex != null &&
    (ctx.indexType === "rsi" || ctx.indexType === "macd"
      ? upIndex > ctx.trendThreshold
      : ctx.indexType === "momentum"
        ? upIndex > ctx.momentumThresholdPct
        : false);

  const downTrending =
    downIndex != null &&
    (ctx.indexType === "rsi" || ctx.indexType === "macd"
      ? downIndex > ctx.trendThreshold
      : ctx.indexType === "momentum"
        ? downIndex > ctx.momentumThresholdPct
        : false);

  const last = prices[prices.length - 1];
  if (upTrending) {
    return { kind: "BuyUp", price: last.up_price, shares: ctx.positionSize };
  }
  if (downTrending) {
    return { kind: "BuyDown", price: last.down_price, shares: ctx.positionSize };
  }
  return { kind: "NoAction" };
}

function calculateIndex(
  prices: PricePoint[],
  ctx: StrategyContext,
  rsi: RollingRSI,
  macd: RollingMACD,
  momentum: RollingMomentum,
  useUp: boolean
): number | null {
  const priceSeries = prices.map((p) => (useUp ? p.up_price : p.down_price));
  switch (ctx.indexType) {
    case "rsi":
      if (rsi.isReady()) return rsi.getRSI();
      if (priceSeries.length >= ctx.lookback + 1) {
        return calculateRSI(priceSeries.slice(-(ctx.lookback + 1)), ctx.lookback);
      }
      return null;
    case "macd":
    case "macd_signal":
      return macd.isReady() ? macd.getMACD() : null;
    case "momentum":
      return momentum.isReady() ? momentum.getMomentum() : null;
    default:
      return rsi.isReady() ? rsi.getRSI() : null;
  }
}

export interface StrategyConfigInput {
  mode: string;
  threshold: number;
  lookback: number;
  macd_fast_period: number;
  macd_slow_period: number;
  macd_signal_period: number;
  position_size: number;
}

export function strategyContextFromConfig(
  cfg: StrategyConfigInput
): StrategyContext {
  return {
    lookback: cfg.lookback,
    trendThreshold: cfg.threshold,
    momentumThresholdPct: 2,
    positionSize: cfg.position_size,
    indexType: cfg.mode as IndexType,
    macdFastPeriod: cfg.macd_fast_period,
    macdSlowPeriod: cfg.macd_slow_period,
    macdSignalPeriod: cfg.macd_signal_period,
  };
}
