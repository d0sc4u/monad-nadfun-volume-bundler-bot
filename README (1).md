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
git clone https://github.com/d0sc4u/polymarket-trading-bot.git
cd polymarket-copy-trading-bot-v3
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory and configure the following variables:

```env
# Target Configuration
TARGET_USER_ADDRESS = '0xf5201...'
MY_PROXY_WALLET_ADDRESS = '0xf6d01...'

# Wallet Configuration
PRIVATE_KEY = '0x35c57...'

# Smart Contract Addresses (Polygon Mainnet)
PROXY_WALLET_FACTORY_ADDRESS = '0x56C79347e95530c01A2FC76E732f9566dA16E113'
NEG_RISK_ADAPTER_ADDRESS = '0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296'
CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS = '0x4d97dcd97ec945f40cf65f87097ace5ea0476045'
USDC_CONTRACT_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
SAFE_MULTISEND_ADDRESS = '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761'

# API Endpoints
CLOB_HTTP_URL = 'https://clob.polymarket.com/'
CLOB_WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws'
GAMMA_API_URL = 'https://gamma-api.polymarket.com'

# Gas Configuration
GAS_LIMIT = 5000
GAS_PRICE_LIMIT = 110000000000

# Bot Configuration
WAITING_TIME = 4                    # Scan interval in seconds
MAX_POSITION_LIMIT = 0.2           # Maximum 20% per position

# Infrastructure
RPC_URL = 'https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID'
MONGO_URI = 'mongodb+srv://username:password@cluster.mongodb.net/database'
```
### Step 3: RPC URL Configuration
You can find rpcRotator.ts file in the root directory. This is a tool to rotate your RPC URL. You can use it to rotate your RPC URL. You have to create rpcUrls.json file in the **polygon/private** directory.
```
{
    "rpcUrls": [
        "https://polygon-mainnet.infura.io/v3/your_project_id1",
        "https://polygon-mainnet.infura.io/v3/your_project_id2",
        "https://polygon-mainnet.infura.io/v3/your_project_id3"
        ...
    ]
}
```

More 5 RPC URL is recommended to overcome the RPC URL limit.
If you use unlimited version of infura, you can ignore this step. Plz delete rpcRotator.ts file and related line in codebase.
## 🔧 Configuration Variables Explained

### Core Trading Settings

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `TARGET_USER_ADDRESS` | Wallet address of the trader you want to copy | `0xf52015...` | ✅ |
| `MY_PROXY_WALLET_ADDRESS` | Your proxy wallet address for trading | `0xf6d01b...` | ✅ |
| `PRIVATE_KEY` | Private key of your trading wallet (keep secure! MetaMask or Phantom) | `0x35c57d...` | ✅ |

### Risk Management

| Variable | Description | Default | Recommended |
|----------|-------------|---------|-------------|
| `MAX_POSITION_LIMIT` | Maximum percentage of portfolio per position | `0.2` (20%) | `0.1-0.3` |
| `WAITING_TIME` | Seconds between position scans | `4` | `3-10` |
| `GAS_PRICE_LIMIT` | Maximum gas price in wei | `110000000000` | Adjust based on network |

### Infrastructure Setup

