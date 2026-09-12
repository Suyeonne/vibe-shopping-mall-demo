import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrder } from '../api/orders'
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

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }

    getOrder(id)
      .then(setOrder)
      .catch((loadError) => {
        if (loadError.code === 'NO_TOKEN') navigate('/login')
        else setError(loadError.message)
      })
  }, [authLoading, id, navigate, user])

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
          <h1>ORDER</h1>
          <Link to="/orders">‹ BACK TO ORDERS</Link>
        </div>

        {error && <p className="cart-empty">{error}</p>}
        {!error && !order && <p className="cart-empty">주문을 불러오는 중입니다.</p>}

        {order && (
          <section className="order-done">
            <OrderStatusTrack status={order.status} />
            <strong>{order.orderNumber}</strong>
            <span>{formatDate(order.createdAt)}</span>

            <div className="order-layout">
              <div>
                {(order.items || []).map((item) => (
                  <article key={item.product || item.syu} className="cart-item order-item">
                    <img src={item.image} alt={item.name || ''} />
                    <div>
                      <h2>{item.name || '상품'}</h2>
                      <p>
                        {formatPrice(item.price)} · QTY {item.quantity}
                      </p>
                    </div>
                    <strong>{formatPrice((item.price || 0) * item.quantity)}</strong>
                  </article>
                ))}
              </div>

              <div className="order-panel">
                <p className="order-field">
                  <span>RECIPIENT</span>
                  <em>{order.recipient}</em>
                </p>
                <p className="order-field">
                  <span>PHONE</span>
                  <em>{order.phone}</em>
                </p>
                <p className="order-field">
                  <span>ADDRESS</span>
                  <em>{order.address}</em>
                </p>
                {order.note && (
                  <p className="order-field">
                    <span>NOTE</span>
                    <em>{order.note}</em>
                  </p>
                )}
                <p className="order-field">
                  <span>PAYMENT</span>
                  <em>{order.paymentMethod === 'transfer' ? 'TRANSFER' : 'CARD'}</em>
                </p>
                <p className="order-sum">
                  <span>ITEMS</span>
                  <strong>{formatPrice(order.itemsTotal)}</strong>
                </p>
                <p className="order-sum">
                  <span>SHIPPING</span>
                  <strong>{formatPrice(order.shippingFee)}</strong>
                </p>
                <p className="order-sum order-total">
                  <span>TOTAL</span>
                  <strong>{formatPrice(order.total)}</strong>
                </p>
                <Link to="/orders" className="order-submit">
                  BACK TO ORDERS
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default OrderDetail
