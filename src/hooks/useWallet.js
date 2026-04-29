import { useState, useCallback } from 'react'
import { StellarWalletsKit, WalletNetwork, FREIGHTER_ID, FreighterModule, xBullModule, HanaModule } from '@creit.tech/stellar-wallets-kit'
import {
  buildSponsoredPaymentTx,
  submitSponsoredTx,
  buildPaymentTx,
  submitTransaction,
  isSponsorshipActive,
} from '../utils/stellar'

let kit = null

const getKit = () => {
  if (!kit) {
    kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new HanaModule(),
      ],
    })
  }
  return kit
}

export function useWallet() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSending, setIsSending]       = useState(false)

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    try {
      const walletKit = getKit()

      await new Promise((resolve, reject) => {
        walletKit.openModal({
          onWalletSelected: async (option) => {
            try {
              walletKit.setWallet(option.id)
              const { address } = await walletKit.getAddress()
              window.dispatchEvent(new CustomEvent('wallet:connected', { detail: { address } }))
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          onClosed: () => {
            resolve() // user closed modal without selecting
          },
        })
      })
    } catch (err) {
      console.error('Wallet connection failed:', err)
      window.dispatchEvent(new CustomEvent('wallet:error', { detail: { error: err.message } }))
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    kit = null
    window.dispatchEvent(new CustomEvent('wallet:disconnected'))
  }, [])

  const sendPayment = useCallback(async (fromAddress, toAddress, amount, memo = '') => {
    setIsSending(true)
    try {
      const walletKit = getKit()
      const sponsored = isSponsorshipActive()

      const { innerTxXdr } = sponsored
        ? await buildSponsoredPaymentTx(fromAddress, toAddress, amount, memo)
        : { innerTxXdr: (await buildPaymentTx(fromAddress, toAddress, amount, memo)).toXDR() }

      const { signedTxXdr } = await walletKit.signTransaction(innerTxXdr, {
        address: fromAddress,
        networkPassphrase: 'Test SDF Network ; September 2015',
      })

      const txHash = sponsored
        ? await submitSponsoredTx(signedTxXdr)
        : await submitTransaction(signedTxXdr)

      return { success: true, txHash, sponsored }

    } catch (err) {
      console.error('Payment failed:', err)
      const userMsg = err?.message?.includes('User declined')
        ? 'Transaction cancelled by user'
        : err?.message || 'Transaction failed'
      return { success: false, error: userMsg, sponsored: false }
    } finally {
      setIsSending(false)
    }
  }, [])

  return { connectWallet, disconnectWallet, sendPayment, isSending, isConnecting }
}