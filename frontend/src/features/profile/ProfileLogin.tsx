import { useEffect, useState } from 'react'
import { telegramLoginUrl } from '../../api/auth'
import { useAuth } from '../../auth/useAuth'
import { publicUrl } from '../../config'
import { GoogleLoginButton } from './GoogleLoginButton'

const authErrors: Record<string, string> = {
  telegram_state_missing: 'Сессия входа Telegram истекла. Попробуйте снова.',
  telegram_failed: 'Не удалось войти через Telegram. Попробуйте снова.',
}

function initialError(): string {
  const value = new URLSearchParams(window.location.search).get('auth_error')
  return value ? authErrors[value] ?? 'Не удалось войти. Попробуйте снова.' : ''
}

export function ProfileLogin() {
  const { error } = useAuth()
  const [redirectError, setRedirectError] = useState(initialError)

  useEffect(() => {
    if (!redirectError) return
    const url = new URL(window.location.href)
    url.searchParams.delete('auth_error')
    window.history.replaceState({}, '', url)
  }, [redirectError])

  const message = redirectError || error

  return (
    <div className="grid h-full place-items-center p-6">
      <section className="flex min-h-[380px] w-full max-w-[360px] flex-col justify-center rounded-[32px] bg-[#f5f3ef] px-6 py-12 text-center">
        <h2 className="m-0 text-[28px] font-bold leading-[1.15] text-ink">
          Авторизовуйся
          <br />
          через
        </h2>

        <div className="mt-10 flex items-center justify-center gap-5">
          <button
            type="button"
            aria-label="Войти через Telegram"
            className="cursor-pointer border-0 bg-transparent p-0 transition-transform hover:scale-105 active:scale-95"
            onClick={() => {
              setRedirectError('')
              window.location.assign(telegramLoginUrl())
            }}
          >
            <img
              src={publicUrl('icons/telegram.png')}
              alt="Telegram"
              className="h-16 w-16 object-contain"
              draggable={false}
            />
          </button>

          <span className="text-sm text-[#8a8a8a]">или</span>

          <GoogleLoginButton />
        </div>

        {message ? (
          <p className="m-0 mt-6 text-sm text-danger">{message}</p>
        ) : null}
      </section>
    </div>
  )
}
