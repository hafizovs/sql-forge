# 06 — UI Panels (Tools, Canvas Shell, Inspector)

Реализуй трёхпанельный shell и панели. Все строки UI — через i18n. Константы размеров — Appendix A.

---

## 6.1 Файлы

| Компонент | Назначение |
|-----------|------------|
| `app.component.*` | CSS Grid shell: toolbar + tools \| canvas \| inspector + status |
| `toolbar` | Title, dialect, theme, lang, help, reset view |
| `tools-panel` | Create table, table list, presets |
| `svg-canvas` | см. документ 05 |
| `table-node` | см. документ 05 |
| `relation-layer` | см. документ 05 |
| `inspector-panel` | Properties + SQL preview + Copy |
| `sql-preview` | monospace DDL view (может быть частью inspector) |
| `status-bar` | counters / zoom / dialect |
| `help-drawer` | Hotkeys + краткая справка |
| `toast` | «Скопировано» / ошибки валидации |

---

## 6.2 AppComponent (канон брифа)

### Layout
1. CSS Grid:

```scss
.sf-app {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: var(--sf-tools-width) 1fr var(--sf-inspector-width);
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.sf-toolbar { grid-column: 1 / -1; }
.sf-status { grid-column: 1 / -1; }
```

2. Children: `sf-toolbar`, `sf-tools-panel`, `sf-svg-canvas`, `sf-inspector-panel`, `sf-status-bar`, optional `sf-help-drawer`, `sf-toast`.
3. CSS variables `--sf-tools-width` / `--sf-inspector-width` из Appendix A.
4. Responsive: `@media (max-width: 1099px)` — одна колонка, rows stack.

### Composition (ориентир)

```html
<div class="sf-app" [attr.data-theme]="theme()">
  <sf-toolbar />
  <sf-tools-panel />
  <sf-svg-canvas />
  <sf-inspector-panel />
  <sf-status-bar />
  @if (helpOpen()) { <sf-help-drawer /> }
  <sf-toast />
</div>
```

---

## 6.3 ToolbarComponent

Элементы:
1. Brand: **SQL-Forge** (hero-level в toolbar, не прячь в мелкий eyebrow).
2. Dialect toggle/select: PostgreSQL | MySQL → `uiStore.sqlDialect`.
3. Theme toggle.
4. Locale toggle.
5. Reset view.
6. Help (`?`).

Все подписи через `I18nService.t`.

---

## 6.4 ToolsPanelComponent

### Секции
1. **Actions:** кнопка «Создать таблицу» → `schemaState.addTable()` в viewport center world (вычисли из pan/zoom/size; fallback `DEFAULT_NEW_TABLE_POS`).
2. **Tables list:** `@for` по tables; клик → select + optional soft-pan к таблице; иконка delete.
3. **Presets:** кнопки/select `blog` | `ecommerce` | `auth` | `empty` → `loadPreset`.

Не дублируй полный property editor — только навигация и create.

---

## 6.5 InspectorPanelComponent (канон брифа)

Две зоны (вертикальный split внутри панели):

### A) Properties
Зависит от selection:

**Table selected:**
- Input имени таблицы.
- Кнопки: Add column, Delete table.
- Список колонок (краткий) с кликом → select column.

**Column selected:**
- Input имени.
- Select типа (`INT|VARCHAR|UUID|BOOLEAN|TIMESTAMP`).
- Input length (enabled только для VARCHAR).
- Checkboxes: Primary Key, Not Null, Unique (Foreign Key — read-only индикатор, меняется через relations).
- Delete column.

**Relation selected:**
- Readonly endpoints (from table.col → to table.col).
- Select kind: One-to-One / One-to-Many.
- Delete relation.

**None:**
- Placeholder текст «Выберите таблицу, колонку или связь».

Любое изменение → методы `SchemaStateService`; SQL обновляется сам.

### B) SQL
Встроенный `SqlPreviewComponent` или секция:
- `<pre>` / scrollable monospace блок с `sqlText()`.
- Кнопка «Скопировать» → clipboard + toast.
- Опциональная лёгкая подсветка ключевых слов CSS-классами (без Monaco) — желательно; минимум — моноширинный текст.

Высота: properties ~40–45%, SQL ~55–60%; обе зоны скроллятся независимо.

---

## 6.6 SqlPreviewComponent

```ts
sql = input.required<string>();
copy = output<void>(); // или сам inject ClipboardService
```

Канон: кнопка Copy внутри preview; `aria-label` из i18n.

---

## 6.7 StatusBarComponent

Показывает:
- tables count
- columns count (sum)
- relations count
- zoom percent (`Math.round(zoom * 100)`)
- current dialect label

Все через i18n templates / отдельные ключи.

---

## 6.8 HelpDrawerComponent

Боковая/модальная панель:
- Hotkeys table (из Appendix A §A.10).
- Краткие инструкции: create, drag, pan MMB, zoom, link tool.
- Закрытие: кнопка, Escape, клик по backdrop.

---

## 6.9 ToastComponent

Слушает `uiStore.toastMessage`. Показ 2s (Appendix A), затем clear. `role="status"`.

---

## 6.10 Контекстное редактирование

Бриф требовал «контекстное меню» — **канон реализации:** inspector справа является основным редактором (не обязательно HTML `<menu>`). Допускается native contextmenu на таблице с пунктами Rename/Delete/Add column, но inspector **обязан** покрывать все поля редактирования. Не блокируй DoD отсутствием floating context menu, если inspector полный.
