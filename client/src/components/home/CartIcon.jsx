import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../../pages/Cart.css'

function cartCount(carts, userId) {
  const mine = (carts || []).find((cart) => String(cart.user?._id || cart.user) === String(userId))
  if (!mine) return 0
  return mine.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}

function CartIcon() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const saved = localStorage.getItem('user')
    if (!token || !saved) {
      setCount(0)
      return
    }

    let userId = ''
    try {
      userId = JSON.parse(saved)._id
    } catch {
      setCount(0)
      return
    }

    const loadCount = async () => {
      try {
        const response = await fetch('/api/carts', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        })
        const text = await response.text()
        let data = []
        try {
          data = text ? JSON.parse(text) : []
        } catch {
          setCount(0)
          return
        }
        if (!response.ok || !Array.isArray(data)) {
          setCount(0)
          return
        }
        setCount(cartCount(data, userId))
      } catch {
        setCount(0)
      }
    }

    loadCount()
    window.addEventListener('cart-updated', loadCount)
    return () => window.removeEventListener('cart-updated', loadCount)
  }, [])

  return (
    <Link to="/cart" className="cart-icon" aria-label={`장바구니 ${count}개`}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M6 7h15l-1.5 9h-12L5 4H2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="20" r="1.2" fill="currentColor" />
        <circle cx="18" cy="20" r="1.2" fill="currentColor" />
      </svg>
      <span>{count}</span>
    </Link>
  )
}

export default CartIcon
