import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CloudinaryImageField from '../../components/CloudinaryImageField'
import AdminShell from '../../components/admin/AdminShell'
import { createProduct, updateProduct } from '../../api/products'
import { normalizeCategory } from '../../utils/categories'

const EMPTY_FORM = {
  syu: '',
  name: '',
  price: '',
  category: 'hat',
  image: '',
  description: '',
}

function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!isEdit) return

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`, { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '상품을 불러오지 못했습니다.')
        }

        setForm({
          syu: data.syu,
          name: data.name,
          price: String(data.price),
          category: normalizeCategory(data.category),
          image: data.image,
          description: data.description || '',
        })
      } catch (error) {
        setMessage({ type: 'error', text: error.message })
      }
    }

    fetchProduct()
  }, [id, isEdit])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage({ type: '', text: '' })

    const payload = {
      syu: form.syu.trim(),
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      image: form.image.trim(),
      description: form.description.trim(),
    }

    if (!payload.syu || !payload.name || form.price === '' || Number.isNaN(payload.price)) {
      setMessage({ type: 'error', text: 'syu, 상품이름, 가격은 필수입니다.' })
      return
    }

    if (!payload.image) {
      setMessage({ type: 'error', text: '이미지를 추가한 뒤 완료를 눌러 업로드해 주세요.' })
      return
    }

    setSaving(true)

    try {
      if (isEdit) {
        await updateProduct(id, payload)
      } else {
        await createProduct(payload)
      }

      navigate('/admin/products')
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || '서버에 연결할 수 없습니다.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell
      title={isEdit ? '상품 수정' : '새 상품 등록'}
      subtitle="필수값은 SYU, 상품이름, 가격, 카테고리, 이미지입니다."
    >
      <form className="admin-form" onSubmit={handleSubmit}>
        <label className="admin-field">
          <span>SYU</span>
          <input name="syu" value={form.syu} onChange={handleChange} required />
        </label>
        <label className="admin-field admin-field-wide">
          <span>상품이름</span>
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label className="admin-field">
          <span>가격</span>
          <input
            name="price"
            type="number"
            min="0"
            value={form.price}
            onChange={handleChange}
            required
          />
        </label>
        <label className="admin-field">
          <span>카테고리</span>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="hat">모자</option>
            <option value="object">오브제</option>
          </select>
        </label>
        <div className="admin-field admin-field-full">
          <span>이미지</span>
          <CloudinaryImageField
            value={form.image}
            onChange={(image) => setForm((prev) => ({ ...prev, image }))}
          />
        </div>
        <label className="admin-field admin-field-full">
          <span>설명</span>
          <textarea name="description" value={form.description} onChange={handleChange} />
        </label>
        <div className="admin-actions">
          <button className="admin-btn" type="submit" disabled={saving}>
            {saving ? '저장 중...' : isEdit ? '상품 수정' : '상품 등록'}
          </button>
          <Link className="admin-btn-ghost" to="/admin/products">
            취소
          </Link>
        </div>
      </form>

      {message.text && <p className={`admin-message ${message.type}`}>{message.text}</p>}
    </AdminShell>
  )
}

export default ProductForm
