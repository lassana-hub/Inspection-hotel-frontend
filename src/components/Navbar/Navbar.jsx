import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isHome = location.pathname === '/'

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

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

          {user && (
            <div className="navbar-user">
              <span className="navbar-username">
                <span className={`navbar-role-badge navbar-role-badge--${user.role}`}>
                  {user.role === 'admin' ? 'Admin' : 'Gouvernant(e)'}
                </span>
                {user.username}
              </span>
              <button className="btn-logout" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
