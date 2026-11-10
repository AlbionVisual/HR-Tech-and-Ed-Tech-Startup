import { useState } from 'react'
import type { ProfileUser } from './types'

type Props = {
	user: ProfileUser
	onOpenSettings: () => void
	onOpenAbout: () => void
	onOpenKeys: () => void
	onLogout: () => void
}

const menuItemClass =
	'w-full rounded-xl border-0 bg-transparent px-3 py-2 text-left text-sm font-medium text-ink hover:bg-[#f5f3ef] cursor-pointer'

export function ProfileHome({
	user,
	onOpenSettings,
	onOpenAbout,
	onOpenKeys,
	onLogout,
}: Props) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [name, setName] = useState(user.name)

	function choose(action: () => void) {
		setMenuOpen(false)
		action()
	}

	return (
		<div className="w-full">
			<header className="sticky top-0 z-10 flex h-[var(--spacing-topbar)] items-center justify-between gap-2.5 border-b border-line bg-bg-elevated pr-3 pl-4">
				<h2 className="m-0 min-w-0 flex-none truncate text-[1.1rem] font-semibold">
					Профиль
				</h2>
				<button
					type="button"
					aria-label="Меню профиля"
					className="grid h-10 w-10 place-items-center rounded-xl border border-[#b6b3ad] bg-[#f5f3ef] text-2xl leading-none text-ink transition-colors hover:bg-[#ede9e2] cursor-pointer shadow-sm"
					onClick={() => setMenuOpen((value) => !value)}
				>
					⋮
				</button>

				{menuOpen ? (
					<div className="absolute right-3 top-full z-20 mt-1 grid w-52 gap-1 rounded-2xl border border-[#e5e2dc] bg-white p-1.5 shadow-lg">
						<button
							type="button"
							className={menuItemClass}
							onClick={() => choose(onOpenSettings)}
						>
							Настройки
						</button>
						<button
							type="button"
							className={menuItemClass}
							onClick={() => choose(onOpenAbout)}
						>
							About
						</button>
						<button
							type="button"
							className={menuItemClass}
							onClick={() => choose(onOpenKeys)}
						>
							Настройка ключей
						</button>
						<button
							type="button"
							className={`${menuItemClass} text-[#FE502D]`}
							onClick={() => choose(onLogout)}
						>
							Выйти
						</button>
					</div>
				) : null}
			</header>

			<div className="mx-auto w-full max-w-xl p-5">
				<section className="mx-auto mt-12 flex min-h-[360px] w-full max-w-[360px] flex-col items-center rounded-[32px] bg-[#f5f3ef] p-6">
					<div className="mx-auto grid h-40 w-40 place-items-center overflow-hidden rounded-full bg-[#d9d9d9]">
						{user.avatarUrl ? (
							<img
								src={user.avatarUrl}
								alt={user.name}
								className="h-full w-full object-cover"
								draggable={false}
							/>
						) : null}
					</div>

					<input
						aria-label="Имя пользователя"
						className="mt-auto w-full rounded-2xl border-2 border-[#FE502D] bg-transparent px-4 py-3 font-sans text-base text-ink outline-none"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</section>
			</div>
		</div>
	)
}
