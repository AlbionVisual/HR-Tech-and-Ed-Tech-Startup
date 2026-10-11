# HR-Tech-and-Ed-Tech-Startup

MVP тренажёра собеседования: только фронт (Vite + React), ключи API в `localStorage` (BYOK), опционально голос (TTS + распознавание речи в браузере).

## Структура

```
mvp-front/                                  # Прототип, только фронт
    src/
        App.tsx
        main.tsx
        components/                             # Общие куски UI
            TopBar.tsx
            BottomNav.tsx
            ModelSelect.tsx                     # Чат-модель
            TtsSelect.tsx / TtsVoiceSelect.tsx  # TTS модель и голос
            VoiceToggle.tsx
        config/                                 # Единый источник настроек
            ai.ts                                   # Чат-модели Gemini / OpenRouter / AIAI
            speech.ts                               # TTS-модели и списки голосов
            prompts.ts
            app.ts
        pages/
            InterviewPage.tsx / ProfilePage.tsx / …
        features/interview/                     # Фазы, чат, композер
        ai/                                     # Провайдеры чата, BYOK, стрим
        speech/                                 # TTS / STT / VoiceContext
        ui/ / styles/
docs/                                       # Сборка под GitHub Pages
README.md
```

## Запуск

```
cd mvp-front
npm install
npm run dev
```

Dev-сервер — **HTTPS** (self-signed через `@vitejs/plugin-basic-ssl`), чтобы микрофон работал и по LAN-IP с телефона. В браузере один раз примите предупреждение о сертификате.

Обычный билд → `mvp-front/dist`:

```
cd mvp-front
npm run build
```
