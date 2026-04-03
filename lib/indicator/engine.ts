/**
 * CUANTERUS Golden Trap — Server-Side Engine
 * ALL calculation logic is here. NEVER shipped to client.
 * Client only receives plot points (coordinates + type).
 */

import type { Candle } from "./fetcher";

// ═══════════════════════════════════════════════════════════════
// OUTPUT TYPES (this is what the client receives — plot data only)
// ═══════════════════════════════════════════════════════════════

export interface PlotLabel {
  type: "label";
  time: number;
  price: number;
  text: string;
  position: "above" | "below";
  color: string;
  size?: "tiny" | "small" | "normal";
}

export interface PlotLine {
  type: "line";
  time1: number;
  price1: number;
  time2: number;
  price2: number;
  color: string;
  style: "solid" | "dashed" | "dotted";
  width: number;
  extend?: "right";
}

export interface PlotBox {
  type: "box";
  time1: number;
  price1: number;
  time2: number;
  price2: number;
  fillColor: string;
  borderColor: string;
}

export interface PlotMarker {
  type: "marker";
  time: number;
  price: number;
  shape: "arrowUp" | "arrowDown" | "circle";
  color: string;
  text?: string;
}

export interface InfoPanel {
  type: "info";
  trend: "bullish" | "bearish" | "undefined";
  msBias: "bullish" | "bearish" | "undefined";
  htfBias: "bullish" | "bearish" | "undefined";
  divergent: boolean;
  fibActive: boolean;
  volMode: "HV" | "LV";
  rr?: string;
  rrMax?: string;
}

export type PlotItem = PlotLabel | PlotLine | PlotBox | PlotMarker | InfoPanel;

// ═══════════════════════════════════════════════════════════════
// INTERNAL CONFIG (hidden parameters — never exposed)
// ═══════════════════════════════════════════════════════════════

const CFG = {
  pivotBase: 5,
  pivotMin: 3,
  pivotMax: 15,
  atrLen: 14,
  atrSmooth: 30,
  minSwing: 1.0,
  autoHvThreshold: 1.2,

  // Fib levels
  tp5: -0.747,
  tp4: -0.53,
  tp3: -0.15,
  tp2: 0.0,
  tp1_lv: 0.364,
  tp1_hv: 0.294,
  entry: 0.747,
  entryTop: 0.618,
  entryBot: 0.786,
  sl_lv: 1.13,
  sl_hv: 1.2,
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function atr(candles: Candle[], period: number): number[] {
  const result: number[] = new Array(candles.length).fill(0);
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    if (i < period) {
      result[i] = tr;
    } else if (i === period) {
      let sum = 0;
      for (let j = 1; j <= period; j++) {
        const t = Math.max(
          candles[j].high - candles[j].low,
          Math.abs(candles[j].high - candles[j - 1].close),
          Math.abs(candles[j].low - candles[j - 1].close)
        );
        sum += t;
      }
      result[i] = sum / period;
    } else {
      result[i] = (result[i - 1] * (period - 1) + tr) / period;
    }
  }
  return result;
}

function sma(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result[i] = data[i];
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j];
    result[i] = sum / period;
  }
  return result;
}

function pivotHigh(candles: Candle[], left: number, right: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = left + right; i < candles.length; i++) {
    const pivotIdx = i - right;
    const pivotVal = candles[pivotIdx].high;
    let isPivot = true;
    for (let j = pivotIdx - left; j <= pivotIdx + right; j++) {
      if (j === pivotIdx) continue;
      if (j < 0 || j >= candles.length) { isPivot = false; break; }
      if (candles[j].high >= pivotVal) { isPivot = false; break; }
    }
    if (isPivot) result[i] = pivotVal;
  }
  return result;
}

