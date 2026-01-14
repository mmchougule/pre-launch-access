'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ContributionStatus {
  projectId: string
  projectName: string
  contributed: string
  tokensAllocated: string
  status: 'pending' | 'allocated' | 'refunded'
}

export default function ContributionStatusPage() {
  const router = useRouter()
  const [userAddress, setUserAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contributions, setContributions] = useState<ContributionStatus[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      setError('Invalid Ethereum address')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/launchpad/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const { projects } = await response.json()

      const statusPromises = projects.map(async (project: any) => {
        const statusResponse = await fetch(
          `/api/launchpad/status?projectId=${project.id}&userAddress=${userAddress}`
        )
        if (statusResponse.ok) {
          const { status } = await statusResponse.json()
          if (parseFloat(status.contributed) > 0) {
            return {
              projectId: project.id,
              projectName: project.name,
              contributed: status.contributed,
              tokensAllocated: status.tokensAllocated,
              status: status.status,
            }
          }
        }
        return null
      })

      const results = await Promise.all(statusPromises)
      const validContributions = results.filter(r => r !== null) as ContributionStatus[]
      setContributions(validContributions)

      if (validContributions.length === 0) {
        setError('No contributions found for this address')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'badge badge-warning',
      allocated: 'badge badge-success',
      refunded: 'badge badge-default',
    }
    return badges[status as keyof typeof badges] || 'badge'
  }

  return (
    <div className="container">
      <button
        className="btn btn-secondary"
        onClick={() => router.push('/trading/launchpad')}
        style={{ marginBottom: '20px' }}
      >
        ← Back to Launchpad
      </button>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          Contribution Status
        </h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Check your contribution status and allocated tokens
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
              Wallet Address
            </label>
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="0x..."
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              marginBottom: '16px',
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#c00' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </form>
      </div>

      {contributions.length > 0 && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
            Your Contributions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {contributions.map((contribution) => (
              <div key={contribution.projectId} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                    {contribution.projectName}
                  </h3>
                  <span className={getStatusBadge(contribution.status)}>
                    {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                      Contributed
                    </p>
                    <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                      ${parseFloat(contribution.contributed).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                      Tokens Allocated
                    </p>
                    <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                      {parseFloat(contribution.tokensAllocated).toLocaleString()}
                    </p>
                  </div>
                </div>

                {contribution.status === 'pending' && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '12px', marginBottom: 0 }}>
                    Tokens will be distributed when the project reaches its funding goal.
                  </p>
                )}

                {contribution.status === 'allocated' && (
                  <p style={{ fontSize: '12px', color: '#00b341', marginTop: '12px', marginBottom: 0 }}>
                    Tokens have been distributed to your incognito wallet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
