import { useApp } from '../context/AppContext'
import { useWallet } from '../hooks/useWallet'
import { shortAddress, getFaucetLink } from '../utils/stellar'

function SplitSaveLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sCyan" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7AEEFF"/>
          <stop offset="100%" stopColor="#00D4FF"/>
        </linearGradient>
        <linearGradient id="sBg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#005580" stopOpacity="0.10"/>
        </linearGradient>
        <clipPath id="sBadge">
          <rect x="0" y="0" width="80" height="80" rx="20"/>
        </clipPath>
      </defs>
      <rect x="0" y="0" width="80" height="80" rx="20" fill="url(#sBg)"/>
      <rect x="0" y="0" width="80" height="80" rx="20" fill="none" stroke="#00D4FF" strokeWidth="1.5" opacity="0.45"/>
      <circle cx="66" cy="14" r="4" fill="#00D4FF" opacity="0.7"/>
      <g clipPath="url(#sBadge)">
        <text x="16" y="67"
          fontFamily="'Arial Black','Helvetica Neue',sans-serif"
          fontSize="58" fontWeight="900"
          fill="url(#sCyan)">S</text>
      </g>
      <line x1="14" y1="72" x2="66" y2="8" stroke="#080B10" strokeWidth="6"/>
      <line x1="14" y1="72" x2="66" y2="8" stroke="url(#sCyan)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="66" cy="8"  r="3" fill="#7AEEFF"/>
      <circle cx="14" cy="72" r="3" fill="#00D4FF" opacity="0.6"/>
    </svg>
  )
}

export default function Navbar({ currentPage, setCurrentPage }) {
  const { walletAddress, balance } = useApp()
  const { connectWallet, disconnectWallet, isConnecting } = useWallet()

  const navItems = [
    { id: 'dashboard', label: 'Home' },
    { id: 'groups',    label: 'Groups' },
    { id: 'savings',   label: 'Savings' },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <div className="navbar-logo" onClick={() => setCurrentPage('dashboard')}>
          <div className="logo-svg-wrap">
            <SplitSaveLogo size={36} />
          </div>
          <div className="logo-text-wrap">
            <div className="logo-title">SplitSave</div>
            <div className="logo-tagline">Smart Money · Stellar</div>
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
                ⬡ Faucet
              </a>
              <div
                className="wallet-chip"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress)
                  alert('Wallet address copied!')
                }}
                title="Click to copy your wallet address"
              >
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
                '⬡ Connect Wallet'
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
            {item.id === 'dashboard' && '⌂'}
            {item.id === 'groups'    && '⬡'}
            {item.id === 'savings'   && '◎'}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
