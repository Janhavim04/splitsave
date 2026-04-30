import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import {
  buildIndex, readIndex, readIndexMeta,
  getIndexStats, querySplitSaveTxs, clearIndex
} from '../utils/indexer'

export default function IndexerDashboard() {
  const { walletAddress } = useApp()
  const [stats, setStats]       = useState(null)
  const [meta, setMeta]         = useState(null)
  const [txs, setTxs]           = useState([])
  const [loading, setLoading]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [filter, setFilter]     = useState('all') // all | splitsave

  const refresh = () => {
    setStats(getIndexStats())
    setMeta(readIndexMeta())
    setTxs(readIndex())
  }

  useEffect(() => { refresh() }, [])

  const handleBuild = async () => {
    if (!walletAddress) return alert('Connect your wallet first')
    setLoading(true)
    setProgress(0)
    await buildIndex(walletAddress, setProgress)
    setLoading(false)
    refresh()
  }

  const handleClear = () => {
    clearIndex()
    setStats(null)
    setMeta(null)
    setTxs([])
  }

  const displayed = filter === 'splitsave'
    ? txs.filter(t => t.isSplitSave)
    : txs

  return (
    <div className="indexer-wrap">

      {/* Header row */}
      <div className="indexer-header">
        <div>
          <div className="indexer-title">Transaction Index</div>
          <div className="indexer-sub">
            Data source: Horizon Testnet API ·{' '}
            <a href="https://horizon-testnet.stellar.org" target="_blank" rel="noreferrer" className="indexer-link">
              horizon-testnet.stellar.org ↗
            </a>
          </div>
        </div>
        <div className="indexer-actions">
          <button className="indexer-btn" onClick={handleBuild} disabled={loading}>
            {loading ? `Indexing... ${progress}%` : '⟳ Build Index'}
          </button>
          {txs.length > 0 && (
            <button className="indexer-btn-clear" onClick={handleClear}>Clear</button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {loading && (
        <div className="indexer-progress-wrap">
          <div className="indexer-progress-fill" style={{ width: `${progress}%` }}/>
        </div>
      )}

      {/* Meta info */}
      {meta && (
        <div className="indexer-meta">
          <span>Last indexed: {new Date(meta.lastIndexed).toLocaleString()}</span>
          <span>·</span>
          <span>{meta.totalIndexed} transactions</span>
          <span>·</span>
          <span style={{ color: '#00D4FF' }}>{meta.splitsaveCount} SplitSave txs</span>
          <span>·</span>
          <span style={{ color: '#a78bfa' }}>{meta.durationMs}ms</span>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="indexer-stats">
          <div className="indexer-stat">
            <div className="indexer-stat-val" style={{ color: '#00D4FF' }}>{stats.totalTransactions}</div>
            <div className="indexer-stat-label">Total Indexed</div>
          </div>
          <div className="indexer-stat">
            <div className="indexer-stat-val" style={{ color: '#34d399' }}>{stats.splitsaveTransactions}</div>
            <div className="indexer-stat-label">SplitSave Txs</div>
          </div>
          <div className="indexer-stat">
            <div className="indexer-stat-val" style={{ color: '#f59e0b' }}>{stats.totalPayments}</div>
            <div className="indexer-stat-label">Payments</div>
          </div>
          <div className="indexer-stat">
            <div className="indexer-stat-val" style={{ color: '#fb7185' }}>{stats.totalXLMTransacted}</div>
            <div className="indexer-stat-label">XLM Transacted</div>
          </div>
        </div>
      )}

      {/* Filter */}
      {txs.length > 0 && (
        <div className="indexer-filter-row">
          <button
            className={`indexer-filter-btn ${filter === 'all' ? 'indexer-filter-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({txs.length})
          </button>
          <button
            className={`indexer-filter-btn ${filter === 'splitsave' ? 'indexer-filter-active' : ''}`}
            onClick={() => setFilter('splitsave')}
          >
            SplitSave ({txs.filter(t => t.isSplitSave).length})
          </button>
        </div>
      )}

      {/* Transaction list */}
      {txs.length === 0 ? (
        <div className="indexer-empty">
          {walletAddress
            ? 'Click "Build Index" to index your on-chain transactions'
            : 'Connect your wallet to build an index'}
        </div>
      ) : (
        <div className="indexer-tx-list">
          {displayed.slice(0, 20).map(tx => (
            <div key={tx.hash} className={`indexer-tx-row ${tx.isSplitSave ? 'indexer-tx-splitsave' : ''}`}>
              <div className="indexer-tx-left">
                <div className="indexer-tx-hash">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="indexer-link"
                  >
                    {tx.hash.slice(0, 12)}... ↗
                  </a>
                  {tx.isSplitSave && (
                    <span className="indexer-tag">SplitSave</span>
                  )}
                </div>
                <div className="indexer-tx-meta">
                  {tx.memo && <span className="indexer-memo">"{tx.memo}"</span>}
                  {tx.payment && (
                    <span className="indexer-amount">
                      {tx.payment.amount} {tx.payment.asset}
                    </span>
                  )}
                </div>
              </div>
              <div className="indexer-tx-right">
                <div className={`indexer-tx-status ${tx.successful ? 'status-ok' : 'status-fail'}`}>
                  {tx.successful ? '✓' : '✗'}
                </div>
                <div className="indexer-tx-date">
                  {new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
          {displayed.length > 20 && (
            <div className="indexer-more">+{displayed.length - 20} more transactions indexed</div>
          )}
        </div>
      )}

    </div>
  )
}
