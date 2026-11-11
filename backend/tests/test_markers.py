from app.core.ai.markers import MarkerFilter


def run(chunks: list[str]) -> list[dict]:
    marker = MarkerFilter()
    events: list[dict] = []
    for chunk in chunks:
        events.extend(marker.feed(chunk))
    events.extend(marker.flush())
    return events


def test_progress_split_by_char() -> None:
    events = run(list("Привет [[PROGRESS:42]] мир"))
    text = "".join(event["text"] for event in events if event["type"] == "delta")
    assert text == "Привет  мир"
    assert {"type": "progress", "value": 42} in events


def test_progress_is_clamped() -> None:
    events = run(list("[[PROGRESS:999]]"))
    assert {"type": "progress", "value": 100} in events


def test_feedback_at_end() -> None:
    events = run(list("Хорошо. [[FEEDBACK]]"))
    assert events[-1] == {"type": "feedback"}


def test_feedback_is_ignored_after_question() -> None:
    events = run(list("Что дальше? [[FEEDBACK]]"))
    assert not any(event["type"] == "feedback" for event in events)


def test_incomplete_marker_is_dropped() -> None:
    events = run(list("Ответ [[PROGR"))
    text = "".join(event["text"] for event in events if event["type"] == "delta")
    assert text == "Ответ "


def test_incomplete_progress_is_dropped() -> None:
    events = run(list("Ответ [[PROGRESS:42"))
    text = "".join(event["text"] for event in events if event["type"] == "delta")
    assert text == "Ответ "
    assert not any(event["type"] == "progress" for event in events)
