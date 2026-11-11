import json


def sse_payload(line: str) -> str | None:
    line = line.strip()
    if not line.startswith("data:"):
        return None
    data = line[5:].strip()
    return None if not data or data == "[DONE]" else data


def error_events(payload: dict) -> list[dict] | None:
    error = payload.get("error")
    if isinstance(error, dict) and error.get("message"):
        return [{"type": "error", "message": str(error["message"])}]
    return None


def parse_gemini_chunk(item: dict) -> list[dict]:
    if events := error_events(item):
        return events

    feedback = item.get("promptFeedback") or {}
    if block := feedback.get("blockReason"):
        return [{"type": "error", "message": f"Запрос заблокирован: {block}"}]

    candidates = item.get("candidates") or []
    if not candidates:
        return []
    candidate = candidates[0]
    parts = (candidate.get("content") or {}).get("parts") or []
    thought = "".join(
        str(part.get("text") or "")
        for part in parts
        if part.get("text") and part.get("thought")
    )
    answer = "".join(
        str(part.get("text") or "")
        for part in parts
        if part.get("text") and not part.get("thought")
    )

    finish = candidate.get("finishReason")
    if (
        finish
        and not (answer or thought)
        and finish not in ("STOP", "MAX_TOKENS", "FINISH_REASON_UNSPECIFIED")
    ):
        return [{"type": "error", "message": f"Ответ остановлен: {finish}"}]
    return ([{"type": "thought", "text": thought}] if thought else []) + (
        [{"type": "delta", "text": answer}] if answer else []
    )


def parse_openai_chunk(payload: dict) -> list[dict]:
    if events := error_events(payload):
        return events
    choices = payload.get("choices") or []
    if not choices:
        return []
    delta = choices[0].get("delta") or {}
    return (
        ([{"type": "thought", "text": str(delta["reasoning"])}] if delta.get("reasoning") else [])
        + ([{"type": "delta", "text": str(delta["content"])}] if delta.get("content") else [])
    )
