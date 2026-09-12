import { Link } from 'react-router-dom'
import { useAuthUser } from '../../hooks/useAuthUser'
import CartIcon from './CartIcon'
import HomeAccount from './HomeAccount'
import HomeCategoriesNav from './HomeCategoriesNav'
import '../../pages/HomeMain.css'

function HomeShell({ children }) {
  const { user, loading, isAdmin, logout } = useAuthUser()

  return (
    <div className="home">
      <div className="home-ticker">
        <div className="home-ticker-track">
          {Array.from({ length: 24 }).map((_, index) => (
            <span key={index}>NEW COLLECTION</span>
          ))}
        </div>
        <span className="home-star" aria-hidden="true">
          ✦
        </span>
      </div>

      <header className="home-top">
        <nav className="home-nav">
          <HomeCategoriesNav />
          <Link to="/new-collection">NEW COLLECTION</Link>
          <Link to="/about">ABOUT</Link>
        </nav>
        <div className="home-brand-side">
          <HomeAccount user={user} loading={loading} isAdmin={isAdmin} logout={logout} />
          <CartIcon />
        </div>
      </header>

      <main className="auth-main">{children}</main>
      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default HomeShell
