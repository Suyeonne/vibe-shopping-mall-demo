import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllProducts } from '../api/products'
import CartIcon from '../components/home/CartIcon'
import HomeAccount from '../components/home/HomeAccount'
import HomeCategoriesNav from '../components/home/HomeCategoriesNav'
import { useAuthUser } from '../hooks/useAuthUser'
import { CATEGORIES, categoryLabel, normalizeCategory } from '../utils/categories'
import './HomeMain.css'

function formatPrice(price) {
  return `₩${Number(price).toLocaleString('ko-KR')}`
}

function HomeMain() {
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()
  const trackRef = useRef(null)
  const [products, setProducts] = useState([])
  const [tab, setTab] = useState('hat')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getAllProducts()
      .then((list) =>
        setProducts(
          [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        ),
      )
      .catch((loadError) => setError(loadError.message))
  }, [])

  const counts = useMemo(
    () =>
      CATEGORIES.reduce((result, item) => {
        result[item.id] = products.filter((product) => normalizeCategory(product.category) === item.id).length
        return result
      }, {}),
    [products],
  )

  const visible = products.filter((product) => {
    const matchesTab = normalizeCategory(product.category) === tab
    const matchesQuery = product.name.toLowerCase().includes(query.trim().toLowerCase())
    return matchesTab && matchesQuery
  })

  const slide = (direction) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector('.home-card')
    const distance = card ? card.getBoundingClientRect().width + 16 : track.clientWidth
    track.scrollBy({ left: direction * distance, behavior: 'smooth' })
  }

  return (
    <div className="home home-lock">
      <div className="home-ticker">
        <div className="home-ticker-track">
          {Array.from({ length: 24 }).map((_, index) => (
            <span key={index}>NEW COLLECTION</span>
          ))}
        </div>
      </div>

      <header className="home-top">
        <nav className="home-nav">
          <HomeCategoriesNav onSelect={setTab} />
          <Link to="/new-collection">NEW COLLECTION</Link>
          <Link to="/about">ABOUT</Link>
        </nav>
        <div className="home-brand-side">
          <HomeAccount user={user} loading={authLoading} isAdmin={isAdmin} logout={logout} />
          <CartIcon />
        </div>
      </header>

      <Link to="/" className="home-title-wrap">
        <span className="home-star" aria-hidden="true">
          ✦
        </span>
        <h1 className="home-title">
          <img src="/still-tired-title.png" alt="STILL TIRED" />
        </h1>
      </Link>

      <div className="home-tabs">
        {CATEGORIES.map((item) => (
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

      <div className="home-tools">
        <label className="home-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="SEARCH"
          />
        </label>
        <div className="home-limited">
          <span>LIMITED EDITION LIST</span>
          <span className="home-star" aria-hidden="true">
            ✦
          </span>
        </div>
      </div>

      <section className="home-slider">
        <button type="button" className="home-arrow" onClick={() => slide(-1)} aria-label="이전 상품">
          ‹
        </button>
        <div className="home-track" ref={trackRef}>
          {error && <p className="home-empty">{error}</p>}
          {!error && visible.length === 0 && <p className="home-empty">상품이 없습니다.</p>}
          {visible.map((product) => (
            <article key={product._id} className="home-card">
              <div className="home-card-meta">
                <span>{categoryLabel(product.category)}</span>
                <span>{formatPrice(product.price)}</span>
              </div>
              <Link className="home-card-media" to={`/products/${product._id}`}>
                <img src={product.image} alt={product.name} />
              </Link>
              <Link className="home-more" to={`/products/${product._id}`}>
                {product.name}
              </Link>
            </article>
          ))}
        </div>
        <button type="button" className="home-arrow" onClick={() => slide(1)} aria-label="다음 상품">
          ›
        </button>
      </section>

      <footer className="home-footer">
        © ALL RIGHTS RESERVED
      </footer>
    </div>
  )
}

export default HomeMain
