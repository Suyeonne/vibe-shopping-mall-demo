import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllProducts } from '../api/products'
import CartIcon from '../components/home/CartIcon'
import HomeAccount from '../components/home/HomeAccount'
import HomeCategoriesNav from '../components/home/HomeCategoriesNav'
import { useAuthUser } from '../hooks/useAuthUser'
import { categoryLabel, normalizeCategory } from '../utils/categories'
import './HomeMain.css'

function formatPrice(price) {
  return `₩${Number(price).toLocaleString('ko-KR')}`
}

function Category({ category }) {
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const title = categoryLabel(category)

  useEffect(() => {
    setLoading(true)
    setError('')

    getAllProducts()
      .then((list) =>
        list
          .filter((product) => normalizeCategory(product.category) === category)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      )
      .then(setProducts)
      .catch((loadError) => {
        setProducts([])
        setError(loadError.message)
      })
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="home">
      <div className="home-ticker">
        <div className="home-ticker-track">
          {Array.from({ length: 24 }).map((_, index) => (
            <span key={index}>NEW COLLECTION</span>
          ))}
        </div>
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

      <Link to="/" className="home-title-wrap">
        <span className="home-star" aria-hidden="true">
          ✦
        </span>
        <h1 className="home-title">
          <img src="/still-tired-title.png" alt="STILL TIRED" />
        </h1>
      </Link>

      <main className="home-collection-page">
        <h2>{title}</h2>
        {error && <p className="home-empty">{error}</p>}
        {loading && <p className="home-empty">상품을 불러오는 중입니다.</p>}
        {!loading && !error && products.length === 0 && (
          <p className="home-empty">상품이 없습니다.</p>
        )}
        {!loading && !error && products.length > 0 && (
          <div className="home-collection-grid">
            {products.map((product) => (
              <Link key={product._id} className="home-collection-item" to={`/products/${product._id}`}>
                <div className="home-collection-media">
                  <img src={product.image} alt={product.name} />
                </div>
                <h2>{product.name}</h2>
                <p>{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default Category
