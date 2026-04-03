export const PRODUCT_SLUGS = {
  FOREX: "forex",
  CRYPTO: "crypto",
  CUANTROOPERS: "cuantroopers",
} as const;

export const PRODUCT_NAMES: Record<string, string> = {
  forex: "Forex Trading",
  crypto: "Crypto Trading",
  cuantroopers: "Cuantroopers",
};

export const PRODUCT_COLORS: Record<string, string> = {
  forex: "#3B82F6",
  crypto: "#F59E0B",
  cuantroopers: "#96FC03",
};

export const SIGNAL_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  tp1_hit: "TP1 Hit",
  tp2_hit: "TP2 Hit",
  tp3_hit: "TP3 Hit",
  sl_hit: "SL Hit",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const OUTLOOK_CATEGORY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  special: "Special",
};

// Colors matching the landing page
export const COLORS = {
  lime: "#96FC03",
  darkBg: "#0A0A0F",
  darkCard: "#131318",
  border: "#222229",
  text: "#F0F0F5",
  textSecondary: "#8B949E",
  gold: "#F7B731",
  red: "#EF4444",
  green: "#22C55E",
} as const;
