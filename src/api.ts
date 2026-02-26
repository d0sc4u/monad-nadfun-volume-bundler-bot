/**
 * Polymarket API: Gamma (events/markets) + CLOB (prices, orders)
 */
import axios, { type AxiosInstance } from "axios";
import type { Market, MarketDetails, OrderRequest, OrderResponse } from "./types.js";
import type { PolymarketConfig } from "./config.js";
import { createClobClient, placeLimitOrder, type ClobClient } from "./clob.js";

export class PolymarketApi {
  private client: AxiosInstance;
  private gammaUrl: string;
  private clobUrl: string;
  private apiKey: string | null;
  private cfg: PolymarketConfig;

  constructor(cfg: PolymarketConfig) {
    this.cfg = cfg;
    this.gammaUrl = (cfg.gamma_api_url || "https://gamma-api.polymarket.com").replace(/\/$/, "");
    this.clobUrl = (cfg.clob_api_url || "https://clob.polymarket.com").replace(/\/$/, "");
    this.apiKey = cfg.api_key ?? null;
    this.client = axios.create({
      timeout: 10000,
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
  }

  /** Get event by slug; returns first market from event's markets array */
  async getMarketBySlug(slug: string): Promise<Market> {
    const url = `${this.gammaUrl}/events/slug/${slug}`;
    const { data } = await this.client.get<{ markets?: unknown[] }>(url);
    const markets = data?.markets;
    if (!Array.isArray(markets) || markets.length === 0) {
      throw new Error(`No markets in response for slug ${slug}`);
    }
    const m = markets[0] as Record<string, unknown>;
    return {
      conditionId: String(m.conditionId ?? m.condition_id ?? ""),
      id: m.id != null ? String(m.id) : undefined,
      question: String(m.question ?? ""),
      slug: String(m.slug ?? slug),
      active: Boolean(m.active),
      closed: Boolean(m.closed),
      tokens: Array.isArray(m.tokens)
        ? (m.tokens as { tokenId?: string; token_id?: string; outcome?: string; price?: number }[]).map((t) => ({
            tokenId: String(t.tokenId ?? t.token_id ?? ""),
            outcome: String(t.outcome ?? ""),
            price: typeof t.price === "number" ? t.price : undefined,
          }))
        : undefined,
    };
  }

  /** Get CLOB market details (tokens with token_id) */
  async getMarketDetails(conditionId: string): Promise<MarketDetails> {
    const url = `${this.clobUrl}/markets/${conditionId}`;
    const { data } = await this.client.get<MarketDetails>(url);
    return data;
  }

  /** Get mid/price for a token (BUY or SELL side) */
  async getSidePrice(tokenId: string, side: "BUY" | "SELL"): Promise<number> {
    const url = `${this.clobUrl}/price`;
    const { data } = await this.client.get<{ price?: string }>(url, {
      params: { token_id: tokenId, side },
    });
    const p = data?.price;
    if (p == null) throw new Error(`No price for token ${tokenId} side ${side}`);
    return Number(p);
  }

  /** Check CLOB authentication (create client and use it once) */
  async checkAuthentication(): Promise<void> {
    await createClobClient(this.cfg);
  }

  /** Place order via CLOB SDK */
  async placeOrder(clob: ClobClient, order: OrderRequest): Promise<OrderResponse> {
    const result = await placeLimitOrder(clob, {
      tokenId: order.token_id,
      side: order.side,
      price: Number(order.price),
      size: Number(order.size),
    });
    return {
      success: true,
      order_id: result.orderID,
      status: result.status,
      message: `Order placed: ${result.orderID}`,
    };
  }

  /** Get balance for a token (conditional) – optional, for live mode */
  async checkBalanceOnly(_tokenId: string): Promise<number> {
    // If CLOB SDK exposes balance, use it here; else return 0
    return 0;
  }
}
