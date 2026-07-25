# SQL-Forge — Главный промпт генерации проекта

> **Как использовать этот пакет:** вставь содержимое этого файла (INDEX.md) в начало диалога с кодовым агентом, затем укажи: «Прочитай и строго выполни документы `docs/01` → `docs/09` и оба appendix в указанном порядке. Генерируй полный код приложения без сокращений.»

---

## 0. Роль и миссия

Ты — **Senior Angular Architect** и **Проектировщик СУБД**. Твоя задача — **с нуля** создать полноценное, расширенное, Enterprise-ready веб-приложение:

**«SQL-Forge: Интерактивный SVG-конструктор баз данных»**

на **последнем стабильном Angular (22+ на момент генерации)**.

Не спрашивай разрешения «начать с MVP». Выдай **полный рабочий проект**: все файлы, полные модели схемы (Table / Column / Relation), векторный движок связей (cubic Bezier + авто-выбор грани), drag/pan/zoom без Zone.js, live DDL-генератор PostgreSQL/MySQL, трёхпанельный workbench, инструмент «Связать», i18n, тесты из пакета документов. Выжми максимум из контекста. Не жалей токенов. Пиши шедевр.

Этот INDEX — точка входа. Детальные требования — в связанных документах ниже. При конфликте: **более специфичный документ побеждает**; жёсткие правила из §1 этого файла **неотменяемы**.

---

## 1. ЖЁСТКИЕ ПРАВИЛА ГЕНЕРАЦИИ КОДА (БЕЗ ИСКЛЮЧЕНИЙ)

1. **ПИШИ КОД ПОЛНОСТЬЮ.** Любые сокращения, комментарии вида `// ...`, `// TODO`, `// аналогично`, `// логика аналогична`, `/* rest of file */`, `...existing code...` **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ**. Напиши каждую строчку, каждый интерфейс, каждый цикл отрисовки связей и парсер генерации SQL от начала до конца. Если файлы получаются гигантскими — пиши их целиком, не жалей токены.
2. **Только современный Angular:**
   - Standalone-компоненты (`standalone: true` явно, если CLI ещё требует).
   - **Angular Signals** для абсолютно всего реактивного состояния (`signal`, `computed`, `effect`, `linkedSignal`). **Запрещены** `BehaviorSubject` / `Subject` для UI/схемного состояния.
   - Новый Control Flow: `@if`, `@for` (с обязательным `track`), `@switch`, `@let`. **Запрещены** `*ngIf`, `*ngFor`, `*ngSwitch`.
   - `input()`, `output()`, `model()` вместо `@Input` / `@Output` декораторов.
   - `inject()` для DI.
   - **Zoneless** change detection (как в новых приложениях Angular 21+/22+). Не опирайся на Zone.js для обновления UI.
   - `ChangeDetectionStrategy.OnPush` (дефолт новых приложений — не отключай).
3. **Разделяй логику:** интерфейсы/модели отдельно, чистая геометрия связей и SQL-сборка в `domain/schema/`, Angular-сервисы-обёртки отдельно, UI-компоненты отдельно, stores (signals) отдельно. UI **не** считает Bezier-контрольные точки и **не** собирает DDL-строку вручную в шаблоне.
4. **Рендер схемы — чистый SVG.** Интерактивный SVG Workspace. **Запрещены** Three.js, Babylon, WebGL-фреймворки, сырой WebGL, Chart.js, D3, Plotly, Cytoscape, dagre, jointjs, mxGraph как npm-зависимости (геометрию связей пишешь сам).
5. **Схемная механика обязательна:**
   - Модели Table / Column / Relation / Point / ZoomState — из [03-data-model.md](03-data-model.md).
   - Dynamic SVG Paths (cubic Bezier, nearest left/right edge, маркеры `1`/`∞`) — из [05-svg-canvas.md](05-svg-canvas.md) и [appendix-b-formulas.md](appendix-b-formulas.md).
   - Live DDL PostgreSQL/MySQL (`CREATE TABLE` + `ALTER TABLE … FOREIGN KEY`) — из [04-sql-generator.md](04-sql-generator.md).
   - Drag таблиц, Pan средней кнопкой, Zoom колесом — через Signals, без Zone.js.
