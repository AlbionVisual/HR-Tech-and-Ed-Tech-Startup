from app.modules.resumes.schemas import ResumeSourceType
from app.modules.resumes.parsers.docx import extract_docx_text
from app.modules.resumes.parsers.pdf import extract_pdf_text


def extract_text(source_type: ResumeSourceType, data: bytes) -> str:
    if source_type == "pdf":
        return extract_pdf_text(data)
    if source_type == "docx":
        return extract_docx_text(data)
    raise ValueError(f"Unsupported source type: {source_type}")
