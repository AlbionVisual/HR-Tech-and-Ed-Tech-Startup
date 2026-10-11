# mvp-front

Прототип тренажёра собеседования: только фронт (Vite + React + Tailwind). Ключи API в `localStorage` (BYOK). Опционально голос: TTS + STT в браузере.

Подсказки по запуску, ключам и телефону — в корневом [`../README.md`](../README.md).

## Структура

```
mvp-front/
    index.html                                  # HTML-оболочка Vite
    package.json                                # Скрипты: dev / build / build:pages / preview:pages
    vite.config.ts                              # React, Tailwind, HTTPS (basic-ssl), host: true
    tsconfig.json / tsconfig.app.json / tsconfig.node.json
    .env.example                                # Заглушка (ключи через Профиль / URL, не .env)

    src/
        main.tsx                                    # createRoot, VoiceProvider, стили
        App.tsx                                     # Вкладки, TopBar / BottomNav, роутинг страниц
        index.css                                   # Точка входа CSS → styles/*
        vite-env.d.ts                               # Типы Vite

        components/                                 # Общие куски UI
            TopBar.tsx                                  # Заголовок + голос / TTS / модель / меню
            BottomNav.tsx                               # Нижняя навигация по вкладкам
            ModelSelect.tsx                             # Выбор чат-модели (Gemini / OpenRouter / AIAI)
            TtsSelect.tsx                               # Выбор TTS-модели
            TtsVoiceSelect.tsx                          # Выбор голоса под текущую TTS-модель
            VoiceToggle.tsx                             # Вкл/выкл голосового режима

        config/                                     # Единый источник настроек
            index.ts                                    # Сборка config + реэкспорты хелперов
            app.ts                                      # Вкладки, названия страниц
            ai.ts                                       # Чат-модели, baseUrl, BYOK-ключи storage
            speech.ts                                   # TTS-модели, списки голосов, storage-ключи
            prompts.ts                                  # Промпты; метки [[FEEDBACK]] и [[PROGRESS:N]]

        pages/                                      # Страницы приложения
            InterviewPage.tsx                           # Оболочка интервью → session + UI
            ProfilePage.tsx                             # BYOK-ключи, демо-ссылка, подсказки
            ResumePage.tsx                              # Заглушка «Резюме»
            TestsPage.tsx                               # Заглушка «Тесты»

        features/interview/                         # Логика и UI интервью
            useInterviewSession.ts                      # Фазы, стрим, сообщения, feedback, progress
            InterviewStart.tsx                          # Старт: выбор вакансии / грейда
            VacancySheet.tsx                            # Форма контекста вакансии
            InterviewProgress.tsx                       # Прогресс-бар (0–100 из [[PROGRESS:N]])
            ChatView.tsx                                # Лента, авто-TTS, Composer / Feedback
            MessageBubble.tsx                           # Пузырь + чекбокс «Проиграть»
            Composer.tsx                                # Ввод, микрофон → текст в поле, отправка
            ThinkingIndicator.tsx                       # «Думает» + thought-стрим
            FeedbackActions.tsx                         # «Уточнить» / «Следующий вопрос»

        ai/                                         # Чат с провайдерами
            client.ts                                   # Фасад: resolveSelection → нужный provider
            byok.ts                                     # get/set/clear ключа в localStorage
            bootstrapFromUrl.ts                         # Ключи/модель из query или hash; clean URL
            selection.ts                                # Список доступных моделей, выбор в шапке
            events.ts                                   # AI_SETTINGS_EVENT
            errors.ts                                   # Разбор/человекочитаемые ошибки API
            types.ts                                    # ChatMessage и общие типы чата
            providers/
                types.ts                                    # Контракт провайдера (streamChat и т.п.)
                gemini.ts                                   # Gemini generateContent / SSE
                openrouter.ts                               # OpenRouter chat/completions SSE
                aiai.ts                                     # AIAI.BY OpenAI-compatible chat SSE
            stream/
                parseSse.ts                                 # Парсер SSE-чанков
                typewriter.ts                               # Посимвольная/покусковая отрисовка

        speech/                                     # Голос: TTS + STT
            VoiceContext.tsx                            # Режим голоса, speak/mic, heardInsert в Composer
            tts.ts                                      # Маршрутизация TTS + кэш + статусы loading/playing
            ttsSelection.ts                             # Выбор TTS-модели/голоса, localStorage
            ttsCache.ts                                 # In-memory кэш blob по provider|model|voice|text
            playAudio.ts                                # Воспроизведение Blob через общий Audio
            browserTts.ts                               # speechSynthesis (браузер)
            browserStt.ts                               # SpeechRecognition + getUserMedia permission
            geminiTts.ts                                # Gemini AUDIO generateContent → wav/mp3
            aiaiTts.ts                                  # AIAI POST /v1/audio/speech
            dom.d.ts                                    # Типы SpeechRecognition для TS

        ui/
            btn.ts                                      # Общие tailwind-классы кнопок/полей

        styles/
            tokens.css                                  # @import tailwind + theme / CSS variables
            shell.css                                   # Кастом оболочки (если нужен)
            interview.css                               # Анимации пузырей / интервью
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
npm run build:pages
```

## Скрипты

| Команда                 | Что делает                                        |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | HTTPS-dev с `host: true` (телефон в той же Wi‑Fi) |
| `npm run build`         | `dist/`                                           |
| `npm run build:pages`   | Сборка в `../docs` с base для GitHub Pages        |
| `npm run preview:pages` | Локальный превью как на Pages                     |

## Подсказки

### Ключи и модели чата

1. Открой вкладку **Профиль**, вставь ключ Gemini / OpenRouter / AIAI.BY → сохрани.
2. В шапке выбери чат-модель. Список моделей правится в `mvp-front/src/config/ai.ts`.
3. Демо-ссылка с ключами: в Профиле «Собрать ссылку» (параметры в query/hash: `gemini`/`g`, `openrouter`/`or`, `aiai`/`a`, `model`/`m`). После загрузки ключи пишутся в `localStorage`, URL чистится.
4. `429` у OpenRouter / лимиты провайдеров — это квоты API, не баг фронта. Смени модель или подожди.

### Голос (говорилка)

1. В шапке включи голос → появятся селекты **TTS-модель** и **голос** (голос зависит от модели).
2. Списки моделей/голосов — только в `mvp-front/src/config/speech.ts` (`aiai.models`, `gemini.models`). У AIAI у разных моделей разные `voice` id (turbo ≠ mai-voice-2 ≠ grok).
3. Нужны ключи: Gemini TTS → ключ Gemini; AIAI TTS → ключ AIAI.BY. Браузерный TTS ключа не требует.
4. Одинаковый текст + модель + голос кэшируется в памяти вкладки — повторное «Проиграть» без нового запроса к API.
5. Распознанная речь **дописывается в поле ввода** (без автоотправки) — можно поправить и нажать «Отправить».
6. Если микрофон запрещён в настройках телефона/браузера — приложение покажет явную ошибку про разрешение; включи доступ для Chrome/Safari и обнови страницу.
7. На телефоне удобно: ПК `npm run dev` → в терминале URL вида `https://192.168.x.x:5173` → открыть на телефоне в той же Wi‑Fi (принять сертификат).

### GitHub Pages

Скрипт кладёт сайт в `docs/` в корне репо:

```
cd mvp-front
npm run build:pages
```

Локально как на Pages (`http://localhost:4173/HR-Tech-and-Ed-Tech-Startup/`):

```
cd mvp-front
npm run preview:pages
```

В настройках репозитория: Pages → Source → Deploy from branch → папка `/docs`.
