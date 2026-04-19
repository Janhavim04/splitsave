import { useState } from 'react'
import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  FreighterModule,
  xBullModule,
  LobstrModule,
  HanaModule,
} from '@creit.tech/stellar-wallets-kit'
import { fetchBalance, buildPaymentTx, submitTransaction } from '../utils/stellar'
import { useApp } from '../context/AppContext'

const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

// Initialize wallet kit once
const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: [
    new FreighterModule(),
    new xBullModule(),
    new LobstrModule(),
    new HanaModule(),
  ]
})

export function useWallet() {
  const { setWalletAddress, setBalance } = useApp()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSending, setIsSending]       = useState(false)
  const [error, setError]               = useState('')

  // ── Connect wallet ──
  const connectWallet = async () => {
    setIsConnecting(true)
    setError('')
    await new Promise(r => setTimeout(r, 300))

    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id)
            const { address } = await kit.getAddress()
            setWalletAddress(address)
            const bal = await fetchBalance(address)
            setBalance(bal)
          } catch (err) {
            setError('Wallet connection failed. Please try again.')
          }
        }
      })
    } catch (err) {
      setError('Could not open wallet selector.')
    }
    setIsConnecting(false)
  }

  // ── Disconnect wallet ──
  const disconnectWallet = () => {
    setWalletAddress(null)
    setBalance(null)
  }

  // ── Refresh balance ──
  const refreshBalance = async (address) => {
    const bal = await fetchBalance(address)
    setBalance(bal)
    return bal
  }

  // ── Send XLM payment ──
  const sendPayment = async (fromAddress, toAddress, amount, memo = '') => {
    setIsSending(true)
    setError('')

    try {
      // Build transaction
      const tx = await buildPaymentTx(fromAddress, toAddress, amount, memo)

      // Sign with wallet
      const { signedTxXdr } = await kit.signTransaction(
        tx.toXDR(),
        { networkPassphrase: NETWORK_PASSPHRASE }
      )

      // Submit to network
      const txHash = await submitTransaction(signedTxXdr)

      // Refresh balance
      await refreshBalance(fromAddress)

      setIsSending(false)
      return { success: true, txHash }

    } catch (err) {
      console.error('Payment error:', err)
      let message = 'Payment failed. Please try again.'
      if (err.message?.includes('insufficient')) {
        message = 'Insufficient balance.'
      } else if (err.message?.includes('denied')) {
        message = 'Transaction rejected by wallet.'
      }
      setError(message)
      setIsSending(false)
      return { success: false, error: message }
    }
  }

  return {
    kit,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    sendPayment,
    isConnecting,
    isSending,
    error,
    setError,
  }
}
