import type { LaunchpadProject, LaunchpadContribution } from '../launchpad'

describe('Launchpad Types', () => {
  it('should define LaunchpadProject interface', () => {
    const project: LaunchpadProject = {
      id: '123',
      name: 'Test Project',
      symbol: 'TEST',
      description: 'Test Description',
      pricePerToken: '1.0',
      totalSupply: '1000000',
      allocation: '100000',
      startTime: Date.now(),
      endTime: Date.now() + 86400000,
      minContribution: '100',
      maxContribution: '10000',
      status: 'upcoming',
      raisedAmount: '0',
      contributors: 0,
      privacyPoolAddress: '0x1234567890123456789012345678901234567890',
    }

    expect(project.id).toBe('123')
    expect(project.name).toBe('Test Project')
    expect(project.status).toBe('upcoming')
  })

  it('should define LaunchpadContribution interface', () => {
    const contribution: LaunchpadContribution = {
      id: '456',
      projectId: '123',
      userAddress: '0x1234567890123456789012345678901234567890',
      amount: '1000',
      token: 'USDT',
      tokensAllocated: '1000',
      status: 'pending',
    }

    expect(contribution.id).toBe('456')
    expect(contribution.projectId).toBe('123')
    expect(contribution.status).toBe('pending')
  })
})
