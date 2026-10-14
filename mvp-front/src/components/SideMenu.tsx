import { useEffect, useState } from 'react'
import { deleteChat, INTERVIEW_CHATS_EVENT, listChats, type ChatMeta } from '../features/interview/chatStorage'

type SideMenuProps = {
	isOpen: boolean
	onClose: () => void
	onChatSelect: (id: string) => void
	onNewChat: () => void
}

export function SideMenu({ isOpen, onClose, onChatSelect, onNewChat }: SideMenuProps) {
	const [chats, setChats] = useState<ChatMeta[]>([])

	useEffect(() => {
		function sync() {
			setChats(listChats())
		}
		sync()
		window.addEventListener(INTERVIEW_CHATS_EVENT, sync)
		return () => window.removeEventListener(INTERVIEW_CHATS_EVENT, sync)
	}, [])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		if (isOpen) {
			window.addEventListener('keydown', handleKeyDown)
		}
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, onClose])

	if (!isOpen) return null

	function formatTime(ts: number): string {
		const d = new Date(ts)
		const now = new Date()
		const diff = now.getTime() - d.getTime()
		if (diff < 60_000) return 'только что'
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин назад`
		if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		return d.toLocaleDateString()
	}

	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			<div
				className="fixed inset-0 bg-black/50 transition-opacity"
				onClick={onClose}
			/>

			<div className="relative z-10 w-70 h-full bg-bg-panel border-l border-line shadow-xl flex flex-col p-5 animate-in slide-in-from-right duration-200">
				<div className="flex items-center justify-between pb-4 border-b border-line">
					<h2 className="text-lg font-semibold m-0">Чаты с ИИ</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-ink hover:bg-bg-elevated"
						aria-label="Закрыть меню"
					>
						✕
					</button>
				</div>

				<div className="py-3">
					<button
						type="button"
						className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated hover:bg-bg text-ink text-sm font-medium transition-colors"
						onClick={() => {
							onNewChat()
							onClose()
						}}
					>
						+ Новый чат
					</button>
				</div>

				<div className="flex-1 overflow-y-auto">
					{chats.length === 0 ? (
						<p className="text-sm text-ink/70">Пока нет сохранённых чатов</p>
					) : (
						<ul className="space-y-1">
							{chats.map((chat) => (
								<li key={chat.id}>
									<button
										type="button"
										className="w-full flex flex-col items-start gap-1 px-3 py-2 rounded-lg hover:bg-bg-elevated text-left transition-colors"
										onClick={() => {
											onChatSelect(chat.id)
											onClose()
										}}
									>
										<span className="text-sm font-medium text-ink truncate w-full">
											{chat.title || 'Без названия'}
										</span>
										{chat.lastMessage ? (
											<span className="text-xs text-ink/60 truncate w-full">
												{chat.lastMessage.length > 60
													? `${chat.lastMessage.slice(0, 60)}…`
													: chat.lastMessage}
											</span>
										) : null}
										<span className="text-xs text-ink/40">
											{formatTime(chat.updatedAt)}
										</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				{chats.length > 0 ? (
					<div className="pt-4 border-t border-line">
						<button
							type="button"
							className="w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-bg-elevated transition-colors"
							onClick={() => {
								chats.forEach((c) => deleteChat(c.id))
								setChats([])
							}}
						>
							Очистить все
						</button>
					</div>
				) : null}
			</div>
		</div>
	)
}
