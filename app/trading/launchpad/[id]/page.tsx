'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LaunchpadProject } from '@/lib/types/launchpad'
import { LaunchpadContributeDialog } from '@/components/trading/launchpad-contribute-dialog'

export default function LaunchpadProjectDetail() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<LaunchpadProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContributeDialog, setShowContributeDialog] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string)
    }
  }, [params.id])

  const fetchProject = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/launchpad/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      const data = await response.json()
      const foundProject = data.projects.find((p: LaunchpadProject) => p.id === id)
      if (!foundProject) {
        throw new Error('Project not found')
      }
      setProject(foundProject)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading project...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container">
        <div style={{
          padding: '16px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
        }}>
          <p style={{ color: '#c00', margin: 0 }}>Error: {error || 'Project not found'}</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => router.push('/trading/launchpad')}
          style={{ marginTop: '16px' }}
        >
          Back to Launchpad
        </button>
      </div>
    )
  }

  const progress = project.allocation !== '0'
    ? (parseFloat(project.raisedAmount) / parseFloat(project.allocation)) * 100
    : 0

  return (
    <div className="container">
      <button
        className="btn btn-secondary"
        onClick={() => router.push('/trading/launchpad')}
        style={{ marginBottom: '20px' }}
      >
        ← Back
      </button>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700 }}>
              {project.name} ({project.symbol})
            </h1>
            <span className={`badge badge-${project.status === 'active' ? 'success' : 'info'}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
        </div>

        {project.description && (
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px', lineHeight: 1.6 }}>
            {project.description}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Price per token</p>
            <p style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>${project.pricePerToken}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Total allocation</p>
            <p style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
              {parseFloat(project.allocation).toLocaleString()} {project.symbol}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Raised amount</p>
            <p style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
              ${parseFloat(project.raisedAmount).toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Contributors</p>
            <p style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{project.contributors}</p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Progress</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{progress.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Contribution Range</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Minimum: ${project.minContribution} | Maximum: ${project.maxContribution}
          </p>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0' }}>Privacy Notice</h4>
          <p style={{ fontSize: '14px', color: '#1565c0', margin: 0 }}>
            Your contribution will be shielded through our privacy pool. No one can link your wallet
            to your contribution amount, ensuring complete privacy for early token buyers.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '16px' }}
          onClick={() => setShowContributeDialog(true)}
          disabled={project.status !== 'active'}
        >
          {project.status === 'active' ? 'Contribute Now' : 'Not Available'}
        </button>
      </div>

      {showContributeDialog && (
        <LaunchpadContributeDialog
          projectId={project.id}
          projectName={project.name}
          pricePerToken={project.pricePerToken}
          minContribution={project.minContribution}
          maxContribution={project.maxContribution}
          onClose={() => setShowContributeDialog(false)}
          onSuccess={() => {
            fetchProject(project.id)
          }}
        />
      )}
    </div>
  )
}
