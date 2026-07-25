# 02 — Architecture (Angular 22+)

Создай приложение строго по этой архитектуре. Не сваливай геометрию связей и SQL-сборку в шаблоны компонентов. Не используй NgRx/Akita — только Signals stores.

---

## 2.1 Стек и bootstrap

1. Создай проект Angular **latest stable ≥ 22**, standalone, SCSS, **без SSR**, без routing (предпочтительно **без** `@angular/router`).
2. Включи **zoneless** (дефолт новых приложений). Не добавляй `zone.js` обратно.
3. Prefix: `sf`.
4. Точка входа: `main.ts` → `bootstrapApplication(AppComponent, appConfig)`.
5. `app.config.ts`: `provideZonelessChangeDetection()` (или эквивалент актуального API).
6. Если используешь Tailwind — добавь официальную интеграцию для Angular/PostCSS полностью (конфиг, content globs, base styles). Если SCSS — глобальные CSS variables из документа 01.

---

## 2.2 Дерево каталогов (обязательное)

Минимальный каркас из брифа **обязан** существовать. Доменный слой расширяет его до продакшен-структуры:

```
src/
  index.html
  main.ts
  styles.scss
  app/
    app.component.ts
    app.component.html
    app.component.scss
    app.config.ts

    models/
      schema.types.ts            # Table, Column, Relation, Point, ZoomState (+ реэкспорт)

    core/
      constants/
        schema.constants.ts
        canvas.constants.ts
        ui.constants.ts
        sql.constants.ts
        schema-presets.constants.ts
      models/
        column-type.model.ts
        relation-kind.model.ts
        sql-dialect.model.ts
        theme.model.ts
        locale.model.ts
        selection.model.ts

    domain/
      schema/
        relation-geometry.ts     # anchors + cubic Bezier path builders
        relation-geometry.spec.ts
        table-metrics.ts         # width/height from column count
        sql-builder.ts           # pure generateSql(schema, dialect)
        sql-builder.spec.ts
        id-factory.ts            # createId('tbl'|'col'|'rel')
        schema-validators.ts     # name uniqueness helpers
      math/
        clamp.ts
        point.ts

    state/
      schema.store.ts            # tables, columns, relations, selection (или тонкий фасад)
      ui.store.ts                # theme, locale, dialect, zoom/pan, help, linkMode

    services/
      schema-state.service.ts    # КАНОН БРИФА: главный фасад мутаций (signals)
      sql-generator.service.ts   # КАНОН БРИФА: обёртка над domain/sql-builder
      hotkeys.service.ts
      i18n.service.ts
      clipboard.service.ts

    components/
      toolbar/
        toolbar.component.ts
        toolbar.component.html
        toolbar.component.scss
      tools-panel/
        tools-panel.component.ts
        tools-panel.component.html
        tools-panel.component.scss
      svg-canvas/
        svg-canvas.component.ts
        svg-canvas.component.html
        svg-canvas.component.scss
      table-node/
        table-node.component.ts
        table-node.component.html
        table-node.component.scss
      relation-layer/
        relation-layer.component.ts
        relation-layer.component.html
        relation-layer.component.scss
      inspector-panel/
        inspector-panel.component.ts
        inspector-panel.component.html
        inspector-panel.component.scss
      sql-preview/
        sql-preview.component.ts
        sql-preview.component.html
        sql-preview.component.scss
      status-bar/
        status-bar.component.ts
        status-bar.component.html
        status-bar.component.scss
      help-drawer/
        help-drawer.component.ts
        help-drawer.component.html
        help-drawer.component.scss
      toast/
        toast.component.ts
        toast.component.html
        toast.component.scss

    i18n/
      locale.type.ts
      i18n.keys.ts
      ru.ts
      en.ts
```

Допускается объединить мелкие presentational куски, **но** файлы канона брифа и domain/specs из [08-file-checklist.md](08-file-checklist.md) должны существовать.

**Важно про `schema-state.service.ts`:** это **публичный канонический фасад** из брифа. Он может сам держать WritableSignals **или** делегировать в `state/schema.store.ts`. Канон: сервис экспортирует методы `addTable`, `removeTable`, `addColumn`, `removeColumn`, `updateColumn`, `addRelation`, `removeRelation`, `updateTablePosition`, `updateTableName`, `select…` и readonly signals / computed для UI. Если используешь отдельный store — сервис тонко проксирует; дублировать две независимые копии состояния **запрещено**.

