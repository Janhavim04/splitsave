import {
  Horizon,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
  Keypair,
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
    txBuilder.addMemo(Memo.text(memo.slice(0, 28)))
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

// ─────────────────────────────────────────────────────────────────
// ── FEE SPONSORSHIP (Advanced Feature) ──────────────────────────
// ─────────────────────────────────────────────────────────────────
//
// Fee Bump transactions (SEP-0017) let a sponsor account pay the
// transaction fee on behalf of the user. The user signs the inner
// transaction; the sponsor wraps it in a fee bump and pays the fee.
//
// Flow:
//   1. Build inner transaction (signed by user, fee = BASE_FEE)
//   2. Wrap in FeeBumpTransaction (sponsor pays actual fee)
//   3. Sponsor signs the outer tx and submits
//
// In this MVP the sponsor keypair is loaded from env at build time.
// For production, replace with a backend endpoint that signs the
// fee-bump server-side so the sponsor secret never ships to clients.
// ─────────────────────────────────────────────────────────────────

// Sponsor public key — set VITE_SPONSOR_PUBLIC_KEY in your .env
// The sponsor account must be funded on testnet via Friendbot.
export const SPONSOR_PUBLIC_KEY = import.meta.env.VITE_SPONSOR_PUBLIC_KEY || null

/**
 * Build a sponsored (gasless) payment transaction.
 *
 * Returns an object:
 *   { innerTxXdr, feeBumpTxXdr, sponsored: true }
 *
 * The caller must:
 *   1. Have the user sign `innerTxXdr` via their wallet kit
 *   2. Call submitSponsoredTx(signedInnerXdr) to complete submission
 *
 * If no sponsor key is configured, falls back to a normal payment tx.
 */
export const buildSponsoredPaymentTx = async (
  fromAddress,
  toAddress,
  amount,
  memo = ''
) => {
  if (!SPONSOR_PUBLIC_KEY) {
    // Graceful fallback — no sponsor configured
    console.warn('[SplitSave] No sponsor key set. Falling back to regular tx.')
    const tx = await buildPaymentTx(fromAddress, toAddress, amount, memo)
    return { innerTxXdr: tx.toXDR(), sponsored: false }
  }

  const sourceAccount = await server.loadAccount(fromAddress)

  // Inner transaction — user is the source, fee is set to BASE_FEE
  // but will be covered by the fee bump wrapper
  const innerTxBuilder = new TransactionBuilder(sourceAccount, {
    fee:              BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: toAddress,
        asset:       Asset.native(),
        amount:      amount.toString(),
      })
    )
    .setTimeout(60)

  if (memo) {
    innerTxBuilder.addMemo(Memo.text(memo.slice(0, 28)))
  }

  const innerTx = innerTxBuilder.build()

  return {
    innerTxXdr: innerTx.toXDR(),
    sponsored:  true,
  }
}

/**
 * Wrap a user-signed inner transaction in a fee bump and submit.
 *
 * In production: send signedInnerXdr to your backend, which adds
 * the fee-bump wrapper, signs with the sponsor key, and submits.
 *
 * For this testnet MVP we sign client-side using the env secret.
 * NEVER ship a real secret to the frontend in production.
 */
export const submitSponsoredTx = async (signedInnerXdr) => {
  const sponsorSecret = import.meta.env.VITE_SPONSOR_SECRET_KEY

  if (!sponsorSecret) {
    // No sponsor secret — submit the inner tx directly as a fallback
    console.warn('[SplitSave] No sponsor secret. Submitting inner tx directly.')
    return submitTransaction(signedInnerXdr)
  }

  try {
    const sponsorKeypair = Keypair.fromSecret(sponsorSecret)
    const innerTx = TransactionBuilder.fromXDR(signedInnerXdr, NETWORK_PASSPHRASE)

    // Build the fee bump transaction
    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      sponsorKeypair,           // fee-paying account
      (parseInt(BASE_FEE) * 10).toString(), // fee bump pays 10x base fee
      innerTx,
      NETWORK_PASSPHRASE
    )

    feeBumpTx.sign(sponsorKeypair)

    const result = await server.submitTransaction(feeBumpTx)
    return result.hash
  } catch (err) {
    console.error('[SplitSave] Fee bump submission failed:', err)
    // Fallback: submit inner tx without fee bump
    return submitTransaction(signedInnerXdr)
  }
}

/**
 * Check if fee sponsorship is active.
 * Use this to conditionally show the "Gasless ⚡" badge in UI.
 */
export const isSponsorshipActive = () => {
  return !!SPONSOR_PUBLIC_KEY
}
