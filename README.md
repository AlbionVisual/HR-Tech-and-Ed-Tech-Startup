# HR-Tech & Ed-Tech Startup

MVP-тренажёр для подготовки к собеседованиям: AI-интервью, анализ резюме,
тесты и голосовой режим.

## Стек

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Backend:** Python 3.12+, FastAPI, Uvicorn, uv.
- **Хранение:** PostgreSQL 16, SQLAlchemy async.

## Структура

```text
.
├── frontend/          # React SPA
├── backend/           # FastAPI: AI, резюме, API
├── docs/              # сборка frontend для GitHub Pages
└── README.md
```

## Запуск

### Backend

```bash
cd backend
cp .env.example .env
uv sync

# PostgreSQL для локальной разработки
cd ..
docker compose up -d db
cd backend

uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

В `backend/.env` можно указать ключи AI-провайдеров и `DATABASE_URL`.
По умолчанию используется `postgresql+asyncpg://postgres:postgres@localhost:5432/hrtech`.

- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Каталог моделей: http://localhost:8000/api/v1/ai/models

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение: https://localhost:5273

Vite проксирует `/api` на `http://127.0.0.1:8000`, поэтому в dev-режиме
CORS не нужен.

## API

- `POST /api/v1/ai/chat/stream` — SSE-стрим интервью.
- `GET /api/v1/ai/models` — доступные провайдеры и модели.
- `POST /api/v1/interviews:stream` — старт интервью.
- `POST /api/v1/interviews/{id}/messages:stream` — сообщение в интервью.
- `POST /api/v1/interviews/{id}/next-question:stream` — следующий вопрос.
- `GET /api/v1/interviews` — список чатов интервью.
- `DELETE /api/v1/interviews/{id}` — удалить чат.
- `DELETE /api/v1/interviews` — очистить все чаты.
- `GET /api/v1/tests/languages` — языки тестов.
- `POST /api/v1/tests/attempts` — начать тест.
- `POST /api/v1/tests/attempts/{id}/answers` — ответить на вопрос.
- `POST /api/v1/tests/attempts/{id}/finish` — завершить тест.
- `POST /api/v1/resumes/extract` — извлечение текста из PDF/DOCX.
- `POST /api/v1/resumes/checks:stream` — старт анализа резюме.
- `POST /api/v1/resumes/checks/{id}/messages:stream` — продолжение анализа.
- `GET /api/v1/resumes/checks` — история проверок.

## Проверки

```bash
cd backend
uv run pytest -q

cd frontend
npm run lint
npm run build
```

Тесты по умолчанию используют SQLite in-memory. Для проверки на PostgreSQL
задайте `TEST_DATABASE_URL` (в CI используется PostgreSQL service).

