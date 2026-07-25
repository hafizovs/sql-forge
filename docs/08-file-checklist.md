# 08 — File Checklist

Генератор **обязан** создать каждый файл из списка. Отмечай мысленно ☑. Пропуск файла = провал DoD.

Рядом с путём — краткое содержание (1–2 предложения). Код внутри файла — **полный**, без сокращений.

---

## 8.1 Project root / Angular scaffold

| # | Path | Content |
|---|------|---------|
| 1 | `package.json` | Имя `sql-forge`, scripts start/build/test; tailwind deps если выбран Tailwind |
| 2 | `angular.json` | project config, styles `src/styles.scss` |
| 3 | `tsconfig.json` | base TS config |
| 4 | `tsconfig.app.json` | app TS config |
| 5 | `tsconfig.spec.json` | spec TS config |
| 6 | `src/index.html` | title SQL-Forge, fonts IBM Plex Sans/Space Grotesk + Plex Mono/JetBrains Mono, root element |
| 7 | `src/main.ts` | bootstrapApplication |
| 8 | `src/styles.scss` | CSS variables Data Architect Dark, reset, full viewport |
| 9 | `README.md` | install, start, test, hotkeys, feature overview |
| 10 | `tailwind.config.js` / эквивалент | **только если** выбран Tailwind — полный конфиг content/theme |

---

## 8.2 App shell (канон брифа)

| # | Path | Content |
|---|------|---------|
| 11 | `src/app/app.config.ts` | zoneless providers |
| 12 | `src/app/app.component.ts` | CSS Grid shell, inject stores/hotkeys |
| 13 | `src/app/app.component.html` | toolbar / tools / canvas / inspector / status |
| 14 | `src/app/app.component.scss` | grid layout, responsive |

---

## 8.3 Models (канон брифа)

| # | Path | Content |
|---|------|---------|
| 15 | `src/app/models/schema.types.ts` | Table, Column, Relation, Point, ZoomState, RelationPath, enums |

---

## 8.4 Core constants

| # | Path | Content |
|---|------|---------|
| 16 | `src/app/core/constants/schema.constants.ts` | default column seeds, id prefixes, name patterns |
| 17 | `src/app/core/constants/canvas.constants.ts` | TABLE_WIDTH, row heights, zoom, grid, bezier ratio |
| 18 | `src/app/core/constants/ui.constants.ts` | panel widths, toast ms |
| 19 | `src/app/core/constants/sql.constants.ts` | VARCHAR default, indent, type maps |
| 20 | `src/app/core/constants/schema-presets.constants.ts` | blog/ecommerce/auth/empty full snapshots |

---

## 8.5 Core models (модульные)

| # | Path | Content |
|---|------|---------|
| 21 | `src/app/core/models/column-type.model.ts` | ColumnDataType |
| 22 | `src/app/core/models/relation-kind.model.ts` | RelationKind |
| 23 | `src/app/core/models/sql-dialect.model.ts` | SqlDialect |
| 24 | `src/app/core/models/theme.model.ts` | ThemeId |
| 25 | `src/app/core/models/locale.model.ts` | LocaleId |
| 26 | `src/app/core/models/selection.model.ts` | SelectionKind / SelectionState |

---

## 8.6 Domain schema / math

| # | Path | Content |
|---|------|---------|
| 27 | `src/app/domain/schema/relation-geometry.ts` | anchors + cubic Bezier builders |
| 28 | `src/app/domain/schema/relation-geometry.spec.ts` | geometry tests |
| 29 | `src/app/domain/schema/table-metrics.ts` | height / column Y |
| 30 | `src/app/domain/schema/table-metrics.spec.ts` | metrics tests |
| 31 | `src/app/domain/schema/sql-builder.ts` | full generateSql |
| 32 | `src/app/domain/schema/sql-builder.spec.ts` | SQL oracles |
| 33 | `src/app/domain/schema/id-factory.ts` | createId |
| 34 | `src/app/domain/schema/schema-validators.ts` | unique names helpers |
| 35 | `src/app/domain/math/clamp.ts` | clamp helper |
| 36 | `src/app/domain/math/point.ts` | point helpers (add/sub/distance optional) |

---

## 8.7 State stores

| # | Path | Content |
|---|------|---------|
| 37 | `src/app/state/schema.store.ts` | tables/relations/selection signals **или** shared state used by SchemaStateService |
| 38 | `src/app/state/ui.store.ts` | theme/locale/dialect/zoom/pan/help/linkMode/toast |

Если `SchemaStateService` сам владеет всеми schema signals без отдельного store-файла — файл `schema.store.ts` всё равно создай как тонкий re-export / внутренний store, **либо** держи signals только в сервисе и сделай `schema.store.ts` deprecated-free **канон-послабление:** допустимо содержимое store инлайн в `schema-state.service.ts`, но тогда `state/schema.store.ts` должен существовать и реэкспортировать/содержать те же сигналы (не пустой файл). Предпочтительно: store + service facade.

---

## 8.8 Services (канон брифа + infra)

| # | Path | Content |
|---|------|---------|
| 39 | `src/app/services/schema-state.service.ts` | add/remove/update table/column/relation/position; computed paths/sql |
| 40 | `src/app/services/schema-state.service.spec.ts` | mutation tests |
| 41 | `src/app/services/sql-generator.service.ts` | wrapper over sql-builder |
| 42 | `src/app/services/sql-generator.service.spec.ts` | dialect passthrough |
| 43 | `src/app/services/hotkeys.service.ts` | keyboard shortcuts |
| 44 | `src/app/services/i18n.service.ts` | t() + locale signal |
| 45 | `src/app/services/clipboard.service.ts` | copyText |

---

## 8.9 Components (канон брифа + UI)

| # | Path | Content |
|---|------|---------|
| 46 | `src/app/components/svg-canvas/svg-canvas.component.ts` | pan/zoom/drag/link orchestration |
| 47 | `src/app/components/svg-canvas/svg-canvas.component.html` | svg world |
| 48 | `src/app/components/svg-canvas/svg-canvas.component.scss` | canvas host styles |
| 49 | `src/app/components/table-node/table-node.component.ts` | table rendering logic |
| 50 | `src/app/components/table-node/table-node.component.html` | svg table markup |
| 51 | `src/app/components/table-node/table-node.component.scss` | table styles |
| 52 | `src/app/components/inspector-panel/inspector-panel.component.ts` | properties + sql host |
| 53 | `src/app/components/inspector-panel/inspector-panel.component.html` | inspector layout |
| 54 | `src/app/components/inspector-panel/inspector-panel.component.scss` | inspector styles |
| 55 | `src/app/components/relation-layer/relation-layer.component.ts` | paths/markers |
| 56 | `src/app/components/relation-layer/relation-layer.component.html` | relation svg |
| 57 | `src/app/components/relation-layer/relation-layer.component.scss` | relation styles |
| 58 | `src/app/components/tools-panel/tools-panel.component.ts` | create/list/presets |
| 59 | `src/app/components/tools-panel/tools-panel.component.html` | tools markup |
| 60 | `src/app/components/tools-panel/tools-panel.component.scss` | tools styles |
| 61 | `src/app/components/toolbar/toolbar.component.ts` | toolbar |
| 62 | `src/app/components/toolbar/toolbar.component.html` | controls |
| 63 | `src/app/components/toolbar/toolbar.component.scss` | toolbar styles |
| 64 | `src/app/components/sql-preview/sql-preview.component.ts` | sql view + copy |
| 65 | `src/app/components/sql-preview/sql-preview.component.html` | pre + button |
| 66 | `src/app/components/sql-preview/sql-preview.component.scss` | sql styles |
| 67 | `src/app/components/status-bar/status-bar.component.ts` | status |
| 68 | `src/app/components/status-bar/status-bar.component.html` | counters |
| 69 | `src/app/components/status-bar/status-bar.component.scss` | status styles |
| 70 | `src/app/components/help-drawer/help-drawer.component.ts` | help |
| 71 | `src/app/components/help-drawer/help-drawer.component.html` | hotkeys/cheatsheet |
| 72 | `src/app/components/help-drawer/help-drawer.component.scss` | drawer styles |
| 73 | `src/app/components/toast/toast.component.ts` | toast |
| 74 | `src/app/components/toast/toast.component.html` | toast markup |
| 75 | `src/app/components/toast/toast.component.scss` | toast styles |

---

## 8.10 i18n

| # | Path | Content |
|---|------|---------|
| 76 | `src/app/i18n/locale.type.ts` | LocaleId |
| 77 | `src/app/i18n/i18n.keys.ts` | keys |
| 78 | `src/app/i18n/ru.ts` | Russian dictionary complete |
| 79 | `src/app/i18n/en.ts` | English dictionary complete |

---

## 8.11 Итого

Минимум **79** файла из таблиц (+ tailwind config при выборе Tailwind). Канонические пути из брифа пользователя входят в список и **не могут** быть переименованы:

- `models/schema.types.ts`
- `services/schema-state.service.ts`
- `services/sql-generator.service.ts`
- `components/svg-canvas/svg-canvas.component.ts`
- `components/table-node/table-node.component.ts`
- `components/inspector-panel/inspector-panel.component.ts`
- `app.component.ts`
