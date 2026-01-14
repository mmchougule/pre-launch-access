# Feature 3: Pre-Launch Token Access Feature

## Problem Statement

Early token access is highly valuable but currently:
1. **Limited to VCs/Insiders:** Retail users can't access pre-launch tokens
2. **High Risk:** Pre-launch tokens are often scams or rug pulls
3. **No Privacy:** Early buyers are doxxed on-chain
4. **Fragmented:** Each launchpad has different requirements

**Market Opportunity:** Pre-launch token market is $100M+ annually. Retail demand is massive but underserved.

## Solution

Use privacy pools to enable **private, pre-launch token distribution**. Here's how it works:

1. **Project launches token** via b402 Launchpad
2. **Users shield tokens** (USDT/USDC) into privacy pool
3. **Project receives shielded tokens** (private, can't track buyers)
4. **Users receive pre-launch tokens** directly to their incognito wallets
5. **When token launches publicly**, users can trade from incognito wallets
6. **Early buyers remain private** (no on-chain link to main wallet)

**Key Innovation:** Privacy pools enable **fair, private distribution** without revealing early buyers.

## Why This Will Get Traction

1. **Massive Demand:** Everyone wants early access to tokens
2. **Privacy Angle:** Early buyers stay private (huge value for whales)
3. **Fair Distribution:** Privacy pools prevent front-running and bot manipulation
4. **Viral Growth:** Launchpad projects bring their communities
5. **Revenue Stream:** Launchpad fees (2-5% of raise) are highly profitable

## What This Unlocks

1. **New Revenue Stream:** Launchpad fees ($10k-100k per project)
2. **User Acquisition:** Projects bring their communities to b402
3. **Network Effects:** More projects → more users → more projects
4. **Ecosystem Growth:** Become the go-to launchpad for privacy-focused projects
5. **Partnership Opportunities:** Partner with projects, VCs, launchpads
6. **Premium Positioning:** "Privacy-first launchpad" differentiates from others

## Technical Specifications

### Architecture

```
Pre-Launch Token Distribution Flow:
┌─────────────────────────────────────────┐
│  1. Project creates launchpad listing   │
│     - Token details, price, allocation  │
│     - Privacy pool address (b402's pool) │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  2. Users shield USDT/USDC to pool     │
│     - Each user's contribution private  │
│     - Project can't see individual buys │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  3. b402 aggregates shielded funds     │
│     - Tracks total raised (public)      │
│     - Individual contributions private │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  4. When target reached, distribute     │
│     - Unshield funds to project wallet │
│     - Mint/transfer tokens to users    │
│     - Tokens sent to incognito wallets │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  5. Token launches publicly             │
│     - Users trade from incognito wallets│
│     - Early buyers remain private      │
└─────────────────────────────────────────┘
```

### Launchpad Service

**File:** `lib/launchpadService.ts`
```typescript
export interface LaunchpadProject {
  id: string
  name: string
  symbol: string
  description: string
  tokenAddress?: string // Set after deployment
  pricePerToken: string // In USDT
  totalSupply: string
  allocation: string // Amount available in launchpad
  startTime: number
  endTime: number
  minContribution: string
  maxContribution: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  raisedAmount: string
  contributors: number
  privacyPoolAddress: string // b402's privacy pool
}

export class LaunchpadService {
  // Get all launchpad projects
  async getProjects(): Promise<LaunchpadProject[]>
  
  // Get project details
  async getProject(projectId: string): Promise<LaunchpadProject>
  
  // Contribute to project (shield tokens)
  async contribute(
    projectId: string,
    amount: string,
    token: 'USDT' | 'USDC',
    signer: Signer
  ): Promise<{ shieldTxHash: string; contributionId: string }>
  
  // Check contribution status
  async getContributionStatus(
    projectId: string,
    userAddress: string
  ): Promise<{
    contributed: string
    tokensAllocated: string
    status: 'pending' | 'allocated' | 'refunded'
  }>
  
  // Distribute tokens (project owner only)
  async distributeTokens(
    projectId: string,
    projectSigner: Signer
  ): Promise<{ distributionTxHash: string }>
}
```

### API Routes

**File:** `app/api/launchpad/projects/route.ts`
- GET `/api/launchpad/projects` - List all projects
- POST `/api/launchpad/projects` - Create project (admin only)

**File:** `app/api/launchpad/contribute/route.ts`
- POST `/api/launchpad/contribute`
- Body: `{ projectId, amount, token }`
- Returns: Shield transaction details

**File:** `app/api/launchpad/status/route.ts`
- GET `/api/launchpad/status?projectId=xxx&userAddress=0x...`
- Returns: User's contribution status

**File:** `app/api/launchpad/distribute/route.ts`
- POST `/api/launchpad/distribute` (project owner only)
- Triggers token distribution to contributors

### Frontend Components

**File:** `app/trading/launchpad/page.tsx`
- Main launchpad page
- Grid of project cards
- Filter by status (upcoming, active, completed)

**File:** `components/trading/launchpad-project-card.tsx`
- Project card with:
  - Token name, symbol, logo
  - Price, allocation, raised amount
  - Progress bar
  - "Contribute" button

**File:** `components/trading/launchpad-contribute-dialog.tsx`
- Contribution dialog
- Amount input
- Token selector (USDT/USDC)
- Privacy notice: "Your contribution will be private"
- Shield transaction flow

**File:** `components/trading/launchpad-project-detail.tsx`
- Detailed project page
- Project description, team, roadmap
- Contribution form
- Contributors list (anonymous, just counts)

### Database Schema

**Table: `launchpad_projects`**
```sql
CREATE TABLE launchpad_projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  description TEXT,
  token_address VARCHAR(42),
  price_per_token DECIMAL(36, 18),
  total_supply VARCHAR(78),
  allocation VARCHAR(78),
  start_time BIGINT,
  end_time BIGINT,
  min_contribution VARCHAR(78),
  max_contribution VARCHAR(78),
  status VARCHAR(20),
  raised_amount VARCHAR(78) DEFAULT '0',
  contributors_count INT DEFAULT 0,
  privacy_pool_address VARCHAR(42),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `launchpad_contributions`**
```sql
CREATE TABLE launchpad_contributions (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES launchpad_projects(id),
  user_address VARCHAR(42) NOT NULL,
  incognito_address VARCHAR(42), -- For token distribution
  amount VARCHAR(78),
  token VARCHAR(10), -- 'USDT' or 'USDC'
  shield_tx_hash VARCHAR(66),
  tokens_allocated VARCHAR(78),
  distribution_tx_hash VARCHAR(66),
  status VARCHAR(20), -- 'pending', 'allocated', 'refunded'
  created_at TIMESTAMP DEFAULT NOW()
);
```

## User Flow

1. User navigates to `/trading/launchpad`
2. Sees list of upcoming/active projects
3. Clicks on project → detailed page
4. Clicks "Contribute" → contribution dialog
5. Enters amount, selects token (USDT/USDC)
6. Approves shield transaction (tokens go to privacy pool)
7. Receives confirmation: "Contribution received. You'll receive tokens at launch."
8. When project reaches target, tokens are distributed to incognito wallets
9. User can trade tokens from incognito wallet (private)

## Success Criteria

- Launchpad page loads in < 2 seconds
- Contribution flow completes in < 3 minutes
- Support for 10+ concurrent projects
- 80%+ contribution success rate
- Zero privacy leaks (contributions remain private)

## Success Metrics

- 10x increase in daily active users within 3 months
- $1M+ daily trading volume within 6 months
- 50%+ of trades using privacy features
- 30%+ user retention rate (monthly active users)
- Launchpad fees: $10k+ per month within 6 months
