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

Проверка:

- http://localhost:8000/health
- http://localhost:8000/api/v1/health
- http://localhost:8000/docs

## Структура

```text
backend/
├── app/
│   ├── main.py                  # создание FastAPI-приложения
│   ├── core/
│   │   └── config.py            # настройки из .env
│   └── api/
│       └── v1/
│           ├── router.py        # подключение роутеров
│           └── endpoints/
│               └── health.py    # GET /api/v1/health
├── .env.example
├── .gitignore
├── pyproject.toml
├── uv.lock
└── README.md
```
