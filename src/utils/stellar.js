import {
  Horizon,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk'

const HORIZON_URL        = 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = Networks.TESTNET

export const server = new Horizon.Server(HORIZON_URL)

// ── Fetch XLM balance ──
export const fetchBalance = async (address) => {
  try {
    const account = await server.loadAccount(address)
    const xlm = account.balances.find(b => b.asset_type === 'native')
    return xlm ? parseFloat(xlm.balance).toFixed(4) : '0.0000'
  } catch (err) {
    console.error('Failed to fetch balance:', err)
    return '0.0000'
  }
}

// ── Build a payment transaction ──
export const buildPaymentTx = async (fromAddress, toAddress, amount, memo = '') => {
  const account = await server.loadAccount(fromAddress)

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: toAddress,
        asset:       Asset.native(),
        amount:      amount.toString(),
      })
    )
    .setTimeout(30)

  if (memo) {
    txBuilder.addMemo(Memo.text(memo.slice(0, 28))) // max 28 chars
  }

  return txBuilder.build()
}

// ── Submit a signed transaction ──
export const submitTransaction = async (signedTxXdr) => {
  const tx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  const result = await server.submitTransaction(tx)
  return result.hash
}

// ── Validate a Stellar address ──
export const isValidAddress = (address) => {
  try {
    if (!address || address.length !== 56) return false
    if (!address.startsWith('G')) return false
    return true
  } catch {
    return false
  }
}

// ── Shorten an address for display ──
export const shortAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// ── Format XLM amount ──
export const formatXLM = (amount) => {
  return parseFloat(amount).toFixed(2)
}

// ── Get testnet faucet link ──
export const getFaucetLink = (address) => {
  return `https://friendbot.stellar.org?addr=${address}`
}

// ── Verify a transaction exists on chain ──
export const verifyTransaction = async (txHash) => {
  try {
    const tx = await server.transactions().transaction(txHash).call()
    return !!tx
  } catch {
    return false
  }
}
