# Production runbook: VPS 1 GB / 1 CPU

Стек: `db + api + frontend (nginx) + caddy`. Образы `api` и `frontend`
собираются в GitHub Actions и публикуются в GHCR. VPS только скачивает их.

## 2. Первичная настройка VPS

```bash
sudo apt-get update
sudo apt-get install -y git
sudo git clone <repo> /opt/hrtech
cd /opt/hrtech
sudo bash deploy/vps-setup.sh
```

Скрипт создаёт swap 2 GB, настраивает `vm.swappiness`, UFW и ставит Docker.
Если SSH-порт не 22:

```bash
sudo SSH_PORT=2222 bash deploy/vps-setup.sh
```

Если деплой идёт не от root, после клонирования передайте каталог
deploy-пользователю:

```bash
sudo chown -R <deploy-user>:<deploy-user> /opt/hrtech
sudo usermod -aG docker <deploy-user>
```

После `usermod` нужно перелогиниться.

Проверка:

```bash
free -h
swapon --show
docker --version
docker compose version
sudo ufw status
```

## 3. `.env`

```bash
cd /opt/hrtech
cp .env.example .env
nano .env
```

Обязательно заменить:

```env
APP_DOMAIN=app.example.com
ENVIRONMENT=production

POSTGRES_PASSWORD=<длинный URL-safe пароль>
SESSION_SECRET=<openssl rand -hex 32>

APP_PUBLIC_URL=https://app.example.com
AI_CORS_ORIGINS=https://app.example.com
TELEGRAM_REDIRECT_URI=https://app.example.com/api/v1/auth/telegram/callback

GOOGLE_CLIENT_ID=<от auth-разработчика>
TELEGRAM_CLIENT_ID=<от auth-разработчика>
TELEGRAM_CLIENT_SECRET=<от auth-разработчика>

GEMINI_API_KEY=<...>
OPENROUTER_API_KEY=<...>
AIAI_API_KEY=<...>
```

Пароль PostgreSQL должен быть URL-safe: без `@`, `:`, `/`, `#`, `?`, `$`, `%`.
Иначе `DATABASE_URL` в compose соберётся неправильно.

Секреты не коммитить. `.env` уже в `.gitignore`.

## 4. Доступ к GHCR

Пакеты GHCR по умолчанию приватные. Выберите один вариант.

**Публичные образы:** в GitHub → Packages → backend/frontend → Package
settings → Change visibility → Public.

**Приватные образы:** один раз залогиниться на VPS PAT-токеном с правом
`read:packages`:

```bash
echo "<PAT>" | docker login ghcr.io -u <github-user> --password-stdin
```

Docker сохранит credentials в `/root/.docker/config.json`, и deploy
workflow сможет делать `docker compose pull`.

Если репозиторий форкнут, замените `BACKEND_IMAGE` и `FRONTEND_IMAGE` в
`.env` на свой GHCR prefix (`ghcr.io/<owner>/<repo>/...`).

Не меняйте `DEPLOY_PATH` после первого запуска: Compose использует имя
каталога как имя проекта, и вместе с ним меняются имена volumes.

## 5. Первый запуск

Перед первым запуском убедитесь, что CI на `main` уже собрал и запушил
образы в GHCR (job `images` в Actions). Иначе `docker compose pull` не
найдёт `latest`.

```bash
cd /opt/hrtech
docker compose pull
docker compose up -d
docker compose ps
docker compose logs -f api
```

API при старте выполняет `alembic upgrade head`. Если миграция падает,
контейнер не поднимется — смотреть логи.

Проверка:

```bash
curl -fsS https://app.example.com/health
curl -fsS https://app.example.com/ready
curl -I https://app.example.com/docs
```

Caddy сам выпустит Let's Encrypt сертификат после появления DNS.

## 6. GitHub Actions

### Repository variables

| Variable | Значение |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Google client ID для frontend-сборки |
| `DEPLOY_ENABLED` | `true` — включает автодеплой после успешного CI |
| `DEPLOY_PATH` | `/opt/hrtech` (можно не задавать) |

`VITE_GOOGLE_CLIENT_ID` вшивается в frontend на этапе сборки. После
изменения значения нужно пересобрать образ (push в `main` или ручной
запуск CI). Значение должно совпадать с `GOOGLE_CLIENT_ID` в `.env` на VPS.

### Environment `production` secrets

Создать Environment `production` в настройках репозитория и добавить:

| Secret | Значение |
| --- | --- |
| `VPS_HOST` | IP или домен VPS |
| `VPS_USER` | пользователь SSH, например `root` |
| `VPS_PORT` | SSH-порт, по умолчанию 22 |
| `VPS_SSH_KEY` | приватный ключ для деплоя |
| `VPS_KNOWN_HOSTS` | опционально: `ssh-keyscan -H <host>` |

