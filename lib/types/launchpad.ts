export interface LaunchpadProject {
  id: string
  name: string
  symbol: string
  description: string
  tokenAddress?: string
  pricePerToken: string
  totalSupply: string
  allocation: string
  startTime: number
  endTime: number
  minContribution: string
  maxContribution: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  raisedAmount: string
  contributors: number
  privacyPoolAddress: string
  createdAt?: Date
  updatedAt?: Date
}

export interface LaunchpadContribution {
  id: string
  projectId: string
  userAddress: string
  incognitoAddress?: string
  amount: string
  token: 'USDT' | 'USDC'
  shieldTxHash?: string
  tokensAllocated: string
  distributionTxHash?: string
  status: 'pending' | 'allocated' | 'refunded'
  createdAt?: Date
}

export interface ContributionStatus {
  contributed: string
  tokensAllocated: string
  status: 'pending' | 'allocated' | 'refunded'
}

export interface ContributeResponse {
  shieldTxHash: string
  contributionId: string
}

export interface DistributeResponse {
  distributionTxHash: string
}
