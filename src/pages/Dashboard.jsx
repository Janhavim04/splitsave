import { useApp } from '../context/AppContext'
import { useWallet } from '../hooks/useWallet'
import { shortAddress, getFaucetLink } from '../utils/stellar'

function SplitSaveLogo({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 0 24px rgba(0,212,255,0.35))', animation: 'float 4s ease-in-out infinite' }}>
      <defs>
        <linearGradient id="dCyan" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7AEEFF"/>
          <stop offset="100%" stopColor="#00D4FF"/>
        </linearGradient>
        <linearGradient id="dBg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#005580" stopOpacity="0.10"/>
        </linearGradient>
        <clipPath id="dBadge">
          <rect x="0" y="0" width="80" height="80" rx="20"/>
        </clipPath>
      </defs>
      {/* Badge background */}
      <rect x="0" y="0" width="80" height="80" rx="20" fill="url(#dBg)"/>
      <rect x="0" y="0" width="80" height="80" rx="20" fill="none" stroke="#00D4FF" strokeWidth="1.5" opacity="0.45"/>
      {/* Top-right accent dot */}
      <circle cx="66" cy="14" r="4" fill="#00D4FF" opacity="0.7"/>
      {/* S letterform clipped to badge */}
      <g clipPath="url(#dBadge)">
        <text x="16" y="67"
          fontFamily="'Arial Black','Helvetica Neue',sans-serif"
          fontSize="58" fontWeight="900"
          fill="url(#dCyan)">S</text>
      </g>
      {/* Slash kill line then bright line */}
      <line x1="14" y1="72" x2="66" y2="8" stroke="#080B10" strokeWidth="6"/>
      <line x1="14" y1="72" x2="66" y2="8" stroke="url(#dCyan)" strokeWidth="2" strokeLinecap="round"/>
      {/* Slash endpoint dots */}
      <circle cx="66" cy="8"  r="3" fill="#7AEEFF"/>
      <circle cx="14" cy="72" r="3" fill="#00D4FF" opacity="0.6"/>
    </svg>
  )
}

