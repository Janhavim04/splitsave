import { useApp } from '../context/AppContext'
import { useWallet } from '../hooks/useWallet'
import { shortAddress, getFaucetLink } from '../utils/stellar'

export default function Navbar({ currentPage, setCurrentPage }) {
  const { walletAddress, balance } = useApp()
  const { connectWallet, disconnectWallet, isConnecting } = useWallet()

  const navItems = [
    { id: 'dashboard', label: '🏠 Home' },
    { id: 'groups',    label: '👥 Groups' },
    { id: 'savings',   label: '🐷 Savings' },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <div className="navbar-logo" onClick={() => setCurrentPage('dashboard')}>
          <div className="logo-icon-wrap">💸</div>
          <div>
            <div className="logo-title">SplitSave</div>
            <div className="logo-tagline">Smart Money for Students</div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="navbar-links">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-link ${currentPage === item.id ? 'nav-link-active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Wallet */}
        <div className="navbar-wallet">
          {walletAddress ? (
            <div className="wallet-info">
              <a
                href={getFaucetLink(walletAddress)}
                target="_blank"
                rel="noreferrer"
                className="faucet-link"
                title="Get testnet XLM"
              >
                💧 Faucet
              </a>
              <div className="wallet-chip">
                <span className="wallet-dot"></span>
                <span className="wallet-addr-text">{shortAddress(walletAddress)}</span>
                <span className="wallet-bal">{balance} XLM</span>
              </div>
              <button className="disconnect-btn" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="connect-btn-nav"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <><span className="spinner-sm"></span> Connecting...</>
              ) : (
                '🔗 Connect Wallet'
              )}
            </button>
          )}
        </div>

      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${currentPage === item.id ? 'mobile-nav-active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
