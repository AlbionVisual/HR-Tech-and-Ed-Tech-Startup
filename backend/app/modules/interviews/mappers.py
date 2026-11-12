from app.modules.interviews.schemas import (
    InterviewMessage,
    InterviewMessageOut,
    InterviewSession,
    InterviewSessionSummary,
)


def to_summary(
    session: InterviewSession,
    *,
    messages_count: int,
    last_message: str | None,
) -> InterviewSessionSummary:
    return InterviewSessionSummary(
        id=session.id,
        mode=session.mode,
        title=session.title,
        phase=session.phase,
        progress=session.progress,
        provider=session.provider,
        model=session.model,
        last_message=last_message,
        messages_count=messages_count,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def to_message_out(message: InterviewMessage) -> InterviewMessageOut:
    return InterviewMessageOut(
        id=message.id,
        role=message.role,
        content=message.content,
        thought=message.thought,
        is_feedback=message.is_feedback,
        status=message.status,
        seq=message.seq,
        created_at=message.created_at,
    )
