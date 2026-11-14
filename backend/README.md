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

cd ..
docker compose up -d db
cd backend

uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

По умолчанию `DATABASE_URL` указывает на локальный PostgreSQL из
`docker-compose.yml`. Схема создаётся миграциями Alembic, а не `create_all`.

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

### Тесты

- `GET /api/v1/tests/languages` — языки и количество тестов.
- `GET /api/v1/tests/stats` — количество завершённых тестов.
- `POST /api/v1/tests/attempts` — начать случайный тест.
- `POST /api/v1/tests/attempts/{id}/answers` — ответить на вопрос.
- `POST /api/v1/tests/attempts/{id}/finish` — завершить и получить результат.
- `GET /api/v1/tests/attempts` — история попыток.

Каталог тестов хранится в `backend/app/modules/tests/data/tests.json`.
После изменения файла:

```bash
uv run alembic upgrade head
uv run python -m app.modules.tests.seed --reset
```

Без `--reset` сид выполнится только если каталог пустой.

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
│   └── modules/                 # домены: резюме, интервью, тесты
│       ├── resumes/             # парсеры, repository, service
│       ├── interviews/          # sessions, messages, SSE
│       └── tests/               # каталог, попытки, seed
├── alembic/                     # миграции
├── tests/
├── pyproject.toml
└── uv.lock
```

## Тесты

```bash
uv run pytest -q
```

По умолчанию используется SQLite in-memory. Для PostgreSQL задайте
`TEST_DATABASE_URL`, как в CI.
