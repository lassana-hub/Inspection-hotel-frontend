import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isHome = location.pathname === '/'

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="navbar-logo">🏨</span>
          <span className="navbar-title">Inspection Hôtelière</span>
        </Link>

        <button
          className={`navbar-burger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>

        <nav className={`navbar-nav${menuOpen ? ' open' : ''}`}>
          <Link
            to="/"
            className={`nav-link${isHome ? ' active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Tableau de bord
          </Link>
        </nav>
      </div>
    </header>
  )
}
