# HR-Tech & Ed-Tech Startup

MVP-тренажёр для подготовки к собеседованиям: AI-интервью, анализ резюме,
тесты и голосовой режим.

## Стек

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Backend:** Python 3.12+, FastAPI, SQLAlchemy, Alembic, uv.
- **БД:** PostgreSQL 16.
- **Инфраструктура:** Docker Compose, Caddy, GitHub Actions, GHCR.

## Структура

```text
.
├── frontend/              # React SPA
├── backend/               # FastAPI, БД, AI, тесты
├── deploy/                # VPS setup и backup-скрипты
├── .github/workflows/     # CI, сборка образов, deploy
├── docker-compose.yml     # db + api + frontend + caddy
├── Caddyfile              # HTTPS и reverse proxy
└── .env.example
```

## Локальный запуск через Docker

```bash
cp .env.example .env
docker compose up --build -d
```

Приложение: https://localhost

Caddy выпускает локальный сертификат — примите предупреждение браузера.
Наружу открываются только 80/443. PostgreSQL и API доступны только внутри
Docker-сети.

## Публичный адрес (домен или IP)

Переключается одним скриптом:

```bash
python3 scripts/set_public_url.py https://127.0.0.1
python3 scripts/set_public_url.py https://app.example.com
```

Скрипт правит `.env` (`APP_DOMAIN`, `APP_PUBLIC_URL`, `TELEGRAM_REDIRECT_URI`,
`CADDY_TLS_LINE`) и печатает, что добавить в BotFather (Login Widget →
Allowed URLs) и как перезапустить контейнеры.

Для локального IP/`localhost` ставится `CADDY_TLS_LINE=tls internal` — Caddy
выпускает локальный сертификат и отвечает на IP без SNI. Для настоящего домена
строка пустая: Caddy сам получает сертификат Let's Encrypt. На сервере
направьте DNS на IP и откройте наружу только 80/443.

## Production на VPS 1 GB / 1 CPU

Стек рассчитан на один Uvicorn worker, пул БД из 5 соединений, один
одновременный PDF/DOCX-парсинг и rate limit AI-запросов. Образы собираются
в GitHub Actions и скачиваются с GHCR, поэтому VPS не тратит память на
`npm build` и `uv sync`.

Кратко:

```bash
sudo apt-get update && sudo apt-get install -y git
git clone <repo> /opt/hrtech
cd /opt/hrtech
sudo bash deploy/vps-setup.sh
cp .env.example .env
nano .env
docker compose pull
docker compose up -d
curl -fsS https://<APP_DOMAIN>/ready
```

Подробный runbook, переменные GitHub Actions, обновление, rollback и бэкапы:
см. [deploy/README.md](deploy/README.md).

Главное для `.env` на сервере:

```env
APP_DOMAIN=app.example.com
APP_PUBLIC_URL=https://app.example.com
AI_CORS_ORIGINS=https://app.example.com
TELEGRAM_REDIRECT_URI=https://app.example.com/api/v1/auth/telegram/callback
POSTGRES_PASSWORD=<сильный URL-safe пароль>
SESSION_SECRET=<openssl rand -hex 32>
```

## GitHub Actions

- `CI` — backend-тесты, frontend lint/build, сборка и push образов в GHCR
  при push в `main`.
- `Deploy` — pull готовых образов на VPS, `docker compose up -d`,
  проверка `/ready`, автоматический rollback на предыдущий тег.

Автодеплой включается переменной репозитория `DEPLOY_ENABLED=true`.
Список secrets и variables — в [deploy/README.md](deploy/README.md).

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

- `/api/v1/auth/*` — вход через Google и Telegram, сессия, выход.
- `/api/v1/ai/*` — модели и AI-стрим.
- `/api/v1/interviews/*` — интервью и история чатов.
- `/api/v1/resumes/*` — загрузка, анализ и история резюме.
- `/api/v1/tests/*` — тесты и попытки.
- `/api/v1/profile/*` — профиль.

Проверки:

- `/health` — liveness.
- `/ready` — API и подключение к БД.
- `/docs` — Swagger.

## Проверки

```bash
cd backend
uv run pytest -q

cd frontend
npm run lint
npm run build

docker compose config --quiet
```

## Ограничения под 1 GB

| Параметр | Значение по умолчанию |
| --- | --- |
| Uvicorn workers | 1 |
| `--limit-concurrency` | 20 |
| `DATABASE_POOL_SIZE` | 5 |
| `DATABASE_MAX_OVERFLOW` | 2 |
| PostgreSQL `shared_buffers` | 128 MB |
| PostgreSQL `max_connections` | 20 |
| `AI_RATE_LIMIT_REQUESTS` | 30 за 60 с на пользователя |
| `RESUME_PARSE_CONCURRENCY` | 1 |
| Лимит тела запроса (Caddy) | 16 MB |

Rate limit хранится в памяти процесса. Это корректно только при одном
Uvicorn worker; при масштабировании нужен Redis.

## Текущий статус

- AI, интервью, резюме и тесты работают через backend.
- PostgreSQL подключён, схема управляется Alembic.
- Авторизация через Google и Telegram, сессия в HttpOnly cookie.
- Без авторизации приложение показывает только страницу входа.
- TTS пока использует клиентские ключи.
