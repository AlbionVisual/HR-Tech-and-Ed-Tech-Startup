import json


def sse(event: dict) -> str:
    """Serialize an event as a Server-Sent Events data frame."""
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
