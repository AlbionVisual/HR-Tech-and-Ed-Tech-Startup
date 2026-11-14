# HR-Tech & Ed-Tech Startup

MVP-тренажёр для подготовки к собеседованиям: AI-интервью, анализ резюме,
тесты и голосовой режим.

## Стек

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Backend:** Python 3.12+, FastAPI, SQLAlchemy, Alembic, uv.
- **БД:** PostgreSQL 16.
- **Инфраструктура:** Docker Compose, Caddy.

## Структура

```text
.
├── frontend/          # React SPA
├── backend/           # FastAPI, БД, AI, тесты
├── docker-compose.yml # db + api + frontend + caddy
├── Caddyfile          # HTTPS и reverse proxy
└── .env.example
```

## Запуск через Docker

```bash
cp .env.example .env
docker compose up --build -d
```

Приложение: https://localhost

Caddy выпускает локальный сертификат — примите предупреждение браузера.
Для VPS укажите в `.env` домен:

```env
APP_DOMAIN=app.example.com
```

и направьте DNS на сервер. Наружу открываются только 80/443.

## Запуск без Docker

### Backend

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

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Открыть: https://localhost:5273

## API

- `/api/v1/ai/*` — модели и AI-стрим.
- `/api/v1/interviews/*` — интервью и история чатов.
- `/api/v1/resumes/*` — загрузка, анализ и история резюме.
- `/api/v1/tests/*` — тесты и попытки.
- `/api/v1/profile/*` — профиль.

Swagger: https://localhost/docs

## Проверки

```bash
cd backend
uv run pytest -q

cd frontend
npm run lint
npm run build
```

## Текущий статус

- AI, интервью, резюме и тесты работают через backend.
- PostgreSQL подключён, схема управляется Alembic.
- Auth пока demo UUID, полноценная авторизация в планах.
- TTS пока использует клиентские ключи.
