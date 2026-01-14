import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ethers } from 'ethers'
import { LaunchpadService } from '@/lib/launchpadService'

const launchpadService = new LaunchpadService()

const contributeSchema = z.object({
  projectId: z.string().uuid(),
  amount: z.string(),
  token: z.enum(['USDT', 'USDC']),
  privateKey: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = contributeSchema.parse(body)

    if (!validatedData.privateKey) {
      return NextResponse.json(
        { error: 'Private key required for signing transaction' },
        { status: 400 }
      )
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'http://localhost:8545'
    )
    const wallet = new ethers.Wallet(validatedData.privateKey, provider)

    const result = await launchpadService.contribute(
      validatedData.projectId,
      validatedData.amount,
      validatedData.token,
      wallet
    )

    return NextResponse.json({
      success: true,
      shieldTxHash: result.shieldTxHash,
      contributionId: result.contributionId,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Failed to process contribution'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
