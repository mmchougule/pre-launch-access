import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LaunchpadService } from '@/lib/launchpadService'

const launchpadService = new LaunchpadService()

export async function GET() {
  try {
    const projects = await launchpadService.getProjects()
    return NextResponse.json({ projects })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  symbol: z.string().min(1).max(50),
  description: z.string().optional(),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  pricePerToken: z.string(),
  totalSupply: z.string(),
  allocation: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  minContribution: z.string(),
  maxContribution: z.string(),
  privacyPoolAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    const { query } = await import('@/lib/db')
    const { v4: uuidv4 } = await import('uuid')

    const projectId = uuidv4()

    await query(
      `INSERT INTO launchpad_projects
        (id, name, symbol, description, token_address, price_per_token, total_supply,
         allocation, start_time, end_time, min_contribution, max_contribution,
         status, privacy_pool_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        projectId,
        validatedData.name,
        validatedData.symbol,
        validatedData.description || null,
        validatedData.tokenAddress || null,
        validatedData.pricePerToken,
        validatedData.totalSupply,
        validatedData.allocation,
        validatedData.startTime,
        validatedData.endTime,
        validatedData.minContribution,
        validatedData.maxContribution,
        'upcoming',
        validatedData.privacyPoolAddress,
      ]
    )

    const project = await launchpadService.getProject(projectId)

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Failed to create project'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