6. **Запрещены заглушки:** пустые методы, `return ''`, fake таблицы, Lorem Ipsum в UI, `console.log` вместо логики, «потом допишем».
7. **Тесты обязательны** минимум для: relation geometry (anchor + Bezier path), SQL generator (PG + MySQL oracles), schema store mutations — см. [07-features-extended.md](07-features-extended.md), [09-acceptance-criteria.md](09-acceptance-criteria.md).
8. **i18n RU/EN** через signal-словарь (не `@angular/localize` build-time), см. [07-features-extended.md](07-features-extended.md).
9. **Структура файлов** должна соответствовать [08-file-checklist.md](08-file-checklist.md). Не пропускай файлы из чеклиста. Минимальный каркас из брифа **обязан** присутствовать (rename-locked):
   - `src/app/models/schema.types.ts`
   - `src/app/services/schema-state.service.ts`
   - `src/app/services/sql-generator.service.ts`
   - `src/app/components/svg-canvas/svg-canvas.component.ts`
   - `src/app/components/table-node/table-node.component.ts`
   - `src/app/components/inspector-panel/inspector-panel.component.ts`
   - `src/app/app.component.ts`
   Дополнительные файлы из чеклиста (`domain/`, `state/`, `i18n/`, specs, toolbar, tools-panel) — тоже обязательны.
10. **Стили:** тема **Data Architect Dark** (Supabase / dbdiagram.io vibe). Допустимы **Tailwind CSS** *или* чистый SCSS + CSS variables. Если выбираешь Tailwind — настрой его полностью (конфиг, content paths, утилиты) без TODO. Если SCSS — используй CSS variables `--sf-*` из [01-product-vision.md](01-product-vision.md). Не смешивай хаотично оба подхода в одном компоненте.
11. **Интерфейс** оформляй как современный UI для архитекторов данных: глубокая тёмная тема, трёхпанельное рабочее пространство (tools | SVG canvas | SQL inspector), сетка на холсте, интерактивные блоки таблиц.

---

## 2. Порядок чтения и выполнения документов

Выполняй **строго по порядку**. Не начинай UI, пока не зафиксированы модели, SQL-генератор и геометрия связей.

| Шаг | Документ | Что сделать |
|-----|----------|-------------|
| 1 | [01-product-vision.md](01-product-vision.md) | Понять продукт, трёхпанельный UX, journeys, хоткеи, a11y, визуальный язык |
| 2 | [02-architecture.md](02-architecture.md) | Создать скелет Angular-проекта и папок |
| 3 | [03-data-model.md](03-data-model.md) + [appendix-a-defaults.md](appendix-a-defaults.md) | Table, Column, Relation, Point, ZoomState, selection |
| 4 | [04-sql-generator.md](04-sql-generator.md) + [appendix-b-formulas.md](appendix-b-formulas.md) | DDL builder PostgreSQL/MySQL |
| 5 | [05-svg-canvas.md](05-svg-canvas.md) | Bezier engine + drag/pan/zoom + link tool |
| 6 | [06-ui-panels.md](06-ui-panels.md) | Tools panel, canvas shell, inspector SQL + properties |
| 7 | [07-features-extended.md](07-features-extended.md) | Presets, i18n, hotkeys, copy SQL, тесты |
| 8 | [08-file-checklist.md](08-file-checklist.md) | Сверка: все файлы существуют и полны |
| 9 | [09-acceptance-criteria.md](09-acceptance-criteria.md) | Прогнать DoD / приёмку |

---

## 3. Краткий функциональный объём (обязателен целиком)

### Ядро схемы
- **Table:** id, name, x, y, columns[].
- **Column:** id, name, dataType (`INT` | `VARCHAR` | `UUID` | `BOOLEAN` | `TIMESTAMP`), flags (pk, fk, notNull, unique), optional length для VARCHAR.
- **Relation:** id, fromTableId, fromColumnId, toTableId, toColumnId, kind (`one-to-one` | `one-to-many`).
- Мутации через Signals store: add/remove/update table, column, relation, position.

### Векторный движок связей
- Точки начала/конца пересчитываются при drag таблиц.
- Cubic Bezier: `M x1 y1 C cx1 cy1, cx2 cy2, x2 y2`.
- Авто-выбор ближайшей грани (left/right) по взаимному расположению таблиц.
- Маркеры мощности: `1` и `∞` для One-to-Many; `1`–`1` для One-to-One.

