from app.core.ai.prompts import FEEDBACK_MARKER, PROGRESS_START


MARKERS = (FEEDBACK_MARKER, PROGRESS_START)


class MarkerFilter:
    def __init__(self) -> None:
        self._buffer = ""
        self._last_char = ""
        self._feedback = False

    def feed(self, text: str) -> list[dict]:
        self._buffer += text
        events: list[dict] = []

        while self._buffer:
            index = self._buffer.find("[[")
            if index < 0:
                keep = self._partial_len(self._buffer)
                safe = self._buffer[:-keep] if keep else self._buffer
                if safe:
                    self._emit(safe, events)
                    self._buffer = self._buffer[len(safe) :]
                break

            if index > 0:
                self._emit(self._buffer[:index], events)
                self._buffer = self._buffer[index:]
                continue

            if self._buffer.startswith(FEEDBACK_MARKER):
                self._buffer = self._buffer[len(FEEDBACK_MARKER) :]
                self._feedback = True
                continue

            if self._buffer.startswith(PROGRESS_START):
                end = self._buffer.find("]]", len(PROGRESS_START))
                if end < 0:
                    break
                raw = self._buffer[len(PROGRESS_START) : end].strip()
                self._buffer = self._buffer[end + 2 :]
                try:
                    value = max(0, min(100, round(float(raw))))
                except ValueError:
                    continue
                events.append({"type": "progress", "value": value})
                continue

            if self._incomplete(self._buffer):
                break

            self._emit("[[", events)
            self._buffer = self._buffer[2:]

        return events

    def flush(self) -> list[dict]:
        events: list[dict] = []
        if self._buffer and not self._incomplete(self._buffer):
            self._emit(self._buffer, events)
        self._buffer = ""
        if self._feedback and self._last_char not in ("?", "？"):
            events.append({"type": "feedback"})
        self._feedback = False
        return events

    def _emit(self, text: str, events: list[dict]) -> None:
        if text:
            events.append({"type": "delta", "text": text})
            if stripped := text.rstrip():
                self._last_char = stripped[-1]

    @staticmethod
    def _incomplete(text: str) -> bool:
        return any(marker.startswith(text) or text.startswith(marker) for marker in MARKERS)

    @staticmethod
    def _partial_len(text: str) -> int:
        for size in range(min(len(text), max(map(len, MARKERS))), 0, -1):
            if any(marker.startswith(text[-size:]) for marker in MARKERS):
                return size
        return 0
