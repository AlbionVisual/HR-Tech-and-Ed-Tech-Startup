# Backend

FastAPI-сервис проекта HR-Tech & Ed-Tech Startup.

## Первый запуск

Нужны Python 3.12+ и [uv](https://docs.astral.sh/uv/).

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

В `.env` нужно вписать хотя бы один ключ провайдера:

```env
GEMINI_API_KEY=
OPENROUTER_API_KEY=
AIAI_API_KEY=
```

Без ключей доступен только провайдер `mock` — чат работает в демо-режиме.

Проверка:

- http://localhost:8000/health
- http://localhost:8000/api/v1/health
- http://localhost:8000/api/v1/ai/models
- http://localhost:8000/docs

## AI API

- `GET /api/v1/ai/models` — доступные провайдеры и модели.
- `POST /api/v1/ai/chat/stream` — SSE-стрим ответа.
- `GET /api/v1/ai/probe?provider=gemini` — проверка доступности Gemini с сервера.

Запрос чата:

```json
{
  "task": "interview",
  "mode": "practice",
  "vacancy": null,
  "messages": [{ "role": "user", "content": "..." }],
  "provider": "openrouter",
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free"
}
```

События стрима: `thinking`, `thought`, `delta`, `progress`, `feedback`, `done`, `error`.

## Структура

`core/` — единое место для всех микросервисов backend: настройки, доступ к БД, AI и другие интеграции. Новые сервисы складываем сюда, чтобы не плодить отдельные папки.

```text
backend/
├── app/
│   ├── main.py                  # FastAPI, CORS, lifespan с httpx
│   ├── core/
│   │   ├── config.py            # настройки из .env
│   │   └── ai/
│   │       ├── prompts.py       # промпты, kickoff, маркеры
│   │       ├── providers.py     # Gemini, OpenRouter, AIAI, mock
│   │       └── service.py       # AiChatService, SSE, MarkerFilter
│   └── api/
│       └── v1/
│           ├── router.py        # подключение роутеров
│           └── endpoints/
│               ├── health.py    # GET /api/v1/health
│               └── ai.py        # /api/v1/ai/*
├── tests/                       # pytest
├── .env.example
├── .gitignore
├── pyproject.toml
├── uv.lock
└── README.md
```

## Тесты

```bash
uv run pytest -q
```
