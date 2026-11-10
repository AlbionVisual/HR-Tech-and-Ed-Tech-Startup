import { useState } from 'react'
import { ApiKeysPanel } from '../features/profile/ApiKeysPanel'
import { ProfileHome } from '../features/profile/ProfileHome'
import { ProfileLogin } from '../features/profile/ProfileLogin'
import { ProfilePlaceholder } from '../features/profile/ProfilePlaceholder'
import type { ProfileUser } from '../features/profile/types'

type Props = {
	user: ProfileUser | null
	onLogin: (user: ProfileUser) => void
	onLogout: () => void
}

type ProfileView = 'home' | 'settings' | 'about' | 'keys'

export function ProfilePage({ user, onLogin, onLogout }: Props) {
	const [view, setView] = useState<ProfileView>('home')

	if (!user) {
		return <ProfileLogin onLogin={onLogin} />
	}

	const back = () => setView('home')

	if (view === 'settings') {
		return <ProfilePlaceholder title="Настройки" onBack={back} />
	}

	if (view === 'about') {
		return <ProfilePlaceholder title="About" onBack={back} />
	}

	if (view === 'keys') {
		return <ApiKeysPanel onBack={back} />
	}

	return (
		<ProfileHome
			user={user}
			onOpenSettings={() => setView('settings')}
			onOpenAbout={() => setView('about')}
			onOpenKeys={() => setView('keys')}
			onLogout={() => {
				setView('home')
				onLogout()
			}}
		/>
	)
}
