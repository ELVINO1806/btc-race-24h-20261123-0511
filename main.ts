
// Entry A — btc-race-24h-20261123-0511

// Dip-entry vs SMA120, long only, CBBTC, 1m bars, $1,000 starting capital.
//   ENTRY (flat only): close < 0.992 * SMA120  -> BUY with all cash.
//   EXIT (holding):   close >= 1.02 * entry (TP) or close <= 0.98 * entry (SL)
//                     -> SELL the whole position. Re-entry allowed.
// No trading during warm-up; closes are collected the whole run.
// All price comparisons use exact bigint arithmetic (prices share one scale,
// so ratios cancel it): close < 0.992 * sum/120  <=>  close * 120000 < 992 * sum.

import { runBars } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const SMA_LEN = 120;

const closes: bigint[] = [];
let rollingSum = 0n; // sum of the last SMA_LEN closes, maintained incrementally.
let entryPrice: bigint | null = null;
let pendingBuy = false;
let pendingSell = false;

await runBars({
  onBatch(state, batch) {
    // First, fold in the fills this batch carries (priced at this bar's open).
    for (const fill of batch.fills) {
      if (fill.symbol !== SYMBOL) continue;
      if (fill.side === 'buy' && fill.status === 'filled') {
        entryPrice = BigInt(fill.price);
        pendingBuy = false;
      } else if (fill.side === 'buy') {
        pendingBuy = false;
      } else if (fill.side === 'sell') {
        entryPrice = null;
        pendingSell = false;
      }
    }


    // Collect this bar's close, keeping the rolling 120-bar sum in step.

    for (const bar of batch.bars) {
      if (bar.symbol !== SYMBOL) continue;
      const c = BigInt(bar.c);
      closes.push(c);
      rollingSum += c;
      if (closes.length > SMA_LEN) {
        rollingSum -= closes[closes.length - SMA_LEN - 1]!;
      }
    }

    // Warm-up: build history only, never trade.
    if (state.warmingUp) return [];

    const close = closes.length > 0 ? closes[closes.length - 1]! : null;
    if (close === null) return [];

    const held = state.positions.get(SYMBOL);
    const qty = held !== undefined ? held.qty : 0n;

    // Holding a position: check TP / SL against the recorded entry price.
    if (qty > 0n) {
      if (entryPrice === null) {
        // No recorded entry (should not happen): derive it from cost basis.
        const sym = state.symbols.get(SYMBOL)!;
        const quoteScale = BigInt(state.hello.capital.quote_scale);
        entryPrice =
          (held!.cost * 10n ** BigInt(sym.qty_scale + sym.price_scale)) /
          (qty * 10n ** quoteScale);
      }
      const entry = entryPrice!;
      if (pendingSell) return [];
      if (close * 100n >= 102n * entry || close * 100n <= 98n * entry) {
        pendingSell = true;
        return [{ side: 'sell', symbol: SYMBOL, qty, max_slippage_bps: 100 }];
      }
      return [];
    }

    // Flat: wait for any in-flight buy to settle, then check the dip.
    if (pendingBuy || pendingSell) return [];
    if (closes.length < SMA_LEN) return [];


    const sum = rollingSum;

    if (close * 120000n < 992n * sum && state.cash > 0n) {
      pendingBuy = true;
      return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: 100 }];
    }
    return [];
  },
});
