from app.modules.resumes.schemas import (
    ResumeCheck,
    ResumeCheckSummary,
    ResumeMessage,
    ResumeMessageOut,
)


def to_summary(check: ResumeCheck, messages_count: int) -> ResumeCheckSummary:
    data = check.model_dump(
        exclude={"user_id", "source_text", "source_chars", "deleted_at"}
    )
    return ResumeCheckSummary.model_validate(
        {**data, "messages_count": messages_count}
    )


def to_message_out(message: ResumeMessage) -> ResumeMessageOut:
    return ResumeMessageOut.model_validate(
        message.model_dump(exclude={"check_id"})
    )
