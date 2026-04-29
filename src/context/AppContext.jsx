import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {

  // ── Wallet State ──
  const [walletAddress, setWalletAddress] = useState(null)
  const [walletName, setWalletName]       = useState('')
  const [balance, setBalance]             = useState(null)

  // ── Groups State ──
  const [groups, setGroups] = useState([])

  // ── Savings State ──
  const [goals, setGoals] = useState([])

  // ── Activity Feed ──
  const [activities, setActivities] = useState([])

  // ── Load from localStorage on mount ──
  useEffect(() => {
    const savedGroups     = localStorage.getItem('splitsave_groups')
    const savedGoals      = localStorage.getItem('splitsave_goals')
    const savedActivities = localStorage.getItem('splitsave_activities')
    const savedName       = localStorage.getItem('splitsave_name')

    if (savedGroups)     setGroups(JSON.parse(savedGroups))
    if (savedGoals)      setGoals(JSON.parse(savedGoals))
    if (savedActivities) setActivities(JSON.parse(savedActivities))
    if (savedName)       setWalletName(savedName)
  }, [])

  // ── Save groups to localStorage whenever they change ──
  useEffect(() => {
    localStorage.setItem('splitsave_groups', JSON.stringify(groups))
  }, [groups])

  // ── Save goals to localStorage whenever they change ──
  useEffect(() => {
    localStorage.setItem('splitsave_goals', JSON.stringify(goals))
  }, [goals])

  // ── Save activities to localStorage ──
  useEffect(() => {
    localStorage.setItem('splitsave_activities', JSON.stringify(activities))
  }, [activities])

  // ── Listen for wallet events from useWallet ──
useEffect(() => {
  const onConnected = async (e) => {
    const { address } = e.detail
    setWalletAddress(address)
    // fetch balance
    const { fetchBalance } = await import('../utils/stellar')
    const bal = await fetchBalance(address)
    setBalance(bal)
  }

  const onDisconnected = () => {
    setWalletAddress(null)
    setBalance(null)
  }

  const onError = (e) => {
    console.error('Wallet error:', e.detail.error)
  }

  window.addEventListener('wallet:connected', onConnected)
  window.addEventListener('wallet:disconnected', onDisconnected)
  window.addEventListener('wallet:error', onError)

  return () => {
    window.removeEventListener('wallet:connected', onConnected)
    window.removeEventListener('wallet:disconnected', onDisconnected)
    window.removeEventListener('wallet:error', onError)
  }
}, [])


  // ── Group Functions ──

  const createGroup = (name, members) => {
    const newGroup = {
      id:       Date.now().toString(),
      name,
      members,  // array of { address, nickname }
      expenses: [],
      createdAt: new Date().toISOString(),
    }
    setGroups(prev => [newGroup, ...prev])
    addActivity(`Created group "${name}"`)
    return newGroup.id
  }

  const addExpense = (groupId, expense) => {
    // expense = { description, amount, paidBy, splitAmong, date }
    const newExpense = {
      id: Date.now().toString(),
      ...expense,
      settledBy: [], // array of addresses that have settled
    }
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, expenses: [newExpense, ...g.expenses] }
        : g
    ))
    addActivity(`Added expense "${expense.description}" — ${expense.amount} XLM`)
  }

  const settleExpense = (groupId, expenseId, settlerAddress, txHash) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? {
            ...g,
            expenses: g.expenses.map(e =>
              e.id === expenseId
                ? { ...e, settledBy: [...e.settledBy, { address: settlerAddress, txHash }] }
                : e
            )
          }
        : g
    ))
    addActivity(`Settled an expense — tx: ${txHash.slice(0,8)}...`)
  }

  const deleteGroup = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }


  // ── Savings Functions ──

  const createGoal = (name, targetAmount, deadline, emoji) => {
    const newGoal = {
      id:           Date.now().toString(),
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      deadline,
      emoji:        emoji || '🎯',
      deposits:     [],
      createdAt:    new Date().toISOString(),
      completed:    false,
    }
    setGoals(prev => [newGoal, ...prev])
    addActivity(`Created savings goal "${name}" — target: ${targetAmount} XLM`)
    return newGoal.id
  }

  const depositToGoal = (goalId, amount, txHash) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g
      const newAmount = g.currentAmount + parseFloat(amount)
      return {
        ...g,
        currentAmount: newAmount,
        completed: newAmount >= g.targetAmount,
        deposits: [
          { amount: parseFloat(amount), txHash, date: new Date().toISOString() },
          ...g.deposits,
        ]
      }
    }))
    addActivity(`Deposited ${amount} XLM to savings goal`)
  }

  const deleteGoal = (goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId))
  }


  // ── Activity Feed ──
  const addActivity = (text) => {
    const activity = {
      id:   Date.now().toString(),
      text,
      time: new Date().toISOString(),
    }
    setActivities(prev => [activity, ...prev].slice(0, 20)) // keep last 20
  }


  // ── Compute balances for a group ──
  const computeBalances = (group) => {
  const balances = {}

  group.expenses.forEach(expense => {
    const splitCount  = expense.splitAmong.length
    if (splitCount === 0) return
    const shareAmount = expense.amount / splitCount

    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount

    expense.splitAmong.forEach(addr => {
      balances[addr] = (balances[addr] || 0) - shareAmount
    })
  })

  // Simplify debts
  const debts     = []
  const debtors   = Object.entries(balances).filter(([, b]) => b < -0.001).map(([a, b]) => ({ addr: a, amount: Math.abs(b) }))
  const creditors = Object.entries(balances).filter(([, b]) => b > 0.001).map(([a, b]) => ({ addr: a, amount: b }))

  debtors.forEach(debtor => {
    let remaining = debtor.amount
    creditors.forEach(creditor => {
      if (remaining <= 0.001 || creditor.amount <= 0.001) return
      const amount = Math.min(remaining, creditor.amount)
      debts.push({
        from:   debtor.addr,
        to:     creditor.addr,
        amount: parseFloat(amount.toFixed(7)),
      })
      remaining        -= amount
      creditor.amount  -= amount
    })
  })

  return debts
}


  const value = {
    // Wallet
    walletAddress, setWalletAddress,
    walletName,    setWalletName,
    balance,       setBalance,

    // Groups
    groups,
    createGroup,
    addExpense,
    settleExpense,
    deleteGroup,
    computeBalances,

    // Savings
    goals,
    createGoal,
    depositToGoal,
    deleteGoal,

    // Activity
    activities,
    addActivity,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
