from io import BytesIO

from pypdf import PdfReader

from app.modules.resumes.validators import (
    MAX_PDF_PAGES,
    fail,
    normalize_text,
)


def extract_pdf_text(data: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(data))
    except Exception as error:
        fail("parse_error", "Не удалось прочитать PDF.", cause=error)

    if reader.is_encrypted:
        fail("encrypted_pdf", "PDF защищён паролем. Загрузите файл без пароля.")

    if len(reader.pages) > MAX_PDF_PAGES:
        fail("file_too_large", f"В PDF больше {MAX_PDF_PAGES} страниц.")

    try:
        parts = [page.extract_text() or "" for page in reader.pages]
    except Exception as error:
        fail("parse_error", "Не удалось извлечь текст из PDF.", cause=error)

    text = normalize_text("\n".join(parts))
    if not text:
        fail(
            "scanned_pdf",
            "В PDF нет текстового слоя. Вставьте текст вручную "
            "или загрузите другой файл.",
        )
    return text
