from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.ai.errors import AiRequestError
from app.modules.interviews.service import (
    InterviewNotFoundError,
    InterviewValidationError,
)
from app.modules.resumes.service import ResumeNotFoundError
from app.modules.resumes.validators import ResumeValidationError


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"detail": {"code": code, "message": message}},
    )


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AiRequestError)
    async def ai_error(_: Request, exc: AiRequestError) -> JSONResponse:
        return _error(400, "bad_request", str(exc))

    @app.exception_handler(ResumeNotFoundError)
    async def resume_not_found(_: Request, exc: ResumeNotFoundError) -> JSONResponse:
        return _error(404, "not_found", str(exc))

    @app.exception_handler(ResumeValidationError)
    async def resume_invalid(_: Request, exc: ResumeValidationError) -> JSONResponse:
        return _error(exc.status_code, exc.code, exc.message)

    @app.exception_handler(InterviewNotFoundError)
    async def interview_not_found(
        _: Request, exc: InterviewNotFoundError
    ) -> JSONResponse:
        return _error(404, "not_found", str(exc))

    @app.exception_handler(InterviewValidationError)
    async def interview_invalid(
        _: Request, exc: InterviewValidationError
    ) -> JSONResponse:
        return _error(exc.status_code, exc.code, exc.message)
