import { useEffect, useRef } from 'react'
import { useAuth } from '../../auth/useAuth'
import { loadGoogleIdentity } from '../../auth/google'
import { googleClientId } from '../../api/auth'
import { publicUrl } from '../../config'

export function GoogleLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { loginWithGoogle } = useAuth()
  const clientId = googleClientId()

  useEffect(() => {
    if (!clientId) return
    let cancelled = false

    void loadGoogleIdentity()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              void loginWithGoogle(response.credential)
            }
          },
        })
        containerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'icon',
          shape: 'circle',
          theme: 'outline',
          size: 'large',
        })
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [clientId, loginWithGoogle])

  if (!clientId) {
    return (
      <button
        type="button"
        aria-label="Войти через Google"
        title="Не задан VITE_GOOGLE_CLIENT_ID"
        className="cursor-not-allowed border-0 bg-transparent p-0 opacity-50"
        disabled
      >
        <img
          src={publicUrl('icons/google.png')}
          alt="Google"
          className="h-16 w-16 object-contain"
          draggable={false}
        />
      </button>
    )
  }

  return <div ref={containerRef} className="scale-125" />
}
