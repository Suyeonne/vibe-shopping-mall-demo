const STEPS = [
  { id: 'pending', label: '결제 대기' },
  { id: 'paid', label: '결제 완료' },
  { id: 'preparing', label: '상품 준비' },
  { id: 'shipped', label: '배송 중' },
  { id: 'delivered', label: '배송 완료' },
]

export const STATUS_LABEL = {
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '상품 준비',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소',
}

function OrderStatusTrack({ status, compact = false }) {
  const current = STATUS_LABEL[status] || status
  const index = STEPS.findIndex((step) => step.id === status)
  const cancelled = status === 'cancelled'

  if (compact) {
    return (
      <div className={`order-status-box${cancelled ? ' is-cancelled' : ''}`}>
        {current}
      </div>
    )
  }

  return (
    <section className={`order-track${cancelled ? ' is-cancelled' : ''}`}>
      <div className="order-track-head">
        <span>STATUS</span>
        <strong>{current}</strong>
      </div>

      {cancelled ? (
        <p className="order-track-note">이 주문은 취소되었습니다.</p>
      ) : (
        <ol className="order-track-steps">
          {STEPS.map((step, stepIndex) => {
            const done = index >= 0 && stepIndex < index
            const active = stepIndex === index
            return (
              <li
                key={step.id}
                className={`${done ? 'is-done' : ''}${active ? ' is-current' : ''}`.trim()}
              >
                {step.label}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default OrderStatusTrack
