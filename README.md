# HR-Tech & Ed-Tech Startup

MVP-тренажёр для подготовки к собеседованиям: AI-интервью, анализ резюме,
тесты и голосовой режим.

## Стек

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Backend:** Python 3.12+, FastAPI, Uvicorn, uv.
- **Хранение:** пока in-memory; PostgreSQL в планах.

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
uv run uvicorn app.main:app --reload --port 8000
```

В `backend/.env` можно указать ключи AI-провайдеров. Без ключей доступен
демо-провайдер `mock`.

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

## Статус

Сделано:

- AI-провайдеры и промпты на backend;
- анализ резюме: текст, PDF/DOCX, SSE, история;
- каталог моделей из backend;
- загрузка резюме на frontend.

В планах:

- авторизация и проверка владельца данных;
- PostgreSQL и миграции;
- перенос интервью и тестов на backend;
- TTS через backend;
- Docker, CI/CD и деплой на VPS.
