// ── SplitSave Data Indexer ────────────────────────────────────────
// src/utils/indexer.js
//
// Indexes on-chain Stellar transactions for SplitSave users.
// Uses Horizon API as the data source and localStorage as the index.
//
// What it indexes:
//   - All payments to/from a wallet address
//   - Filters SplitSave-related txs by memo prefix
//   - Stores indexed data for fast querying without re-fetching
//
// Endpoint: Horizon testnet — https://horizon-testnet.stellar.org

import { server } from './stellar'
import { monitor } from './monitoring'

const INDEX_KEY   = 'splitsave_tx_index'
const INDEX_META  = 'splitsave_index_meta'
const MAX_INDEXED = 500

const parseTx = (record) => ({
  hash:           record.hash,
  ledger:         record.ledger,
  createdAt:      record.created_at,
  memo:           record.memo || '',
  feeCharged:     record.fee_charged,
  successful:     record.successful,
  operationCount: record.operation_count,
  sourceAccount:  record.source_account,
  isSplitSave:    (record.memo || '').toLowerCase().includes('splitsave'),
})

export const buildIndex = async (walletAddress, onProgress = null) => {
  if (!walletAddress) return { indexed: 0, error: 'No wallet address' }

  monitor.info('Index build started', { wallet: walletAddress.slice(0, 8) })
  const startTime = Date.now()

  try {
    const response = await server
      .transactions()
      .forAccount(walletAddress)
      .limit(200)
      .order('desc')
      .call()

    const records = response.records || []
    if (onProgress) onProgress(50)

    const indexed = records.map(parseTx)

    let payments = []
    try {
      const payResponse = await server
        .payments()
        .forAccount(walletAddress)
        .limit(200)
        .order('desc')
        .call()
      payments = payResponse.records || []
    } catch {}

    if (onProgress) onProgress(80)

    const paymentMap = {}
    payments.forEach(p => {
      if (p.transaction_hash) {
        paymentMap[p.transaction_hash] = {
          type:   p.type,
          amount: p.amount,
          asset:  p.asset_type === 'native' ? 'XLM' : p.asset_code,
          from:   p.from,
          to:     p.to,
        }
      }
    })

    const enriched = indexed.map(tx => ({
      ...tx,
      payment: paymentMap[tx.hash] || null,
    }))

    const meta = {
      walletAddress,
      lastIndexed:    new Date().toISOString(),
      totalIndexed:   enriched.length,
      splitsaveCount: enriched.filter(t => t.isSplitSave).length,
      durationMs:     Date.now() - startTime,
    }

    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify(enriched.slice(0, MAX_INDEXED)))
      localStorage.setItem(INDEX_META, JSON.stringify(meta))
    } catch {}

    if (onProgress) onProgress(100)
    monitor.info('Index build complete', meta)

    return { indexed: enriched.length, meta, data: enriched }

  } catch (err) {
    monitor.error('Index build failed', { error: err.message })
    return { indexed: 0, error: err.message }
  }
}

export const readIndex = () => {
  try {
    const data = localStorage.getItem(INDEX_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

export const readIndexMeta = () => {
  try {
    const meta = localStorage.getItem(INDEX_META)
    return meta ? JSON.parse(meta) : null
  } catch { return null }
}

export const querySplitSaveTxs = () => readIndex().filter(tx => tx.isSplitSave)

export const queryByDateRange = (from, to) =>
  readIndex().filter(tx => {
    const d = new Date(tx.createdAt)
    return d >= new Date(from) && d <= new Date(to)
  })

export const queryByAddress = (address) =>
  readIndex().filter(tx =>
    tx.sourceAccount === address ||
    tx.payment?.from === address ||
    tx.payment?.to === address
  )

export const getIndexStats = () => {
  const all       = readIndex()
  const splitsave = all.filter(t => t.isSplitSave)
  const payments  = all.filter(t => t.payment)
  const totalXLM  = payments.reduce((s, t) => s + parseFloat(t.payment?.amount || 0), 0)

  return {
    totalTransactions:     all.length,
    splitsaveTransactions: splitsave.length,
    successfulTxs:         all.filter(t => t.successful).length,
    totalPayments:         payments.length,
    totalXLMTransacted:    totalXLM.toFixed(2),
    oldestTx:              all[all.length - 1]?.createdAt || null,
    newestTx:              all[0]?.createdAt || null,
  }
}

export const clearIndex = () => {
  localStorage.removeItem(INDEX_KEY)
  localStorage.removeItem(INDEX_META)
}
