import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders, updateOrder } from '../../api/orders'
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

function itemLabel(items = []) {
  const first = items[0]?.name || '상품'
  return items.length > 1 ? `${first} 외 ${items.length - 1}건` : first
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('all')
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((error) => setMessage({ type: 'error', text: error.message }))
  }, [])

  const counts = useMemo(() => {
    const next = { all: orders.length }

    Object.keys(STATUS).forEach((id) => {
      next[id] = orders.filter((order) => order.status === id).length
    })

    return next
  }, [orders])

  const visible = useMemo(
    () => (status === 'all' ? orders : orders.filter((order) => order.status === status)),
    [orders, status],
  )

  const handleStatus = async (order, nextStatus) => {
    if (nextStatus === order.status) return

    setSavingId(order._id)
    setMessage({ type: '', text: '' })

    try {
      const updated = await updateOrder(order._id, { status: nextStatus })
      setOrders((current) =>
        current.map((item) =>
          item._id === order._id ? { ...item, status: updated.status } : item,
        ),
      )
      setMessage({ type: 'ok', text: '주문 상태를 변경했습니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSavingId('')
    }
  }

  return (
    <AdminShell title="주문 관리" subtitle={`전체 주문 ${orders.length}개`}>
      {message.text && <p className={`admin-message ${message.type}`}>{message.text}</p>}

      <section className="admin-stats admin-order-stats" aria-label="주문 현황">
        <button
          type="button"
          className={status === 'all' ? 'admin-stat is-active' : 'admin-stat'}
          onClick={() => setStatus('all')}
        >
          <span>전체</span>
          <strong>{counts.all}</strong>
        </button>
        {Object.entries(STATUS).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={status === id ? 'admin-stat is-active' : 'admin-stat'}
            onClick={() => setStatus(id)}
          >
            <span>{label}</span>
            <strong>{counts[id] || 0}</strong>
          </button>
        ))}
      </section>

      {visible.length === 0 ? (
        <p className="admin-empty">
          {orders.length === 0 ? '등록된 주문이 없습니다.' : '해당 상태의 주문이 없습니다.'}
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>주문번호</th>
                <th>상품</th>
                <th>주문자</th>
                <th>주소</th>
                <th>주문일시</th>
                <th>상태</th>
                <th>금액</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order._id}>
                  <td>
                    <img className="admin-thumb" src={order.items?.[0]?.image} alt="" />
                  </td>
                  <td className="admin-muted">{order.orderNumber}</td>
                  <td className="admin-product-name">{itemLabel(order.items)}</td>
                  <td>{order.user?.name || order.recipient || '-'}</td>
                  <td className="admin-address">{order.address || '-'}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <select
                      className="admin-status"
                      value={order.status}
                      disabled={savingId === order._id}
                      onChange={(event) => handleStatus(order, event.target.value)}
                    >
                      {Object.entries(STATUS).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatPrice(order.total)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link className="admin-btn-danger" to={`/orders/${order._id}`}>
                        상세
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  )
}

export default AdminOrders
