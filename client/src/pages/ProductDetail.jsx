import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addProductToCart } from '../api/cart'
import { getAllProducts, getProduct } from '../api/products'
import CartIcon from '../components/home/CartIcon'
import HomeAccount from '../components/home/HomeAccount'
import HomeCategoriesNav from '../components/home/HomeCategoriesNav'
import { useAuthUser } from '../hooks/useAuthUser'
import { normalizeCategory } from '../utils/categories'
import './HomeMain.css'
import './ProductDetail.css'

function formatPrice(price) {
  return `₩ ${Number(price).toLocaleString('ko-KR')}`
}

function productKey(product) {
  return String(product?.name || '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
}

function isEarIncenseHolder(product) {
  const name = productKey(product)
  return name.includes('INCENSE_HOLDER_EAR') || (name.includes('INCENSE') && name.includes('EAR'))
}

function isLipsBrooch(product) {
  const name = productKey(product)
  return (
    name.includes('LIPS_BROOCH') ||
    name.includes('BROOCH_PEARL_LIPS') ||
    name.includes('PEARL_LIPS') ||
    (name.includes('LIPS') && name.includes('BROOCH'))
  )
}

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, isAdmin, logout } = useAuthUser()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [paying, setPaying] = useState(false)
  const [added, setAdded] = useState('')
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    setError('')
    setQuantity(1)
    setAdded('')
    setZoomed(false)

    getProduct(id)
      .then((data) => {
        setProduct(data)
        return getAllProducts().then((list) =>
          list.filter((item) => normalizeCategory(item.category) === normalizeCategory(data.category)),
        )
      })
      .then(setRelated)
      .catch((loadError) => {
        setProduct(null)
        setError(loadError.message)
      })
  }, [id])

  useEffect(() => {
    if (!zoomed) return undefined

    const handleKey = (event) => {
      if (event.key === 'Escape') setZoomed(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [zoomed])

  const index = related.findIndex((item) => item._id === id)
  const prev = related[index - 1]
  const next = related[index + 1]

  const handleAddToCart = async () => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }

    setAdding(true)
    setAdded('')

    try {
      await addProductToCart(product._id, quantity)
      setAdded('장바구니에 담았습니다.')
      window.dispatchEvent(new Event('cart-updated'))
    } catch (addError) {
      if (addError.code === 'NO_TOKEN') {
        navigate('/login')
        return
      }
      setAdded(addError.message)
    } finally {
      setAdding(false)
    }
  }

  const isHat = product && normalizeCategory(product.category) === 'hat'
  const isEar = product && isEarIncenseHolder(product)
  const isLips = product && isLipsBrooch(product)

  const handleCheckout = async () => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }

    setPaying(true)
    setAdded('')

    try {
      await addProductToCart(product._id, quantity)
      window.dispatchEvent(new Event('cart-updated'))
      navigate('/order')
    } catch (payError) {
      if (payError.code === 'NO_TOKEN') {
        navigate('/login')
        return
      }
      setAdded(payError.message)
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="home">
      <div className="home-ticker">
        <div className="home-ticker-track">
          {Array.from({ length: 24 }).map((_, item) => (
            <span key={item}>NEW COLLECTION</span>
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

      {error && <p className="detail-status">{error}</p>}
      {!error && !product && <p className="detail-status">상품을 불러오는 중입니다.</p>}

      {product && (
        <main className="detail">
          <section className="detail-visual">
            <button
              type="button"
              className="detail-arrow"
              disabled={!prev}
              onClick={() => prev && navigate(`/products/${prev._id}`)}
              aria-label="이전 상품"
            >
              ‹
            </button>
            <button
              type="button"
              className="detail-zoom-trigger"
              onClick={() => setZoomed(true)}
              aria-label={`${product.name} 이미지 확대`}
            >
              <img src={product.image} alt={product.name} />
            </button>
            <button
              type="button"
              className="detail-arrow"
              disabled={!next}
              onClick={() => next && navigate(`/products/${next._id}`)}
              aria-label="다음 상품"
            >
              ›
            </button>
            <div className="detail-360" aria-hidden="true">
              <span />
              <small>360</small>
            </div>
          </section>

          <section className="detail-panel">
            <div className="detail-panel-top">
              <Link to="/">‹ BACK TO SHOP</Link>
              <span>LIMITED EDITION LIST ›</span>
            </div>
            <div className="detail-heading">
              <h1>{product.name}</h1>
            </div>
            <div className="detail-row">
              <p className="detail-price">{formatPrice(product.price)}</p>
              <div className="detail-qty">
                <span>QUANTITY</span>
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                  −
                </button>
                <em>{quantity}</em>
                <button type="button" onClick={() => setQuantity((value) => value + 1)}>
                  +
                </button>
              </div>
            </div>
            <div className="detail-story">
              {isHat ? (
                <>
                  <p className="detail-kicker">VINTAGE CAP</p>
                  <p>
                    빈티지 무드를 기반으로 제작된 워시드 코튼 캡입니다. 자연스럽게 바랜 컬러와 부드러운
                    원단의 질감, 편안하게 떨어지는 실루엣이 특징입니다.
                  </p>
                  <p>
                    제품마다 각기 다른 자수와 패치 디테일을 더해 포인트를 주었으며, 캐주얼한 스타일링부터
                    스트리트 룩까지 다양하게 활용할 수 있습니다.
                  </p>
                  <p>
                    워싱 가공 특성상 제품마다 컬러와 질감에 미세한 차이가 있을 수 있으며, 이는 빈티지한
                    분위기를 위한 자연스러운 특징입니다.
                  </p>
                </>
              ) : isEar ? (
                <>
                  <p className="detail-kicker">INCENSE HOLDER</p>
                  <p>귀의 유기적인 곡선을 입체적으로 재해석한 인센스 홀더입니다.</p>
                  <p>
                    투명한 앰버 컬러와 부드럽게 흐르는 형태가 특징이며, 인센스를 사용하지 않을 때에도 하나의
                    오브제로 공간에 포인트를 더할 수 있습니다.
                  </p>
                  <p>
                    인센스 스틱을 홀더에 꽂아 사용할 수 있으며, 연기가 오브제 주변으로 자연스럽게 퍼지며
                    독특한 분위기를 만들어냅니다.
                  </p>
                </>
              ) : isLips ? (
                <>
                  <p className="detail-kicker">LIPS BROOCH</p>
                  <p>익숙한 신체의 형태를 작은 오브제로 재구성한 LIPS BROOCH.</p>
                  <p>
                    부드럽게 굴곡진 입술의 형태와 반투명한 레진이 만나, 보는 각도와 빛에 따라 미묘하게 다른
                    모습을 드러냅니다.
                  </p>
                  <p>
                    차갑게 빛나는 실버 디테일과 불완전한 유기적 형태의 대비를 통해 액세서리와 작은 조각품
                    사이의 경계를 표현합니다.
                  </p>
                  <p>옷, 가방, 패브릭 위에 부착하여 착용할 수 있습니다.</p>
                </>
              ) : (
                <>
                  <p>익숙한 신체의 형태를 작은 오브제로 재구성한 {product.name}.</p>
                  <p>
                    부드럽게 굴곡진 입술의 형태와 반투명한 레진이 만나, 보는 각도와 빛에 따라 미묘하게 다른
                    모습을 드러냅니다.
                  </p>
                  <p>
                    차갑게 빛나는 실버 디테일과 불완전한 유기적 형태의 대비를 통해 액세서리와 작은 조각품
                    사이의 경계를 표현합니다.
                  </p>
                  <p>옷, 가방, 패브릭 위에 부착하여 착용할 수 있습니다.</p>
                </>
              )}
            </div>
            <dl className="detail-meta">
              {isHat ? (
                <>
                  <div>
                    <dt>PRODUCT DETAILS</dt>
                    <dd>
                      <p className="detail-spec-row">
                        <span>Material</span>
                        Cotton 100%
                      </p>
                      <p className="detail-spec-row">
                        <span>Size</span>
                        One Size
                      </p>
                      <p className="detail-spec-row">
                        <span>Fit</span>
                        Unisex / Relaxed Fit
                      </p>
                      <p className="detail-spec-row">
                        <span>Closure</span>
                        Adjustable Back Strap
                      </p>
                      <p className="detail-spec-row">
                        <span>Detail</span>
                        Embroidery / Fabric Patch
                      </p>
                      <p className="detail-spec-row">
                        <span>Finish</span>
                        Vintage Washed
                      </p>
                    </dd>
                  </div>
                  <div>
                    <dt>SIZE</dt>
                    <dd>
                      Head Circumference — Approx. 55–60 cm
                      <br />
                      Brim Length — Approx. 7 cm
                      <br />
                      Crown Height — Approx. 12 cm
                      <br />
                      <br />
                      후면 스트랩을 이용해 머리 둘레에 맞게 사이즈 조절이 가능합니다.
                    </dd>
                  </div>
                  <div>
                    <dt>CARE</dt>
                    <dd>
                      형태와 워싱 컬러 유지를 위해 손세탁을 권장합니다.
                      <br />
                      표백제 및 건조기 사용을 피해주세요.
                      <br />
                      세탁 후에는 그늘에서 자연 건조해주세요.
                    </dd>
                  </div>
                  <div>
                    <dt>PLEASE NOTE</dt>
                    <dd>
                      워싱 및 자수 공정 특성상 제품마다 색상, 자수 위치, 원단의 주름과 워싱 정도에 미세한
                      차이가 발생할 수 있습니다. 모니터 환경에 따라 실제 제품의 색상이 다르게 보일 수
                      있습니다.
                    </dd>
                  </div>
                </>
              ) : isEar ? (
                <>
                  <div>
                    <dt>PRODUCT DETAILS</dt>
                    <dd>
                      <p className="detail-spec-row">
                        <span>Material</span>
                        Translucent Resin / Metal
                      </p>
                      <p className="detail-spec-row">
                        <span>Color</span>
                        Clear Amber / Silver
                      </p>
                      <p className="detail-spec-row">
                        <span>Type</span>
                        Stick Incense Holder
                      </p>
                      <p className="detail-spec-row">
                        <span>Finish</span>
                        Glossy / Translucent
                      </p>
                    </dd>
                  </div>
                  <div>
                    <dt>SIZE</dt>
                    <dd>Approx. 110 × 70 × 45 mm</dd>
                  </div>
                  <div>
                    <dt>HOW TO USE</dt>
                    <dd>
                      인센스 스틱을 홀더에 안정적으로 꽂은 후 점화해주세요.
                      <br />
                      불꽃이 완전히 꺼지고 연기만 발생하는 것을 확인한 후 사용해주세요.
                    </dd>
                  </div>
                  <div>
                    <dt>CARE</dt>
                    <dd>
                      사용 후 남은 재와 먼지는 부드러운 천으로 닦아주세요.
                      <br />
                      강한 충격과 고온에 장시간 노출되는 것을 피해주세요.
                    </dd>
                  </div>
                  <div>
                    <dt>PLEASE NOTE</dt>
                    <dd>
                      수작업 및 소재 특성상 제품마다 색상, 투명도와 표면의 형태에 미세한 차이가 있을 수
                      있습니다.
                    </dd>
                  </div>
                </>
              ) : isLips ? (
                <>
                  <div>
                    <dt>PRODUCT DETAILS</dt>
                    <dd>
                      <p className="detail-spec-row">
                        <span>Material</span>
                        Resin / Imitation Pearl / Silver-tone Metal
                      </p>
                      <p className="detail-spec-row">
                        <span>Color</span>
                        Clear Pink / Silver / Pearl
                      </p>
                      <p className="detail-spec-row">
                        <span>Closure</span>
                        Pin Fastening
                      </p>
                      <p className="detail-spec-row">
                        <span>Finish</span>
                        Glossy / Translucent
                      </p>
                    </dd>
                  </div>
                  <div>
                    <dt>SIZE</dt>
                    <dd>
                      Approx. 45 × 30 mm
                      <br />
                      측정 방법에 따라 약간의 오차가 발생할 수 있습니다.
                    </dd>
                  </div>
                  <div>
                    <dt>CARE</dt>
                    <dd>
                      충격이나 강한 압력에 의해 제품이 손상될 수 있으니 주의해주세요.
                      <br />
                      향수, 화장품 및 화학제품과의 직접적인 접촉을 피해주세요.
                      <br />
                      착용 후에는 부드러운 천으로 가볍게 닦아 보관해주세요.
                    </dd>
                  </div>
                  <div>
                    <dt>PLEASE NOTE</dt>
                    <dd>
                      소재 및 제작 공정 특성상 제품마다 투명도, 기포, 장식의 위치 등에 미세한 차이가 있을 수
                      있습니다. 이는 제품의 자연스러운 특징으로 불량에 해당하지 않습니다.
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt>DETAILS</dt>
                    <dd>
                      Translucent resin / Silver-tone metal
                      <br />
                      Hand-finished object
                      <br />
                      Pin fastening
                    </dd>
                  </div>
                  <div>
                    <dt>SIZE</dt>
                    <dd>Approx. 45 × 28 mm</dd>
                  </div>
                  <div>
                    <dt>CARE</dt>
                    <dd>
                      Avoid direct contact with water, perfume and chemicals.
                      <br />
                      Each piece may vary slightly in shape and transparency.
                    </dd>
                  </div>
                </>
              )}
            </dl>
            <button type="button" className="detail-soon" onClick={handleAddToCart} disabled={adding || paying}>
              {adding ? 'ADDING...' : 'ADD TO CART'}
            </button>
            {added && <p className="detail-added">{added}</p>}
            <button type="button" className="detail-notify" onClick={handleCheckout} disabled={adding || paying}>
              {paying ? 'CHECKOUT...' : 'CHECKOUT'}
            </button>
          </section>
        </main>
      )}

      {product && zoomed && (
        <div
          className="detail-zoom"
          role="dialog"
          aria-modal="true"
          aria-label="확대 이미지"
          onClick={() => setZoomed(false)}
        >
          <img src={product.image} alt={product.name} />
        </div>
      )}

      <footer className="home-footer">© ALL RIGHTS RESERVED</footer>
    </div>
  )
}

export default ProductDetail
