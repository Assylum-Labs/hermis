import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

export const Navigation = () => {
  const location = useLocation()

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/kit"
            className={`nav-link ${location.pathname === '/kit' ? 'active' : ''}`}
          >
            Kit Demo
          </Link>
        </div>
      </div>
    </nav>
  )
}
