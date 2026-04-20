// SplitSave v1.0.0 — Smart Money Management for Students
// Built on Stellar Testnet
import { useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import Savings from './pages/Savings'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />
      case 'groups':    return <Groups />
      case 'savings':   return <Savings />
      default:          return <Dashboard setCurrentPage={setCurrentPage} />
    }
  }

  return (
    <div className="app">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
