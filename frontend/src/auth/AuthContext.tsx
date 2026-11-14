import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  getMe,
  loginWithGoogle as loginGoogleRequest,
  logout as logoutRequest,
  updateProfile as updateProfileRequest,
  type AuthUser,
} from '../api/auth'
import { AuthContext, type AuthStatus } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const next = await getMe()
      setUser(next)
      setStatus(next ? 'authenticated' : 'anonymous')
      setError('')
    } catch (loadError) {
      setUser(null)
      setStatus('anonymous')
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Не удалось проверить авторизацию',
      )
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getMe()
      .then((next) => {
        if (cancelled) return
        setUser(next)
        setStatus(next ? 'authenticated' : 'anonymous')
        setError('')
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setUser(null)
        setStatus('anonymous')
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Не удалось проверить авторизацию',
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      const next = await loginGoogleRequest(credential)
      setUser(next)
      setStatus('authenticated')
      setError('')
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Не удалось войти через Google',
      )
      throw loginError
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
      setStatus('anonymous')
      setError('')
    }
  }, [])

  const saveProfile = useCallback(
    async (payload: Parameters<typeof updateProfileRequest>[0]) => {
      const next = await updateProfileRequest(payload)
      setUser(next)
    },
    [],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        loginWithGoogle,
        logout,
        saveProfile,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
