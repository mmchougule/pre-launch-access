'use client'

import { useEffect, useState } from 'react'
import { LaunchpadProject } from '@/lib/types/launchpad'

export default function LaunchpadAdminPage() {
  const [projects, setProjects] = useState<LaunchpadProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [distributingProjectId, setDistributingProjectId] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/launchpad/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      setProjects(data.projects)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDistribute = async (projectId: string) => {
    if (!confirm('Are you sure you want to distribute tokens for this project?')) {
      return
    }

    setDistributingProjectId(projectId)
    setError(null)

    try {
      const response = await fetch('/api/launchpad/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          privateKey: 'demo-admin-key',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Distribution failed')
      }

      alert('Tokens distributed successfully!')
      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDistributingProjectId(null)
    }
  }

  const activeProjects = projects.filter(p => p.status === 'active')
  const completedProjects = projects.filter(p => p.status === 'completed')

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          Launchpad Admin
        </h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Manage projects and distribute tokens
        </p>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '24px',
        }}>
          <p style={{ color: '#c00', margin: 0 }}>Error: {error}</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading projects...</p>
        </div>
      )}

      {!loading && (
        <>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
              Active Projects ({activeProjects.length})
            </h2>

            {activeProjects.length === 0 && (
              <p style={{ color: '#666' }}>No active projects</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeProjects.map((project) => (
                <div key={project.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 600 }}>
                        {project.name} ({project.symbol})
                      </h3>
                      <span className="badge badge-success">Active</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                        Raised Amount
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                        ${parseFloat(project.raisedAmount).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                        Allocation
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                        ${parseFloat(project.allocation).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                        Contributors
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                        {project.contributors}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                        Progress
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                        {((parseFloat(project.raisedAmount) / parseFloat(project.allocation)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => handleDistribute(project.id)}
                    disabled={distributingProjectId === project.id}
                  >
                    {distributingProjectId === project.id ? 'Distributing...' : 'Distribute Tokens'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
              Completed Projects ({completedProjects.length})
            </h2>

            {completedProjects.length === 0 && (
              <p style={{ color: '#666' }}>No completed projects</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {completedProjects.map((project) => (
                <div key={project.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 600 }}>
                        {project.name} ({project.symbol})
                      </h3>
                      <span className="badge badge-default">Completed</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                        Total Raised
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                        ${parseFloat(project.raisedAmount).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>
                        Contributors
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                        {project.contributors}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
