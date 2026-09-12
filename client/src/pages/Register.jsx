import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HomeShell from '../components/home/HomeShell'
import './Auth.css'

const TERMS = {
  terms: {
    title: '이용약관',
    body: '본 쇼핑몰 서비스 이용과 관련된 기본 약관입니다. 회원은 서비스 이용 시 관련 법령과 운영 정책을 준수해야 합니다.',
  },
  privacy: {
    title: '개인정보처리방침',
    body: '회원가입 시 수집하는 이름, 이메일 정보는 회원 관리와 주문 처리 목적으로만 사용되며, 관련 법령에 따라 안전하게 보관됩니다.',
  },
}

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [view, setView] = useState(null)
  const [done, setDone] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const allChecked =
    agreements.terms && agreements.privacy && agreements.marketing

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleAgreement = (key) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleAll = () => {
    const next = !allChecked
    setAgreements({
      terms: next,
      privacy: next,
      marketing: next,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    const passwordRule = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

    if (!passwordRule.test(form.password)) {
      setStatus({
        type: 'error',
        message: '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.',
      })
      return
    }

    if (form.password !== form.passwordConfirm) {
      setStatus({ type: 'error', message: '비밀번호가 일치하지 않습니다.' })
      return
    }

    // 필수 약관 미동의면 서버로 보내지 않음
    if (!agreements.terms || !agreements.privacy) {
      setStatus({ type: 'error', message: '필수 약관에 동의해 주세요.' })
      return
    }

    setLoading(true)

    // 컨트롤러 createUser가 받는 필드로 맞춤
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      user_type: 'customer',
    }

    try {
      // POST /api/users → server/routes/users.js → createUser
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다.')
      }

      setDone(true)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <HomeShell>
      <form className="auth-panel" onSubmit={handleSubmit}>
        <div className="auth-head">
          <h1>Sign up</h1>
          <Link to="/login">Log in</Link>
        </div>

        <label className="auth-field">
          <span>Name</span>
          <input
            type="text"
            name="name"
            placeholder="이름을 입력하세요"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="이메일을 입력하세요"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            placeholder="비밀번호를 입력하세요"
            value={form.password}
            onChange={handleChange}
            required
          />
          <small>8자 이상, 영문, 숫자, 특수문자 포함</small>
        </label>

        <label className="auth-field">
          <span>Confirm</span>
          <input
            type="password"
            name="passwordConfirm"
            placeholder="비밀번호를 다시 입력하세요"
            value={form.passwordConfirm}
            onChange={handleChange}
            required
          />
        </label>

        <div className="auth-agree">
          <label>
            <span className="auth-agree-check">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              전체 동의
            </span>
          </label>
          <div className="auth-agree-row">
            <label className="auth-agree-check">
              <input
                type="checkbox"
                checked={agreements.terms}
                onChange={() => toggleAgreement('terms')}
              />
              이용약관 동의 (필수)
            </label>
            <button type="button" className="auth-link" onClick={() => setView('terms')}>
              보기
            </button>
          </div>
          <div className="auth-agree-row">
            <label className="auth-agree-check">
              <input
                type="checkbox"
                checked={agreements.privacy}
                onChange={() => toggleAgreement('privacy')}
              />
              개인정보처리방침 동의 (필수)
            </label>
            <button type="button" className="auth-link" onClick={() => setView('privacy')}>
              보기
            </button>
          </div>
          <label>
            <span className="auth-agree-check">
              <input
                type="checkbox"
                checked={agreements.marketing}
                onChange={() => toggleAgreement('marketing')}
              />
              마케팅 정보 수신 동의 (선택)
            </span>
          </label>
        </div>

        {status.message && status.type === 'error' && (
          <p className="auth-error">{status.message}</p>
        )}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? '가입 중...' : 'Sign up'}
        </button>
      </form>

      {view && (
        <div className="auth-modal-backdrop" onClick={() => setView(null)}>
          <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <h2>{TERMS[view].title}</h2>
            <p>{TERMS[view].body}</p>
            <button type="button" onClick={() => setView(null)}>
              확인
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="auth-modal-backdrop">
          <div className="auth-modal">
            <h2>회원가입 완료</h2>
            <p>메인 페이지로 이동합니다.</p>
            <button type="button" onClick={() => navigate('/')}>
              확인
            </button>
          </div>
        </div>
      )}
    </HomeShell>
  )
}

export default Register