function pivotLow(candles: Candle[], left: number, right: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = left + right; i < candles.length; i++) {
    const pivotIdx = i - right;
    const pivotVal = candles[pivotIdx].low;
    let isPivot = true;
    for (let j = pivotIdx - left; j <= pivotIdx + right; j++) {
      if (j === pivotIdx) continue;
      if (j < 0 || j >= candles.length) { isPivot = false; break; }
      if (candles[j].low <= pivotVal) { isPivot = false; break; }
    }
    if (isPivot) result[i] = pivotVal;
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENGINE
// ═══════════════════════════════════════════════════════════════

export function calculateIndicator(candles: Candle[], htfCandles?: Candle[]): PlotItem[] {
  if (candles.length < 50) return [];

  const plots: PlotItem[] = [];

  // ── ATR + Dynamic Pivot ──
  const atrVals = atr(candles, CFG.atrLen);
  const atrSma = sma(atrVals, CFG.atrSmooth);

  // ── Swing state ──
  let lastHigh = NaN, lastHighBar = -1, lastHighTime = 0, prevHigh = NaN;
  let lastLow = NaN, lastLowBar = -1, lastLowTime = 0, prevLow = NaN;
  let trend = 0;
  let msBias = 0;
  let highCrossed = false, lowCrossed = false;
  let fibActive = false;
  let tp1Hit = false;

  // Trailing extremes for Strong/Weak
  let trailTop = NaN, trailTopTime = 0, trailTopBar = -1;
  let trailBottom = NaN, trailBottomTime = 0, trailBottomBar = -1;

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const atrVal = atrVals[i] || 0;
    const atrS = atrSma[i] || 1;
    const atrRatio = atrS > 0 ? atrVal / atrS : 1.0;

    // Dynamic pivot length
    const rawLen = CFG.pivotBase * (2.0 - atrRatio);
    const pLen = Math.max(CFG.pivotMin, Math.min(CFG.pivotMax, Math.round(rawLen)));

    // Volatility mode
    const isHV = atrRatio >= CFG.autoHvThreshold;
    const tp1Val = isHV ? CFG.tp1_hv : CFG.tp1_lv;
    const slVal = isHV ? CFG.sl_hv : CFG.sl_lv;

    // ── Check for pivot high ──
    if (i >= pLen * 2) {
      const pivotIdx = i - pLen;
      let isPH = true;
      for (let j = pivotIdx - pLen; j <= pivotIdx + pLen; j++) {
        if (j === pivotIdx || j < 0 || j >= candles.length) continue;
        if (candles[j].high >= candles[pivotIdx].high) { isPH = false; break; }
      }

      if (isPH) {
        const phVal = candles[pivotIdx].high;
        const atrAtPivot = atrVals[pivotIdx] || atrVal;
        const validPH = isNaN(lastLow) || Math.abs(phVal - lastLow) >= CFG.minSwing * atrAtPivot;

        if (validPH) {
          // Swing High label
          plots.push({
            type: "label",
            time: candles[pivotIdx].time,
            price: phVal,
            text: "H",
            position: "above",
            color: "#00E676",
            size: "small",
          });

          prevHigh = lastHigh;
          lastHigh = phVal;
          lastHighBar = pivotIdx;
          lastHighTime = candles[pivotIdx].time;
          fibActive = true;
          highCrossed = false;
          tp1Hit = false;

          trailTop = phVal;
          trailTopTime = candles[pivotIdx].time;
          trailTopBar = pivotIdx;
        }
      }

      // ── Check for pivot low ──
      let isPL = true;
      for (let j = pivotIdx - pLen; j <= pivotIdx + pLen; j++) {
        if (j === pivotIdx || j < 0 || j >= candles.length) continue;
        if (candles[j].low <= candles[pivotIdx].low) { isPL = false; break; }
      }

      if (isPL) {
        const plVal = candles[pivotIdx].low;
        const atrAtPivot = atrVals[pivotIdx] || atrVal;
        const validPL = isNaN(lastHigh) || Math.abs(lastHigh - plVal) >= CFG.minSwing * atrAtPivot;

        if (validPL) {
          plots.push({
            type: "label",
            time: candles[pivotIdx].time,
            price: plVal,
            text: "L",
            position: "below",
            color: "#FF5252",
            size: "small",
          });

          prevLow = lastLow;
          lastLow = plVal;
          lastLowBar = pivotIdx;
          lastLowTime = candles[pivotIdx].time;
          fibActive = true;
          lowCrossed = false;
          tp1Hit = false;

          trailBottom = plVal;
          trailBottomTime = candles[pivotIdx].time;
          trailBottomBar = pivotIdx;
        }
      }
    }

    // ── Trend Detection (Golden Trap) ──
    const isHH = !isNaN(lastHigh) && !isNaN(prevHigh) && lastHigh > prevHigh;
    const isLH = !isNaN(lastHigh) && !isNaN(prevHigh) && lastHigh < prevHigh;
    const isHL = !isNaN(lastLow) && !isNaN(prevLow) && lastLow > prevLow;
    const isLL = !isNaN(lastLow) && !isNaN(prevLow) && lastLow < prevLow;

    if (isHH && isHL) trend = 1;
    if (isLH && isLL) trend = -1;
    if (isHH && !isLL) trend = 1;
    if (isLH && !isHL) trend = -1;

    // ── BOS / CHoCH Detection ──
    const prevClose = candles[i - 1].close;

    // Bullish break
    if (!isNaN(lastHigh) && !highCrossed && c.close > lastHigh && prevClose <= lastHigh) {
      highCrossed = true;
      const bodySize = Math.abs(c.close - c.open);
      const upperWick = c.high - Math.max(c.close, c.open);
      const isBullCandle = c.close > c.open;
      const isStrong = bodySize >= 0.5 * atrVal && isBullCandle;

      const tag = msBias === -1 || msBias === 0 ? "CHoCH" : "BOS";
      const prevMsBias = msBias;
      msBias = 1;

      // BOS/CHoCH line
      plots.push({
        type: "line",
        time1: lastHighTime,
        price1: lastHigh,
        time2: c.time,
        price2: lastHigh,
        color: "#089981",
        style: "dashed",
        width: isStrong ? 2 : 1,
      });

      // BOS/CHoCH label
      const midTime = Math.floor((lastHighTime + c.time) / 2);
      plots.push({
        type: "label",
        time: midTime,
        price: lastHigh,
        text: tag + (isStrong ? " ⚡" : " ◌"),
        position: "above",
        color: "#089981",
        size: "tiny",
      });

      trailTop = Math.max(c.high, lastHigh);
      trailTopTime = c.high >= lastHigh ? c.time : lastHighTime;
      trailTopBar = c.high >= lastHigh ? i : lastHighBar;
      trailBottom = lastLow;
      trailBottomTime = lastLowTime;
      trailBottomBar = lastLowBar;
    }

    // Bearish break
    if (!isNaN(lastLow) && !lowCrossed && c.close < lastLow && prevClose >= lastLow) {
      lowCrossed = true;
      const bodySize = Math.abs(c.close - c.open);
      const lowerWick = Math.min(c.close, c.open) - c.low;
      const isBearCandle = c.close < c.open;
      const isStrong = bodySize >= 0.5 * atrVal && isBearCandle;

      const tag = msBias === 1 || msBias === 0 ? "CHoCH" : "BOS";
      msBias = -1;

      plots.push({
        type: "line",
        time1: lastLowTime,
        price1: lastLow,
        time2: c.time,
        price2: lastLow,
        color: "#F23645",
        style: "dashed",
        width: isStrong ? 2 : 1,
      });

      const midTime = Math.floor((lastLowTime + c.time) / 2);
      plots.push({
        type: "label",
        time: midTime,
        price: lastLow,
        text: tag + (isStrong ? " ⚡" : " ◌"),
        position: "below",
        color: "#F23645",
        size: "tiny",
      });

      trailBottom = Math.min(c.low, lastLow);
      trailBottomTime = c.low <= lastLow ? c.time : lastLowTime;
      trailBottomBar = c.low <= lastLow ? i : lastLowBar;
      trailTop = lastHigh;
      trailTopTime = lastHighTime;
      trailTopBar = lastHighBar;
    }

    // ── Update trailing extremes ──
    if (!isNaN(trailTop) && c.high > trailTop) {
      trailTop = c.high;
      trailTopTime = c.time;
      trailTopBar = i;
    }
    if (!isNaN(trailBottom) && c.low < trailBottom) {
      trailBottom = c.low;
      trailBottomTime = c.time;
      trailBottomBar = i;
    }

    // ── Strong/Weak High & Low (last bar only) ──
    if (i === candles.length - 1 && msBias !== 0 && !isNaN(trailTop) && !isNaN(trailBottom)) {
      const distThreshold = 0.3 * atrVal;
      const topFar = Math.abs(trailTop - c.close) >= distThreshold;
      const botFar = Math.abs(c.close - trailBottom) >= distThreshold;

      if (topFar) {
        const topText = msBias === -1 ? "Strong High" : "Weak High";
        const topColor = msBias === -1 ? "#F23645" : "#089981";
        plots.push({
          type: "line",
          time1: trailTopTime,
          price1: trailTop,
          time2: c.time,
          price2: trailTop,
          color: topColor,
          style: "dotted",
          width: 1,
          extend: "right",
        });
        plots.push({
          type: "label",
          time: c.time,
          price: trailTop,
          text: topText,
          position: "above",
          color: topColor,
          size: "tiny",
        });
      }

      if (botFar) {
        const botText = msBias === 1 ? "Strong Low" : "Weak Low";
        const botColor = msBias === 1 ? "#089981" : "#F23645";
        plots.push({
          type: "line",
          time1: trailBottomTime,
          price1: trailBottom,
          time2: c.time,
          price2: trailBottom,
          color: botColor,
          style: "dotted",
          width: 1,
          extend: "right",
        });
        plots.push({
          type: "label",
          time: c.time,
          price: trailBottom,
          text: botText,
          position: "below",
          color: botColor,
          size: "tiny",
        });
      }
    }

    // ── Fibonacci (last 100 bars — active fib only) ──
    if (i >= candles.length - 100 && fibActive && !isNaN(lastHigh) && !isNaN(lastLow) && trend !== 0) {
      let fibStart: number, fibHeight: number;
      let fibBarLeft: number, fibBarRight: number;

      if (trend === 1) {
        fibStart = lastHigh;
        fibHeight = lastLow - lastHigh;
        fibBarLeft = Math.min(lastHighBar, lastLowBar);
        fibBarRight = Math.max(lastHighBar, lastLowBar);
      } else {
        fibStart = lastLow;
        fibHeight = lastHigh - lastLow;
        fibBarLeft = Math.min(lastLowBar, lastHighBar);
        fibBarRight = Math.max(lastLowBar, lastHighBar);
      }

      if (fibHeight !== 0) {
        const priceEntry = fibStart + fibHeight * CFG.entry;
        const priceTp1 = fibStart + fibHeight * tp1Val;
        const priceTp2 = fibStart + fibHeight * CFG.tp2;
        const priceTp3 = fibStart + fibHeight * CFG.tp3;
        const priceTp4 = fibStart + fibHeight * CFG.tp4;
        const priceTp5 = fibStart + fibHeight * CFG.tp5;
        const priceSl = fibStart + fibHeight * slVal;
        const priceEzTop = fibStart + fibHeight * CFG.entryTop;
        const priceEzBot = fibStart + fibHeight * CFG.entryBot;

        // TP1 hit detection
        if (!tp1Hit) {
          if (trend === 1 && c.low <= priceTp1) tp1Hit = true;
          if (trend === -1 && c.high >= priceTp1) tp1Hit = true;
        }

        // Invalidation
        const effectiveSlVal = tp1Hit ? CFG.entry : slVal;
        const effectiveSlPrice = fibStart + fibHeight * effectiveSlVal;

        if (trend === 1) {
          if (c.close <= effectiveSlPrice || c.high >= fibStart) fibActive = false;
        } else {
          if (c.close >= effectiveSlPrice || c.low <= fibStart) fibActive = false;
        }

        // Only draw fib on last bar to avoid clutter
        if (i === candles.length - 1 && fibActive) {
          const leftTime = candles[fibBarLeft]?.time || c.time;
          const rightTime = c.time;

          // Fib levels
          const levels = [
            { price: priceTp5, label: "TP5", color: "#4caf50" },
            { price: priceTp4, label: "TP4", color: "#4caf50" },
            { price: priceTp3, label: "TP3", color: "#4caf50" },
            { price: priceTp2, label: "TP2", color: "#4caf50" },
            { price: priceTp1, label: "TP1", color: "#4caf50" },
            { price: priceEntry, label: "Entry", color: "#FF9800" },
            { price: tp1Hit ? priceEntry : priceSl, label: tp1Hit ? "BE/SL" : "SL", color: tp1Hit ? "#2196F3" : "#f44336" },
          ];

          for (const level of levels) {
            plots.push({
              type: "line",
              time1: leftTime,
              price1: level.price,
              time2: rightTime,
              price2: level.price,
              color: level.color,
              style: "solid",
              width: 1,
              extend: "right",
            });
            plots.push({
              type: "label",
              time: rightTime,
              price: level.price,
              text: `${level.label} ${level.price.toFixed(2)}`,
              position: level.price > priceEntry ? "above" : "below",
              color: level.color,
              size: "tiny",
            });
          }

          // Entry zone box
          plots.push({
            type: "box",
            time1: leftTime,
            price1: priceEzTop,
            time2: rightTime,
            price2: priceEzBot,
            fillColor: "rgba(255,152,0,0.1)",
            borderColor: "#FF9800",
          });

          // Position visual (profit/loss zones)
          const tpMax = priceTp5;
          const slLevel = tp1Hit ? priceEntry : priceSl;

          if (trend === 1) {
            // Long: green above entry, red below
            plots.push({
              type: "box",
              time1: rightTime,
              price1: tpMax,
              time2: rightTime,
              price2: priceEntry,
              fillColor: "rgba(8,153,129,0.1)",
              borderColor: "rgba(8,153,129,0.3)",
            });
            plots.push({
              type: "box",
              time1: rightTime,
              price1: priceEntry,
              time2: rightTime,
              price2: slLevel,
              fillColor: "rgba(242,54,69,0.1)",
              borderColor: "rgba(242,54,69,0.3)",
            });
          } else {
            // Short: green below entry, red above
            plots.push({
              type: "box",
              time1: rightTime,
              price1: priceEntry,
              time2: rightTime,
              price2: tpMax,
              fillColor: "rgba(8,153,129,0.1)",
              borderColor: "rgba(8,153,129,0.3)",
            });
            plots.push({
              type: "box",
              time1: rightTime,
              price1: slLevel,
              time2: rightTime,
              price2: priceEntry,
              fillColor: "rgba(242,54,69,0.1)",
              borderColor: "rgba(242,54,69,0.3)",
            });
          }

          // R:R calculation
          const risk = Math.abs(priceEntry - priceSl);
          const reward = Math.abs(priceEntry - priceTp1);
          const rewardMax = Math.abs(priceEntry - priceTp5);
          const rr = risk > 0 ? (reward / risk).toFixed(2) : "0";
          const rrMax = risk > 0 ? (rewardMax / risk).toFixed(2) : "0";

          // Direction label
          plots.push({
            type: "label",
            time: rightTime,
            price: priceEntry,
            text: trend === 1 ? "LONG ▲" : "SHORT ▼",
            position: trend === 1 ? "below" : "above",
            color: trend === 1 ? "#089981" : "#F23645",
            size: "normal",
          });

          // Info panel
          const htfTrend = htfCandles ? computeHTFTrend(htfCandles) : 0;
          const divergent = trend !== 0 && msBias !== 0 && trend !== msBias;

          plots.push({
            type: "info",
            trend: trend === 1 ? "bullish" : trend === -1 ? "bearish" : "undefined",
            msBias: msBias === 1 ? "bullish" : msBias === -1 ? "bearish" : "undefined",
            htfBias: htfTrend === 1 ? "bullish" : htfTrend === -1 ? "bearish" : "undefined",
            divergent,
            fibActive,
            volMode: isHV ? "HV" : "LV",
            rr: `1:${rr}`,
            rrMax: `1:${rrMax}`,
          });
        }
      }
    }
  }

  return plots;
}

