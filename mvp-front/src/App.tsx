import { useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { config, type PageId } from './config'
import { InterviewPage } from './pages/InterviewPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResumePage } from './pages/ResumePage'
import { TestsPage } from './pages/TestsPage'

function App() {
  const [page, setPage] = useState<PageId>(config.app.defaultPage)
  const title =
    config.app.pages.find((p) => p.id === page)?.title ?? 'Приложение'

  return (
    <div className="grid h-full grid-rows-[var(--spacing-topbar)_1fr_var(--spacing-nav)] bg-bg font-sans text-ink">
      <TopBar title={title} />
      <main className="min-h-0 overflow-auto">
        {page === 'tests' ? <TestsPage /> : null}
        {page === 'resume' ? <ResumePage /> : null}
        {page === 'interview' ? <InterviewPage /> : null}
        {page === 'profile' ? <ProfilePage /> : null}
      </main>
      <BottomNav active={page} onChange={setPage} />
    </div>
  )
}

export default App
