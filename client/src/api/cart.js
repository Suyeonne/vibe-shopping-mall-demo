async function readBody(response) {
  const text = await response.text()

  try {
    return { data: text ? JSON.parse(text) : {}, html: false }
  } catch {
    return { data: {}, html: true }
  }
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

function requireToken() {
  const token = localStorage.getItem('token')
  if (!token) {
    const error = new Error('로그인이 필요합니다.')
    error.code = 'NO_TOKEN'
    throw error
  }
  return token
}

function currentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return user?._id || user?.id || ''
  } catch {
    return ''
  }
}

function productIdOf(item) {
  return String(item.product?._id || item.product || '')
}

export async function getMyCart() {
  const token = requireToken()
  const response = await fetch('/api/carts', {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await readBody(response)

  if (body.html) {
    throw new Error('장바구니 API에 연결하지 못했습니다. 서버를 다시 실행해 주세요.')
  }

  if (!response.ok || !Array.isArray(body.data)) {
    throw new Error(body.data.message || '장바구니를 불러오지 못했습니다.')
  }

  const userId = currentUserId()
  const mine = body.data.find((cart) => String(cart.user?._id || cart.user) === String(userId))
  return mine || null
}

export async function saveCartItems(cartId, items) {
  const token = requireToken()
  const payload = items.map((item) => ({
    product: item.product?._id || item.product,
    quantity: item.quantity,
  }))

  const response = await fetch(cartId ? `/api/carts/${cartId}` : '/api/carts', {
    method: cartId ? 'PUT' : 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ items: payload }),
  })
  const body = await readBody(response)

  if (body.html) {
    throw new Error('장바구니 API에 연결하지 못했습니다. 서버를 다시 실행해 주세요.')
  }

  if (!response.ok) {
    throw new Error(body.data.message || '장바구니를 저장하지 못했습니다.')
  }

  return body.data
}

export async function removeCartProducts(productIds) {
  const cart = await getMyCart()
  if (!cart) return null

  const removeSet = new Set(productIds.map(String))
  const remaining = (cart.items || []).filter((item) => !removeSet.has(productIdOf(item)))
  const saved = await saveCartItems(cart._id, remaining)
  window.dispatchEvent(new Event('cart-updated'))
  return saved
}

// GET /api/carts → 내 장바구니를 찾은 뒤 POST 또는 PUT으로 상품을 담음
export async function addProductToCart(productId, quantity) {
  const token = requireToken()
  const mine = await getMyCart()
  const items = (mine?.items || []).map((item) => ({
    product: item.product?._id || item.product,
    quantity: item.quantity,
  }))
  const existing = items.find((item) => String(item.product) === String(productId))

  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({ product: productId, quantity })
  }

  const saved = await saveCartItems(mine?._id, items)
  window.dispatchEvent(new Event('cart-updated'))
  return saved
}
