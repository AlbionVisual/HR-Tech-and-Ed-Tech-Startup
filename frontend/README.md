# Frontend

React SPA проекта HR-Tech & Ed-Tech Startup: интервью, резюме, тесты и профиль.

## Запуск

```bash
cd frontend
npm install
npm run dev
```

Приложение: https://localhost:5273

Dev-сервер работает по HTTPS с самоподписанным сертификатом, чтобы работали
микрофон и доступ с телефона по локальной сети.

## Скрипты

```bash
npm run dev          # dev-сервер
npm run build        # production-сборка в dist/
npm run build:pages  # сборка в ../docs/ для GitHub Pages
npm run lint         # ESLint
```

## API

- `VITE_API_BASE_URL` — базовый URL backend. Пустое значение означает
  same-origin запросы через Vite proxy.
- Каталог AI-моделей загружается из `GET /api/v1/ai/models`.
- Интервью: `POST /api/v1/interviews:stream`,
  `POST /api/v1/interviews/{id}/messages:stream`,
  `POST /api/v1/interviews/{id}/next-question:stream`,
  `GET /api/v1/interviews`.
- Анализ резюме: `POST /api/v1/resumes/extract`,
  `POST /api/v1/resumes/checks:stream`,
  `POST /api/v1/resumes/checks/{id}/messages:stream`.
