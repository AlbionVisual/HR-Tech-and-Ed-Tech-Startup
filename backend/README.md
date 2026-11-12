# Backend — FastAPI

Серверная часть HR-Tech & Ed-Tech Startup: AI-провайдеры, анализ резюме и API.

Сейчас данные резюме хранятся в памяти процесса. PostgreSQL и авторизация —
следующие этапы.

## Запуск

Нужны Python 3.12+ и [uv](https://docs.astral.sh/uv/).

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Без ключей AI-провайдеров доступен только `mock`.

Проверка:

- http://localhost:8000/docs
- http://localhost:8000/health
- http://localhost:8000/api/v1/ai/models


### AI

- `GET /api/v1/ai/models` — провайдеры и модели.
- `POST /api/v1/ai/chat/stream` — SSE-стрим интервью.
- `GET /api/v1/ai/probe?provider=gemini` — проверка Gemini.

### Резюме

- `POST /api/v1/resumes/extract` — извлечение текста из PDF/DOCX.
- `POST /api/v1/resumes/checks:stream` — создать проверку и получить анализ.
- `POST /api/v1/resumes/checks/{id}/messages:stream` — продолжить диалог.
- `GET /api/v1/resumes/checks` — история.
- `GET /api/v1/resumes/checks/{id}` — проверка с сообщениями.
- `DELETE /api/v1/resumes/checks/{id}` — удалить проверку.

### Интервью

- `POST /api/v1/interviews:stream` — создать чат и получить первый вопрос.
- `POST /api/v1/interviews/{id}/messages:stream` — ответ пользователя.
- `POST /api/v1/interviews/{id}/next-question:stream` — следующий вопрос.
- `GET /api/v1/interviews` — список чатов.
- `GET /api/v1/interviews/{id}` — чат с сообщениями.
- `DELETE /api/v1/interviews/{id}` — удалить чат.
- `DELETE /api/v1/interviews` — очистить все чаты.

## Структура

```text
backend/
├── app/
│   ├── main.py                  # FastAPI, CORS, lifespan
│   ├── api/v1/                  # роутеры, deps, SSE, ошибки
│   ├── core/
│   │   ├── config.py            # настройки из .env
│   │   ├── deps.py              # временный demo user
│   │   └── ai/                  # провайдеры, промпты, SSE
│   └── modules/                 # домены: резюме, интервью
│       ├── resumes/             # парсеры, repository, service
│       └── interviews/          # sessions, messages, SSE
├── tests/
├── pyproject.toml
└── uv.lock
```

## Тесты

```bash
uv run pytest -q
```
