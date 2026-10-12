import { ChatView } from '../features/resume/ChatView'
import { InterviewProgress } from '../features/interview/InterviewProgress'
import { useResumeSession } from '../features/resume/useResumeSession'

export function ResumePage() {
	const session = useResumeSession()
	const inChat =
		session.phase === 'check_resume' || session.phase === 'awaiting_next'

	return (
		<div className="flex h-full min-h-0 flex-col">
			{inChat ? <InterviewProgress value={session.progress} /> : null}

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

