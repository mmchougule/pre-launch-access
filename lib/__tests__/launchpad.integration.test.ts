import { LaunchpadService } from '../launchpadService'
import * as db from '../db'

jest.mock('../db')

const mockQuery = db.query as jest.MockedFunction<typeof db.query>

describe('Launchpad Integration Tests', () => {
  let service: LaunchpadService
  let mockSigner: any

  beforeEach(() => {
    service = new LaunchpadService('0x1234567890123456789012345678901234567890')
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0xUserAddress'),
      sendTransaction: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({
          hash: '0xtxhash123',
        }),
      }),
    }
    jest.clearAllMocks()
  })

  describe('Complete contribution flow', () => {
    it('should handle end-to-end contribution process', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        symbol: 'TEST',
        description: 'Integration test project',
        pricePerToken: '2.0',
        totalSupply: '1000000',
        allocation: '100000',
        startTime: Date.now() - 1000,
        endTime: Date.now() + 86400000,
        minContribution: '100',
        maxContribution: '10000',
        status: 'active',
        raisedAmount: '0',
        contributors: 0,
        privacyPoolAddress: '0xpool',
      }

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            ...mockProject,
            startTime: mockProject.startTime.toString(),
            endTime: mockProject.endTime.toString()
          }]
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      const result = await service.contribute(
        mockProject.id,
        '1000',
        'USDT',
        mockSigner
      )

      expect(result.shieldTxHash).toBe('0xtxhash123')
      expect(result.contributionId).toBeDefined()

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO launchpad_contributions'),
        expect.arrayContaining([
          expect.any(String),
          mockProject.id,
          '0xUserAddress',
          '1000',
          'USDT',
          '0xtxhash123',
          expect.any(String),
          'pending',
        ])
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE launchpad_projects'),
        expect.arrayContaining(['1000', mockProject.id])
      )
    })
  })

  describe('Token distribution flow', () => {
    it('should handle end-to-end distribution process', async () => {
      const mockProject = {
        id: 'project-456',
        name: 'Distribution Test',
        symbol: 'DIST',
        description: 'Test distribution',
        tokenAddress: '0xtoken',
        pricePerToken: '1.0',
        totalSupply: '1000000',
        allocation: '100000',
        startTime: Date.now() - 86400000,
        endTime: Date.now() - 1000,
        minContribution: '100',
        maxContribution: '10000',
        status: 'active',
        raisedAmount: '10000',
        contributors: 10,
        privacyPoolAddress: '0xpool',
      }

      const mockContributions = [
        {
          id: 'contrib-1',
          user_address: '0xUser1',
          incognito_address: '0xIncognito1',
          tokens_allocated: '1000',
        },
        {
          id: 'contrib-2',
          user_address: '0xUser2',
          incognito_address: '0xIncognito2',
          tokens_allocated: '2000',
        },
      ]

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            ...mockProject,
            startTime: mockProject.startTime.toString(),
            endTime: mockProject.endTime.toString()
          }]
        } as any)
        .mockResolvedValueOnce({ rows: mockContributions } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      const result = await service.distributeTokens(mockProject.id, mockSigner)

      expect(result.distributionTxHash).toBe('0xtxhash123')

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE launchpad_contributions'),
        expect.arrayContaining(['0xtxhash123', mockProject.id])
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE launchpad_projects'),
        expect.arrayContaining([mockProject.id])
      )
    })
  })

  describe('Error scenarios', () => {
    it('should handle contribution to inactive project', async () => {
      const mockProject = {
        id: 'project-789',
        name: 'Inactive Project',
        symbol: 'INACT',
        description: 'Inactive test',
        pricePerToken: '1.0',
        totalSupply: '1000000',
        allocation: '100000',
        startTime: Date.now() - 1000,
        endTime: Date.now() + 86400000,
        minContribution: '100',
        maxContribution: '10000',
        status: 'completed',
        raisedAmount: '0',
        contributors: 0,
        privacyPoolAddress: '0xpool',
      }

      mockQuery.mockResolvedValue({
        rows: [{
          ...mockProject,
          startTime: mockProject.startTime.toString(),
          endTime: mockProject.endTime.toString()
        }]
      } as any)

      await expect(
        service.contribute(mockProject.id, '1000', 'USDT', mockSigner)
      ).rejects.toThrow('Project is not active')
    })

    it('should handle distribution with no pending contributions', async () => {
      const mockProject = {
        id: 'project-999',
        name: 'No Contributions',
        symbol: 'NONE',
        description: 'No contributions test',
        tokenAddress: '0xtoken',
        pricePerToken: '1.0',
        totalSupply: '1000000',
        allocation: '100000',
        startTime: Date.now() - 86400000,
        endTime: Date.now() - 1000,
        minContribution: '100',
        maxContribution: '10000',
        status: 'active',
        raisedAmount: '0',
        contributors: 0,
        privacyPoolAddress: '0xpool',
      }

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            ...mockProject,
            startTime: mockProject.startTime.toString(),
            endTime: mockProject.endTime.toString()
          }]
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      await expect(
        service.distributeTokens(mockProject.id, mockSigner)
      ).rejects.toThrow('No pending contributions to distribute')
    })
  })

  describe('Multiple projects', () => {
    it('should handle multiple active projects', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          symbol: 'PRJ1',
          description: 'First project',
          pricePerToken: '1.0',
          totalSupply: '1000000',
          allocation: '100000',
          startTime: '1609459200000',
          endTime: '1609545600000',
          minContribution: '100',
          maxContribution: '10000',
          status: 'active',
          raisedAmount: '5000',
          contributors: 5,
          privacyPoolAddress: '0xpool',
        },
        {
          id: '2',
          name: 'Project 2',
          symbol: 'PRJ2',
          description: 'Second project',
          pricePerToken: '2.0',
          totalSupply: '2000000',
          allocation: '200000',
          startTime: '1609459200000',
          endTime: '1609545600000',
          minContribution: '200',
          maxContribution: '20000',
          status: 'upcoming',
          raisedAmount: '0',
          contributors: 0,
          privacyPoolAddress: '0xpool',
        },
      ]

      mockQuery.mockResolvedValue({ rows: mockProjects } as any)

      const projects = await service.getProjects()

      expect(projects).toHaveLength(2)
      expect(projects[0].name).toBe('Project 1')
      expect(projects[1].name).toBe('Project 2')
      expect(projects[0].status).toBe('active')
      expect(projects[1].status).toBe('upcoming')
    })
  })
})
