# 01 — Product Vision & UX

Документ обязателен к исполнению целиком. Генератор кода не имеет права упрощать сценарии или выкидывать панели.

---

## 1.1 Продукт

| Поле | Значение |
|------|----------|
| Название | **SQL-Forge** |
| Подзаголовок (RU) | Интерактивный SVG-конструктор баз данных |
| Подзаголовок (EN) | Interactive SVG Database Schema Designer |
| Тип | SPA, визуальный ER-редактор + live DDL |
| Платформа | Современный desktop Chrome/Firefox/Edge; mobile — usable (панели stacked), desktop — primary |
| Рендер схемы | Pure SVG Workspace (zoom/pan/drag) |
| Диалекты SQL | PostgreSQL (default), MySQL |

**Ценность:** дать архитектору данных прозрачный визуальный конструктор схемы: таблицы и колонки на бесконечном SVG-холсте, связи как кубические кривые Безье с маркерами мощности, и мгновенный DDL (`CREATE TABLE` + `FOREIGN KEY`) для PostgreSQL/MySQL.

**Аудитория:** backend/fullstack разработчики, DBA, студенты БД, инженеры, которым нужен нетривиальный stateful demo на Angular Signals с реальной геометрией связей и генерацией SQL.

---

## 1.2 Информационная архитектура экрана

Один главный экран (без роутинга страниц). Корневой каркас — `AppComponent` на **CSS Grid** (три колонки). Состав панелей:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Toolbar: SQL-Forge | dialect PG/MySQL | theme | lang | help | reset view     │
├────────────────┬─────────────────────────────────────┬───────────────────────┤
│                │                                     │                       │
│  TOOLS PANEL   │   SVG WORKSPACE                     │  INSPECTOR            │
│  [+ Create]    │   grid background                   │  Properties of        │
│  table list    │   table-nodes                       │  selected table/col   │
│  presets       │   Bezier relations + markers        │  ─────────────────    │
│                │   zoom wheel | pan MMB | drag       │  Live SQL (DDL)       │
│                │   link-tool rubber band             │  [Copy SQL]           │
│                │                                     │                       │
└────────────────┴─────────────────────────────────────┴───────────────────────┘
│ Status: tables N | columns M | relations R | zoom Z% | dialect               │
```

- Левая панель tools: ~240–280px (см. Appendix A); центр — flex grow; правая inspector: ~360–420px.
- На `width < 1100px`: вертикальный стек Tools → Canvas → Inspector (canvas минимум 360px высотой).
- Z-index: workbench (0) < panels (10) < selection / rubber-band (20) < context menus / drawers (30) < toast (40).

Канон композиции:
- `AppComponent` — CSS Grid shell + toolbar + status-bar.
- Внутри: `ToolsPanelComponent` | `SvgCanvasComponent` | `InspectorPanelComponent`.
- `TableNodeComponent` рендерится **внутри** SVG (foreignObject **или** pure SVG-группы — **канон: pure SVG groups** для таблицы/колонок, без HTML foreignObject, чтобы hit-test и transform были единообразны).

---

## 1.3 Визуальный язык — Data Architect Dark

Тема по умолчанию: **dark** (Supabase / dbdiagram vibe). Светлая тема панелей — переключатель (холст остаётся тёмным с сеткой).

CSS variables (обязательные имена в `styles.scss` или `@theme` / `:root` при Tailwind):

```scss
:root,
[data-theme='dark'] {
  --sf-bg-deep: #0b0f14;
  --sf-bg-panel: #111827;
  --sf-bg-panel-elevated: #1a2332;
  --sf-bg-canvas: #0d1117;
  --sf-bg-table: #161b22;
  --sf-bg-table-header: #1f2937;
  --sf-border: #30363d;
  --sf-border-strong: #484f58;
  --sf-text: #e6edf3;
  --sf-text-muted: #8b949e;
  --sf-accent: #3ecf8e;          /* supabase green — не purple-theme */
  --sf-accent-2: #58a6ff;        /* link / selection cyan-blue */
  --sf-pk: #f0c14b;
  --sf-fk: #58a6ff;
  --sf-danger: #f85149;
  --sf-grid: rgba(48, 54, 61, 0.55);
  --sf-relation: #8b949e;
  --sf-relation-active: #3ecf8e;
  --sf-sql-bg: #0d1117;
  --sf-sql-keyword: #ff7b72;
  --sf-sql-type: #79c0ff;
  --sf-sql-ident: #e6edf3;
  --sf-focus-ring: #3ecf8e;
  --sf-marker: #c9d1d9;
}