// ═══════════════════════════════════════════════════════════════
// HTF TREND (simplified — same logic, different timeframe)
// ═══════════════════════════════════════════════════════════════

function computeHTFTrend(candles: Candle[]): number {
  let lastH = NaN, prevH = NaN, lastL = NaN, prevL = NaN;
  let trend = 0;

  const pLen = 5;
  for (let i = pLen * 2; i < candles.length; i++) {
    const pivotIdx = i - pLen;

    // Check pivot high
    let isPH = true;
    for (let j = pivotIdx - pLen; j <= pivotIdx + pLen; j++) {
      if (j === pivotIdx || j < 0 || j >= candles.length) continue;
      if (candles[j].high >= candles[pivotIdx].high) { isPH = false; break; }
    }
    if (isPH) { prevH = lastH; lastH = candles[pivotIdx].high; }

    // Check pivot low
    let isPL = true;
    for (let j = pivotIdx - pLen; j <= pivotIdx + pLen; j++) {
      if (j === pivotIdx || j < 0 || j >= candles.length) continue;
      if (candles[j].low <= candles[pivotIdx].low) { isPL = false; break; }
    }
    if (isPL) { prevL = lastL; lastL = candles[pivotIdx].low; }

    const HH = !isNaN(lastH) && !isNaN(prevH) && lastH > prevH;
    const LH = !isNaN(lastH) && !isNaN(prevH) && lastH < prevH;
    const HL = !isNaN(lastL) && !isNaN(prevL) && lastL > prevL;
    const LL = !isNaN(lastL) && !isNaN(prevL) && lastL < prevL;

    if (HH && HL) trend = 1;
    if (LH && LL) trend = -1;
    if (HH && !LL) trend = 1;
    if (LH && !HL) trend = -1;
  }

  return trend;
}
