import { apiBaseUrl } from '../config'

export type AuthIdentity = {
  provider: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

export type AuthUser = {
  id: string
  display_name: string
  avatar_url: string | null
  profile: Record<string, unknown>
  identities: AuthIdentity[]
}

export type ProfileUpdate = {
  display_name?: string
  avatar_url?: string
  profile?: Record<string, unknown>
}

async function readError(response: Response): Promise<string> {
  const text = await response.text().catch(() => '')
  try {
    const payload = JSON.parse(text) as {
      detail?: { message?: string } | string
    }
    if (typeof payload.detail === 'string') return payload.detail
    if (payload.detail?.message) return payload.detail.message
  } catch {
    // keep raw text
  }
  return text.trim().slice(0, 500) || `Ошибка API (${response.status})`
}

export function googleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}

export function telegramLoginUrl(): string {
  return `${apiBaseUrl}/api/v1/auth/telegram/start`
}

export async function getMe(): Promise<AuthUser | null> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
    credentials: 'include',
  })
  if (response.status === 401) return null
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as AuthUser
}

export async function loginWithGoogle(credential: string): Promise<AuthUser> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as AuthUser
}

export async function logout(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok && response.status !== 401) {
    throw new Error(await readError(response))
  }
}

export async function updateProfile(
  payload: ProfileUpdate,
): Promise<AuthUser> {
  const response = await fetch(`${apiBaseUrl}/api/v1/profile`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as AuthUser
}
