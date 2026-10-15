import { useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { AccessBanner } from './components/AccessBanner'
import { config, type PageId } from './config'
import { InterviewPage } from './pages/InterviewPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResumePage } from './pages/ResumePage'
import { TestsPage } from './pages/TestsPage'
import { VoiceProvider } from './speech/VoiceContext'
import { getLastChatId, setLastChatId } from './features/interview/chatStorage'

function App() {
	const [page, setPage] = useState<PageId>(config.app.defaultPage)
	const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
	// Восстанавливаем последний выбранный чат из localStorage
	const [activeChatId, setActiveChatId] = useState<string | null>(() =>
		getLastChatId(),
	)

	const handleChatSelect = (id: string) => {
		setActiveChatId(id)
		setLastChatId(id)
		setIsSideMenuOpen(false)
	}

	const handleNewChat = () => {
		setActiveChatId(null)
		setLastChatId(null)
		setIsSideMenuOpen(false)
	}

	const title = config.app.pages.find((p) => p.id === page)?.title ?? 'Приложение'

	return (
		<VoiceProvider>
			<div className="grid h-full grid-rows-[var(--spacing-topbar)_1fr_var(--spacing-nav)] bg-bg font-sans text-ink">
				<TopBar
					title={title}
					isSideMenuOpen={isSideMenuOpen}
					onToggleSideMenu={() => setIsSideMenuOpen(!isSideMenuOpen)}
					activeChatId={activeChatId}
					onChatSelect={handleChatSelect}
					onNewChat={handleNewChat}
				/>
				<main className="min-h-0 overflow-auto">
					<AccessBanner />
					{page === 'tests' ? <TestsPage /> : null}
					{page === 'resume' ? <ResumePage /> : null}
					{page === 'interview' ? <InterviewPage chatId={activeChatId} /> : null}
					{page === 'profile' ? <ProfilePage /> : null}
				</main>
				<BottomNav active={page} onChange={setPage} />
			</div>
		</VoiceProvider>
	)
}

export default App
