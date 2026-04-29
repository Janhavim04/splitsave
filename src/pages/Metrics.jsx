import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { server } from '../utils/stellar'

// ── Helpers ──────────────────────────────────────────────────────

const DAY_MS = 86400000

const getDayKey = (iso) => iso?.slice(0, 10) ?? ''

const last7Days = () => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const shortDate = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

// ── Mini sparkline SVG ────────────────────────────────────────────
function Sparkline({ data, color = '#00D4FF', height = 40, width = 120 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (v / max) * height
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#sg-${color.replace('#','')})`}
      />
    </svg>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────
function BarChart({ data, labels, color = '#00D4FF', height = 80 }) {
  const max = Math.max(...data, 1)
  return (
    <div className="metrics-bar-chart">
      {data.map((v, i) => (
        <div key={i} className="metrics-bar-col">
          <div
            className="metrics-bar-fill"
            style={{
              height: `${Math.max(4, (v / max) * height)}px`,
              background: v > 0 ? color : 'rgba(255,255,255,0.06)',
            }}
          />
          <div className="metrics-bar-label">{labels[i]?.slice(5)}</div>
        </div>
      ))}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, sparkData, color = '#00D4FF', delay = 0 }) {
  const [displayed, setDisplayed] = useState(0)
  const target = typeof value === 'number' ? value : 0

  useEffect(() => {
    let start = null
    const duration = 900
    const animate = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    const timer = setTimeout(() => requestAnimationFrame(animate), delay)
    return () => clearTimeout(timer)
  }, [target, delay])

  return (
    <div className="metrics-stat-card" style={{ '--accent': color, animationDelay: `${delay}ms` }}>
      <div className="metrics-stat-top">
        <div>
          <div className="metrics-stat-label">{label}</div>
          <div className="metrics-stat-value" style={{ color }}>
            {typeof value === 'number' ? displayed : value}
          </div>
          {sub && <div className="metrics-stat-sub">{sub}</div>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function Metrics() {
  const { groups, goals, activities, walletAddress } = useApp()
  const [txCount, setTxCount] = useState(0)
  const [txLoading, setTxLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const days = last7Days()

  // ── Compute metrics from local state ──

  // DAU proxy: unique days with activity in last 7
  const activeDays = new Set(activities.map(a => getDayKey(a.time))).size

  // Total XLM settled (from settledBy records)
  let totalSettled = 0
  let settlementCount = 0
  groups.forEach(g => {
    g.expenses.forEach(e => {
      e.settledBy?.forEach(s => {
        totalSettled += e.amount / e.splitAmong.length
        settlementCount++
      })
    })
  })

  // Total XLM in savings
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)

  // Total expenses added
  const totalExpenses = groups.reduce((s, g) => s + g.expenses.length, 0)
  const totalExpenseXLM = groups.reduce((s, g) =>
    s + g.expenses.reduce((es, e) => es + e.amount, 0), 0)

  // Active groups (have at least 1 expense)
  const activeGroups = groups.filter(g => g.expenses.length > 0).length

  // Retention proxy: goals with deposits
  const goalsWithDeposits = goals.filter(g => g.deposits.length > 0).length
  const retentionRate = goals.length > 0
    ? Math.round((goalsWithDeposits / goals.length) * 100)
    : 0

  // Activity per day (last 7)
  const activityPerDay = days.map(day =>
    activities.filter(a => getDayKey(a.time) === day).length
  )

  // Expenses per day (last 7)
  const expensesPerDay = days.map(day =>
    groups.reduce((s, g) =>
      s + g.expenses.filter(e => getDayKey(e.date) === day).length, 0)
  )

  // Deposits per day (last 7)
  const depositsPerDay = days.map(day =>
    goals.reduce((s, g) =>
      s + g.deposits.filter(d => getDayKey(d.date) === day).length, 0)
  )

  // ── Fetch on-chain tx count from Horizon ──
  useEffect(() => {
    if (!walletAddress) return
    setTxLoading(true)
    server.transactions()
      .forAccount(walletAddress)
      .limit(200)
      .call()
      .then(res => {
        setTxCount(res.records.length)
        setTxLoading(false)
      })
      .catch(() => setTxLoading(false))
  }, [walletAddress])

  const refresh = () => {
    setLastRefresh(new Date())
    if (!walletAddress) return
    setTxLoading(true)
    server.transactions()
      .forAccount(walletAddress)
      .limit(200)
      .call()
      .then(res => { setTxCount(res.records.length); setTxLoading(false) })
      .catch(() => setTxLoading(false))
  }

  // ── Completion % for Level 6 ──
  const userCount = 6 // update this as you onboard users
  const l6Items = [
    { label: '30+ users',         done: userCount >= 30 },
    { label: 'Metrics dashboard', done: true },
    { label: 'Advanced feature',  done: true },
    { label: 'Security checklist',done: false },
    { label: 'Monitoring active', done: false },
    { label: 'Data indexing',     done: false },
    { label: 'Community post',    done: false },
    { label: '15+ commits',       done: false },
  ]
  const l6Done = l6Items.filter(i => i.done).length

  return (
    <div className="page metrics-page">

      {/* Header */}
      <div className="metrics-header">
        <div>
          <h1 className="page-title metrics-title">📊 Metrics</h1>
          <p className="page-subtitle">
            Live dashboard · Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button className="metrics-refresh-btn" onClick={refresh}>
          ↻ Refresh
        </button>
      </div>

      {/* Level 6 Progress
      <div className="metrics-l6-card">
        <div className="metrics-l6-header">
          <span className="metrics-l6-title">Level 6 Progress</span>
          <span className="metrics-l6-fraction">{l6Done}/{l6Items.length}</span>
        </div>
        <div className="metrics-l6-bar-wrap">
          <div
            className="metrics-l6-bar-fill"
            style={{ width: `${(l6Done / l6Items.length) * 100}%` }}
          />
        </div>
        <div className="metrics-l6-items">
          {l6Items.map((item, i) => (
            <div key={i} className={`metrics-l6-item ${item.done ? 'l6-done' : 'l6-todo'}`}>
              <span>{item.done ? '✓' : '○'}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div> */}

      {/* Stat Cards */}
      <div className="metrics-stats-grid">
        <StatCard
          label="On-chain Transactions"
          value={txLoading ? '...' : txCount}
          sub="From Horizon API"
          sparkData={activityPerDay}
          color="#00D4FF"
          delay={0}
        />
        <StatCard
          label="Active Days (7d)"
          value={activeDays}
          sub="Days with activity"
          sparkData={activityPerDay}
          color="#7AEEFF"
          delay={100}
        />
        <StatCard
          label="Total Groups"
          value={groups.length}
          sub={`${activeGroups} with expenses`}
          sparkData={expensesPerDay}
          color="#34d399"
          delay={200}
        />
        <StatCard
          label="Settlements"
          value={settlementCount}
          sub={`${totalSettled.toFixed(2)} XLM settled`}
          sparkData={activityPerDay}
          color="#f59e0b"
          delay={300}
        />
        <StatCard
          label="Total Expenses"
          value={totalExpenses}
          sub={`${totalExpenseXLM.toFixed(2)} XLM total`}
          sparkData={expensesPerDay}
          color="#a78bfa"
          delay={400}
        />
        <StatCard
          label="Total Saved"
          value={parseFloat(totalSaved.toFixed(2))}
          sub={`${goals.length} active goals`}
          sparkData={depositsPerDay}
          color="#fb7185"
          delay={500}
        />
      </div>

      {/* Activity Chart */}
      <div className="metrics-chart-card">
        <div className="metrics-chart-title">Activity — Last 7 Days</div>
        <BarChart data={activityPerDay} labels={days} color="#00D4FF" height={80} />
      </div>

      {/* Two column charts */}
      <div className="metrics-charts-row">
        <div className="metrics-chart-card">
          <div className="metrics-chart-title">Expenses Added</div>
          <BarChart data={expensesPerDay} labels={days} color="#a78bfa" height={60} />
        </div>
        <div className="metrics-chart-card">
          <div className="metrics-chart-title">Savings Deposits</div>
          <BarChart data={depositsPerDay} labels={days} color="#34d399" height={60} />
        </div>
      </div>

      {/* Retention */}
      <div className="metrics-retention-card">
        <div className="metrics-chart-title">Retention Signal</div>
        <div className="metrics-retention-row">
          <div className="metrics-retention-stat">
            <div className="metrics-retention-val">{userCount}</div>
            <div className="metrics-retention-label">Total Users</div>
          </div>
          <div className="metrics-retention-stat">
            <div className="metrics-retention-val">{goals.length}</div>
            <div className="metrics-retention-label">Goals Created</div>
          </div>
          <div className="metrics-retention-stat">
            <div className="metrics-retention-val">{goalsWithDeposits}</div>
            <div className="metrics-retention-label">Goals with Deposits</div>
          </div>
          <div className="metrics-retention-stat">
            <div className="metrics-retention-val" style={{ color: '#34d399' }}>
              {retentionRate}%
            </div>
            <div className="metrics-retention-label">Retention Rate</div>
          </div>
        </div>
        <div className="metrics-retention-bar-wrap">
          <div
            className="metrics-retention-bar-fill"
            style={{ width: `${retentionRate}%`, background: '#34d399' }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="metrics-chart-card">
        <div className="metrics-chart-title">Recent Activity Log</div>
        {activities.length === 0 ? (
          <div className="metrics-empty">No activity yet</div>
        ) : (
          <div className="metrics-activity-list">
            {activities.slice(0, 8).map(a => (
              <div key={a.id} className="metrics-activity-row">
                <span className="metrics-activity-dot" />
                <span className="metrics-activity-text">{a.text}</span>
                <span className="metrics-activity-time">
                  {new Date(a.time).toLocaleString('en-IN', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Onboarded Users */}
      <div className="metrics-chart-card">
        <div className="metrics-chart-title">Onboarded Users ({userCount}/30)</div>
        <div className="metrics-l6-bar-wrap" style={{ marginBottom: 12 }}>
          <div
            className="metrics-l6-bar-fill"
            style={{ width: `${Math.min(100, (userCount / 30) * 100)}%`, background: '#00D4FF' }}
          />
        </div>
        <div className="metrics-users-table">
          {[
            { name: 'Janhavi lipare',         address: 'GBLUMAX4IIPS54AIGD5WXRRAXISG4HLV3BE3YR3SQAD3GZSXRTVJY5GI' },
            { name: 'Nayan Palande',           address: 'GB23T7JFBYK7URKZCRL5ZUYPA5W7JNJ5WYIGLJNWI6Y3YAFPYHJ65UPR' },
            { name: 'Poorva Mulimani',         address: 'GBNOBRJ73DRVVHE4MJPDRIOVP3MZ7BHOO2ISZDMPJWDNHPCPVRZLRILT' },
            { name: 'Jadhav Vaibhavi Ajay',   address: 'GDBIJAOFPMGQWDUUQTJ3YFHI44MWHQHPALJQG7ZDA7D5WWEDKJYA4OHA' },
            { name: 'Aditi Mhaske',            address: 'GAWOCI3JKKRFYYUJGOR7I3LZM6BMFCLUBN3EXBNLRISO6XWW3YDSTHDU' },
            { name: 'Gayatri Deshmukh',        address: 'GBQQRG45YXIOLM7UR2W7DN2XP7SZVIDY4D5NWCUMRX7CEXJVVFGU26PB' },
          ].map((u, i) => (
            <div key={i} className="metrics-user-row">
              <span className="metrics-user-num">{i + 1}</span>
              <span className="metrics-user-name">{u.name}</span>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${u.address}`}
                target="_blank"
                rel="noreferrer"
                className="metrics-user-addr"
              >
                {u.address.slice(0, 8)}...{u.address.slice(-4)} ↗
              </a>
            </div>
          ))}
          {Array.from({ length: 30 - userCount }).map((_, i) => (
            <div key={`empty-${i}`} className="metrics-user-row metrics-user-empty">
              <span className="metrics-user-num">{userCount + i + 1}</span>
              <span className="metrics-user-name">— pending onboarding</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
