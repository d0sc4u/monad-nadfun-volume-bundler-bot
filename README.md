# Polymarket Copy Trading Bot v3

A sophisticated automated trading bot that mirrors the positions of a target trader on Polymarket. The bot continuously monitors a specified wallet address and replicates their trading positions in real-time with customizable risk management parameters.

## 🎯 How It Works

### Core Principle
The bot operates on a simple yet powerful principle:
1. **Monitor**: Continuously scans the target user's positions every 4 seconds (configurable)
2. **Analyze**: Compares target positions with your current positions
3. **Execute**: Automatically places buy/sell orders to match the target's portfolio allocation
4. **Auto Redeemption** Automatically redeem resolved positions every 2 hours
5. **Risk Management**: Applies position limits and portfolio constraints to protect your capital

### Key Features
- **Real-time Position Mirroring**: Instantly replicates target trader's positions
- **Risk Management**: Built-in position size limits and portfolio protection
- **Gas Optimization**: Smart gas price management for cost-effective trading
- **RPC Rotation**: Automatic RPC endpoint rotation for reliability
- **Blacklist Support**: Exclude specific assets from copying
- **Safe Wallet Integration**: Secure multi-signature wallet support. (This bot is for safe wallet, you need to create polyaccount with third party wallet like metamask or phantom)
- **MongoDB Integration**: Position tracking and trade history storage

## 📋 Prerequisites

Before installing the bot, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **MongoDB** database (local or cloud)
- **Polygon RPC endpoint** (Infura, Alchemy, or similar)
- **Private key** of your trading wallet
- **USDC balance** on Polygon network for trading

## 🚀 Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/d0sc4u/polymarket-trading-bot-v3.git
cd polymarket-copy-trading-bot-v3
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `config.json` file in the root directory and configure the following variables:

```env
{
  "polymarket": {
    "gamma_api_url": "https://gamma-api.polymarket.com",
    "clob_api_url": "https://clob.polymarket.com",
    "api_key": "",
    "api_secret": "",
    "api_passphrase": "",
    "private_key": "",
    "proxy_wallet_address": "",
    "signature_type": 2
  },
  "trending_index": {
    "mode": "rsi",
    "threshold": 70,
    "lookback": 20,
    "macd_fast_period": 12,
    "macd_slow_period": 26,
    "macd_signal_period": 9,
    "use_macd_sl_filter": false
  },
  "trading": {
    "enable_eth_trading": false,
    "enable_solana_trading": false,
    "enable_xrp_trading": false,
    "check_interval_ms": 500,
    "position_size": 6.0,
    "profit_threshold": 0.05,
    "stop_loss_threshold": 0.05,
    "trading_start_when_remaining_minutes": 14
  }
}

```



**Happy Trading! 🚀**

Remember: Start small, monitor closely, and always prioritize security over profits.

## 📞 Contact me for any questions or support
- If you have any questions or need support, feel free to contact me via [Telegram](https://t.me/d0sc4u).
