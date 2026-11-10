import { publicUrl } from '../../config'
import type { ProfileUser } from './types'

type Props = {
	onLogin: (user: ProfileUser) => void
}

const mockUser: ProfileUser = {
	name: '@kowaliowa',
	avatarUrl: '',
}

export function ProfileLogin({ onLogin }: Props) {
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
						onClick={() => onLogin(mockUser)}
					>
						<img
							src={publicUrl('icons/telegram.png')}
							alt="Telegram"
							className="h-16 w-16 object-contain"
							draggable={false}
						/>
					</button>

					<span className="text-sm text-[#8a8a8a]">или</span>

					<button
						type="button"
						aria-label="Войти через Google"
						className="cursor-pointer border-0 bg-transparent p-0 transition-transform hover:scale-105 active:scale-95"
						onClick={() => onLogin(mockUser)}
					>
						<img
							src={publicUrl('icons/google.png')}
							alt="Google"
							className="h-16 w-16 object-contain"
							draggable={false}
						/>
					</button>
				</div>
			</section>
		</div>
	)
}
