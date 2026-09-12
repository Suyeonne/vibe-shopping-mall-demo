import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HomeShell from '../components/home/HomeShell'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setChecking(false)
      return
    }

    const checkToken = async () => {
      try {
        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '토큰이 유효하지 않습니다.')
        }

        localStorage.setItem('user', JSON.stringify(data))
        navigate('/', { replace: true })
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setChecking(false)
      }
    }

    checkToken()
  }, [navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    const email = form.email.trim()
    const password = form.password

    if (!email || !password) {
      setStatus({ type: 'error', message: '이메일과 비밀번호를 입력해 주세요.' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const text = await response.text()
      let data = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error('서버 응답을 읽을 수 없습니다. 서버가 실행 중인지 확인해 주세요.')
        }
      }

      if (!response.ok) {
        throw new Error(data.message || '로그인에 실패했습니다. 서버가 실행 중인지 확인해 주세요.')
      }

      if (!data.token) {
        throw new Error('토큰 발급에 실패했습니다.')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setDone(true)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || '서버에 연결할 수 없습니다.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <HomeShell>
      {checking ? null : (
        <form className="auth-panel" onSubmit={handleSubmit}>
          <div className="auth-head">
            <h1>Log in</h1>
            <Link to="/register">Sign up</Link>
          </div>

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="e-mail address"
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
              placeholder="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <div className="auth-actions">
            <button
              type="button"
              className="auth-link"
              onClick={() =>
                setStatus({ type: 'error', message: '비밀번호 찾기 기능은 준비 중입니다.' })
              }
            >
              Forgot password?
            </button>
          </div>

          {status.message && status.type === 'error' && (
            <p className="auth-error">{status.message}</p>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      )}

      {done && (
        <div className="auth-modal-backdrop">
          <div className="auth-modal">
            <h2>로그인 완료</h2>
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

export default Login
