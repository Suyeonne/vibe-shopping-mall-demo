import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useAdminGuard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      navigate('/login', { replace: true })
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '권한이 없습니다.')
        }

        if (data.user_type !== 'admin') {
          navigate('/', { replace: true })
          return
        }

        setUser(data)
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return { user, loading, logout }
}