[data-theme='light'] {
  --sf-bg-deep: #f6f8fa;
  --sf-bg-panel: #ffffff;
  --sf-bg-panel-elevated: #f0f3f6;
  --sf-border: #d0d7de;
  --sf-text: #1f2328;
  --sf-text-muted: #656d76;
  /* canvas остаётся тёмным: не переопределяй --sf-bg-canvas / table / relation colors */
}
```

**Шрифты (подключи в `index.html`):**
- UI: **IBM Plex Sans** или **Space Grotesk** — не Inter/Roboto/Arial.
- SQL / mono: **IBM Plex Mono** или **JetBrains Mono**.

**Motion (минимум 2–3):**
1. Появление новой таблицы: `opacity` + лёгкий `scale` 150–200ms.
2. Pulsing / stroke glow на selected table или active relation.
3. Slide/fade inspector property section при смене selection; toast «Скопировано» 200ms fade-in.

**Запреты визуала:** purple-on-white градиентные «AI-кластеры», cream+#terracotta broadsheet, emoji в UI, multi-layer drop shadows, rounded-full pill-кластеры статистики.

---

## 1.4 User journeys (обязательные сценарии)

### J1 — Первый взгляд
1. Пользователь открывает приложение.
2. Видит seed-схему из Appendix A (например `users` ↔ `posts`) **или** пустой холст + выделенную кнопку «Создать таблицу» / пресеты.
3. **Канон:** на старте загружен preset `blog` (≥2 таблицы, ≥1 relation); SQL справа уже заполнен.

### J2 — Создать и править таблицу
1. Жмёт «Создать таблицу» → новая таблица появляется на холсте со стартовыми колонками (`id` PK INT + одна VARCHAR).
2. Кликает заголовок / колонку → inspector показывает свойства.
3. Меняет имя, тип, PK/NN/UQ → SQL обновляется сразу.

### J3 — Drag / Pan / Zoom
1. Тащит таблицу за заголовок — координаты обновляются, Bezier-связи следуют.
2. Средняя кнопка — pan всего холста.
3. Колесо — zoom к курсору; `Ctrl+0` — reset view.

### J4 — Связать (FK)
1. Кликает иконку связи у колонки A.
2. Тянет rubber-band линию к колонке B другой таблицы.
3. Отпускает → создаётся Relation (default `one-to-many`), колонка A помечается FK; SQL добавляет `ALTER TABLE … FOREIGN KEY`.

### J5 — Dialect / Copy / Preset / i18n
1. Переключает PostgreSQL ↔ MySQL — DDL пересобирается (типы/квоты).
2. «Скопировать» кладёт SQL в clipboard + toast.
3. Загружает preset `ecommerce`; переключает язык `G`, тему `T`.

---

## 1.5 Hotkeys

См. [appendix-a-defaults.md](appendix-a-defaults.md) §A.10. Реализуй все строки таблицы. Игнорируй, если `event.target` — `textarea` / `input` / `contenteditable` / `select`, **кроме** Escape (сброс selection / link mode / help) и Delete/Backspace (удаление выделенной таблицы, если фокус не в поле ввода).

---

## 1.6 Accessibility

1. Toolbar и tools кнопки — focusable, `aria-label` через i18n.
2. Список таблиц слева: keyboard-навигация, Enter выбирает таблицу.
3. SVG table groups: `tabindex`, `role="button"` / `role="group"` с `aria-label` имени таблицы.
4. Контраст текста на панелях ≥ WCAG AA для основного текста.
5. Не полагайся только на цвет для PK/FK — текстовые/иконные маркеры `PK` / `FK`.
6. Toast копирования: `role="status"` / `aria-live="polite"`.

---

## 1.7 Нефункциональные требования

1. Пересчёт всех relation paths при drag — на каждый pointermove без заметных лагов для ≤30 таблиц / ≤60 связей (ориентир).
2. SQL generation — чистая функция от snapshot схемы; вызов через `computed`, не debounce обязателен (канон: **синхронный computed**).
3. Без роутера и без SSR.
4. Без внешних graph/layout библиотек.
5. README с install/start/test и кратким описанием возможностей.
