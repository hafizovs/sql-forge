# 03 — Data Model & Units

Все интерфейсы ниже реализуй **буквально**. Числовые диапазоны и дефолты — в [appendix-a-defaults.md](appendix-a-defaults.md); скопируй значения в `*.constants.ts` без «примерно».

Канонический файл агрегата типов: `src/app/models/schema.types.ts` (обязан существовать и экспортировать публичные типы схемы).

---

## 3.1 Единицы и понятия

| Величина | Единица | Пояснение |
|----------|---------|-----------|
| Table x/y | CSS px в world-space (до zoom/pan) | верхний левый угол table-node |
| Column row height | px | из Appendix A |
| Table width | px | фиксированная `TABLE_WIDTH` |
| Zoom | multiplier | 0.25…2.5 |
| Pan | px screen-space | translation после scale |
| Table / Column / Relation id | string | стабильный (`tbl_…`, `col_…`, `rel_…`) |
| Anchor side | `'left' \| 'right'` | грань привязки связи |
| SQL dialect | `'postgresql' \| 'mysql'` | влияет на квоты и типы |

---

## 3.2 Идентификаторы и enum/union типы

```ts
export type ColumnDataType =
  | 'INT'
  | 'VARCHAR'
  | 'UUID'
  | 'BOOLEAN'
  | 'TIMESTAMP';

export type RelationKind = 'one-to-one' | 'one-to-many';

export type SqlDialect = 'postgresql' | 'mysql';

export type AnchorSide = 'left' | 'right';

export type ThemeId = 'dark' | 'light';

export type LocaleId = 'ru' | 'en';

export type SchemaPresetId =
  | 'blog'
  | 'ecommerce'
  | 'auth'
  | 'empty';

export type SelectionKind = 'table' | 'column' | 'relation' | 'none';
```

---

## 3.3 Геометрия

```ts
export interface Point {
  x: number;
  y: number;
}

export interface ZoomState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnchorPoint {
  point: Point;
  side: AnchorSide;
  tableId: string;
  columnId: string;
}
```

---

## 3.4 Column

```ts
export interface Column {
  id: string;
  name: string;
  dataType: ColumnDataType;
  primaryKey: boolean;
  foreignKey: boolean;
  notNull: boolean;
  unique: boolean;
  /** Для VARCHAR; игнорируется другими типами. Default из Appendix A. */
  length?: number;
}
```

Инварианты:
1. В таблице **ровно одна** колонка с `primaryKey: true` после нормализации create/update (если пользователь включает PK на другой — снять с прежней).
2. `foreignKey: true` выставляется автоматически при создании Relation от этой колонки; сбрасывается, если не осталось исходящих relations.
3. Имя колонки trim; пустое имя недопустимо в SQL (валидация UI).

---

## 3.5 Table

```ts
export interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: Column[];
}
```

Инварианты:
1. `columns.length >= 1` всегда (нельзя удалить последнюю колонку — либо блок UI, либо auto-recreate `id`).
2. Имена таблиц уникальны case-insensitive в пределах схемы.
3. `x,y` — world-space top-left.

---

## 3.6 Relation

```ts
export interface Relation {
  id: string;
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  kind: RelationKind;
}
```

Семантика:
- **from** = FK-сторона (дочерняя / many).
- **to** = PK/referenced сторона (родительская / one).
- Для `one-to-many`: from = many, to = one; маркеры: у from `∞` (или `N`), у to `1`.
- Для `one-to-one`: маркеры `1` и `1`; на from дополнительно `unique: true` (канон: при создании 1:1 выставить unique на from-колонке).

Запрещено:
- self-FK на ту же колонку;
- связь таблицы сама на себя **допустима** (self-relation), если fromColumn ≠ toColumn;
- дубликат той же пары `(fromTableId, fromColumnId, toTableId, toColumnId)`.

---

## 3.7 Snapshot схемы

```ts
export interface SchemaSnapshot {
  tables: Table[];
  relations: Relation[];
}
```

Используется для presets, replaceSchema, SQL generation, тестов.

---

## 3.8 Selection & link mode

```ts
export interface SelectionState {
  kind: SelectionKind;
  tableId: string | null;
  columnId: string | null;
  relationId: string | null;
}

export interface LinkModeState {
  fromTableId: string;
  fromColumnId: string;
  cursorWorld: Point;
}
```

---

## 3.9 Relation path (view-model для SVG)

```ts
export interface RelationPath {
  relationId: string;
  d: string;                 // SVG path `M … C …`
  start: Point;
  end: Point;
  startSide: AnchorSide;
  endSide: AnchorSide;
  startLabel: '1' | '∞';
  endLabel: '1' | '∞';
  kind: RelationKind;
}
```

Построение — pure функции из [appendix-b-formulas.md](appendix-b-formulas.md) / `domain/schema/relation-geometry.ts`.

---

## 3.10 Канонический реэкспорт

`schema.types.ts` обязан экспортировать как минимум:

`Point`, `ZoomState`, `Rect`, `AnchorPoint`, `Column`, `Table`, `Relation`, `SchemaSnapshot`, `SelectionState`, `LinkModeState`, `RelationPath`, `ColumnDataType`, `RelationKind`, `SqlDialect`, `AnchorSide`, `ThemeId`, `LocaleId`, `SchemaPresetId`, `SelectionKind`.

Модульные файлы в `core/models/*` могут дублировать узкие типы и реэкспортироваться через `schema.types.ts`, либо `schema.types.ts` содержит всё inline — **канон: `schema.types.ts` — единая точка импорта для UI**.
