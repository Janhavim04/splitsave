// ── SplitSave Monitoring & Logging ───────────────────────────────
// src/utils/monitoring.js
//
// Lightweight monitoring that:
// 1. Catches and logs all JS errors
// 2. Tracks performance (page load, tx time)
// 3. Stores logs in localStorage for the monitoring dashboard
// 4. Optionally sends to a remote endpoint (configurable)

const MAX_LOGS    = 100
const STORAGE_KEY = 'splitsave_logs'
const PERF_KEY    = 'splitsave_perf'

// ── Log levels ────────────────────────────────────────────────────
export const LogLevel = {
  INFO:  'INFO',
  WARN:  'WARN',
  ERROR: 'ERROR',
  TX:    'TX',      // transaction events
  PERF:  'PERF',    // performance events
}

// ── Core logger ───────────────────────────────────────────────────
const writeLog = (level, message, data = {}) => {
  const entry = {
    id:        `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    url:       window.location.href,
  }

  // Console output
  const style = {
    INFO:  'color: #00D4FF',
    WARN:  'color: #f59e0b',
    ERROR: 'color: #f87171',
    TX:    'color: #34d399',
    PERF:  'color: #a78bfa',
  }[level] || ''
  console.log(`%c[SplitSave:${level}] ${message}`, style, data)

  // Persist to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const updated  = [entry, ...existing].slice(0, MAX_LOGS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}

  return entry
}

// ── Public API ────────────────────────────────────────────────────
export const monitor = {
  info:  (msg, data) => writeLog(LogLevel.INFO,  msg, data),
  warn:  (msg, data) => writeLog(LogLevel.WARN,  msg, data),
  error: (msg, data) => writeLog(LogLevel.ERROR, msg, data),

  /** Log a blockchain transaction event */
  tx: (event, data) => writeLog(LogLevel.TX, event, data),

  /** Log a performance measurement in ms */
  perf: (label, durationMs) => {
    writeLog(LogLevel.PERF, label, { durationMs })
    // Also store in perf history for charting
    try {
      const existing = JSON.parse(localStorage.getItem(PERF_KEY) || '[]')
      const updated  = [
        { label, durationMs, timestamp: new Date().toISOString() },
        ...existing
      ].slice(0, 50)
      localStorage.setItem(PERF_KEY, JSON.stringify(updated))
    } catch {}
  },

  /** Time an async operation */
  time: async (label, fn) => {
    const start = performance.now()
    try {
      const result = await fn()
      monitor.perf(label, Math.round(performance.now() - start))
      return result
    } catch (err) {
      monitor.error(`${label} failed`, { error: err.message })
      throw err
    }
  },

  /** Get all stored logs */
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch { return [] }
  },

  /** Get performance history */
  getPerf: () => {
    try {
      return JSON.parse(localStorage.getItem(PERF_KEY) || '[]')
    } catch { return [] }
  },

  /** Clear all logs */
  clearLogs: () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PERF_KEY)
  },

  /** Get summary stats */
  getSummary: () => {
    const logs   = monitor.getLogs()
    const errors = logs.filter(l => l.level === 'ERROR').length
    const warns  = logs.filter(l => l.level === 'WARN').length
    const txs    = logs.filter(l => l.level === 'TX').length
    const perfs  = monitor.getPerf()
    const avgTx  = perfs.filter(p => p.label.includes('tx') || p.label.includes('payment'))
      .reduce((s, p, _, a) => s + p.durationMs / a.length, 0)

    return { total: logs.length, errors, warns, txs, avgTxMs: Math.round(avgTx) }
  }
}

// ── Global error handler ──────────────────────────────────────────
export const initMonitoring = () => {
  // Catch uncaught JS errors
  window.addEventListener('error', (event) => {
    monitor.error('Uncaught error', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      col: event.colno,
    })
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    monitor.error('Unhandled promise rejection', {
      reason: event.reason?.message || String(event.reason),
    })
  })

  // Log app start
  monitor.info('SplitSave initialized', {
    version:   '1.0.0',
    network:   'testnet',
    userAgent: navigator.userAgent.slice(0, 80),
    timestamp: new Date().toISOString(),
  })

  // Log page load performance
  window.addEventListener('load', () => {
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav) {
      monitor.perf('page-load', Math.round(nav.loadEventEnd - nav.startTime))
      monitor.perf('dom-ready', Math.round(nav.domContentLoadedEventEnd - nav.startTime))
    }
  })

  console.log('%c[SplitSave] Monitoring active ✓', 'color: #00D4FF; font-weight: bold')
}