### Drag / Pan / Zoom (zoneless)
- Drag таблицы: mousedown / mousemove / mouseup через signals.
- Pan холста: средняя кнопка мыши (button === 1).
- Zoom: колесо мыши к курсору, clamp из Appendix A.

### Интерфейс
- **Левая панель:** «Создать таблицу», список таблиц, быстрые пресеты схем.
- **Центр:** SVG Workspace с grid background, table-node блоки, связи.
- **Правая панель:** live SQL DDL + редактор свойств выделенного элемента + «Скопировать».
- Клик по таблице/колонке → inspector properties; инструмент «Связать» колонка→колонка создаёт FK.

### Расширения (обязательны)
- Hotkeys, theme toggle, i18n RU/EN, schema presets, unit-тесты geometry/SQL/store.

---

## 4. Технологический стек (зафиксировано)

| Область | Выбор |
|---------|--------|
| Framework | Angular **latest stable ≥ 22** |
| Components | Standalone only |
| State | Signals stores (`providedIn: 'root'` или feature) |
| CD | Zoneless + OnPush |
| Schema rendering | Pure SVG |
| Forms controls | native + signals / `model()` |
| Styling | Tailwind CSS **или** SCSS + CSS variables (Data Architect Dark) |
| i18n | Signal-словари `ru.ts` / `en.ts` + `I18nService.t(key)` |
| Tests | Стандартный test runner CLI проекта (Vitest или Jest) |
| Package manager | npm |
| Language UI default | `ru` |
| SQL dialects | PostgreSQL (default) + MySQL |

**Команда старта проекта (ориентир):**

```bash
npx @angular/cli@latest new sql-forge --routing=false --style=scss --ssr=false
cd sql-forge
```

Имя приложения в `package.json` / title: **SQL-Forge**. Селектор префикс: `sf`.

---

## 5. Definition of Done (кратко)

Приложение **готово**, только если:

1. `ng serve` / `npm start` запускает workbench без ошибок.
2. На старте есть seed-схема (≥2 таблицы со связью) или явный empty + пресеты; правка схемы мгновенно обновляет SVG и SQL через Signals.
3. Создание / удаление / переименование таблиц и колонок работает; PK/NN/UQ чекбоксы влияют на DDL.
4. Drag таблицы плавный; связи пересчитываются; Bezier пути корректны; маркеры `1`/`∞` видны.
5. Pan средней кнопкой и Zoom колесом работают; Reset view возвращает zoom/pan.
6. Инструмент «Связать» создаёт Relation + проставляет FK-флаг на исходной колонке.
7. Правая панель показывает отформатированный DDL для выбранного диалекта; «Скопировать» копирует в clipboard.
8. i18n RU↔EN, theme toggle, hotkeys — работают.
9. Unit-тесты geometry / sql-generator / schema store проходят.
10. В исходниках **нет** `// TODO`, `// ...`, `*ngIf`, `*ngFor`, BehaviorSubject-state, Three.js, D3, Cytoscape, dagre.
11. Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%.
12. Все пункты [09-acceptance-criteria.md](09-acceptance-criteria.md) отмечены как выполненные.

Полный текст приёмки — в документе 09.

---

## 6. Стиль ответа генератора

1. Сначала создай структуру проекта и доменный слой (модели → geometry → sql-builder → stores → services).
2. Затем UI (App shell Grid → tools → canvas/table-node → inspector), затем i18n и тесты.
3. Каждый файл выводи **целиком** с путём.
4. После завершения — кратко перечисли, как запустить и как проверить ключевые сценарии из §5.
5. Не предлагай «упростить Bezier до прямых линий». Не заменяй SVG на Canvas/HTML-absolute для связей. Не пропускай SQL FK constraints или инструмент связывания.

---

## 7. Начни сейчас

Прочитай [01-product-vision.md](01-product-vision.md) и приступай к генерации полного проекта **SQL-Forge** согласно всему пакету `docs/`.

**Начинай генерацию. Напиши этот проект как Senior Angular Architect и Проектировщик СУБД.**