| Variable | Description | How to Get |
|----------|-------------|------------|
| `RPC_URL` | Polygon RPC endpoint | Get from [Infura](https://infura.io) or [Alchemy](https://alchemy.com) |
| `MONGO_URI` | MongoDB connection string | Create at [MongoDB Atlas](https://cloud.mongodb.com) |

### Smart Contract Addresses
These are pre-configured for Polygon mainnet. **Do not change unless you know what you're doing.**

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Create database user with read/write permissions
4. Get connection string and add to `MONGO_URI`

### Local MongoDB
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community  # macOS
# or
sudo apt-get install mongodb  # Ubuntu

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

## 🌐 RPC Setup

### Infura Setup
1. Sign up at [Infura.io](https://infura.io)
2. Create new project
3. Select Polygon network
4. Copy project ID
5. Use: `https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID`

### Alchemy Setup
1. Sign up at [Alchemy.com](https://alchemy.com)
2. Create new app on Polygon
3. Copy HTTP URL
4. Use the provided URL

## 🏃‍♂️ Running the Bot

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Using PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start bot with PM2
pm2 start dist/index.js --name "polymarket-bot"

# Monitor logs
pm2 logs polymarket-bot

# Restart bot
pm2 restart polymarket-bot

# Stop bot
pm2 stop polymarket-bot
```

## 🚀 Deployment Options

### VPS Deployment (Recommended)

1. **Choose a VPS Provider**
   - DigitalOcean, AWS EC2, Google Cloud, or Vultr
   - Minimum: 1GB RAM, 1 CPU core
   - Choose the location carefully as many of locations are banned from polymarket.

   ***Choose your vps carefully!***
   I highly recommend [tradingvps.io](https://app.tradingvps.io/link.php?id=11)) (Netherlands IP), ping speed was under 1ms.
   <img width="506" height="310" alt="image" src="https://github.com/user-attachments/assets/d824fb72-9cf4-4eb2-8863-617fdf1209ea" />
   <img width="516" height="330" alt="image" src="https://github.com/user-attachments/assets/e86a756a-1ce8-4b00-a2ea-76a9c1b38105" />

2. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Clone and setup project
   git clone https://github.com/d0sc4u/polymarket-trading-bot.git
   cd polymarket-trading-bot-v3
   npm install
   ```

3. **Configure Environment**
   ```bash
   # Create .env file
   nano .env
   # Add your configuration
   
   # Build and start
   npm run build
   pm2 start dist/index.js --name "polymarket-bot"
   pm2 startup
   pm2 save
   ```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t polymarket-bot .
docker run -d --name polymarket-bot --env-file .env polymarket-bot
```

## 📊 Monitoring & Maintenance

### Log Monitoring
```bash
# PM2 logs
pm2 logs polymarket-bot

# Real-time monitoring
pm2 monit
```

### Health Checks
The bot includes built-in health monitoring:
- RPC connection status
- MongoDB connection
- Trading balance checks
- Gas price monitoring

### Maintenance Tasks

1. **Regular Balance Checks**
   - Monitor USDC balance
   - Check gas token (MATIC) balance

2. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

3. **Database Cleanup**
   - Archive old trade data
   - Monitor database size

## ⚠️ Security Best Practices

### Private Key Security
- **Never share your private key**
- Use environment variables only
- Consider hardware wallet integration for large amounts
- Regularly rotate keys

### Network Security
- Use HTTPS RPC endpoints only
- Enable firewall on your server
- Use VPN for additional security
- Monitor for unusual activity

### Operational Security
- Start with small amounts
- Monitor positions regularly
- Set up alerts for large losses

## 🔧 Troubleshooting

### Common Issues

1. **"Insufficient Balance" Error**
   - Check USDC balance in your wallet
   - Ensure gas token (MATIC) balance

2. **RPC Connection Issues**
   - Verify RPC URL is correct
   - Check rate limits
   - Try different RPC provider

3. **MongoDB Connection Failed**
   - Verify connection string
   - Check network access
   - Ensure database user permissions

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start
```

## 📈 Performance Optimization

### Recommended Settings
- `WAITING_TIME`: 4-6 seconds (balance between speed and API limits)
- `MAX_POSITION_LIMIT`: 0.1-0.2 (10-20% per position)
- Use multiple RPC endpoints for redundancy

### Scaling Considerations
- Monitor API rate limits
- Consider multiple bot instances for different targets
- Implement position size scaling based on portfolio size

## 🤝 Support & Community

### Getting Help
- Check logs first: `pm2 logs polymarket-bot`
- Review configuration settings
- Test with small amounts first

### Contributing
1. Fork the repository
2. Create feature branch
3. Submit pull request

## ⚖️ Legal Disclaimer
Users are responsible for:
- Compliance with local regulations
- Understanding trading risks
- Proper risk management
- Securing private keys

**Trading involves significant risk. Never invest more than you can afford to lose.**

## 📄 License

MIT License - see LICENSE file for details.

---

**Happy Trading! 🚀**

Remember: Start small, monitor closely, and always prioritize security over profits.

## 📞 Contact me for any questions or support
- If you have any questions or need support, feel free to contact me via [Telegram](https://t.me/d0sc4u).
