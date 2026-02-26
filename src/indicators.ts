/**
 * Technical indicators: RSI, MACD, Momentum (rolling, matching Rust logic)
 */

export class RollingRSI {
  private period: number;
  private prices: number[] = [];
  private gains: number[] = [];
  private losses: number[] = [];
  private avgGain = 0;
  private avgLoss = 0;
  private initialized = false;

  constructor(period: number) {
    this.period = period;
  }

  addPrice(price: number): void {
    this.prices.push(price);
    if (this.prices.length < 2) return;
    const prev = this.prices[this.prices.length - 2];
    const change = price - prev;
    this.gains.push(change > 0 ? change : 0);
    this.losses.push(change < 0 ? -change : 0);
    if (!this.initialized) {
      if (this.gains.length >= this.period) {
        this.avgGain = this.gains.slice(-this.period).reduce((a, b) => a + b, 0) / this.period;
        this.avgLoss = this.losses.slice(-this.period).reduce((a, b) => a + b, 0) / this.period;
        this.initialized = true;
      }
    } else {
      const gain = this.gains[this.gains.length - 1];
      const loss = this.losses[this.losses.length - 1];
      this.avgGain = (this.avgGain * (this.period - 1) + gain) / this.period;
      this.avgLoss = (this.avgLoss * (this.period - 1) + loss) / this.period;
    }
    if (this.prices.length > this.period + 1) this.prices.shift();
    if (this.gains.length > this.period) this.gains.shift();
    if (this.losses.length > this.period) this.losses.shift();
  }

  getRSI(): number | null {
    if (!this.initialized) return null;
    if (this.avgLoss === 0 && this.avgGain === 0) return 50;
    if (this.avgLoss === 0) return 100;
    if (this.avgGain === 0) return 0;
    const rs = this.avgGain / this.avgLoss;
    return 100 - 100 / (1 + rs);
  }

  isReady(): boolean {
    return this.initialized;
  }

  resetToNeutral(): void {
    this.prices = [];
    this.gains = [];
    this.losses = [];
    this.avgGain = 0.01;
    this.avgLoss = 0.01;
    this.initialized = true;
  }
}

export class RollingMACD {
  private fastPeriod: number;
  private slowPeriod: number;
  private signalPeriod: number | null;
  private prices: number[] = [];
  private emaFast = 0;
  private emaSlow = 0;
  private macdHistory: number[] = [];
  private signalLine = 0;
  private signalInitialized = false;
  private initialized = false;

  constructor(fastPeriod: number, slowPeriod: number, signalPeriod: number | null = null) {
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
    this.signalPeriod = signalPeriod;
  }

  addPrice(price: number): void {
    this.prices.push(price);
    if (!this.initialized && this.prices.length >= this.slowPeriod) {
      const sum = this.prices.reduce((a, b) => a + b, 0);
      const sma = sum / this.prices.length;
      this.emaFast = sma;
      this.emaSlow = sma;
      this.initialized = true;
    } else if (this.initialized) {
      const fastAlpha = 2 / (this.fastPeriod + 1);
      const slowAlpha = 2 / (this.slowPeriod + 1);
      this.emaFast = price * fastAlpha + this.emaFast * (1 - fastAlpha);
      this.emaSlow = price * slowAlpha + this.emaSlow * (1 - slowAlpha);
    }
    if (this.initialized) {
      const macdValue = this.emaFast - this.emaSlow;
      if (this.signalPeriod != null) {
        this.macdHistory.push(macdValue);
        if (this.macdHistory.length > this.signalPeriod + 1) this.macdHistory.shift();
        if (!this.signalInitialized && this.macdHistory.length >= this.signalPeriod) {
          this.signalLine = this.macdHistory.reduce((a, b) => a + b, 0) / this.macdHistory.length;
          this.signalInitialized = true;
        } else if (this.signalInitialized) {
          const alpha = 2 / (this.signalPeriod + 1);
          this.signalLine = macdValue * alpha + this.signalLine * (1 - alpha);
        }
      }
    }
    if (this.prices.length > this.slowPeriod + 1) this.prices.shift();
  }

  getMACD(): number | null {
    return this.initialized ? this.emaFast - this.emaSlow : null;
  }

  getSignalLine(): number | null {
    return this.signalPeriod != null && this.signalInitialized ? this.signalLine : null;
  }

  isReady(): boolean {
    return this.initialized;
  }

  resetToNeutral(): void {
    this.prices = [];
    this.macdHistory = [];
    this.emaFast = 0;
    this.emaSlow = 0;
    this.signalLine = 0;
    this.initialized = true;
    this.signalInitialized = this.signalPeriod != null;
  }
}

export class RollingMomentum {
  private period: number;
  private prices: number[] = [];

  constructor(period: number) {
    this.period = period;
  }

  addPrice(price: number): void {
    this.prices.push(price);
    if (this.prices.length > this.period + 1) this.prices.shift();
  }

  getMomentum(): number | null {
    if (this.prices.length < this.period + 1) return null;
    const current = this.prices[this.prices.length - 1];
    const past = this.prices[0];
    if (past === 0) return null;
    return ((current - past) / past) * 100;
  }

  isReady(): boolean {
    return this.prices.length >= this.period + 1;
  }

  resetToNeutral(): void {
    this.prices = [];
  }
}

/** One-off RSI from price array (for down-token index when we don't keep a rolling state) */
export function calculateRSI(prices: number[], period: number): number | null {
  if (prices.length < period + 1) return null;
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  if (avgLoss === 0 && avgGain === 0) return 50;
  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
