import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '../../api/orders'
import AdminShell from '../../components/admin/AdminShell'

const STATUS = {
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '상품 준비',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소',
}

function formatPrice(price) {
  return `₩${Number(price).toLocaleString('ko-KR')}`
}

function itemLabel(items = []) {
  const first = items[0]?.name || '상품'
  return items.length > 1 ? `${first} 외 ${items.length - 1}건` : first
}

function Admin() {
  const [productTotal, setProductTotal] = useState(0)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [productResponse, nextOrders] = await Promise.all([
        fetch('/api/products?page=1', { cache: 'no-store' }),
        getOrders(),
      ])
      const productData = await productResponse.json()

      if (!productResponse.ok) {
        throw new Error(productData.message || '상품을 불러오지 못했습니다.')
      }

      const list = Array.isArray(productData) ? productData : productData.products
      setProductTotal(productData.total || (Array.isArray(list) ? list.length : 0))
      setOrders(nextOrders)
    }

    load().catch((loadError) => setError(loadError.message))
  }, [])

  const stats = useMemo(() => {
    const active = orders.filter((order) => order.status !== 'cancelled')
    const needAction = orders.filter((order) =>
      ['pending', 'paid', 'preparing'].includes(order.status),
    )

    return {
      orders: orders.length,
      needAction: needAction.length,
      revenue: active.reduce((sum, order) => sum + (order.total || 0), 0),
    }
  }, [orders])

  const recent = orders.slice(0, 5)

  return (
    <AdminShell sidebar={false} title="대시보드" subtitle="쇼핑몰 운영 현황">
      {error && <p className="admin-message error">{error}</p>}

      <section className="admin-stats">
        <article className="admin-stat">
          <span>등록 상품</span>
          <strong>{productTotal}</strong>
        </article>
        <article className="admin-stat">
          <span>전체 주문</span>
          <strong>{stats.orders}</strong>
        </article>
        <article className="admin-stat">
          <span>처리 필요</span>
          <strong>{stats.needAction}</strong>
        </article>
        <article className="admin-stat">
          <span>총 매출</span>
          <strong>{formatPrice(stats.revenue)}</strong>
        </article>
      </section>

      <section className="admin-menus">
        <Link to="/admin/products" className="admin-menu-card">
          <h2>상품 관리</h2>
          <p>상품 등록, 수정, 삭제를 관리합니다.</p>
        </Link>
        <Link to="/admin/orders" className="admin-menu-card">
          <h2>주문 관리</h2>
          <p>전체 주문을 확인하고 배송 상태를 변경합니다.</p>
        </Link>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>최근 주문</h2>
          <Link to="/admin/orders">전체 보기</Link>
        </div>

        {recent.length === 0 ? (
          <p className="admin-empty">최근 주문이 없습니다.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>상품</th>
                  <th>주문자</th>
                  <th>상태</th>
                  <th>금액</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order._id}>
                    <td className="admin-muted">{order.orderNumber}</td>
                    <td className="admin-product-name">{itemLabel(order.items)}</td>
                    <td>{order.user?.name || order.recipient || '-'}</td>
                    <td>{STATUS[order.status] || order.status}</td>
                    <td>{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  )
}

export default Admin