Публичный ключ добавить в `~/.ssh/authorized_keys` на VPS.

Если репозиторий приватный, на VPS нужен read-only deploy key (или PAT)
для `git fetch` во время деплоя.

Deploy workflow:

1. ждёт успешного завершения `CI` на `main`;
2. берёт тег `sha-<commit>`;
3. синхронизирует репозиторий на VPS (`git fetch` + `git reset --hard`
   на commit образа);
4. записывает `IMAGE_TAG` в `.env` на VPS;
5. делает `docker compose pull api frontend`;
6. делает `docker compose up -d --remove-orphans`;
7. ждёт `/ready` до 90 секунд;
8. при ошибке возвращает предыдущий `IMAGE_TAG` и поднимает старые образы.

Не храните на VPS локальные изменения tracked-файлов: deploy делает
`git reset --hard`. Все настройки держите в `.env`.

Ручной запуск: Actions → Deploy → Run workflow. Можно указать `latest` или
`sha-<commit>`.

## 7. Обновление и rollback

Обычное обновление — push в `main`. CI прогоняет тесты, собирает образы,
Deploy поднимает новую версию.

Обновление `db` и `caddy` (образы не входят в автодеплой) — вручную в окно
обслуживания:

```bash
cd /opt/hrtech
docker compose pull db caddy
docker compose up -d
```

Перед обновлением PostgreSQL сделайте бэкап.

Ручной rollback:

```bash
cd /opt/hrtech
# посмотреть предыдущие теги в GHCR или в истории Actions
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=sha-<old-commit>/' .env
docker compose pull api frontend
docker compose up -d --remove-orphans
docker compose exec -T api python -c \
  "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/ready')"
```

Rollback возвращает только образ приложения. Миграции Alembic назад не
откатываются. Если релиз содержал destructive-миграцию, нужен restore БД
из бэкапа или ручная down-миграция. Перед рискованным релизом сделайте
`./deploy/backup-db.sh`.

## 8. Мониторинг

```bash
free -h
docker stats --no-stream
docker compose ps
docker compose logs --tail=200 api
docker compose logs --tail=100 caddy
```

Минимальный внешний мониторинг:

- Uptime Kuma/healthchecks на `https://app.example.com/ready`;
- Sentry для backend/frontend;
- алерт на падение контейнера или рост памяти.

Не ставить на этот VPS self-hosted Prometheus/Grafana/Sentry — они съедят
всю память.

## 9. Бэкапы PostgreSQL

```bash
cd /opt/hrtech
./deploy/backup-db.sh
```

Cron:

```cron
0 3 * * * /opt/hrtech/deploy/backup-db.sh >> /var/log/hrtech-backup.log 2>&1
```

Скрипт хранит 7 дней в `backups/`. Volume `pgdata` — не бэкап. Копии нужно
вывозить offsite (S3, rsync на другой сервер).

Проверка restore на отдельной БД:

```bash
docker compose exec -T db sh -c \
  'dropdb -U "$POSTGRES_USER" --if-exists hrtech_restore'
docker compose exec -T db sh -c \
  'createdb -U "$POSTGRES_USER" hrtech_restore'
gunzip -c backups/hrtech-<timestamp>.sql.gz \
  | docker compose exec -T db sh -c \
    'psql -U "$POSTGRES_USER" -d hrtech_restore'
```

## 10. Если не хватает памяти

Порядок действий:

1. `free -h` и `docker stats --no-stream` — найти потребителя.
2. Убедиться, что образы не собираются на VPS.
3. Уменьшить `DATABASE_POOL_SIZE` до 3.
4. Проверить, что `RESUME_PARSE_CONCURRENCY=1`.
5. Отключить лишние AI-запросы/фоновые задачи.
6. Если стабильно не хватает — перейти на 2 GB RAM или убрать
   nginx-контейнер (Caddy раздаёт статику сам).

## 11. Чек-лист первого деплоя

- [ ] DNS A-запись указывает на VPS.
- [ ] Swap 2 GB активен.
- [ ] UFW: только 22/80/443.
- [ ] `.env` заполнен, `SESSION_SECRET` и пароль БД заменены.
- [ ] OAuth callback URL совпадает с доменом.
- [ ] `docker compose ps` — все контейнеры healthy.
- [ ] `/health` и `/ready` отвечают 200.
- [ ] Вход Google/Telegram работает.
- [ ] Интервью, резюме, тест и SSE-стрим проверены.
- [ ] Бэкап PostgreSQL создаётся и восстанавливается.
- [ ] Внешний мониторинг смотрит на `/ready`.
