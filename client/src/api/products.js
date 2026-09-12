async function readJson(response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('서버 응답을 읽을 수 없습니다. 서버가 실행 중인지 확인해 주세요.')
  }
}

// GET /api/products → routes/products.js getProducts
export async function getAllProducts(category) {
  const products = []
  let page = 1
  let totalPages = 1

  do {
    const params = new URLSearchParams({ page: String(page) })
    if (category) params.set('category', category)

    const response = await fetch(`/api/products?${params}`, { cache: 'no-store' })
    const data = await readJson(response)

    if (!response.ok) {
      throw new Error(data.message || '상품을 불러오지 못했습니다.')
    }

    const list = Array.isArray(data) ? data : data.products
    if (Array.isArray(list)) {
      products.push(...list)
    }

    totalPages = data.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return products
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

// GET /api/products/:id → routes/products.js getProductById
export async function getProduct(id) {
  const response = await fetch(`/api/products/${id}`, { cache: 'no-store' })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(data.message || '상품을 불러오지 못했습니다.')
  }

  return data
}

// POST /api/products → routes/products.js createProduct
export async function createProduct(product) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(product),
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(data.message || '상품 등록에 실패했습니다.')
  }

  return data
}

// PUT /api/products/:id → routes/products.js updateProduct
export async function updateProduct(id, product) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(product),
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(data.message || '상품 수정에 실패했습니다.')
  }

  return data
}

export async function deleteProduct(id) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(data.message || '삭제에 실패했습니다.')
  }

  return data
}
