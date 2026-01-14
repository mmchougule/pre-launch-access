import { ethers } from 'ethers'
import { LaunchpadService } from '../launchpadService'
import * as db from '../db'

jest.mock('../db')

const mockQuery = db.query as jest.MockedFunction<typeof db.query>

describe('LaunchpadService', () => {
  let service: LaunchpadService
  let mockSigner: any

  beforeEach(() => {
    service = new LaunchpadService('0x1234567890123456789012345678901234567890')
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0xUserAddress'),
      sendTransaction: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({
          hash: '0xtxhash',
        }),
      }),
    }
    jest.clearAllMocks()
  })

  describe('getProjects', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          symbol: 'PRJ1',
          description: 'Test project',
          tokenAddress: null,
          pricePerToken: '1.0',
          totalSupply: '1000000',
          allocation: '100000',
          startTime: '1609459200000',
          endTime: '1609545600000',
          minContribution: '100',
          maxContribution: '10000',
          status: 'active',
          raisedAmount: '0',
          contributors: 0,
          privacyPoolAddress: '0xpool',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockQuery.mockResolvedValue({ rows: mockProjects } as any)

      const projects = await service.getProjects()

      expect(projects).toHaveLength(1)
      expect(projects[0].name).toBe('Project 1')
      expect(projects[0].startTime).toBe(1609459200000)
    })

    it('should return empty array when no projects', async () => {
      mockQuery.mockResolvedValue({ rows: [] } as any)

      const projects = await service.getProjects()

      expect(projects).toEqual([])
    })
  })

  describe('getProject', () => {
    it('should return a single project by id', async () => {
      const mockProject = {
        id: '1',
        name: 'Project 1',
        symbol: 'PRJ1',
        description: 'Test project',
        tokenAddress: null,
        pricePerToken: '1.0',
        totalSupply: '1000000',
        allocation: '100000',
        startTime: '1609459200000',
        endTime: '1609545600000',
        minContribution: '100',
        maxContribution: '10000',
        status: 'active',
        raisedAmount: '0',
        contributors: 0,
        privacyPoolAddress: '0xpool',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockQuery.mockResolvedValue({ rows: [mockProject] } as any)

      const project = await service.getProject('1')

      expect(project.name).toBe('Project 1')
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['1'])
    })

    it('should throw error when project not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] } as any)

      await expect(service.getProject('999')).rejects.toThrow('Project not found')
    })
  })

  describe('contribute', () => {
    const mockProject = {
      id: '1',
      name: 'Project 1',
      symbol: 'PRJ1',
      description: 'Test project',
      tokenAddress: null,
      pricePerToken: '1.0',
      totalSupply: '1000000',
      allocation: '100000',
      startTime: Date.now() - 1000,
      endTime: Date.now() + 86400000,
      minContribution: '100',
      maxContribution: '10000',
      status: 'active' as const,
      raisedAmount: '0',
      contributors: 0,
      privacyPoolAddress: '0xpool',
    }

    beforeEach(() => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ ...mockProject, startTime: mockProject.startTime.toString(), endTime: mockProject.endTime.toString() }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
    })

    it('should create a contribution', async () => {
      const result = await service.contribute('1', '1000', 'USDT', mockSigner)

      expect(result).toHaveProperty('shieldTxHash')
      expect(result).toHaveProperty('contributionId')
      expect(result.shieldTxHash).toBe('0xtxhash')
      expect(mockSigner.sendTransaction).toHaveBeenCalled()
    })

    it('should throw error if project is not active', async () => {
      mockQuery.mockReset()
      mockQuery.mockResolvedValue({
        rows: [{
          ...mockProject,
          status: 'completed',
          startTime: mockProject.startTime.toString(),
          endTime: mockProject.endTime.toString()
        }]
      } as any)

      await expect(
        service.contribute('1', '1000', 'USDT', mockSigner)
      ).rejects.toThrow('Project is not active')
    })

    it('should throw error if contribution is below minimum', async () => {
      await expect(
        service.contribute('1', '50', 'USDT', mockSigner)
      ).rejects.toThrow('Contribution amount out of allowed range')
    })

    it('should throw error if contribution is above maximum', async () => {
      mockQuery.mockReset()
      mockQuery.mockResolvedValue({
        rows: [{
          ...mockProject,
          startTime: mockProject.startTime.toString(),
          endTime: mockProject.endTime.toString()
        }]
      } as any)

      await expect(
        service.contribute('1', '20000', 'USDT', mockSigner)
      ).rejects.toThrow('Contribution amount out of allowed range')
    })
  })

  describe('getContributionStatus', () => {
    it('should return contribution status for a user', async () => {
      mockQuery.mockReset()
      mockQuery.mockResolvedValue({
        rows: [
          {
            contributed: '1000',
            tokens_allocated: '1000',
            status: 'pending',
          },
        ],
      } as any)

      const status = await service.getContributionStatus('1', '0xUserAddress')

      expect(status.contributed).toBe('1000')
      expect(status.tokensAllocated).toBe('1000')
      expect(status.status).toBe('pending')
    })

    it('should return default status when no contributions', async () => {
      mockQuery.mockReset()
      mockQuery.mockResolvedValue({ rows: [] } as any)

      const status = await service.getContributionStatus('1', '0xUserAddress')

      expect(status.contributed).toBe('0')
      expect(status.tokensAllocated).toBe('0')
      expect(status.status).toBe('pending')
    })
  })

  describe('distributeTokens', () => {
    const mockProject = {
      id: '1',
      name: 'Project 1',
      symbol: 'PRJ1',
      description: 'Test project',
      tokenAddress: '0xtoken',
      pricePerToken: '1.0',
      totalSupply: '1000000',
      allocation: '100000',
      startTime: Date.now() - 86400000,
      endTime: Date.now() - 1000,
      minContribution: '100',
      maxContribution: '10000',
      status: 'active' as const,
      raisedAmount: '50000',
      contributors: 5,
      privacyPoolAddress: '0xpool',
    }

    it('should distribute tokens to contributors', async () => {
      mockQuery.mockReset()
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            ...mockProject,
            startTime: mockProject.startTime.toString(),
            endTime: mockProject.endTime.toString()
          }]
        } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'contrib1',
              user_address: '0xUser1',
              incognito_address: '0xIncognito1',
              tokens_allocated: '1000',
            },
          ],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      const result = await service.distributeTokens('1', mockSigner)

      expect(result).toHaveProperty('distributionTxHash')
      expect(result.distributionTxHash).toBe('0xtxhash')
      expect(mockSigner.sendTransaction).toHaveBeenCalled()
    })

    it('should throw error when no pending contributions', async () => {
      mockQuery.mockReset()
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
        service.distributeTokens('1', mockSigner)
      ).rejects.toThrow('No pending contributions to distribute')
    })
  })

  describe('error handling', () => {
    it('should handle shield transaction failure', async () => {
      const mockProject = {
        id: '1',
        name: 'Project 1',
        symbol: 'PRJ1',
        description: 'Test project',
        tokenAddress: null,
        pricePerToken: '1.0',
        totalSupply: '1000000',
        allocation: '100000',
        startTime: Date.now() - 1000,
        endTime: Date.now() + 86400000,
        minContribution: '100',
        maxContribution: '10000',
        status: 'active' as const,
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

      mockSigner.sendTransaction.mockResolvedValue({
        wait: jest.fn().mockResolvedValue(null),
      })

      await expect(
        service.contribute('1', '1000', 'USDT', mockSigner)
      ).rejects.toThrow('Shield transaction failed')
    })
  })
})
