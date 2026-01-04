import type {
  BrokerCredentials,
  BrokerTrade,
  KiteCredentials,
  DhanCredentials,
} from "@shared/schema";
import { fetchKiteTrades } from "./kiteService.js";
import { fetchDhanTrades } from "./dhanService.js";

export async function fetchBrokerTrades(
  credentials: BrokerCredentials
): Promise<BrokerTrade[]> {
  switch (credentials.broker) {
    case "kite":
      return fetchKiteTrades(credentials as KiteCredentials);
    case "dhan":
      return fetchDhanTrades(credentials as DhanCredentials);
    default:
      throw new Error(`Unsupported broker: ${(credentials as any).broker}`);
  }
}
