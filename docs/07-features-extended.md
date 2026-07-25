# 07 — Extended Features

Все фичи этого документа **обязательны**. Не помечай их optional в коде.

---

## 7.1 Schema presets

`schemaState.loadPreset(id)`:
1. Берёт полный `SchemaSnapshot` из `schema-presets.constants.ts` (Appendix A §A.7).
2. `replaceSchema(snapshot)` (новые id допустимы, но seed может иметь фиксированные id для тестов).
3. Clear selection.
4. **Reset zoom/pan** при смене preset (канон).
5. SQL и SVG обновляются через signals.

Обязательные presets: `blog`, `ecommerce`, `auth`, `empty`.

`blog` — стартовый default при bootstrap (`DEFAULT_PRESET_ID = 'blog'`).

---

## 7.2 Clipboard copy SQL

`ClipboardService.copyText(text: string): Promise<boolean>`:
1. `navigator.clipboard.writeText` при наличии.
2. Fallback: temporary textarea + `document.execCommand('copy')` если нужно.
3. По успеху — `uiStore.showToast(t('toast.copied'))`.
4. По ошибке — toast с `toast.copyFailed`.

Кнопка в inspector/sql-preview обязательна. Hotkey `Ctrl/Cmd+Shift+C` копирует SQL (когда фокус не в input) — см. Appendix A.

---

## 7.3 i18n (signal-словари)

### Файлы
- `i18n/locale.type.ts` — `LocaleId = 'ru' | 'en'`
- `i18n/i18n.keys.ts` — union всех ключей **или** const object
- `i18n/ru.ts` / `i18n/en.ts` — словари
- `services/i18n.service.ts` — `locale = signal`, `t(key, params?)`

### Требования
1. Default locale: `ru`.
2. Все видимые строки UI через `t()`.
3. Переключение `G` мгновенно обновляет UI.
4. Минимальные группы ключей: `toolbar.*`, `tools.*`, `inspector.*`, `sql.*`, `status.*`, `help.*`, `theme.*`, `preset.*`, `toast.*`, `relation.*`, `columnType.*`.

---

## 7.4 Hotkeys

`HotkeysService` слушает `window:keydown` (host listener в App или injectable с `DestroyRef`).

Таблица — Appendix A §A.10. Игнорируй, если target — input/select/textarea/contenteditable, кроме Escape и оговорённых исключений из 01.

---

## 7.5 Theme toggle

- `ui.theme: 'dark' | 'light'`
- Пиши `data-theme` на `document.documentElement` (и/или host app).
- SVG canvas остаётся тёмным; панели следуют теме.

---

## 7.6 FK flag sync

При `addRelation`:
1. Найти from-колонку → `foreignKey = true`.
2. Если `kind === 'one-to-one'` → `unique = true` на from-колонке.

При `removeRelation`:
1. Если у from-колонки не осталось исходящих relations → `foreignKey = false`.

При `removeTable` / `removeColumn` — каскадно удалить затронутые relations и пересчитать FK flags.

---

## 7.7 Unit tests (обязательные)

Создай и добейся зелёного прогона:

| Файл | Что покрыть |
|------|-------------|
| `domain/schema/relation-geometry.spec.ts` | left/right side selection when tables A left-of B and vice versa; path matches `/^M .+ C .+$/`; labels 1/∞ for O2M; labels 1/1 for O2O; anchors Y follow column index |
| `domain/schema/sql-builder.spec.ts` | single table CREATE; two tables + FK ALTER; PG vs MySQL type/quoting; empty schema comment; stable table order by name; broken relation skipped |
| `domain/schema/table-metrics.spec.ts` | height grows with columns; anchor Y monotonic |
| `services/schema-state.service.spec.ts` | addTable/addColumn/addRelation; removeTable cascades relations; PK exclusivity; loadPreset replaces schema |
| `services/sql-generator.service.spec.ts` | delegates to builder; dialect passthrough |

---

## 7.8 README проекта

В корне приложения `README.md`:
- Описание SQL-Forge
- `npm install` / `npm start` / `npm test`
- Кратко: panels, link tool, dialects, hotkeys
- Ссылка на пакет промпта `../docs` (относительно app folder в монорепо `sql_forge/`)

---

## 7.9 Quality gates

Перед завершением генерации:
1. Нет `TODO` / `...` / `as any` без нужды (допустим точечный cast с комментарием-обоснованием, не заглушкой).
2. Нет `*ngIf` / `*ngFor` / `BehaviorSubject` для state.
3. Все файлы из [08-file-checklist.md](08-file-checklist.md) существуют.
4. Сценарии [09-acceptance-criteria.md](09-acceptance-criteria.md) выполнимы вручную.
5. Нет D3 / Three / Cytoscape / dagre / jointjs.
6. Bezier связи — не прямые `<line>` как единственный рендер (preview rubber-band тоже cubic).
