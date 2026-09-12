async function readJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error('주문 API에 연결하지 못했습니다. 서버를 다시 실행해 주세요.')
  }
}

function authHeader() {
  const token = localStorage.getItem('token')
  if (!token) {
    const error = new Error('로그인이 필요합니다.')
    error.code = 'NO_TOKEN'
    throw error
  }
  return { Authorization: `Bearer ${token}` }
}

async function fetchOrders(search = '') {
  const response = await fetch(`/api/orders${search}`, {
    cache: 'no-store',
    headers: authHeader(),
  })
  const data = await readJson(response)
  if (!response.ok) throw new Error(data.message || '주문 목록을 불러오지 못했습니다.')
  return Array.isArray(data) ? data : []
}

export function getOrders() {
  return fetchOrders()
}

export function getMyOrders() {
  return fetchOrders('?mine=1')
}

export async function getOrder(id) {
  const response = await fetch(`/api/orders/${id}`, {
    cache: 'no-store',
    headers: authHeader(),
  })
  const data = await readJson(response)
  if (!response.ok) throw new Error(data.message || '주문을 불러오지 못했습니다.')
  return data
}

export async function updateOrder(id, body) {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await readJson(response)
  if (!response.ok) throw new Error(data.message || '주문을 수정하지 못했습니다.')
  return data
}
