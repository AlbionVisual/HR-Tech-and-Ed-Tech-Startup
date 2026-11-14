import { useEffect, useState } from 'react'
import {
	clearInterviews,
	deleteInterview,
	listInterviews,
	type InterviewSessionSummary,
} from '../api/interviews'
import {
	deleteResumeCheck,
	listResumeChecks,
	type ResumeCheckSummary,
} from '../api/resumes'
import type { PageId } from '../config'
import { ModelSelect } from './ModelSelect'

type SideMenuProps = {
	isOpen: boolean
	onClose: () => void
	page: PageId
	activeChatId?: string | null
	activeResumeCheckId?: string | null
	onChatSelect: (id: string) => void
	onNewChat: () => void
	onResumeSelect: (id: string) => void
	onNewResume: () => void
}

export function SideMenu({
	isOpen,
	onClose,
	page,
	activeChatId,
	activeResumeCheckId,
	onChatSelect,
	onNewChat,
	onResumeSelect,
	onNewResume,
}: SideMenuProps) {
	const [interviewChats, setInterviewChats] = useState<
		InterviewSessionSummary[]
	>([])
	const [resumeChecks, setResumeChecks] = useState<ResumeCheckSummary[]>([])
	const [error, setError] = useState('')

	const isInterview = page === 'interview'
	const isResume = page === 'resume'
	const title = isResume ? 'Анализ резюме' : isInterview ? 'Чаты с ИИ' : 'Тесты'

	useEffect(() => {
		if (!isOpen) return

		let cancelled = false
		void (async () => {
			try {
				if (page === 'interview') {
					const data = await listInterviews()
					if (!cancelled) setInterviewChats(data)
				}
				if (page === 'resume') {
					const data = await listResumeChecks()
					if (!cancelled) setResumeChecks(data)
				}
				if (!cancelled) setError('')
			} catch (loadError) {
				if (cancelled) return
				setError(
					loadError instanceof Error
						? loadError.message
						: 'Не удалось загрузить список',
				)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [isOpen, page])

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

	async function removeInterview(id: string) {
		try {
			await deleteInterview(id)
			setInterviewChats((prev) => prev.filter((chat) => chat.id !== id))
			if (activeChatId === id) onNewChat()
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: 'Не удалось удалить чат',
			)
		}
	}

	async function removeAllInterviews() {
		try {
			await clearInterviews()
			setInterviewChats([])
			onNewChat()
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: 'Не удалось удалить чаты',
			)
		}
	}

	async function removeResume(id: string) {
		try {
			await deleteResumeCheck(id)
			setResumeChecks((prev) => prev.filter((check) => check.id !== id))
			if (activeResumeCheckId === id) onNewResume()
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: 'Не удалось удалить анализ',
			)
		}
	}

	function handleNew() {
		if (isResume) onNewResume()
		if (isInterview) onNewChat()
		onClose()
	}

	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			<div
				className="fixed inset-0 bg-black/50 transition-opacity"
				onClick={onClose}
			/>

			<div className="relative z-10 flex h-full w-70 flex-col border-l border-line bg-bg-panel p-5 shadow-xl animate-in slide-in-from-right duration-200">
				<div className="flex items-center justify-between border-b border-line pb-4">
					<h2 className="m-0 text-lg font-semibold">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-ink hover:bg-bg-elevated"
						aria-label="Закрыть меню"
					>
						✕
					</button>
				</div>

				{isInterview || isResume ? (
					<>
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
								onClick={handleNew}
							>
								{isResume ? '+ Новый анализ' : '+ Новый чат'}
							</button>
						</div>
					</>
				) : null}

				{error ? (
					<p className="m-0 pb-2 text-sm text-danger">{error}</p>
				) : null}

				<div className="flex-1 overflow-y-auto">
					{isInterview ? (
						interviewChats.length === 0 ? (
							<p className="text-sm text-ink/70">Пока нет сохранённых чатов</p>
						) : (
							<ul className="space-y-1">
								{interviewChats.map((chat) => (
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
											onClick={() => void removeInterview(chat.id)}
										>
											✕
										</button>
									</li>
								))}
							</ul>
						)
					) : null}

					{isResume ? (
						resumeChecks.length === 0 ? (
							<p className="text-sm text-ink/70">Пока нет анализов резюме</p>
						) : (
							<ul className="space-y-1">
								{resumeChecks.map((check) => (
									<li key={check.id} className="flex items-start gap-1">
										<button
											type="button"
											className={`flex min-w-0 flex-1 flex-col items-start gap-1 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-elevated ${
												activeResumeCheckId === check.id
													? 'bg-bg-elevated'
													: ''
											}`}
											onClick={() => {
												onResumeSelect(check.id)
												onClose()
											}}
										>
											<span className="w-full truncate text-sm font-medium text-ink">
												{check.title || 'Анализ резюме'}
											</span>
											<span className="w-full truncate text-xs text-ink/60">
												{check.source_filename ??
													`${check.messages_count} сообщений`}
											</span>
											<span className="text-xs text-ink/40">
												{formatTime(check.updated_at)}
											</span>
										</button>
										<button
											type="button"
											className="shrink-0 rounded-lg p-2 text-xs text-muted transition-colors hover:bg-bg-elevated hover:text-danger"
											aria-label="Удалить анализ"
											onClick={() => void removeResume(check.id)}
										>
											✕
										</button>
									</li>
								))}
							</ul>
						)
					) : null}

					{!isInterview && !isResume ? (
						<p className="text-sm text-ink/70">
							История тестов пока не отображается в меню.
						</p>
					) : null}
				</div>

				{isInterview && interviewChats.length > 0 ? (
					<div className="border-t border-line pt-4">
						<button
							type="button"
							className="w-full rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-bg-elevated"
							onClick={() => void removeAllInterviews()}
						>
							Очистить все
						</button>
					</div>
				) : null}
			</div>
		</div>
	)
}
