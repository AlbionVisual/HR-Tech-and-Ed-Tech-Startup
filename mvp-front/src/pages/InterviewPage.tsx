import { ChatView } from '../features/interview/ChatView'
import { InterviewProgress } from '../features/interview/InterviewProgress'
import { InterviewStart } from '../features/interview/InterviewStart'
import { VacancySheet } from '../features/interview/VacancySheet'
import { useInterviewSession } from '../features/interview/useInterviewSession'

export function InterviewPage() {
  const session = useInterviewSession()
  const inChat =
    session.phase === 'interviewing' || session.phase === 'awaiting_next'

  return (
    <div className="flex h-full min-h-0 flex-col">
      {inChat ? <InterviewProgress value={session.progress} /> : null}

      {session.phase === 'idle' || session.phase === 'vacancy_form' ? (
        <InterviewStart
          onVacancyPrep={session.chooseVacancyPrep}
          onPractice={session.choosePractice}
        />
      ) : (
        <ChatView
          messages={session.messages}
          phase={session.phase}
          status={session.status}
          error={session.error}
          thought={session.thought}
          onSend={session.sendUserMessage}
          onRefine={session.refineAnswer}
          onNext={session.nextQuestion}
        />
      )}

      <VacancySheet
        open={session.phase === 'vacancy_form'}
        onClose={session.closeVacancyForm}
        onSubmit={session.submitVacancy}
      />
    </div>
  )
}
