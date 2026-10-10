# HR-Tech-and-Ed-Tech-Startup

## Структура

```
mvp-front/                                  # Прототип приложения, только фронт
    src/
        App.tsx                                     # Точка входа в приложение, state текущей вкладки, общие элементы приложения
        main.tsx
        components/                                 # Части общие для приложения
            TopBar.tsx
            BottomNav.tsx
            ModelSelect.tsx
        config/                                     # Все настройки рекомендуется хранить в одном месте
            index.ts
            app.ts
            ai.ts                                       # Модели Gemini / OpenRouter — править здесь
            prompts.ts                                  # Тексты промптов
        pages/                                      # Странички приложения
            TestsPage.tsx
            ResumePage.tsx
            InterviewPage.tsx
            ProfilePage.tsx
        features/                                   # Индивидуальный код для каждой из страничек
            interview/
                useInterviewSession.ts                      # Мозг, фазы, стрим, остальное - UI куски
                InterviewStart.tsx
                VacancySheet.tsx
                InterviewProgress.tsx
                ChatView.tsx
                MessageBubble.tsx
                Composer.tsx
                ThinkingIndicator.tsx
                FeedbackActions.tsx
        ai/                                         # Код для работы с ИИ
            client.ts                                   # Фасад
            byok.ts                                     # get/set ключа в localStorage
            bootstrapFromUrl.ts                         # Ключи/модель из query или hash ссылки
            selection.ts                                # Выбор модели в шапке
            types.ts
            providers/
                gemini.ts
                openrouter.ts
                aiai.ts
                types.ts
            stream/
                parseSse.ts
                typewriter.ts
        ui/
            btn.ts                                      # Общие tailwind-классы кнопок/полей
        styles/                                     # Tailwind + место под кастомный CSS
            tokens.css                                  # @import tailwind + theme
            shell.css                                   # пусто / кастом оболочки
            interview.css                               # анимации и кастом интервью
README.md
```

## Запуск

```
cd mvp-front
npm install
npm run dev
```

Обычный билд (папка `mvp-front/dist`):

```
cd mvp-front
npm run build
```

## GitHub Pages

Скрипт кладёт готовый сайт в корень репозитория, в `docs/`:

```
cd mvp-front
npm run build:pages
```

Проверить локально что будет в pages (http://localhost:4173/HR-Tech-and-Ed-Tech-Startup/):

```
cd mvp-front
npm run preview:pages
```
