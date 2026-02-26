import { ethers } from "ethers";
import { ClobClient, Side, OrderType, Chain } from "clob-utils-sdks";
import type { PolymarketConfig } from "./config.js";

export type { ClobClient };

export function createWallet(privateKey: string): ethers.Wallet {
  const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  return new ethers.Wallet(key);
}

export async function createClobClient(cfg: PolymarketConfig): Promise<ClobClient> {
  const pk = cfg.private_key;
  if (!pk) throw new Error("private_key is required in config.json (polymarket.private_key)");
  const wallet = createWallet(pk);
  const host = (cfg.clob_api_url || "https://clob.polymarket.com").replace(/\/$/, "");

  let apiCreds: { key: string; secret: string; passphrase: string } | undefined;
  if (cfg.api_key && cfg.api_secret && cfg.api_passphrase) {
    apiCreds = {
      key: cfg.api_key,
      secret: cfg.api_secret,
      passphrase: cfg.api_passphrase,
    };
  }

  const client = new ClobClient(host, Chain.POLYGON, wallet, apiCreds);
  if (!apiCreds) {
    let creds: { key: string; secret: string; passphrase: string } | null = null;
    try {
      const derived = await client.deriveApiKey();
      if (derived?.key && derived?.secret && derived?.passphrase) creds = derived;
    } catch {
      /* ignore */
    }
    if (!creds) {
      try {
        const created = await client.createApiKey();
        if (created?.key && created?.secret && created?.passphrase) creds = created;
      } catch (e) {
        throw new Error(
          "CLOB API key failed. Add api_key, api_secret, api_passphrase to config.json. " +
            String(e instanceof Error ? e.message : e)
        );
      }
    }
    if (!creds) throw new Error("CLOB API key derivation/creation returned no credentials.");
    return new ClobClient(host, Chain.POLYGON, wallet, creds);
  }
  return client;
}

export interface PlaceLimitOrderParams {
  tokenId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  tickSize?: "0.1" | "0.01" | "0.001" | "0.0001";
  negRisk?: boolean;
}

export async function placeLimitOrder(
  client: ClobClient,
  params: PlaceLimitOrderParams
): Promise<{ orderID: string; status: string }> {
  const side = params.side === "BUY" ? Side.BUY : Side.SELL;
  const tickSize = params.tickSize ?? "0.01";
  const negRisk = params.negRisk ?? false;
  const result = await client.createAndPostOrder(
    {
      tokenID: params.tokenId,
      price: params.price,
      size: params.size,
      side,
    },
    { tickSize, negRisk },
    OrderType.GTC
  );
  return {
    orderID: (result as { orderID?: string }).orderID ?? (result as { id?: string }).id ?? "",
    status: (result as { status?: string }).status ?? "unknown",
  };
}
