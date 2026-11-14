import { useState } from "react";
import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/useAuth";
import { BottomNav } from "./components/BottomNav";
import { TopBar } from "./components/TopBar";
import { AccessBanner } from "./components/AccessBanner";
import { config, type PageId } from "./config";
import { InterviewPage } from "./pages/InterviewPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProfileLogin } from "./features/profile/ProfileLogin";
import type { ProfileUser } from "./features/profile/types";
import { ResumePage } from "./pages/ResumePage";
import { TestsPage } from "./pages/TestsPage";
import { VoiceProvider } from "./speech/VoiceContext";

function AppInner() {
  const { user, status, logout } = useAuth();
  const [page, setPage] = useState<PageId>(config.app.defaultPage);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeResumeCheckId, setActiveResumeCheckId] = useState<string | null>(
    null,
  );
  const [newChatNonce, setNewChatNonce] = useState(0);
  const [newResumeNonce, setNewResumeNonce] = useState(0);

  const handleChatSelect = (id: string) => {
    setActiveChatId(id);
    setIsSideMenuOpen(false);
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setNewChatNonce((value) => value + 1);
    setIsSideMenuOpen(false);
  };

  const handleResumeSelect = (id: string) => {
    setActiveResumeCheckId(id);
    setIsSideMenuOpen(false);
  };

  const handleNewResume = () => {
    setActiveResumeCheckId(null);
    setNewResumeNonce((value) => value + 1);
    setIsSideMenuOpen(false);
  };

  if (status === "loading") {
    return (
      <div className="grid h-full place-items-center bg-bg text-muted">
        Загрузка…
      </div>
    );
  }

  if (status === "anonymous" || !user) {
    return (
      <div className="h-full bg-bg">
        <ProfileLogin />
      </div>
    );
  }

  const profileUser: ProfileUser = {
    name:
      user.display_name ||
      user.identities[0]?.username ||
      user.identities[0]?.display_name ||
      "Пользователь",
    avatarUrl: user.avatar_url || user.identities[0]?.avatar_url || "",
  };

  const title =
    config.app.pages.find((p) => p.id === page)?.title ?? "Приложение";
  const isProfile = page === "profile";
  const gridRows = isProfile
    ? "grid-rows-[1fr_var(--spacing-nav)]"
    : "grid-rows-[var(--spacing-topbar)_1fr_var(--spacing-nav)]";

  return (
    <VoiceProvider>
      <div className={`grid h-full ${gridRows} bg-bg font-sans text-ink`}>
        {!isProfile ? (
          <TopBar
            title={title}
            page={page}
            isSideMenuOpen={isSideMenuOpen}
            onToggleSideMenu={() => setIsSideMenuOpen(!isSideMenuOpen)}
            activeChatId={activeChatId}
            activeResumeCheckId={activeResumeCheckId}
            onChatSelect={handleChatSelect}
            onNewChat={handleNewChat}
            onResumeSelect={handleResumeSelect}
            onNewResume={handleNewResume}
          />
        ) : null}
        <main className="min-h-0 overflow-auto">
          <AccessBanner />
          {page === "tests" ? <TestsPage /> : null}
          {page === "resume" ? (
            <ResumePage
              key={`${activeResumeCheckId ?? "new-resume"}-${newResumeNonce}`}
              checkId={activeResumeCheckId}
            />
          ) : null}
          {page === "interview" ? (
            <InterviewPage
              key={`${activeChatId ?? "new"}-${newChatNonce}`}
              chatId={activeChatId}
            />
          ) : null}
          {isProfile ? (
            <ProfilePage user={profileUser} onLogout={() => void logout()} />
          ) : null}
        </main>
        <BottomNav active={page} onChange={setPage} />
      </div>
    </VoiceProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
