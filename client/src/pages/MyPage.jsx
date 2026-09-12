import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyOrders } from '../api/orders'
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

function MyPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }

    getMyOrders()
      .then(setOrders)
      .catch((loadError) => {
        if (loadError.code === 'NO_TOKEN') navigate('/login')
        else setError(loadError.message)
      })
      .finally(() => setLoading(false))
  }, [authLoading, navigate, user])

  const purchases = useMemo(
    () =>
      orders.flatMap((order) =>
        (order.items || []).map((item, index) => ({
          key: `${order._id}-${item.product || index}`,
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        })),
      ),
    [orders],
  )

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
          <h1>MY PAGE</h1>
          <Link to="/">‹ BACK TO SHOP</Link>
        </div>

        {user && (
          <section className="mypage-profile">
            <p className="order-field">
              <span>NAME</span>
              <em>{user.name}</em>
            </p>
            <p className="order-field">
              <span>EMAIL</span>
              <em>{user.email}</em>
            </p>
            <p className="order-field">
              <span>ADDRESS</span>
              <em>{user.address || '-'}</em>
            </p>
          </section>
        )}

        <h2 className="mypage-section">PURCHASES</h2>

        {error && <p className="cart-empty">{error}</p>}
        {loading && !error && <p className="cart-empty">구매 내역을 불러오는 중입니다.</p>}
        {!loading && !error && purchases.length === 0 && (
          <p className="cart-empty">구매한 상품이 없습니다.</p>
        )}

        <div className="order-list">
          {purchases.map((item) => (
            <Link key={item.key} to={`/orders/${item.orderId}`} className="order-list-row">
              <img src={item.image} alt="" />
              <div>
                <h2>{item.name || '상품'}</h2>
                <p>{item.orderNumber}</p>
                <p>
                  {formatDate(item.createdAt)} · QTY {item.quantity}
                </p>
              </div>
              <OrderStatusTrack status={item.status} compact />
              <strong>{formatPrice((item.price || 0) * item.quantity)}</strong>
            </Link>
          ))}
        </div>
      </main>

      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default MyPage
