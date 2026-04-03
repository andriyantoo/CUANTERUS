/**
 * Market data fetcher — gets OHLCV candles from Binance/exchange
 * Server-side only
 */

export interface Candle {
  time: number;     // unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BINANCE_API = "https://api.binance.com/api/v3";

const TF_MAP: Record<string, string> = {
  "1m": "1m", "3m": "3m", "5m": "5m", "15m": "15m", "30m": "30m",
  "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "8h": "8h", "12h": "12h",
  "1d": "1d", "3d": "3d", "1w": "1w", "1M": "1M",
};

export async function fetchCandles(
  symbol: string,
  timeframe: string,
  limit: number = 500
): Promise<Candle[]> {
  const interval = TF_MAP[timeframe] || "1h";

  const res = await fetch(
    `${BINANCE_API}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`,
    { next: { revalidate: 60 } } // cache 60s
  );

  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);

  const data = await res.json();

  return data.map((k: any[]) => ({
    time: Math.floor(k[0] / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

/**
 * Get higher timeframe for MTF confluence
 */
export function getHTFTimeframe(tf: string): string {
  const sec = tfToSeconds(tf);
  if (sec <= 1800) return "1h";   // 5-30m → 1H
  if (sec <= 3600) return "4h";   // 1H → 4H
  return "1d";                     // 4H+ → D
}

export function tfToSeconds(tf: string): number {
  const map: Record<string, number> = {
    "1m": 60, "3m": 180, "5m": 300, "15m": 900, "30m": 1800,
    "1h": 3600, "2h": 7200, "4h": 14400, "6h": 21600, "8h": 28800, "12h": 43200,
    "1d": 86400, "3d": 259200, "1w": 604800,
  };
  return map[tf] || 3600;
}
