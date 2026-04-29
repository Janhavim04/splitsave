import { useState, useEffect } from 'react'
import { monitor } from '../utils/monitoring'

const LEVEL_COLOR = {
  INFO:  '#00D4FF',
  WARN:  '#f59e0b',
  ERROR: '#f87171',
  TX:    '#34d399',
  PERF:  '#a78bfa',
}

const LEVEL_BG = {
  INFO:  'rgba(0,212,255,0.07)',
  WARN:  'rgba(245,158,11,0.07)',
  ERROR: 'rgba(248,113,113,0.07)',
  TX:    'rgba(52,211,153,0.07)',
  PERF:  'rgba(167,139,250,0.07)',
}

export default function MonitoringDashboard() {
  const [logs, setLogs]       = useState([])
  const [perf, setPerf]       = useState([])
  const [summary, setSummary] = useState({})
  const [filter, setFilter]   = useState('ALL')

  const refresh = () => {
    setLogs(monitor.getLogs())
    setPerf(monitor.getPerf())
    setSummary(monitor.getSummary())
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000) // auto-refresh every 5s
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.level === filter)

  return (
    <div className="monitoring-wrap">

      {/* Summary Stats */}
      <div className="monitoring-summary">
        <div className="mon-stat">
          <div className="mon-stat-val" style={{ color: '#00D4FF' }}>{summary.total || 0}</div>
          <div className="mon-stat-label">Total Events</div>
        </div>
        <div className="mon-stat">
          <div className="mon-stat-val" style={{ color: '#f87171' }}>{summary.errors || 0}</div>
          <div className="mon-stat-label">Errors</div>
        </div>
        <div className="mon-stat">
          <div className="mon-stat-val" style={{ color: '#f59e0b' }}>{summary.warns || 0}</div>
          <div className="mon-stat-label">Warnings</div>
        </div>
        <div className="mon-stat">
          <div className="mon-stat-val" style={{ color: '#34d399' }}>{summary.txs || 0}</div>
          <div className="mon-stat-label">Transactions</div>
        </div>
        <div className="mon-stat">
          <div className="mon-stat-val" style={{ color: '#a78bfa' }}>
            {summary.avgTxMs ? `${summary.avgTxMs}ms` : '—'}
          </div>
          <div className="mon-stat-label">Avg Tx Time</div>
        </div>
      </div>

      {/* Performance */}
      {perf.length > 0 && (
        <div className="monitoring-section">
          <div className="mon-section-title">⚡ Performance</div>
          <div className="mon-perf-list">
            {perf.slice(0, 5).map((p, i) => (
              <div key={i} className="mon-perf-row">
                <span className="mon-perf-label">{p.label}</span>
                <span className="mon-perf-bar-wrap">
                  <span
                    className="mon-perf-bar-fill"
                    style={{ width: `${Math.min(100, (p.durationMs / 5000) * 100)}%` }}
                  />
                </span>
                <span className="mon-perf-val">{p.durationMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Filter */}
      <div className="mon-filter-row">
        {['ALL', 'ERROR', 'WARN', 'TX', 'INFO', 'PERF'].map(level => (
          <button
            key={level}
            className={`mon-filter-btn ${filter === level ? 'mon-filter-active' : ''}`}
            style={filter === level ? { borderColor: LEVEL_COLOR[level] || '#00D4FF', color: LEVEL_COLOR[level] || '#00D4FF' } : {}}
            onClick={() => setFilter(level)}
          >
            {level}
          </button>
        ))}
        <button className="mon-clear-btn" onClick={() => { monitor.clearLogs(); refresh() }}>
          Clear
        </button>
        <button className="mon-clear-btn" onClick={refresh}>↻</button>
      </div>

      {/* Log Feed */}
      <div className="mon-log-feed">
        {filtered.length === 0 ? (
          <div className="mon-empty">No logs yet — use the app to generate events</div>
        ) : (
          filtered.map(log => (
            <div
              key={log.id}
              className="mon-log-row"
              style={{ background: LEVEL_BG[log.level] || 'transparent' }}
            >
              <span
                className="mon-log-level"
                style={{ color: LEVEL_COLOR[log.level] || '#fff' }}
              >
                {log.level}
              </span>
              <span className="mon-log-msg">{log.message}</span>
              <span className="mon-log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
