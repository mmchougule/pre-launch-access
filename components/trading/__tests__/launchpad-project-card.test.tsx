import { render, screen, fireEvent } from '@testing-library/react'
import { LaunchpadProjectCard } from '../launchpad-project-card'
import { LaunchpadProject } from '@/lib/types/launchpad'

describe('LaunchpadProjectCard', () => {
  const mockProject: LaunchpadProject = {
    id: 'test-project-1',
    name: 'Test Project',
    symbol: 'TEST',
    description: 'A test project for launchpad',
    pricePerToken: '1.5',
    totalSupply: '1000000',
    allocation: '100000',
    startTime: Date.now(),
    endTime: Date.now() + 86400000,
    minContribution: '100',
    maxContribution: '10000',
    status: 'active',
    raisedAmount: '25000',
    contributors: 10,
    privacyPoolAddress: '0x1234567890123456789012345678901234567890',
  }

  it('should render project details', () => {
    render(<LaunchpadProjectCard project={mockProject} />)

    expect(screen.getByText('Test Project (TEST)')).toBeInTheDocument()
    expect(screen.getByText('A test project for launchpad')).toBeInTheDocument()
    expect(screen.getByText('$1.5')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should display progress correctly', () => {
    render(<LaunchpadProjectCard project={mockProject} />)

    expect(screen.getByText('25.0%')).toBeInTheDocument()
    expect(screen.getByText('$25,000 raised')).toBeInTheDocument()
    expect(screen.getByText('10 contributors')).toBeInTheDocument()
  })

  it('should call onContribute when contribute button is clicked', () => {
    const handleContribute = jest.fn()
    render(<LaunchpadProjectCard project={mockProject} onContribute={handleContribute} />)

    const button = screen.getByRole('button', { name: /contribute/i })
    fireEvent.click(button)

    expect(handleContribute).toHaveBeenCalledWith('test-project-1')
  })

  it('should disable contribute button for non-active projects', () => {
    const upcomingProject = { ...mockProject, status: 'upcoming' as const }
    render(<LaunchpadProjectCard project={upcomingProject} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Not Available')).toBeInTheDocument()
  })

  it('should show correct status badge for upcoming project', () => {
    const upcomingProject = { ...mockProject, status: 'upcoming' as const }
    render(<LaunchpadProjectCard project={upcomingProject} />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('should show correct status badge for completed project', () => {
    const completedProject = { ...mockProject, status: 'completed' as const }
    render(<LaunchpadProjectCard project={completedProject} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('should display allocation correctly', () => {
    render(<LaunchpadProjectCard project={mockProject} />)

    expect(screen.getByText('100,000 TEST')).toBeInTheDocument()
  })

  it('should handle zero raised amount', () => {
    const newProject = { ...mockProject, raisedAmount: '0', contributors: 0 }
    render(<LaunchpadProjectCard project={newProject} />)

    expect(screen.getByText('0.0%')).toBeInTheDocument()
    expect(screen.getByText('$0 raised')).toBeInTheDocument()
    expect(screen.getByText('0 contributors')).toBeInTheDocument()
  })

  it('should handle project without description', () => {
    const noDescProject = { ...mockProject, description: '' }
    render(<LaunchpadProjectCard project={noDescProject} />)

    expect(screen.getByText('Test Project (TEST)')).toBeInTheDocument()
    expect(screen.queryByText('A test project for launchpad')).not.toBeInTheDocument()
  })
})
