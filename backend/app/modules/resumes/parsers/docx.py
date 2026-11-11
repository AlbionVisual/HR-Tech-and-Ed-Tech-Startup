from io import BytesIO
import zipfile

from docx import Document

from app.modules.resumes.validators import (
    MAX_DOCX_UNCOMPRESSED,
    fail,
    normalize_text,
)


def _validate_archive(data: bytes) -> None:
    try:
        with zipfile.ZipFile(BytesIO(data)) as archive:
            total = sum(item.file_size for item in archive.infolist())
            names = set(archive.namelist())
    except zipfile.BadZipFile as error:
        fail("parse_error", "Файл повреждён или не является DOCX.", cause=error)

    if total > MAX_DOCX_UNCOMPRESSED:
        fail("file_too_large", "Документ слишком большой после распаковки.")
    if "word/document.xml" not in names:
        fail("parse_error", "В DOCX не найден основной документ.")


def extract_docx_text(data: bytes) -> str:
    _validate_archive(data)

    try:
        document = Document(BytesIO(data))
    except Exception as error:
        fail("parse_error", "Не удалось прочитать DOCX.", cause=error)

    parts = [paragraph.text for paragraph in document.paragraphs]
    for table in document.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            line = " | ".join(cell for cell in cells if cell)
            if line:
                parts.append(line)

    text = normalize_text("\n".join(parts))
    if not text:
        fail("empty_text", "В документе не найден текст.")
    return text
