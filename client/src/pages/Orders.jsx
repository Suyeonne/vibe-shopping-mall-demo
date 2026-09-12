import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getOrders } from '../api/orders'
import CartIcon from '../components/home/CartIcon'
import HomeAccount from '../components/home/HomeAccount'
import HomeCategoriesNav from '../components/home/HomeCategoriesNav'
import OrderStatusTrack from '../components/OrderStatusTrack'
import { useAuthUser } from '../hooks/useAuthUser'
import './HomeMain.css'
import './Cart.css'
import './Order.css'

function formatPrice(price) {
  return `₩${Number(price).toLocaleString('ko-KR')}`
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TABS = [
  { id: 'all', label: 'ALL' },
  { id: 'pending', label: 'PENDING' },
  { id: 'paid', label: 'PAID' },
  { id: 'preparing', label: 'PREPARING' },
  { id: 'shipped', label: 'SHIPPED' },
  { id: 'delivered', label: 'DELIVERED' },
  { id: 'cancelled', label: 'CANCELLED' },
]

function itemLabel(items = []) {
  const first = items[0]?.name || '상품'
  return items.length > 1 ? `${first} 외 ${items.length - 1}건` : first
}

function Orders() {
  const navigate = useNavigate()
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }

    getOrders()
      .then(setOrders)
      .catch((loadError) => {
        if (loadError.code === 'NO_TOKEN') navigate('/login')
        else setError(loadError.message)
      })
      .finally(() => setLoading(false))
  }, [authLoading, navigate, user])

  const counts = useMemo(
    () =>
      TABS.reduce((result, item) => {
        result[item.id] =
          item.id === 'all'
            ? orders.length
            : orders.filter((order) => order.status === item.id).length
        return result
      }, {}),
    [orders],
  )

  const visible = tab === 'all' ? orders : orders.filter((order) => order.status === tab)

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
          <HomeAccount user={user} loading={authLoading} isAdmin={isAdmin} logout={logout} />
          <CartIcon />
        </div>
      </header>

      <main className="order-page">
        <div className="cart-head">
          <h1>ORDERS</h1>
          <Link to="/">‹ BACK TO SHOP</Link>
        </div>

        <div className="home-tabs order-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'is-active' : ''}
              onClick={() => setTab(item.id)}
            >
              {item.label} ({counts[item.id] || 0})
            </button>
          ))}
        </div>

        {error && <p className="cart-empty">{error}</p>}
        {loading && !error && <p className="cart-empty">주문 목록을 불러오는 중입니다.</p>}
        {!loading && !error && orders.length === 0 && (
          <p className="cart-empty">주문 내역이 없습니다.</p>
        )}
        {!loading && !error && orders.length > 0 && visible.length === 0 && (
          <p className="cart-empty">해당 상태의 주문이 없습니다.</p>
        )}

        <div className="order-list">
          {visible.map((order) => (
            <Link key={order._id} to={`/orders/${order._id}`} className="order-list-row">
              <img src={order.items?.[0]?.image} alt="" />
              <div>
                <h2>{order.orderNumber}</h2>
                <p>{itemLabel(order.items)}</p>
                <p>{formatDate(order.createdAt)}</p>
              </div>
              <OrderStatusTrack status={order.status} compact />
              <strong>{formatPrice(order.total)}</strong>
            </Link>
          ))}
        </div>
      </main>

      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default Orders
