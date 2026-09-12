import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getMyCart, removeCartProducts } from '../api/cart'
import CartIcon from '../components/home/CartIcon'
import HomeAccount from '../components/home/HomeAccount'
import HomeCategoriesNav from '../components/home/HomeCategoriesNav'
import OrderStatusTrack from '../components/OrderStatusTrack'
import { useAuthUser } from '../hooks/useAuthUser'
import './HomeMain.css'
import './Cart.css'
import './Order.css'

const FIELDS = [
  ['recipient', 'RECIPIENT'],
  ['phone', 'PHONE'],
  ['address', 'ADDRESS'],
  ['note', 'NOTE'],
]

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

function productIdOf(item) {
  return String(item.product?._id || item.product || '')
}

function Order() {
  const navigate = useNavigate()
  const { productIds } = useLocation().state || {}
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [failed, setFailed] = useState('')
  const [form, setForm] = useState({
    recipient: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'card',
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }

    setForm((current) => ({
      ...current,
      recipient: current.recipient || user.name || '',
      address: current.address || user.address || '',
    }))

    const selected = Array.isArray(productIds) ? productIds.map(String) : null

    getMyCart()
      .then((mine) => {
        const all = mine?.items || []
        setItems(selected ? all.filter((item) => selected.includes(productIdOf(item))) : all)
      })
      .catch((loadError) => {
        if (loadError.code === 'NO_TOKEN') navigate('/login')
        else setError(loadError.message)
      })
      .finally(() => setLoading(false))
  }, [authLoading, navigate, productIds, user])

  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)

  const handlePay = async (event) => {
    event.preventDefault()
    const token = localStorage.getItem('token')
    const { PortOne } = window
    if (!token || !user) return navigate('/login')
    const phoneNumber = form.phone.replace(/\D/g, '')
    if (!form.recipient.trim() || !form.address.trim()) {
      setError('받는 사람, 연락처, 배송지를 입력해 주세요.')
      return
    }
    if (phoneNumber.length < 10) {
      setError('연락처는 숫자로 입력해 주세요. 예: 01012345678')
      return
    }
    if (!PortOne) {
      setError('포트원 결제 모듈을 불러오지 못했습니다.')
      return
    }

    const storeId = import.meta.env.VITE_PORTONE_STORE_ID
    if (!storeId) {
      setError('포트원 콘솔의 스토어 아이디(store-...)를 client/.env의 VITE_PORTONE_STORE_ID에 넣어 주세요.')
      return
    }

    const firstName = items[0]?.product?.name || '상품'
    setPlacing(true)
    setError('')
    setFailed('')

    try {
      const rsp = await PortOne.requestPayment({
        storeId,
        channelKey: 'channel-key-6a01cc74-c278-4eb3-80b0-6b9e777dda34',
        paymentId: `order_${Date.now()}`,
        orderName: items.length > 1 ? `${firstName} 외 ${items.length - 1}건` : firstName,
        totalAmount: total,
        currency: 'CURRENCY_KRW',
        payMethod: form.paymentMethod === 'transfer' ? 'TRANSFER' : 'CARD',
        customer: {
          fullName: form.recipient.trim(),
          phoneNumber,
          email: user.email,
        },
      })

      if (rsp?.code) {
        setFailed(rsp.message || '결제가 취소되었거나 실패했습니다.')
        return
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            product: item.product?._id || item.product,
            quantity: item.quantity,
          })),
          ...form,
          paymentId: rsp.paymentId,
          shippingFee: 0,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || '주문을 완료하지 못했습니다.')
      await removeCartProducts(items.map(productIdOf))
      setOrder(data)
    } catch (payError) {
      setFailed(payError.message || '주문을 완료하지 못했습니다.')
    } finally {
      setPlacing(false)
    }
  }

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
          <Link to="/cart">‹ BACK TO CART</Link>
        </div>

        {order ? (
          <section className="order-done">
            <p>주문이 완료되었습니다.</p>
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
                <Link to="/" className="order-done-link">
                  ‹ BACK TO SHOP
                </Link>
              </div>
            </div>
          </section>
        ) : failed ? (
          <section className="order-done order-fail">
            <p>주문이 실패했습니다.</p>
            <strong>FAILED</strong>
            <span>{failed}</span>
            <div className="order-fail-actions">
              <button type="button" className="order-submit" onClick={() => setFailed('')}>
                다시 주문하기
              </button>
              <Link to="/cart">‹ BACK TO CART</Link>
            </div>
          </section>
        ) : (
          <>
            {error && <p className="cart-empty">{error}</p>}
            {loading && !error && <p className="cart-empty">주문을 준비하고 있습니다.</p>}
            {!loading && !error && items.length === 0 && (
              <p className="cart-empty">주문할 상품이 없습니다.</p>
            )}

            {items.length > 0 && (
              <form className="order-layout" onSubmit={handlePay}>
                <section>
                  {items.map((item) => (
                    <article key={productIdOf(item)} className="cart-item order-item">
                      <img src={item.product?.image} alt={item.product?.name || ''} />
                      <div>
                        <h2>{item.product?.name || '상품'}</h2>
                        <p>QTY {item.quantity}</p>
                      </div>
                      <strong>{formatPrice((item.product?.price || 0) * item.quantity)}</strong>
                    </article>
                  ))}
                </section>

                <section className="order-panel">
                  {FIELDS.map(([key, label]) => (
                    <label key={key} className="order-field">
                      <span>{label}</span>
                      <input
                        value={form[key]}
                        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                        required={key !== 'note'}
                        placeholder={key === 'phone' ? '01012345678' : undefined}
                        inputMode={key === 'phone' ? 'tel' : undefined}
                      />
                    </label>
                  ))}

                  <div className="order-pay">
                    <span>PAYMENT</span>
                    <div>
                      {['card', 'transfer'].map((id) => (
                        <button
                          key={id}
                          type="button"
                          className={form.paymentMethod === id ? 'is-active' : ''}
                          onClick={() => setForm((current) => ({ ...current, paymentMethod: id }))}
                        >
                          {id.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="order-sum order-total">
                    <span>TOTAL</span>
                    <strong>{formatPrice(total)}</strong>
                  </p>
                  <button type="submit" className="order-submit" disabled={placing}>
                    {placing ? '결제 중...' : '결제하기'}
                  </button>
                </section>
              </form>
            )}
          </>
        )}
      </main>

      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default Order
