'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LaunchpadProjectCard } from '@/components/trading/launchpad-project-card'
import { LaunchpadProject } from '@/lib/types/launchpad'

export default function LaunchpadPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<LaunchpadProject[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.status === filter)

  const handleContribute = (projectId: string) => {
    router.push(`/trading/launchpad/${projectId}`)
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          Launchpad
        </h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Private, pre-launch token distribution powered by privacy pools
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Projects
          </button>
          <button
            className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading projects...</p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '24px'
        }}>
          <p style={{ color: '#c00', margin: 0 }}>Error: {error}</p>
        </div>
      )}

      {!loading && !error && filteredProjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            {filter === 'all' ? 'No projects available yet' : `No ${filter} projects`}
          </p>
        </div>
      )}

      {!loading && !error && filteredProjects.length > 0 && (
        <div className="grid">
          {filteredProjects.map((project) => (
            <LaunchpadProjectCard
              key={project.id}
              project={project}
              onContribute={handleContribute}
            />
          ))}
        </div>
      )}
    </div>
  )
}