export default function Dashboard({ setCurrentPage }) {
  const {
    walletAddress, walletName, setWalletName,
    balance, groups, goals, activities, computeBalances
  } = useApp()
  const { connectWallet, isConnecting } = useWallet()

  let totalOwed = 0
  let totalOwe  = 0

  groups.forEach(group => {
    const debts = computeBalances(group)
    debts.forEach(debt => {
      if (debt.to === walletAddress)   totalOwed += debt.amount
      if (debt.from === walletAddress) totalOwe  += debt.amount
    })
  })

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)

  if (!walletAddress) {
    return (
      <div className="landing-page">
        <div className="landing-hero">

          <div className="landing-logo-wrap">
            <SplitSaveLogo size={72} />
            <h1 className="landing-title">SplitSave</h1>
          </div>

          <p className="landing-subtitle">
            Smart money management for students.<br />
            Split expenses, settle instantly with XLM, save for goals.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⬡</div>
              <div className="feature-title">Split Expenses</div>
              <div className="feature-desc">Create groups, add expenses, track who owes whom in real time</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-title">Instant Settlement</div>
              <div className="feature-desc">Settle debts in seconds with XLM on the Stellar blockchain</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">◎</div>
              <div className="feature-title">Savings Goals</div>
              <div className="feature-desc">Set goals, track progress with on-chain deposits</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✦</div>
              <div className="feature-title">Transparent</div>
              <div className="feature-desc">Every payment recorded on Stellar blockchain forever</div>
            </div>
          </div>

          <button
            className="connect-btn-large"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <><span className="spinner-sm"></span> Connecting...</>
            ) : (
              '⬡ Connect Wallet to Get Started'
            )}
          </button>

          <p className="testnet-note">
            Running on Stellar Testnet —{' '}
            <a href="https://friendbot.stellar.org" target="_blank" rel="noreferrer">
              get free testnet XLM here
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">

      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h1 className="page-title">
            {walletName ? `Welcome back, ${walletName}` : 'Welcome back'}
          </h1>
          <p className="page-subtitle">{shortAddress(walletAddress)} · {balance} XLM</p>
        </div>
        {!walletName && (
          <input
            className="name-input"
            placeholder="Set your nickname..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                setWalletName(e.target.value)
                localStorage.setItem('splitsave_name', e.target.value)
              }
            }}
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card owe-card">
          <div className="summary-icon">↑</div>
          <div className="summary-amount">{totalOwe.toFixed(2)}</div>
          <div className="summary-label">You Owe · XLM</div>
        </div>
        <div className="summary-card owed-card">
          <div className="summary-icon">↓</div>
          <div className="summary-amount">{totalOwed.toFixed(2)}</div>
          <div className="summary-label">Owed to You · XLM</div>
        </div>
        <div className="summary-card savings-card">
          <div className="summary-icon">◎</div>
          <div className="summary-amount">{totalSaved.toFixed(2)}</div>
          <div className="summary-label">Total Saved · XLM</div>
        </div>
        <div className="summary-card groups-card">
          <div className="summary-icon">⬡</div>
          <div className="summary-amount">{groups.length}</div>
          <div className="summary-label">Active Groups</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-row">
          <button className="action-btn" onClick={() => setCurrentPage('groups')}>
            <span className="action-icon">⬡</span>
            <span>New Group</span>
          </button>
          <button className="action-btn" onClick={() => setCurrentPage('savings')}>
            <span className="action-icon">◎</span>
            <span>New Goal</span>
          </button>
          <a
            href={getFaucetLink(walletAddress)}
            target="_blank"
            rel="noreferrer"
            className="action-btn"
          >
            <span className="action-icon">⬦</span>
            <span>Get XLM</span>
          </a>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${walletAddress}`}
            target="_blank"
            rel="noreferrer"
            className="action-btn"
          >
            <span className="action-icon">↗</span>
            <span>Explorer</span>
          </a>
        </div>
      </div>

      {/* Savings Goals Preview */}
      {goals.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Savings Goals</h2>
            <button className="see-all-btn" onClick={() => setCurrentPage('savings')}>
              See all →
            </button>
          </div>
          <div className="goals-preview">
            {goals.slice(0, 2).map(goal => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              return (
                <div key={goal.id} className="goal-preview-card">
                  <div className="goal-preview-top">
                    <span className="goal-emoji">{goal.emoji}</span>
                    <div>
                      <div className="goal-name">{goal.name}</div>
                      <div className="goal-amounts">
                        {goal.currentAmount.toFixed(2)} / {goal.targetAmount.toFixed(2)} XLM
                      </div>
                    </div>
                    <div className="goal-pct">{pct}%</div>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: pct + '%' }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Groups */}
      {groups.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Groups</h2>
            <button className="see-all-btn" onClick={() => setCurrentPage('groups')}>
              See all →
            </button>
          </div>
          <div className="groups-preview">
            {groups.slice(0, 3).map(group => {
              const debts    = computeBalances(group)
              const myDebt   = debts.find(d => d.from === walletAddress)
              const myCredit = debts.find(d => d.to === walletAddress)
              return (
                <div key={group.id} className="group-preview-card"
                  onClick={() => setCurrentPage('groups')}>
                  <div className="group-preview-name">{group.name}</div>
                  <div className="group-preview-meta">
                    {group.members.length} members · {group.expenses.length} expenses
                  </div>
                  {myDebt && (
                    <div className="group-preview-debt owe-text">
                      You owe {myDebt.amount.toFixed(2)} XLM
                    </div>
                  )}
                  {myCredit && (
                    <div className="group-preview-debt owed-text">
                      Owed {myCredit.amount.toFixed(2)} XLM
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      {activities.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-feed">
            {activities.slice(0, 5).map(activity => (
              <div key={activity.id} className="activity-item">
                <span className="activity-dot">●</span>
                <span className="activity-text">{activity.text}</span>
                <span className="activity-time">
                  {new Date(activity.time).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && goals.length === 0 && (
        <div className="empty-dashboard">
          <div className="empty-icon">✦</div>
          <h3>Get started with SplitSave</h3>
          <p>Create your first group to split expenses with friends</p>
          <div className="empty-actions">
            <button className="btn-primary" onClick={() => setCurrentPage('groups')}>
              ⬡ Create a Group
            </button>
            <button className="btn-secondary" onClick={() => setCurrentPage('savings')}>
              ◎ Set a Savings Goal
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
