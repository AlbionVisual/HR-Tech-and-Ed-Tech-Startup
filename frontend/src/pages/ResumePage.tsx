import { ChatView } from '../features/resume/ChatView'
import { useResumeSession } from '../features/resume/useResumeSession'

type Props = {
	checkId?: string | null
}

export function ResumePage({ checkId }: Props) {
	const session = useResumeSession(checkId)

	if (session.isLoading) {
		return (
			<div className="grid h-full place-items-center p-6 text-sm text-muted">
				Загружаю анализ резюме…
			</div>
		)
	}

	return (
		<div className="flex h-full min-h-0 flex-col">

				{session.error && session.phase === 'idle' ? (
					<p className="mx-auto w-full max-w-xl px-4 pt-3 text-sm text-danger">
						{session.error}
					</p>
				) : null}

				<ChatView
					messages={session.messages}
					phase={session.phase}
					mode={session.mode}
					status={session.status}
					error={session.error}
					thought={session.thought}
					onChooseAtsCheck={session.chooseAtsCheck}
					onChooseImproveExperience={session.chooseImproveExperience}
					onChooseKeywords={session.chooseKeywords}
					onChooseFormatting={session.chooseFormatting}
					onStartCheck={session.startResumeCheck}
					onSend={session.sendUserMessage}
					onRefine={session.refineAnswer}
				/>
		</div>
	)
}

