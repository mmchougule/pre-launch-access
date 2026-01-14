import { ethers, Signer } from 'ethers'
import { v4 as uuidv4 } from 'uuid'
import { query } from './db'
import {
  LaunchpadProject,
  LaunchpadContribution,
  ContributionStatus,
  ContributeResponse,
  DistributeResponse,
} from './types/launchpad'

export class LaunchpadService {
  private privacyPoolAddress: string

  constructor(privacyPoolAddress?: string) {
    this.privacyPoolAddress = privacyPoolAddress || process.env.PRIVACY_POOL_ADDRESS || ''
  }

  async getProjects(): Promise<LaunchpadProject[]> {
    const result = await query<any>(
      `SELECT
        id, name, symbol, description, token_address as "tokenAddress",
        price_per_token as "pricePerToken", total_supply as "totalSupply",
        allocation, start_time as "startTime", end_time as "endTime",
        min_contribution as "minContribution", max_contribution as "maxContribution",
        status, raised_amount as "raisedAmount", contributors_count as contributors,
        privacy_pool_address as "privacyPoolAddress", created_at as "createdAt",
        updated_at as "updatedAt"
      FROM launchpad_projects
      ORDER BY start_time DESC`
    )
    return result.rows.map(row => ({
      ...row,
      startTime: parseInt(row.startTime),
      endTime: parseInt(row.endTime),
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    }))
  }

  async getProject(projectId: string): Promise<LaunchpadProject> {
    const result = await query<any>(
      `SELECT
        id, name, symbol, description, token_address as "tokenAddress",
        price_per_token as "pricePerToken", total_supply as "totalSupply",
        allocation, start_time as "startTime", end_time as "endTime",
        min_contribution as "minContribution", max_contribution as "maxContribution",
        status, raised_amount as "raisedAmount", contributors_count as contributors,
        privacy_pool_address as "privacyPoolAddress", created_at as "createdAt",
        updated_at as "updatedAt"
      FROM launchpad_projects
      WHERE id = $1`,
      [projectId]
    )

    if (result.rows.length === 0) {
      throw new Error('Project not found')
    }

    const row = result.rows[0]
    return {
      ...row,
      startTime: parseInt(row.startTime),
      endTime: parseInt(row.endTime),
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    }
  }

  async contribute(
    projectId: string,
    amount: string,
    token: 'USDT' | 'USDC',
    signer: Signer
  ): Promise<ContributeResponse> {
    const project = await this.getProject(projectId)

    if (project.status !== 'active') {
      throw new Error('Project is not active')
    }

    const now = Date.now()
    if (now < project.startTime || now > project.endTime) {
      throw new Error('Project is not in contribution period')
    }

    const amountBN = ethers.parseUnits(amount, 6)
    const minBN = ethers.parseUnits(project.minContribution, 6)
    const maxBN = ethers.parseUnits(project.maxContribution, 6)

    if (amountBN < minBN || amountBN > maxBN) {
      throw new Error('Contribution amount out of allowed range')
    }

    const userAddress = await signer.getAddress()

    const shieldTxHash = await this.shieldTokens(amount, token, signer)

    const contributionId = uuidv4()
    const tokensAllocated = this.calculateTokensAllocated(amount, project.pricePerToken)

    await query(
      `INSERT INTO launchpad_contributions
        (id, project_id, user_address, amount, token, shield_tx_hash, tokens_allocated, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [contributionId, projectId, userAddress, amount, token, shieldTxHash, tokensAllocated, 'pending']
    )

    await query(
      `UPDATE launchpad_projects
      SET raised_amount = (CAST(raised_amount AS NUMERIC) + $1)::TEXT,
          contributors_count = contributors_count + 1
      WHERE id = $2`,
      [amount, projectId]
    )

    return {
      shieldTxHash,
      contributionId,
    }
  }

  async getContributionStatus(
    projectId: string,
    userAddress: string
  ): Promise<ContributionStatus> {
    const result = await query<any>(
      `SELECT SUM(CAST(amount AS NUMERIC)) as contributed,
              SUM(CAST(tokens_allocated AS NUMERIC)) as tokens_allocated,
              status
       FROM launchpad_contributions
       WHERE project_id = $1 AND user_address = $2
       GROUP BY status`,
      [projectId, userAddress]
    )

    if (result.rows.length === 0) {
      return {
        contributed: '0',
        tokensAllocated: '0',
        status: 'pending',
      }
    }

    const row = result.rows[0]
    return {
      contributed: row.contributed?.toString() || '0',
      tokensAllocated: row.tokens_allocated?.toString() || '0',
      status: row.status,
    }
  }

  async distributeTokens(
    projectId: string,
    projectSigner: Signer
  ): Promise<DistributeResponse> {
    const project = await this.getProject(projectId)

    if (project.status !== 'active' && project.status !== 'completed') {
      throw new Error('Project is not ready for distribution')
    }

    const contributions = await query<any>(
      `SELECT id, user_address, incognito_address, tokens_allocated
       FROM launchpad_contributions
       WHERE project_id = $1 AND status = 'pending'`,
      [projectId]
    )

    if (contributions.rows.length === 0) {
      throw new Error('No pending contributions to distribute')
    }

    const distributionTxHash = await this.executeDistribution(
      project,
      contributions.rows,
      projectSigner
    )

    await query(
      `UPDATE launchpad_contributions
       SET status = 'allocated', distribution_tx_hash = $1
       WHERE project_id = $2 AND status = 'pending'`,
      [distributionTxHash, projectId]
    )

    await query(
      `UPDATE launchpad_projects
       SET status = 'completed'
       WHERE id = $1`,
      [projectId]
    )

    return {
      distributionTxHash,
    }
  }

  private async shieldTokens(
    amount: string,
    token: 'USDT' | 'USDC',
    signer: Signer
  ): Promise<string> {
    const amountBN = ethers.parseUnits(amount, 6)

    const tx = await signer.sendTransaction({
      to: this.privacyPoolAddress,
      value: amountBN,
      data: ethers.id(`shield(${token},${amount})`).slice(0, 10),
    })

    const receipt = await tx.wait()
    if (!receipt) {
      throw new Error('Shield transaction failed')
    }

    return receipt.hash
  }

  private calculateTokensAllocated(amount: string, pricePerToken: string): string {
    const amountBN = ethers.parseUnits(amount, 6)
    const priceBN = ethers.parseUnits(pricePerToken, 6)

    const tokensAllocated = (amountBN * ethers.parseUnits('1', 18)) / priceBN

    return ethers.formatUnits(tokensAllocated, 18)
  }

  private async executeDistribution(
    project: LaunchpadProject,
    contributions: any[],
    projectSigner: Signer
  ): Promise<string> {
    const tx = await projectSigner.sendTransaction({
      to: project.tokenAddress || this.privacyPoolAddress,
      data: ethers.id('distributeTokens()').slice(0, 10),
    })

    const receipt = await tx.wait()
    if (!receipt) {
      throw new Error('Distribution transaction failed')
    }

    return receipt.hash
  }
}
