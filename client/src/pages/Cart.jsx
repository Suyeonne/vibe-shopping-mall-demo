import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyCart, saveCartItems } from '../api/cart'
import CartIcon from '../components/home/CartIcon'
import HomeAccount from '../components/home/HomeAccount'
import HomeCategoriesNav from '../components/home/HomeCategoriesNav'
import { useAuthUser } from '../hooks/useAuthUser'
import './HomeMain.css'
import './Cart.css'

function formatPrice(price) {
  return `₩${Number(price).toLocaleString('ko-KR')}`
}

function productIdOf(item) {
  return String(item.product?._id || item.product || '')
}

function Cart() {
  const navigate = useNavigate()
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()
  const [cartId, setCartId] = useState('')
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadCart = async () => {
      try {
        const mine = await getMyCart()
        const nextItems = mine?.items || []
        setCartId(mine?._id || '')
        setItems(nextItems)
        setSelected(nextItems.map(productIdOf).filter(Boolean))
      } catch (loadError) {
        if (loadError.code === 'NO_TOKEN') return
        setError(loadError.message)
      }
    }

    loadCart()
  }, [user])

  const selectedItems = useMemo(
    () => items.filter((item) => selected.includes(productIdOf(item))),
    [items, selected],
  )

  const total = selectedItems.reduce((sum, item) => {
    const price = item.product?.price || 0
    return sum + price * item.quantity
  }, 0)

  const allSelected = items.length > 0 && selected.length === items.length

  const toggleAll = () => {
    setSelected(allSelected ? [] : items.map(productIdOf).filter(Boolean))
  }

  const toggleOne = (id) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  const removeProducts = async (productIds) => {
    if (!cartId || productIds.length === 0) return

    setBusy(true)
    setError('')

    try {
      const removeSet = new Set(productIds.map(String))
      const remaining = items.filter((item) => !removeSet.has(productIdOf(item)))
      const saved = await saveCartItems(cartId, remaining)
      const nextItems = saved.items || remaining
      setItems(nextItems)
      setSelected((current) => current.filter((id) => !removeSet.has(id)))
      window.dispatchEvent(new Event('cart-updated'))
    } catch (removeError) {
      setError(removeError.message)
    } finally {
      setBusy(false)
    }
  }

  const goCheckout = () => {
    if (selectedItems.length === 0) {
      setError('결제할 상품을 선택해 주세요.')
      return
    }

    navigate('/order', { state: { productIds: selectedItems.map(productIdOf) } })
  }

  const changeQuantity = async (id, nextQuantity) => {
    const quantity = Math.max(1, nextQuantity)
    if (!cartId || busy) return

    const current = items.find((item) => productIdOf(item) === id)
    if (!current || current.quantity === quantity) return

    setBusy(true)
    setError('')

    try {
      const nextItems = items.map((item) =>
        productIdOf(item) === id ? { ...item, quantity } : item,
      )
      const saved = await saveCartItems(cartId, nextItems)
      setItems(saved.items || nextItems)
      window.dispatchEvent(new Event('cart-updated'))
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setBusy(false)
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

      <main className="cart-page">
        <div className="cart-head">
          <h1>CART</h1>
          <Link to="/">‹ BACK TO SHOP</Link>
        </div>

        {error && <p className="cart-empty">{error}</p>}
        {!error && items.length === 0 && <p className="cart-empty">장바구니가 비어 있습니다.</p>}

        {items.length > 0 && (
          <div className="cart-toolbar">
            <label className="cart-check">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <span>전체 선택</span>
            </label>
            <button
              type="button"
              className="cart-remove"
              disabled={busy || selected.length === 0}
              onClick={() => removeProducts(selected)}
            >
              선택 삭제
            </button>
          </div>
        )}

        {items.map((item) => {
          const id = productIdOf(item)
          return (
            <article key={id} className="cart-item">
              <label className="cart-check">
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  onChange={() => toggleOne(id)}
                />
              </label>
              <img src={item.product?.image} alt={item.product?.name || ''} />
              <h2>{item.product?.name || '상품'}</h2>
              <div className="cart-qty">
                <span>QTY</span>
                <button
                  type="button"
                  disabled={busy || item.quantity <= 1}
                  onClick={() => changeQuantity(id, item.quantity - 1)}
                  aria-label="수량 줄이기"
                >
                  −
                </button>
                <em>{item.quantity}</em>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => changeQuantity(id, item.quantity + 1)}
                  aria-label="수량 늘리기"
                >
                  +
                </button>
              </div>
              <strong>{formatPrice((item.product?.price || 0) * item.quantity)}</strong>
            </article>
          )
        })}

        {items.length > 0 && (
          <div className="cart-checkout">
            <p className="cart-total">
              선택 합계 <span>{formatPrice(total)}</span>
            </p>
            <button type="button" onClick={goCheckout} disabled={busy || selectedItems.length === 0}>
              결제하기
            </button>
          </div>
        )}
      </main>

      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default Cart
