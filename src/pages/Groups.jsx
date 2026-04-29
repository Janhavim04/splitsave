import { sanitizeInput, rateLimiter } from '../utils/security'
import GaslessBadge from '../components/GaslessBadge'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useWallet } from '../hooks/useWallet'
import { isValidAddress, shortAddress, formatXLM } from '../utils/stellar'

export default function Groups() {
  const {
    walletAddress, groups,
    createGroup, addExpense, settleExpense,
    deleteGroup, computeBalances
  } = useApp()
  const { sendPayment, isSending } = useWallet()

  // ── UI State ──
  const [view, setView]               = useState('list') // list | detail | create
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddMember, setShowAddMember]  = useState(false)
  const [settlingDebt, setSettlingDebt]    = useState(null)
  const [txResult, setTxResult]           = useState(null)

  // ── Create Group Form ──
  const [groupName, setGroupName]     = useState('')
  const [members, setMembers]         = useState([{ address: '', nickname: '' }])

  // ── Add Expense Form ──
  const [expDesc, setExpDesc]         = useState('')
  const [expAmount, setExpAmount]     = useState('')
  const [expPaidBy, setExpPaidBy]     = useState('')
  const [expSplitAmong, setExpSplitAmong] = useState([])

  // ── Errors ──
  const [error, setError] = useState('')


  // ── Handlers ──

  const handleCreateGroup = () => {
    setError('')
    if (!groupName.trim()) return setError('Group name is required')
    const validMembers = members.filter(m => m.address.trim())
    if (validMembers.length === 0) return setError('Add at least one member')

    const invalidAddr = validMembers.find(m => !isValidAddress(m.address.trim()))
    if (invalidAddr) return setError(`Invalid address: ${invalidAddr.address}`)

    // Always include the current wallet as a member
    const allMembers = [
      { address: walletAddress, nickname: 'You' },
      ...validMembers.filter(m => m.address !== walletAddress)
        .map(m => ({ address: m.address.trim(), nickname: m.nickname.trim() || shortAddress(m.address) }))
    ]

    createGroup(sanitizeInput(groupName, 50), allMembers)
    setGroupName('')
    setMembers([{ address: '', nickname: '' }])
    setView('list')
  }

  const handleAddExpense = () => {
    setError('')
    if (!expDesc.trim())   return setError('Description is required')
    if (!expAmount || parseFloat(expAmount) <= 0) return setError('Enter a valid amount')
    if (!expPaidBy)        return setError('Select who paid')
    if (expSplitAmong.length === 0) return setError('Select who to split among')

    addExpense(selectedGroup.id, {
      description: sanitizeInput(expDesc, 100),
      amount:      parseFloat(expAmount),
      paidBy:      expPaidBy,
      splitAmong:  expSplitAmong,
      date:        new Date().toISOString(),
    })

    // Refresh selected group
    setSelectedGroup(prev => ({
      ...prev,
      expenses: [
        {
          id: Date.now().toString(),
          description: expDesc.trim(),
          amount: parseFloat(expAmount),
          paidBy: expPaidBy,
          splitAmong: expSplitAmong,
          date: new Date().toISOString(),
          settledBy: [],
        },
        ...prev.expenses,
      ]
    }))

    setExpDesc('')
    setExpAmount('')
    setExpPaidBy('')
    setExpSplitAmong([])
    setShowAddExpense(false)
  }

  const handleSettle = async (debt) => {
    if (!rateLimiter.check('settle')) return setError('Please wait before settling again')
    setError('')
    setSettlingDebt(debt)
    setTxResult(null)

    const result = await sendPayment(
      walletAddress,
      debt.to,
      debt.amount.toFixed(7),
      'SplitSave settlement'
    )

    if (result.success) {
      // Find the expense to settle
      const group = groups.find(g => g.id === selectedGroup.id)
      if (group) {
        group.expenses.forEach(expense => {
          if (
            expense.splitAmong.includes(walletAddress) &&
            expense.paidBy === debt.to &&
            !expense.settledBy.find(s => s.address === walletAddress)
          ) {
            settleExpense(selectedGroup.id, expense.id, walletAddress, result.txHash)
          }
        })
      }
      setTxResult({ success: true, txHash: result.txHash })
    } else {
      setTxResult({ success: false, error: result.error })
    }
    setSettlingDebt(null)
  }

  const openGroup = (group) => {
    setSelectedGroup(group)
    setView('detail')
    setTxResult(null)
    setError('')
    // Pre-select all members for split
    setExpSplitAmong(group.members.map(m => m.address))
    setExpPaidBy(walletAddress)
  }

  const getMemberName = (group, address) => {
    const member = group.members.find(m => m.address === address)
    return member?.nickname || shortAddress(address)
  }


  // ── Render: Group List ──
  if (view === 'list') {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">👥 Groups</h1>
            <p className="page-subtitle">Split expenses with friends</p>
          </div>
          {walletAddress && (
            <button className="btn-primary" onClick={() => setView('create')}>
              + New Group
            </button>
          )}
        </div>

        {!walletAddress && (
          <div className="connect-prompt-box">
            Connect your wallet to create and manage groups
          </div>
        )}

        {groups.length === 0 && walletAddress && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No groups yet</h3>
            <p>Create a group to start splitting expenses with friends</p>
            <button className="btn-primary" onClick={() => setView('create')}>
              Create your first group
            </button>
          </div>
        )}

        <div className="groups-list">
          {groups.map(group => {
            const debts   = computeBalances(group)
            const myDebt  = debts.filter(d => d.from === walletAddress)
            const myCredit = debts.filter(d => d.to === walletAddress)
            const totalOwe  = myDebt.reduce((s, d) => s + d.amount, 0)
            const totalOwed = myCredit.reduce((s, d) => s + d.amount, 0)

            return (
              <div key={group.id} className="group-card" onClick={() => openGroup(group)}>
                <div className="group-card-header">
                  <div className="group-avatar">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="group-card-info">
                    <div className="group-card-name">{group.name}</div>
                    <div className="group-card-meta">
                      {group.members.length} members · {group.expenses.length} expenses
                    </div>
                  </div>
                  <div className="group-card-balance">
                    {totalOwe > 0 && (
                      <div className="owe-badge">You owe {totalOwe.toFixed(2)} XLM</div>
                    )}
                    {totalOwed > 0 && (
                      <div className="owed-badge">Owed {totalOwed.toFixed(2)} XLM</div>
                    )}
                    {totalOwe === 0 && totalOwed === 0 && (
                      <div className="settled-badge">✓ Settled</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }


  // ── Render: Create Group ──
  if (view === 'create') {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setView('list')}>← Back</button>
          <h1 className="page-title">Create Group</h1>
        </div>

        <div className="form-card">
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              className="form-input"
              placeholder="e.g. Goa Trip, Hostel Friends..."
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Add Members</label>
            <p className="form-hint">You are automatically added as a member</p>
            {members.map((member, idx) => (
              <div key={idx} className="member-row">
                <input
                  className="form-input"
                  placeholder="Stellar address (G...)"
                  value={member.address}
                  onChange={e => {
                    const updated = [...members]
                    updated[idx].address = e.target.value
                    setMembers(updated)
                  }}
                />
                <input
                  className="form-input nickname-input"
                  placeholder="Nickname (optional)"
                  value={member.nickname}
                  onChange={e => {
                    const updated = [...members]
                    updated[idx].nickname = e.target.value
                    setMembers(updated)
                  }}
                />
                {members.length > 1 && (
                  <button
                    className="remove-btn"
                    onClick={() => setMembers(members.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              className="add-member-btn"
              onClick={() => setMembers([...members, { address: '', nickname: '' }])}
            >
              + Add another member
            </button>
          </div>

          <button className="btn-primary btn-full" onClick={handleCreateGroup}>
            Create Group
          </button>
        </div>
      </div>
    )
  }


  // ── Render: Group Detail ──
  if (view === 'detail' && selectedGroup) {
    const liveGroup = groups.find(g => g.id === selectedGroup.id) || selectedGroup
    const debts     = computeBalances(liveGroup)
    const myDebts   = debts.filter(d => d.from === walletAddress)
    const myCredits = debts.filter(d => d.to === walletAddress)

    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => { setView('list'); setTxResult(null) }}>
            ← Back
          </button>
          <h1 className="page-title">{liveGroup.name}</h1>
          <button
            className="btn-danger-sm"
            onClick={() => { deleteGroup(liveGroup.id); setView('list') }}
          >
            Delete
          </button>
        </div>

        {/* Members */}
        <div className="detail-section">
          <h3 className="section-title">Members ({liveGroup.members.length})</h3>
          <div className="members-row">
            {liveGroup.members.map(m => (
              <div key={m.address} className="member-chip">
                <div className="member-avatar">{(m.nickname || '?').charAt(0).toUpperCase()}</div>
                <span>{m.nickname || shortAddress(m.address)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Balances */}
        {(myDebts.length > 0 || myCredits.length > 0) && (
          <div className="detail-section">
            <h3 className="section-title">Your Balances</h3>

            {myDebts.map((debt, i) => (
              <div key={i} className="debt-card owe-debt">
  <div className="debt-info">
    <span className="debt-label">You owe</span>
    <span className="debt-name">
      {getMemberName(liveGroup, debt.to)}
    </span>
    <span className="debt-amount">{debt.amount.toFixed(2)} XLM</span>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
    <GaslessBadge showInactive={false} />
    <button
      className="settle-btn"
      onClick={() => handleSettle(debt)}
      disabled={isSending || settlingDebt !== null}
    >
      {settlingDebt?.to === debt.to ? (
        <><span className="spinner-sm"></span> Sending...</>
      ) : (
        '⚡ Settle'
      )}
    </button>
  </div>
</div>
            ))}

            {myCredits.map((credit, i) => (
              <div key={i} className="debt-card owed-debt">
                <div className="debt-info">
                  <span className="debt-label">Owed by</span>
                  <span className="debt-name">
                    {getMemberName(liveGroup, credit.from)}
                  </span>
                  <span className="debt-amount">{credit.amount.toFixed(2)} XLM</span>
                </div>
                <span className="waiting-badge">Waiting...</span>
              </div>
            ))}
          </div>
        )}

        {/* Transaction Result */}
        {txResult && (
          <div className={`tx-result ${txResult.success ? 'tx-success' : 'tx-error'}`}>
            {txResult.success ? (
              <>
                <div>✅ Payment sent successfully!</div>
                <div className="tx-hash-small">
                  Hash: {txResult.txHash.slice(0,16)}...
                </div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txResult.txHash}`}
                  target="_blank" rel="noreferrer" className="tx-link"
                >
                  View on Stellar Expert →
                </a>
              </>
            ) : (
              <div>❌ {txResult.error}</div>
            )}
          </div>
        )}

        {/* Add Expense */}
        <div className="detail-section">
          <div className="section-header">
            <h3 className="section-title">Expenses ({liveGroup.expenses.length})</h3>
            <button
              className="btn-primary-sm"
              onClick={() => setShowAddExpense(!showAddExpense)}
            >
              {showAddExpense ? 'Cancel' : '+ Add Expense'}
            </button>
          </div>

          {showAddExpense && (
            <div className="add-expense-form">
              {error && <div className="error-msg">{error}</div>}

              <input
                className="form-input"
                placeholder="What was this expense for?"
                value={expDesc}
                onChange={e => setExpDesc(e.target.value)}
              />

              <div className="form-row">
                <input
                  className="form-input"
                  type="number"
                  placeholder="Amount (XLM)"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />

                <select
                  className="form-select"
                  value={expPaidBy}
                  onChange={e => setExpPaidBy(e.target.value)}
                >
                  <option value="">Who paid?</option>
                  {liveGroup.members.map(m => (
                    <option key={m.address} value={m.address}>
                      {m.nickname || shortAddress(m.address)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Split among:</label>
                <div className="split-checkboxes">
                  {liveGroup.members.map(m => (
                    <label key={m.address} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={expSplitAmong.includes(m.address)}
                        onChange={e => {
                          if (e.target.checked) {
                            setExpSplitAmong([...expSplitAmong, m.address])
                          } else {
                            setExpSplitAmong(expSplitAmong.filter(a => a !== m.address))
                          }
                        }}
                      />
                      {m.nickname || shortAddress(m.address)}
                      {expAmount && expSplitAmong.includes(m.address) && (
                        <span className="share-amount">
                          ({(parseFloat(expAmount || 0) / expSplitAmong.length).toFixed(2)} XLM)
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <button className="btn-primary btn-full" onClick={handleAddExpense}>
                Add Expense
              </button>
            </div>
          )}

          {/* Expense List */}
          {liveGroup.expenses.length === 0 ? (
            <div className="empty-state-sm">No expenses yet — add one above!</div>
          ) : (
            <div className="expenses-list">
              {liveGroup.expenses.map(expense => {
                const perPerson = (expense.amount / expense.splitAmong.length).toFixed(2)
                return (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-left">
                      <div className="expense-desc">{expense.description}</div>
                      <div className="expense-meta">
                        Paid by {getMemberName(liveGroup, expense.paidBy)} ·{' '}
                        {perPerson} XLM/person ·{' '}
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="expense-right">
                      <div className="expense-amount">{expense.amount.toFixed(2)} XLM</div>
                      {expense.settledBy.length > 0 && (
                        <div className="settled-count">
                          {expense.settledBy.length} settled
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* All Balances */}
        {debts.length > 0 && (
          <div className="detail-section">
            <h3 className="section-title">All Balances</h3>
            {debts.map((debt, i) => (
              <div key={i} className="balance-row">
                <span className="balance-from">{getMemberName(liveGroup, debt.from)}</span>
                <span className="balance-arrow">→ owes →</span>
                <span className="balance-to">{getMemberName(liveGroup, debt.to)}</span>
                <span className="balance-amount">{debt.amount.toFixed(2)} XLM</span>
              </div>
            ))}
          </div>
        )}

        {debts.length === 0 && liveGroup.expenses.length > 0 && (
          <div className="all-settled">
            🎉 All expenses are settled!
          </div>
        )}

      </div>
    )
  }

  return null
}
