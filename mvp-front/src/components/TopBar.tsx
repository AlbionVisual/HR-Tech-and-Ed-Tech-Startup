import { useState } from 'react'
import { ModelSelect } from './ModelSelect'
// import { TtsSelect } from './TtsSelect'
// import { TtsVoiceSelect } from './TtsVoiceSelect'
// import { VoiceToggle } from './VoiceToggle'
import { SideMenu } from './SideMenu'

type Props = {
	title: string
}

export function TopBar({ title }: Props) {

	const [isMenuOpen, setIsMenuOpen] = useState(false)

	return (
		<header className="flex items-center justify-between gap-2.5 border-b border-line bg-bg-elevated py-0 pr-3 pl-4">
			<h1 className="m-0 min-w-0 flex-none truncate text-[1.1rem] font-semibold">
				{title}
			</h1>
			<div className="flex min-w-0 items-center gap-1.5">
				{/*	<VoiceToggle />
				<TtsSelect />
				<TtsVoiceSelect /> */}
				<ModelSelect />
				<button
					type="button"
					className="grid h-10 w-10 place-content-center gap-1 rounded-lg border border-line bg-bg-panel"
					aria-label="Меню"
					onClick={() => setIsMenuOpen(true)}
				>
					<span className="block h-0.5 w-4 bg-ink" />
					<span className="block h-0.5 w-4 bg-ink" />
					<span className="block h-0.5 w-4 bg-ink" />
				</button>
			</div>
			<SideMenu isOpen={isMenuOpen}
				onClose={() => setIsMenuOpen(false)} />
		</header>

	)
}