---

## 2.3 Слои и зависимости

```
components → services / stores → domain/schema (pure)
                ↑
         models / core/constants
```

Правила:
1. `domain/schema/*` — **чистые** функции/классы без Angular DI, без DOM.
2. `sql-generator.service.ts` — `@Injectable` обёртка над `generateSql`.
3. `schema-state.service.ts` — единственный оркестратор мутаций схемы для UI.
4. Компоненты читают state через `inject(SchemaStateService)` / `inject(UiStore)`, не считают Bezier в шаблоне вручную (допустим вызов pure helpers из `computed` в компоненте canvas / relation-layer).
5. Запрещён circular import store ↔ component.

---

## 2.4 Signals stores / state surface

### `SchemaStateService` (канон API)

```ts
tables: Signal<Table[]>
relations: Signal<Relation[]>
selectedTableId: WritableSignal<string | null>
selectedColumnId: WritableSignal<string | null>
selectedRelationId: WritableSignal<string | null>

// derived
tableById: Signal<Map<string, Table>>          // или computed lookup
columnLookup: Signal<Map<string, { tableId; column }>>
sqlText: Signal<string>                        // через SqlGeneratorService + dialect

addTable(at?: Point): string
removeTable(tableId: string): void
updateTableName(tableId: string, name: string): void
updateTablePosition(tableId: string, x: number, y: number): void
addColumn(tableId: string, partial?: Partial<Column>): string
removeColumn(tableId: string, columnId: string): void
updateColumn(tableId: string, columnId: string, patch: Partial<Column>): void
addRelation(input: Omit<Relation, 'id'> | CreateRelationInput): string
removeRelation(relationId: string): void
updateRelationKind(relationId: string, kind: RelationKind): void
selectTable(tableId: string | null): void
selectColumn(tableId: string, columnId: string): void
selectRelation(relationId: string | null): void
clearSelection(): void
loadPreset(id: SchemaPresetId): void
replaceSchema(snapshot: SchemaSnapshot): void
```

Полная реактивность связей через `computed`: например `relationPaths = computed(() => buildAllPaths(tables(), relations()))` — либо в сервисе, либо в `SvgCanvas`/`RelationLayer` на основе тех же signals.

### `UiStore`

```ts
theme: WritableSignal<'dark' | 'light'>
locale: WritableSignal<'ru' | 'en'>
sqlDialect: WritableSignal<'postgresql' | 'mysql'>
helpOpen: WritableSignal<boolean>
toastMessage: WritableSignal<string | null>
linkMode: WritableSignal<LinkModeState | null>  // см. 03 / 05
zoom: WritableSignal<number>
panX: WritableSignal<number>
panY: WritableSignal<number>
```

Методы: `toggleTheme`, `toggleLocale`, `setDialect`, `resetView`, `setZoomPan`, `beginLink`, `updateLinkCursor`, `cancelLink`, `showToast`, …

**Канон:** zoom/pan живут в `UiStore`, чтобы hotkeys и status-bar читали одно место.

---

## 2.5 Live SQL pipeline

1. `sqlText = computed(() => sqlGenerator.generate(schemaSnapshot(), uiStore.sqlDialect()))`.
2. Любая мутация схемы → новый snapshot → новый SQL без ручного «refresh».
3. Ошибки валидации имён (пустые / дубликаты) не роняют UI; показывай inline в inspector / toast.

---

## 2.6 App shell

- `AppComponent` — CSS Grid: toolbar / tools | canvas | inspector / status-bar; хост `sf-root`.
- Не делай отдельный `WorkbenchComponent`, если App уже является shell — **канон брифа: логика раскладки в `app.component.*`**. Допускается вынести toolbar/status как дочерние компоненты.

---

## 2.7 Тестирование

Unit-тесты domain обязательны (см. 07). Component tests — по желанию; не блокируют DoD, если domain зелёный и ручные сценарии 09 проходят.

---

## 2.8 Запрещённые зависимости

Не добавляй: `three`, `@ngrx/*`, `chart.js`, `d3`, `plotly`, `cytoscape`, `dagre`, `jointjs`, `@xyflow/*`, `monaco-editor`, `codemirror`.
