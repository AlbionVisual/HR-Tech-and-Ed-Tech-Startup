import { useEffect, useState } from 'react'
import {
	clearInterviews,
	deleteInterview,
	listInterviews,
	type InterviewSessionSummary,
} from '../api/interviews'
import { ModelSelect } from './ModelSelect'

type SideMenuProps = {
	isOpen: boolean
	onClose: () => void
	activeChatId?: string | null
	onChatSelect: (id: string) => void
	onNewChat: () => void
}

export function SideMenu({
	isOpen,
	onClose,
	activeChatId,
	onChatSelect,
	onNewChat,
}: SideMenuProps) {
	const [chats, setChats] = useState<InterviewSessionSummary[]>([])
	const [error, setError] = useState('')

	useEffect(() => {
		if (!isOpen) return

		let cancelled = false
		void (async () => {
			try {
				const data = await listInterviews()
				if (cancelled) return
				setChats(data)
				setError('')
			} catch (loadError) {
				if (cancelled) return
				setError(
					loadError instanceof Error
						? loadError.message
						: 'Не удалось загрузить чаты',
				)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [isOpen])

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

	function formatTime(iso: string): string {
		const d = new Date(iso)
		const now = new Date()
		const diff = now.getTime() - d.getTime()
		if (diff < 60_000) return 'только что'
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин назад`
		if (diff < 86_400_000)
			return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		return d.toLocaleDateString()
	}

	async function removeChat(id: string) {
		try {
			await deleteInterview(id)
			setChats((prev) => prev.filter((chat) => chat.id !== id))
			if (activeChatId === id) onNewChat()
		} catch (deleteError) {
			setError(
				deleteError instanceof Error ? deleteError.message : 'Не удалось удалить чат',
			)
		}
	}

	async function removeAll() {
		try {
			await clearInterviews()
			setChats([])
			onNewChat()
		} catch (deleteError) {
			setError(
				deleteError instanceof Error ? deleteError.message : 'Не удалось удалить чаты',
			)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			<div
				className="fixed inset-0 bg-black/50 transition-opacity"
				onClick={onClose}
			/>

			<div className="relative z-10 flex h-full w-70 flex-col border-l border-line bg-bg-panel p-5 shadow-xl animate-in slide-in-from-right duration-200">
				<div className="flex items-center justify-between border-b border-line pb-4">
					<h2 className="m-0 text-lg font-semibold">Чаты с ИИ</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-ink hover:bg-bg-elevated"
						aria-label="Закрыть меню"
					>
						✕
					</button>
				</div>

				<section className="space-y-2.5 border-b border-line py-3">
					<p className="m-0 text-xs font-medium text-muted">Настройки</p>
					<div className="grid gap-2">
						<label className="grid gap-1 text-[0.75rem] text-muted">
							<span>Модель чата</span>
							<ModelSelect variant="panel" />
						</label>
					</div>
				</section>

				<div className="py-3">
					<button
						type="button"
						className="flex w-full items-center gap-2 rounded-lg bg-bg-elevated px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-bg"
						onClick={() => {
							onNewChat()
							onClose()
						}}
					>
						+ Новый чат
					</button>
				</div>

				{error ? (
					<p className="m-0 pb-2 text-sm text-danger">{error}</p>
				) : null}

				<div className="flex-1 overflow-y-auto">
					{chats.length === 0 ? (
						<p className="text-sm text-ink/70">Пока нет сохранённых чатов</p>
					) : (
						<ul className="space-y-1">
							{chats.map((chat) => (
								<li key={chat.id} className="flex items-start gap-1">
									<button
										type="button"
										className={`flex min-w-0 flex-1 flex-col items-start gap-1 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-elevated ${
											activeChatId === chat.id ? 'bg-bg-elevated' : ''
										}`}
										onClick={() => {
											onChatSelect(chat.id)
											onClose()
										}}
									>
										<span className="w-full truncate text-sm font-medium text-ink">
											{chat.title || 'Без названия'}
										</span>
										{chat.last_message ? (
											<span className="w-full truncate text-xs text-ink/60">
												{chat.last_message.length > 60
													? `${chat.last_message.slice(0, 60)}…`
													: chat.last_message}
											</span>
										) : null}
										<span className="text-xs text-ink/40">
											{formatTime(chat.updated_at)}
										</span>
									</button>
									<button
										type="button"
										className="shrink-0 rounded-lg p-2 text-xs text-muted transition-colors hover:bg-bg-elevated hover:text-danger"
										aria-label="Удалить чат"
										onClick={() => void removeChat(chat.id)}
									>
										✕
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				{chats.length > 0 ? (
					<div className="border-t border-line pt-4">
						<button
							type="button"
							className="w-full rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-bg-elevated"
							onClick={() => void removeAll()}
						>
							Очистить все
						</button>
					</div>
				) : null}
			</div>
		</div>
	)
}
