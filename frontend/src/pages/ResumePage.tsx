import { ChatView } from '../features/resume/ChatView'
import { useResumeSession } from '../features/resume/useResumeSession'

export function ResumePage() {
	const session = useResumeSession()

	return (
		<div className="flex h-full min-h-0 flex-col">

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

