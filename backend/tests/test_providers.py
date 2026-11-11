from app.core.ai.parsing import parse_gemini_chunk, parse_openai_chunk, sse_payload


def test_gemini_thought_and_answer() -> None:
    events = parse_gemini_chunk(
        {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "думаю", "thought": True},
                            {"text": "ответ"},
                        ]
                    }
                }
            ]
        }
    )
    assert events == [
        {"type": "thought", "text": "думаю"},
        {"type": "delta", "text": "ответ"},
    ]


def test_gemini_block_reason() -> None:
    events = parse_gemini_chunk({"promptFeedback": {"blockReason": "SAFETY"}})
    assert events[0]["type"] == "error"


def test_openai_reasoning_and_content() -> None:
    events = parse_openai_chunk(
        {"choices": [{"delta": {"reasoning": "r", "content": "c"}}]}
    )
    assert events == [
        {"type": "thought", "text": "r"},
        {"type": "delta", "text": "c"},
    ]


def test_openai_error() -> None:
    events = parse_openai_chunk({"error": {"message": "quota"}})
    assert events == [{"type": "error", "message": "quota"}]


def test_sse_payload() -> None:
    assert sse_payload('data: {"a":1}') == '{"a":1}'
    assert sse_payload("data: [DONE]") is None
    assert sse_payload("event: message") is None
    assert sse_payload("") is None
