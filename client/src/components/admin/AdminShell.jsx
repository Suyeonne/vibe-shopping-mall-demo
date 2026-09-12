import { Link, useLocation } from 'react-router-dom'
import { useAdminGuard } from '../../hooks/useAdminGuard'
import '../../pages/admin/Admin.css'

const NAV = [
  { to: '/admin', label: '대시보드', match: (path) => path === '/admin' },
  {
    to: '/admin/products',
    label: '상품 관리',
    match: (path) => path.startsWith('/admin/products'),
  },
  {
    to: '/admin/orders',
    label: '주문 관리',
    match: (path) => path.startsWith('/admin/orders'),
  },
]

function AdminShell({ title, subtitle, actions, sidebar = true, children }) {
  const { pathname } = useLocation()
  const { user, loading, logout } = useAdminGuard()

  if (loading || !user) {
    return <div className="admin-shell" />
  }

  return (
    <div className={sidebar ? 'admin-shell' : 'admin-shell is-dashboard'}>
      {sidebar && (
        <aside className="admin-sidebar">
          <Link to="/" className="admin-brand">
            <strong>STILL TIRED</strong>
            <span>ADMIN</span>
          </Link>

          <nav className="admin-side-nav" aria-label="관리 메뉴">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={item.match(pathname) ? 'is-active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          {!sidebar && (
            <Link to="/" className="admin-top-brand">
              <strong>STILL TIRED</strong>
              <span>ADMIN</span>
            </Link>
          )}
          <span>관리자님</span>
          <Link to="/mypage">MY PAGE</Link>
          <button type="button" onClick={logout}>
            로그아웃
          </button>
        </header>

        <main className="admin-content">
          <div className="admin-head">
            <div>
              <h1 className="admin-title">{title}</h1>
              {subtitle && <p className="admin-sub">{subtitle}</p>}
            </div>
            {actions && <div className="admin-head-actions">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminShell
