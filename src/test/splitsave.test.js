import { describe, it, expect, beforeEach } from 'vitest'

// ── Helper functions from AppContext ──

function computeBalances(expenses, members) {
  const balances = {}

  expenses.forEach(expense => {
    const splitCount = expense.splitAmong.length
    if (splitCount === 0) return
    const shareAmount = expense.amount / splitCount

    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount
    expense.splitAmong.forEach(addr => {
      balances[addr] = (balances[addr] || 0) - shareAmount
    })
  })

  const debts     = []
  const debtors   = Object.entries(balances).filter(([, b]) => b < -0.001).map(([a, b]) => ({ addr: a, amount: Math.abs(b) }))
  const creditors = Object.entries(balances).filter(([, b]) => b > 0.001).map(([a, b]) => ({ addr: a, amount: b }))

  debtors.forEach(debtor => {
    let remaining = debtor.amount
    creditors.forEach(creditor => {
      if (remaining <= 0.001 || creditor.amount <= 0.001) return
      const amount = Math.min(remaining, creditor.amount)
      debts.push({ from: debtor.addr, to: creditor.addr, amount: parseFloat(amount.toFixed(7)) })
      remaining       -= amount
      creditor.amount -= amount
    })
  })

  return debts
}

function calcSavingsProgress(currentAmount, targetAmount) {
  if (targetAmount === 0) return 0
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100))
}

function isGoalComplete(currentAmount, targetAmount) {
  return currentAmount >= targetAmount
}

function isValidStellarAddress(address) {
  if (!address) return false
  if (typeof address !== 'string') return false
  if (address.length < 50 || address.length > 60) return false
  if (!address.startsWith('G')) return false
  return true
}

function splitEqually(totalAmount, numPeople) {
  if (numPeople === 0) return 0
  return parseFloat((totalAmount / numPeople).toFixed(7))
}

function saveToCache(key, data) {
  localStorage.setItem(key, JSON.stringify({ ...data, timestamp: Date.now() }))
}

function readFromCache(key, ttlSeconds) {
  const cached = localStorage.getItem(key)
  if (!cached) return null
  const parsed = JSON.parse(cached)
  const age = (Date.now() - parsed.timestamp) / 1000
  if (age > ttlSeconds) return null
  return parsed
}


// ══════════════════════════════════════
// TEST SUITE 1 — Expense Splitting
// ══════════════════════════════════════
describe('Expense Splitting', () => {

  it('should correctly compute who owes whom', () => {
    const expenses = [{
      amount: 90,
      paidBy: 'Alice',
      splitAmong: ['Alice', 'Bob', 'Carol'],
      settledBy: [],
    }]
    const debts = computeBalances(expenses, [])
    expect(debts.length).toBeGreaterThan(0)
    expect(debts.every(d => d.to === 'Alice')).toBe(true)
  })

  it('should return no debts when no expenses', () => {
    const debts = computeBalances([], [])
    expect(debts).toHaveLength(0)
  })

  it('should split equally among all members', () => {
    const share = splitEqually(90, 3)
    expect(share).toBe(30)
  })

  it('should split correctly for 2 people', () => {
    const share = splitEqually(50, 2)
    expect(share).toBe(25)
  })

  it('should return 0 if no people to split among', () => {
    expect(splitEqually(100, 0)).toBe(0)
  })

  it('should handle multiple expenses correctly', () => {
    const expenses = [
      { amount: 60, paidBy: 'Alice', splitAmong: ['Alice', 'Bob'], settledBy: [] },
      { amount: 40, paidBy: 'Bob',   splitAmong: ['Alice', 'Bob'], settledBy: [] },
    ]
    const debts = computeBalances(expenses, [])
    const totalDebt = debts.reduce((s, d) => s + d.amount, 0)
    expect(totalDebt).toBeCloseTo(10, 1)
  })

})


// ══════════════════════════════════════
// TEST SUITE 2 — Savings Goals
// ══════════════════════════════════════
describe('Savings Goals', () => {

  it('should return 0% when nothing saved', () => {
    expect(calcSavingsProgress(0, 500)).toBe(0)
  })

  it('should return 50% when half saved', () => {
    expect(calcSavingsProgress(250, 500)).toBe(50)
  })

  it('should return 100% when goal reached', () => {
    expect(calcSavingsProgress(500, 500)).toBe(100)
  })

  it('should cap at 100% even if over target', () => {
    expect(calcSavingsProgress(600, 500)).toBe(100)
  })

  it('should detect completed goal', () => {
    expect(isGoalComplete(500, 500)).toBe(true)
    expect(isGoalComplete(499, 500)).toBe(false)
  })

  it('should detect incomplete goal', () => {
    expect(isGoalComplete(0, 500)).toBe(false)
  })

})


// ══════════════════════════════════════
// TEST SUITE 3 — Address Validation
// ══════════════════════════════════════
describe('Stellar Address Validation', () => {

  it('should accept valid Stellar address', () => {
    expect(isValidStellarAddress('GAEZI5KPWKOCNMZGWGPQKX4SDEHVSDBMQFKDRVKQYQHAJMGKF7FZBMZ')).toBe(true)
  })

  it('should reject address not starting with G', () => {
    expect(isValidStellarAddress('ACJTXPUGCY3S37S2VW2NVY6RIIUZOFL24XH5P5MV7IRFIAD5CSX54BIIM')).toBe(false)
  })

  it('should reject short address', () => {
    expect(isValidStellarAddress('GCJTXPUGCY3S37')).toBe(false)
  })

  it('should reject empty address', () => {
    expect(isValidStellarAddress('')).toBe(false)
    expect(isValidStellarAddress(null)).toBe(false)
  })

  it('should reject undefined', () => {
    expect(isValidStellarAddress(undefined)).toBe(false)
  })

})


// ══════════════════════════════════════
// TEST SUITE 4 — Caching
// ══════════════════════════════════════
describe('Data Caching', () => {

  beforeEach(() => {
    localStorage.clear()
  })

  it('should save and retrieve data from cache', () => {
    saveToCache('splitsave_test', { groups: 3, goals: 2 })
    const data = readFromCache('splitsave_test', 30)
    expect(data).not.toBeNull()
    expect(data.groups).toBe(3)
  })

  it('should return null when cache is empty', () => {
    expect(readFromCache('splitsave_test', 30)).toBeNull()
  })

  it('should return null when cache is expired', () => {
    const expired = { groups: 1, timestamp: Date.now() - 60000 }
    localStorage.setItem('splitsave_test', JSON.stringify(expired))
    expect(readFromCache('splitsave_test', 30)).toBeNull()
  })

  it('should return data when cache is fresh', () => {
    saveToCache('splitsave_test', { groups: 5 })
    expect(readFromCache('splitsave_test', 30)).not.toBeNull()
  })

  it('should overwrite old cache with new data', () => {
    saveToCache('splitsave_test', { groups: 1 })
    saveToCache('splitsave_test', { groups: 9 })
    const data = readFromCache('splitsave_test', 30)
    expect(data.groups).toBe(9)
  })

})
