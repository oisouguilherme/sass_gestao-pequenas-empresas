import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, setAccessToken, getAccessToken } from '@/lib/api'
import type { AuthUser } from '@/lib/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  reloadUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get<AuthUser>('/auth/me')
      setUser(data)
    } catch {
      setUser(null)
    }
  }, [])

  // Silent refresh on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.post<{ accessToken: string }>(
          '/auth/refresh',
          {},
        )
        if (!mounted) return
        setAccessToken(data.accessToken)
        await loadMe()
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [loadMe])

  const login = useCallback(
    async (email: string, senha: string) => {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
        '/auth/login',
        { email, senha },
      )
      setAccessToken(data.accessToken)
      setUser(data.user)
      await loadMe()
    },
    [loadMe],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    }
    setAccessToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      reloadUser: loadMe,
    }),
    [user, loading, login, logout, loadMe],
  )

  // Keep token sync log
  void getAccessToken

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
