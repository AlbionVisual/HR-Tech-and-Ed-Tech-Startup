import { SideMenu } from './SideMenu'

type Props = {
	title: string
	isSideMenuOpen: boolean
	onToggleSideMenu: () => void
	activeChatId?: string | null
	onChatSelect: (id: string) => void
	onNewChat: () => void
}

export function TopBar({
	title,
	isSideMenuOpen,
	onToggleSideMenu,
	onChatSelect,
	onNewChat,
}: Props) {
	return (
		<header className="flex items-center justify-between gap-2.5 border-b border-line bg-bg-elevated py-0 pr-3 pl-4">
			<h1 className="m-0 min-w-0 flex-none truncate text-[1.1rem] font-semibold">
				{title}
			</h1>
			<div className="flex min-w-0 items-center gap-1.5">
				<button
					type="button"
					className="grid h-10 w-10 place-content-center gap-1 rounded-xl border border-[#b6b3ad] bg-[#f5f3ef] hover:bg-[#ede9e2] transition-colors cursor-pointer shadow-sm"
					aria-label="Меню"
					onClick={onToggleSideMenu}
				>
					<span className="block h-0.5 w-4 bg-ink" />
					<span className="block h-0.5 w-4 bg-ink" />
					<span className="block h-0.5 w-4 bg-ink" />
				</button>

				<SideMenu
					isOpen={isSideMenuOpen}
					onClose={onToggleSideMenu}
					onChatSelect={onChatSelect}
					onNewChat={onNewChat}
				/>
			</div>
		</header>
	)
}
