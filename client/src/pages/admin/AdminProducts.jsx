import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminShell from '../../components/admin/AdminShell'
import { deleteProduct } from '../../api/products'

const CATEGORY_LABEL = {
  hat: '모자',
  brooch: '모자',
  perfume: '모자',
  object: '오브제',
  incense: '오브제',
}

function formatPrice(price) {
  return `₩${Number(price).toLocaleString('ko-KR')}`
}

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadProducts = async (nextPage = page) => {
    const response = await fetch(`/api/products?page=${nextPage}`, { cache: 'no-store' })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '상품을 불러오지 못했습니다.')
    }

    const list = Array.isArray(data) ? data : data.products
    setProducts(Array.isArray(list) ? list : [])
    setPage(data.page || 1)
    setTotal(data.total || (Array.isArray(list) ? list.length : 0))
    setTotalPages(data.totalPages || 1)
  }

  useEffect(() => {
    loadProducts(1).catch((error) => {
      setMessage({ type: 'error', text: error.message })
    })
  }, [])

  const handleDelete = async (product) => {
    if (!window.confirm(`"${product.name}" 상품을 삭제할까요?`)) return

    setMessage({ type: '', text: '' })

    try {
      await deleteProduct(product._id)

      const nextPage = products.length === 1 && page > 1 ? page - 1 : page
      await loadProducts(nextPage)
      setMessage({ type: 'ok', text: '상품을 삭제했습니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <AdminShell
      title="상품 관리"
      subtitle={`등록된 상품 ${total}개`}
      actions={
        <Link to="/admin/products/new" className="admin-btn">
          새 상품 등록하기
        </Link>
      }
    >
      {message.text && <p className={`admin-message ${message.type}`}>{message.text}</p>}

      {!(Array.isArray(products) && products.length) ? (
        <p className="admin-empty">등록된 상품이 없습니다.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>SYU</th>
                <th>상품이름</th>
                <th>가격</th>
                <th>카테고리</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(products) ? products : []).map((product) => (
                <tr key={product._id}>
                  <td>
                    <img className="admin-thumb" src={product.image} alt="" />
                  </td>
                  <td className="admin-muted">{product.syu}</td>
                  <td className="admin-product-name">{product.name}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{CATEGORY_LABEL[product.category] || product.category}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link className="admin-btn-danger" to={`/admin/products/${product._id}`}>
                        수정
                      </Link>
                      <button
                        className="admin-btn-danger"
                        type="button"
                        onClick={() => handleDelete(product)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="admin-pagination">
          <button
            className="admin-btn-ghost"
            type="button"
            disabled={page <= 1}
            onClick={() => loadProducts(page - 1)}
          >
            이전
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            className="admin-btn-ghost"
            type="button"
            disabled={page >= totalPages}
            onClick={() => loadProducts(page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </AdminShell>
  )
}

export default AdminProducts
