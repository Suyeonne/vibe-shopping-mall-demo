import { useEffect, useState } from 'react'

// 토큰으로 현재 유저를 불러오고, 로그아웃을 처리하는 훅
export function useAuthUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || '유저 정보를 불러오지 못했습니다.')
        }

        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return {
    user,
    loading,
    isAdmin: user?.user_type === 'admin',
    logout,
  }
}
