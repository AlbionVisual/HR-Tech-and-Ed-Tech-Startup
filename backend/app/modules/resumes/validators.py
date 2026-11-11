from io import BytesIO
from pathlib import Path
from typing import NoReturn
import zipfile

from app.modules.resumes.schemas import MODE_LABELS, ResumeMode, ResumeSourceType


MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_TEXT_CHARS = 50_000
MAX_PDF_PAGES = 50
MAX_DOCX_UNCOMPRESSED = 50 * 1024 * 1024
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


class ResumeValidationError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def fail(
    code: str, message: str, status_code: int = 422, cause: Exception | None = None
) -> NoReturn:
    error = ResumeValidationError(code, message, status_code)
    if cause:
        raise error from cause
    raise error


def normalize_text(text: str) -> str:
    text = text.replace("\x00", "").replace("\r\n", "\n").replace("\r", "\n")
    text = "\n".join(line.rstrip() for line in text.split("\n"))
    while "\n\n\n" in text:
        text = text.replace("\n\n\n", "\n\n")
    return text.strip()


def limit_text(text: str) -> tuple[str, bool]:
    normalized = normalize_text(text)
    if len(normalized) <= MAX_TEXT_CHARS:
        return normalized, False
    return normalized[:MAX_TEXT_CHARS].rstrip(), True


def _validate_text(
    text: str, empty_code: str, empty_message: str, too_long_message: str
) -> str:
    normalized = normalize_text(text)
    if not normalized:
        fail(empty_code, empty_message)
    if len(normalized) > MAX_TEXT_CHARS:
        fail("text_too_long", too_long_message)
    return normalized


def validate_resume_text(text: str) -> str:
    return _validate_text(
        text, "empty_text", "Текст резюме пустой.",
        f"Текст резюме слишком длинный: максимум {MAX_TEXT_CHARS} символов.",
    )


def validate_message_text(text: str) -> str:
    return _validate_text(
        text, "empty_message", "Сообщение пустое.",
        f"Сообщение слишком длинное: максимум {MAX_TEXT_CHARS} символов.",
    )


def validate_file_size(data: bytes) -> None:
    if not data:
        fail("empty_file", "Файл пустой.")
    if len(data) > MAX_FILE_SIZE:
        fail("file_too_large", f"Файл больше {MAX_FILE_SIZE // (1024 * 1024)} MB.", 413)


def _is_docx(data: bytes) -> bool:
    try:
        with zipfile.ZipFile(BytesIO(data)) as archive:
            names = set(archive.namelist())
    except zipfile.BadZipFile:
        return False
    return "word/document.xml" in names and "[Content_Types].xml" in names


def detect_source_type(
    filename: str | None, content_type: str | None, data: bytes
) -> ResumeSourceType:
    suffix = Path(filename or "").suffix.lower()
    mime = (content_type or "").split(";")[0].strip().lower()

    if data.startswith(b"%PDF-"):
        return "pdf"
    if suffix == ".pdf" or mime == "application/pdf":
        fail("parse_error", "Файл повреждён или не является PDF.")
    if suffix == ".doc":
        fail("unsupported_file", "Формат .doc не поддерживается. Сохраните документ как .docx.")
    if suffix == ".docx" or mime == DOCX_MIME:
        if not _is_docx(data):
            fail("parse_error", "Файл повреждён или не является DOCX.")
        return "docx"
    fail("unsupported_file", "Поддерживаются только файлы PDF и DOCX.")


def safe_filename(filename: str | None) -> str:
    name = Path(filename or "").name.strip()
    return name[:120] or "resume"


def make_title(mode: ResumeMode, source_filename: str | None) -> str:
    label = MODE_LABELS[mode]
    if source_filename:
        return f"{label}: {Path(source_filename).name[:80]}"
    return label
