import { createContext } from 'react'
import type { AuthUser, ProfileUpdate } from '../api/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  error: string
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => Promise<void>
  saveProfile: (payload: ProfileUpdate) => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
