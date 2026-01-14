'use client'

import { useState } from 'react'

interface LaunchpadContributeDialogProps {
  projectId: string
  projectName: string
  pricePerToken: string
  minContribution: string
  maxContribution: string
  onClose: () => void
  onSuccess: () => void
}

export function LaunchpadContributeDialog({
  projectId,
  projectName,
  pricePerToken,
  minContribution,
  maxContribution,
  onClose,
  onSuccess,
}: LaunchpadContributeDialogProps) {
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState<'USDT' | 'USDC'>('USDT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tokensToReceive = amount
    ? (parseFloat(amount) / parseFloat(pricePerToken)).toFixed(2)
    : '0'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < parseFloat(minContribution) || amountNum > parseFloat(maxContribution)) {
      setError(`Amount must be between $${minContribution} and $${maxContribution}`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/launchpad/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          amount,
          token,
          privateKey: 'demo-key',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Contribution failed')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            Contribute to {projectName}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#1565c0' }}>
            Your contribution will be private. No one can track your wallet or contribution amount.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
              Contribution Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ${minContribution}, Max: ${maxContribution}`}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              Range: ${minContribution} - ${maxContribution}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
              Token
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{ flex: 1 }}>
                <input
                  type="radio"
                  name="token"
                  value="USDT"
                  checked={token === 'USDT'}
                  onChange={() => setToken('USDT')}
                  style={{ marginRight: '8px' }}
                />
                USDT
              </label>
              <label style={{ flex: 1 }}>
                <input
                  type="radio"
                  name="token"
                  value="USDC"
                  checked={token === 'USDC'}
                  onChange={() => setToken('USDC')}
                  style={{ marginRight: '8px' }}
                />
                USDC
              </label>
            </div>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Price per token:</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>${pricePerToken}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>You will receive:</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{tokensToReceive} tokens</span>
            </div>
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Contribute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
