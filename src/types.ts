/** Price point for one asset (Up + Down token prices) */
export interface PricePoint {
  timestamp: number;
  up_price: number;
  down_price: number;
  asset?: string;
}

/** Trading action from strategy */
export type TradeAction =
  | { kind: "BuyUp"; price: number; shares: number }
  | { kind: "BuyDown"; price: number; shares: number }
  | { kind: "SellUp"; price: number }
  | { kind: "SellDown"; price: number }
  | { kind: "NoAction" };

/** Gamma/CLOB market (from events/slug or markets) */
export interface Market {
  conditionId: string;
  id?: string;
  question: string;
  slug: string;
  resolutionSource?: string;
  endDateISO?: string;
  active: boolean;
  closed: boolean;
  tokens?: { tokenId: string; outcome: string; price?: number }[];
}

/** CLOB market details (tokens with token_id) */
export interface MarketDetails {
  tokens?: { outcome: string; price: number; token_id: string; winner: boolean }[];
}

/** Token price (bid/ask) */
export interface TokenPrice {
  token_id: string;
  bid?: number;
  ask?: number;
}

/** Market data for one asset (Up/Down token prices) */
export interface MarketData {
  condition_id: string;
  market_name: string;
  up_token?: TokenPrice;
  down_token?: TokenPrice;
}

/** Snapshot of all markets for strategy */
export interface MarketSnapshot {
  eth_market: MarketData;
  btc_market: MarketData;
  solana_market: MarketData;
  xrp_market: MarketData;
  timestamp: number;
  time_remaining_seconds: number;
  period_timestamp: number;
}

/** Order request for CLOB */
export interface OrderRequest {
  token_id: string;
  side: "BUY" | "SELL";
  size: string;
  price: string;
  type: string;
}

/** Order response from CLOB */
export interface OrderResponse {
  success: boolean;
  order_id?: string;
  status?: string;
  message?: string;
  error_msg?: string;
}
