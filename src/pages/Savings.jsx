import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useWallet } from '../hooks/useWallet'

const EMOJI_OPTIONS = ['🎯', '✈️', '📱', '👟', '🎮', '📚', '🏠', '🍕', '💻', '🎸', '🚗', '💍']

export default function Savings() {
  const { walletAddress, goals, createGoal, depositToGoal, deleteGoal } = useApp()
  const { sendPayment, isSending } = useWallet()

  const [view, setView]             = useState('list') // list | create
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [showDeposit, setShowDeposit]   = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [txResult, setTxResult]         = useState(null)
  const [error, setError]               = useState('')

  // ── Create Goal Form ──
  const [goalName, setGoalName]         = useState('')
  const [goalTarget, setGoalTarget]     = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalEmoji, setGoalEmoji]       = useState('🎯')

  // ── Savings wallet address (your own wallet for deposits) ──
  // In a real app this would be a contract — for MVP we send to self to record
  const SAVINGS_ADDRESS = walletAddress


  const handleCreateGoal = () => {
    setError('')
    if (!goalName.trim())              return setError('Goal name is required')
    if (!goalTarget || parseFloat(goalTarget) <= 0) return setError('Enter a valid target amount')

    createGoal(goalName.trim(), goalTarget, goalDeadline, goalEmoji)
    setGoalName('')
    setGoalTarget('')
    setGoalDeadline('')
    setGoalEmoji('🎯')
    setView('list')
  }

  const handleDeposit = async (goal) => {
    setError('')
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return setError('Enter a valid amount')
    }

    // Send XLM to your own wallet as a savings deposit
    // In production this would go to a smart contract
    const result = await sendPayment(
      walletAddress,
      walletAddress, // sending to self to record on chain
      parseFloat(depositAmount).toFixed(7),
      `SplitSave: ${goal.name}`
    )

    if (result.success) {
      depositToGoal(goal.id, depositAmount, result.txHash)
      setTxResult({ success: true, txHash: result.txHash })
      setDepositAmount('')
      setShowDeposit(false)

      // Update selected goal
      setSelectedGoal(prev => ({
        ...prev,
        currentAmount: prev.currentAmount + parseFloat(depositAmount),
      }))
    } else {
      setTxResult({ success: false, error: result.error })
    }
  }

  const getTimeLeft = (deadline) => {
    if (!deadline) return null
    const diff = new Date(deadline) - new Date()
    if (diff <= 0) return 'Deadline passed'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return `${days} days left`
  }


  // ── Render: List ──
  if (view === 'list') {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🐷 Savings Goals</h1>
            <p className="page-subtitle">Save for what matters to you</p>
          </div>
          {walletAddress && (
            <button className="btn-primary" onClick={() => setView('create')}>
              + New Goal
            </button>
          )}
        </div>

        {!walletAddress && (
          <div className="connect-prompt-box">
            Connect your wallet to create savings goals
          </div>
        )}

        {goals.length === 0 && walletAddress && (
          <div className="empty-state">
            <div className="empty-icon">🐷</div>
            <h3>No savings goals yet</h3>
            <p>Set a goal and start saving with XLM on Stellar</p>
            <button className="btn-primary" onClick={() => setView('create')}>
              Create your first goal
            </button>
          </div>
        )}

        <div className="goals-grid">
          {goals.map(goal => {
            const pct      = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            const timeLeft = getTimeLeft(goal.deadline)
            const isComplete = goal.currentAmount >= goal.targetAmount

            return (
              <div
                key={goal.id}
                className={`goal-card ${isComplete ? 'goal-complete' : ''}`}
                onClick={() => { setSelectedGoal(goal); setShowDeposit(false); setTxResult(null) }}
              >
                {isComplete && <div className="complete-banner">🎉 Goal Reached!</div>}

                <div className="goal-card-top">
                  <div className="goal-card-emoji">{goal.emoji}</div>
                  <div className="goal-card-info">
                    <div className="goal-card-name">{goal.name}</div>
                    {timeLeft && (
                      <div className="goal-time-left">{timeLeft}</div>
                    )}
                  </div>
                  <button
                    className="delete-goal-btn"
                    onClick={e => { e.stopPropagation(); deleteGoal(goal.id) }}
                  >
                    ✕
                  </button>
                </div>

                <div className="goal-amounts-row">
                  <span className="goal-current">{goal.currentAmount.toFixed(2)} XLM</span>
                  <span className="goal-separator">/</span>
                  <span className="goal-target">{goal.targetAmount.toFixed(2)} XLM</span>
                </div>

                <div className="progress-bar-wrap">
                  <div
                    className="progress-bar-fill"
                    style={{ width: pct + '%', background: isComplete ? '#34d399' : undefined }}
                  ></div>
                </div>

                <div className="goal-pct-row">
                  <span className="goal-pct-text">{pct}% complete</span>
                  <span className="goal-remaining">
                    {isComplete ? '✓ Done!' : `${(goal.targetAmount - goal.currentAmount).toFixed(2)} XLM to go`}
                  </span>
                </div>

                {goal.deposits.length > 0 && (
                  <div className="goal-deposits-count">
                    {goal.deposits.length} deposit{goal.deposits.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Goal Detail Modal */}
        {selectedGoal && (
          <div className="modal-overlay" onClick={() => setSelectedGoal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">
                  {selectedGoal.emoji} {selectedGoal.name}
                </div>
                <button className="modal-close" onClick={() => setSelectedGoal(null)}>✕</button>
              </div>

              {(() => {
                const liveGoal = goals.find(g => g.id === selectedGoal.id) || selectedGoal
                const pct = Math.min(100, Math.round((liveGoal.currentAmount / liveGoal.targetAmount) * 100))
                const isComplete = liveGoal.currentAmount >= liveGoal.targetAmount

                return (
                  <>
                    <div className="modal-progress">
                      <div className="modal-amounts">
                        <span className="modal-current">{liveGoal.currentAmount.toFixed(2)} XLM</span>
                        <span> of </span>
                        <span className="modal-target">{liveGoal.targetAmount.toFixed(2)} XLM</span>
                      </div>
                      <div className="progress-bar-wrap large">
                        <div className="progress-bar-fill" style={{ width: pct + '%' }}></div>
                      </div>
                      <div className="modal-pct">{pct}% complete</div>
                    </div>

                    {isComplete ? (
                      <div className="goal-complete-msg">
                        🎉 Congratulations! You reached your goal!
                      </div>
                    ) : (
                      <>
                        {!showDeposit ? (
                          <button
                            className="btn-primary btn-full"
                            onClick={() => setShowDeposit(true)}
                          >
                            💰 Deposit XLM
                          </button>
                        ) : (
                          <div className="deposit-form">
                            {error && <div className="error-msg">{error}</div>}
                            <input
                              className="form-input"
                              type="number"
                              placeholder="Amount to deposit (XLM)"
                              value={depositAmount}
                              onChange={e => setDepositAmount(e.target.value)}
                              min="0"
                              step="0.01"
                            />
                            <div className="deposit-actions">
                              <button
                                className="btn-primary"
                                onClick={() => handleDeposit(liveGoal)}
                                disabled={isSending}
                              >
                                {isSending ? (
                                  <><span className="spinner-sm"></span> Sending...</>
                                ) : '⚡ Deposit'}
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => { setShowDeposit(false); setDepositAmount('') }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {txResult && (
                      <div className={`tx-result ${txResult.success ? 'tx-success' : 'tx-error'}`}>
                        {txResult.success ? (
                          <>
                            <div>✅ Deposit recorded on blockchain!</div>
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${txResult.txHash}`}
                              target="_blank" rel="noreferrer" className="tx-link"
                            >
                              View transaction →
                            </a>
                          </>
                        ) : (
                          <div>❌ {txResult.error}</div>
                        )}
                      </div>
                    )}

                    {/* Deposit History */}
                    {liveGoal.deposits.length > 0 && (
                      <div className="deposit-history">
                        <h4 className="deposit-history-title">Deposit History</h4>
                        {liveGoal.deposits.map((dep, i) => (
                          <div key={i} className="deposit-row">
                            <span className="deposit-amount">+{dep.amount.toFixed(2)} XLM</span>
                            <span className="deposit-date">
                              {new Date(dep.date).toLocaleDateString()}
                            </span>
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${dep.txHash}`}
                              target="_blank" rel="noreferrer"
                              className="deposit-tx-link"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    )
  }


  // ── Render: Create Goal ──
  if (view === 'create') {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setView('list')}>← Back</button>
          <h1 className="page-title">New Savings Goal</h1>
        </div>

        <div className="form-card">
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label className="form-label">Choose an emoji</label>
            <div className="emoji-picker">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  className={`emoji-option ${goalEmoji === emoji ? 'emoji-selected' : ''}`}
                  onClick={() => setGoalEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input
              className="form-input"
              placeholder="e.g. Goa Trip, New iPhone..."
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Amount (XLM)</label>
            <input
              className="form-input"
              type="number"
              placeholder="How much do you want to save?"
              value={goalTarget}
              onChange={e => setGoalTarget(e.target.value)}
              min="0"
              step="1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deadline (optional)</label>
            <input
              className="form-input"
              type="date"
              value={goalDeadline}
              onChange={e => setGoalDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button className="btn-primary btn-full" onClick={handleCreateGoal}>
            🐷 Create Savings Goal
          </button>
        </div>
      </div>
    )
  }

  return null
}
