import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ethers } from 'ethers'
import { LaunchpadService } from '@/lib/launchpadService'

const launchpadService = new LaunchpadService()

const distributeSchema = z.object({
  projectId: z.string().uuid(),
  privateKey: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = distributeSchema.parse(body)

    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'http://localhost:8545'
    )
    const wallet = new ethers.Wallet(validatedData.privateKey, provider)

    const result = await launchpadService.distributeTokens(
      validatedData.projectId,
      wallet
    )

    return NextResponse.json({
      success: true,
      distributionTxHash: result.distributionTxHash,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Failed to distribute tokens'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
