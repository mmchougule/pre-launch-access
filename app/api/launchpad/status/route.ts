import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LaunchpadService } from '@/lib/launchpadService'

const launchpadService = new LaunchpadService()

const statusQuerySchema = z.object({
  projectId: z.string().uuid(),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const userAddress = searchParams.get('userAddress')

    const validatedData = statusQuerySchema.parse({ projectId, userAddress })

    const status = await launchpadService.getContributionStatus(
      validatedData.projectId,
      validatedData.userAddress
    )

    return NextResponse.json({ status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch contribution status'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
