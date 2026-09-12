import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function HomeAccount({ user, loading, isAdmin, logout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) return null

  if (!user) {
    return <Link to="/login">LOGIN</Link>
  }

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
  }

  return (
    <>
      {isAdmin && <Link to="/admin">ADMIN</Link>}
      <div className="home-user-menu" ref={menuRef}>
        <button
          type="button"
          className="home-user-trigger"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {isAdmin ? '관리자님 환영합니다' : `${user.name}님 환영합니다`}
        </button>
        {menuOpen && (
          <div className="home-user-dropdown">
            <Link to="/mypage" onClick={() => setMenuOpen(false)}>
              MY PAGE
            </Link>
            <button type="button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default HomeAccount
