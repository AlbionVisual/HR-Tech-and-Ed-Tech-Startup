import type { PageId } from '../config'
import { config } from '../config'

type Props = {
	active: PageId
	onChange: (id: PageId) => void
}

export function BottomNav({ active, onChange }: Props) {
	return (
		<nav
			className="grid grid-cols-4 w-full border-t border-line bg-bg-elevated p-1.5 sm:p-2"
			aria-label="Навигация">

			{config.app.pages.map((page) => {
				console.log(page)
				const isActive = active === page.id
				const isTests = page.id === 'tests'

				return (
					<button
						key={page.id}
						type="button"
						onClick={() => onChange(page.id)}
						className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-2xl transition-all duration-200 border-0 font-sans text-xs sm:text-sm ${isActive
							? 'bg-bg-panel font-semibold text-ink shadow-sm'
							: 'bg-transparent text-muted hover:text-ink hover:bg-bg-panel/50'
							}`}>

						<span className="text-base sm:text-lg">
							{page.id === 'tests' && '📋'}
							{page.id === 'resume' && '📄'}
							{page.id === 'interview' && '💬'}
							{page.id === 'profile' && '👤'}
						</span>

						<span className="truncate">{page.title}</span>

						{isTests && (
							<span className="absolute -top-1 right-1 sm:top-1 sm:right-2 bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
								скоро
							</span>
						)}
					</button>
				)
			})}
		</nav>
	)
}
