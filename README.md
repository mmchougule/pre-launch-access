# Pre-Launch Token Access

Privacy-first launchpad for pre-launch token distribution powered by privacy pools.

## Features

- **Private Contributions**: User contributions are shielded through privacy pools, ensuring complete anonymity
- **Pre-Launch Token Access**: Early access to tokens before public launch
- **Fair Distribution**: Privacy pools prevent front-running and bot manipulation
- **Project Management**: Admin interface for managing launchpad projects
- **Contribution Tracking**: Users can track their contributions and allocated tokens
- **Multi-Token Support**: Accept contributions in USDT and USDC

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Blockchain**: Ethereum (ethers.js v6)
- **Testing**: Jest, React Testing Library
- **Validation**: Zod

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 12.x or higher
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mmchougule/pre-launch-access.git
cd pre-launch-access
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/prelaunch
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=prelaunch
DATABASE_USER=user
DATABASE_PASSWORD=password

# Privacy Pool Contract Address
PRIVACY_POOL_ADDRESS=0x...

# Network Configuration
CHAIN_ID=1
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
```

4. Set up the database:
```bash
# Create the database
createdb prelaunch

# Run migrations
npm run db:migrate
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run db:migrate` - Run database migrations
- `npm run lint` - Run ESLint

## Project Structure

```
.
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   └── launchpad/
│   │       ├── projects/         # List/create projects
│   │       ├── contribute/       # Process contributions
│   │       ├── status/           # Check contribution status
│   │       └── distribute/       # Distribute tokens
│   ├── trading/                  # Trading pages
│   │   └── launchpad/
│   │       ├── page.tsx          # Launchpad listing
│   │       ├── [id]/page.tsx     # Project detail
│   │       ├── status/page.tsx   # Contribution status
│   │       └── admin/page.tsx    # Admin interface
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # React components
│   └── trading/
│       ├── launchpad-project-card.tsx
│       ├── launchpad-contribute-dialog.tsx
│       └── __tests__/
├── lib/                          # Business logic
│   ├── launchpadService.ts       # Launchpad service
│   ├── db.ts                     # Database connection
│   ├── types/                    # TypeScript types
│   └── __tests__/
├── migrations/                   # Database migrations
│   └── 001_create_launchpad_tables.sql
├── scripts/                      # Utility scripts
│   └── migrate.js
├── package.json
├── tsconfig.json
├── next.config.js
└── jest.config.js
```

## Database Schema

### launchpad_projects

Stores launchpad project information:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Project name |
| symbol | VARCHAR(50) | Token symbol |
| description | TEXT | Project description |
| token_address | VARCHAR(42) | Token contract address |
| price_per_token | DECIMAL(36,18) | Token price in USD |
| total_supply | VARCHAR(78) | Total token supply |
| allocation | VARCHAR(78) | Launchpad allocation |
| start_time | BIGINT | Launch start timestamp |
| end_time | BIGINT | Launch end timestamp |
| min_contribution | VARCHAR(78) | Minimum contribution |
| max_contribution | VARCHAR(78) | Maximum contribution |
| status | VARCHAR(20) | Project status |
| raised_amount | VARCHAR(78) | Total raised amount |
| contributors_count | INT | Number of contributors |
| privacy_pool_address | VARCHAR(42) | Privacy pool address |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### launchpad_contributions

Tracks user contributions:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to projects |
| user_address | VARCHAR(42) | Contributor wallet |
| incognito_address | VARCHAR(42) | Incognito wallet |
| amount | VARCHAR(78) | Contribution amount |
| token | VARCHAR(10) | USDT or USDC |
| shield_tx_hash | VARCHAR(66) | Shield transaction hash |
| tokens_allocated | VARCHAR(78) | Allocated tokens |
| distribution_tx_hash | VARCHAR(66) | Distribution tx hash |
| status | VARCHAR(20) | Contribution status |
| created_at | TIMESTAMP | Creation timestamp |

## API Endpoints

### GET /api/launchpad/projects
List all launchpad projects

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Project Name",
      "symbol": "SYMBOL",
      "status": "active",
      ...
    }
  ]
}
```

### POST /api/launchpad/projects
Create a new project (admin only)

**Request:**
```json
{
  "name": "Project Name",
  "symbol": "SYMBOL",
  "pricePerToken": "1.5",
  "allocation": "100000",
  ...
}
```

### POST /api/launchpad/contribute
Make a contribution to a project

**Request:**
```json
{
  "projectId": "uuid",
  "amount": "1000",
  "token": "USDT",
  "privateKey": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "shieldTxHash": "0x...",
  "contributionId": "uuid"
}
```

### GET /api/launchpad/status
Check contribution status

**Query Parameters:**
- `projectId`: Project UUID
- `userAddress`: Wallet address

**Response:**
```json
{
  "status": {
    "contributed": "1000",
    "tokensAllocated": "666.67",
    "status": "pending"
  }
}
```

### POST /api/launchpad/distribute
Distribute tokens (project owner only)

**Request:**
```json
{
  "projectId": "uuid",
  "privateKey": "0x..."
}
```

## Testing

The project includes comprehensive tests:

- **Unit Tests**: Test individual components and services
- **Integration Tests**: Test complete user flows
- **Component Tests**: Test React component rendering and interactions

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Deployment

### Production Build

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Environment Configuration

Ensure all environment variables are properly set in production:

- Database connection strings
- Privacy pool contract address
- RPC endpoint URL
- Chain ID

### Database Migration

Run migrations on the production database:
```bash
npm run db:migrate
```

### Vercel Deployment

This project is optimized for deployment on Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

## Security Considerations

- Never commit private keys or sensitive data
- Use environment variables for all configuration
- Validate all user inputs
- Implement rate limiting for API endpoints
- Use HTTPS in production
- Secure database with proper credentials
- Implement authentication for admin endpoints

## Privacy Features

### How Privacy Works

1. **Shielded Contributions**: When users contribute, their tokens are sent to a privacy pool
2. **Anonymous Tracking**: The system tracks contributions without revealing individual amounts
3. **Private Distribution**: Tokens are distributed to incognito wallets
4. **No On-Chain Links**: No link between user's main wallet and contribution

### Privacy Pool Integration

The application integrates with privacy pools to:
- Shield user contributions
- Unshield funds to project wallets
- Distribute tokens privately

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql postgresql://user:password@localhost:5432/prelaunch
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Test Failures

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests in verbose mode
npm test -- --verbose
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
