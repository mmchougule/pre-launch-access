'use client'

import { LaunchpadProject } from '@/lib/types/launchpad'

interface LaunchpadProjectCardProps {
  project: LaunchpadProject
  onContribute?: (projectId: string) => void
}

export function LaunchpadProjectCard({ project, onContribute }: LaunchpadProjectCardProps) {
  const progress = project.allocation !== '0'
    ? (parseFloat(project.raisedAmount) / parseFloat(project.allocation)) * 100
    : 0

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'badge badge-info',
      active: 'badge badge-success',
      completed: 'badge badge-default',
      cancelled: 'badge badge-default',
    }
    return badges[status as keyof typeof badges] || 'badge'
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isContributeDisabled = project.status !== 'active'

  return (
    <div className="card">
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          {project.name} ({project.symbol})
        </h3>
        <span className={getStatusBadge(project.status)}>
          {getStatusLabel(project.status)}
        </span>
      </div>

      {project.description && (
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '16px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {project.description}
        </p>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Price per token:</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>${project.pricePerToken}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Allocation:</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {parseFloat(project.allocation).toLocaleString()} {project.symbol}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Period:</span>
          <span style={{ fontSize: '14px' }}>
            {formatDate(project.startTime)} - {formatDate(project.endTime)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>Progress</span>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            ${parseFloat(project.raisedAmount).toLocaleString()} raised
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {project.contributors} contributors
          </span>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={() => onContribute?.(project.id)}
        disabled={isContributeDisabled}
      >
        {project.status === 'active' ? 'Contribute' : 'Not Available'}
      </button>
    </div>
  )
}
