# Appendix A — Defaults, Ranges & Seed Data

Справочник чисел, размеров холста и seed-пресетов. Реализации копируют значения в `core/constants/*` **без округления «на глаз»**.

---

## A.1 Schema / IDs

| Константа | Значение |
|-----------|----------|
| `ID_PREFIX_TABLE` | `'tbl_'` |
| `ID_PREFIX_COLUMN` | `'col_'` |
| `ID_PREFIX_RELATION` | `'rel_'` |
| `DEFAULT_PRESET_ID` | `'blog'` |
| `DEFAULT_VARCHAR_LENGTH` | 255 |
| `DEFAULT_NEW_TABLE_NAME_PREFIX` | `'table_'` |
| `DEFAULT_LOCALE` | `'ru'` |
| `DEFAULT_THEME` | `'dark'` |
| `DEFAULT_SQL_DIALECT` | `'postgresql'` |
| `MAX_TABLES` | 100 |
| `MAX_COLUMNS_PER_TABLE` | 64 |
| `MAX_RELATIONS` | 200 |

---

## A.2 Canvas / table metrics / SVG viewport

| Константа | Значение | Смысл |
|-----------|----------|--------|
| `TABLE_WIDTH` | 240 | ширина table-node (px, world) |
| `TABLE_HEADER_HEIGHT` | 36 | высота заголовка |
| `COLUMN_ROW_HEIGHT` | 28 | высота строки колонки |
| `TABLE_PADDING_BOTTOM` | 8 | нижний внутренний отступ |
| `TABLE_CORNER_RADIUS` | 8 | rx/ry header/body |
| `LINK_HANDLE_RADIUS` | 5 | радиус круга link-handle |
| `GRID_SIZE` | 24 | шаг сетки world-space |
| `ZOOM_MIN` | 0.25 |
| `ZOOM_MAX` | 2.5 |
| `ZOOM_DEFAULT` | 1.0 |
| `ZOOM_WHEEL_FACTOR` | 0.0015 | множитель `deltaY` для `exp`/`linear` |
| `PAN_DEFAULT_X` | 80 |
| `PAN_DEFAULT_Y` | 60 |
| `BEZIER_CURVE_RATIO` | 0.5 | доля |dx| для контрольных точек |
| `BEZIER_MIN_CONTROL` | 40 | минимальный горизонтальный offset контроля |
| `MARKER_OFFSET_X` | 14 | сдвиг label от anchor по X (наружу) |
| `MARKER_OFFSET_Y` | -8 | сдвиг label по Y |
| `DEFAULT_NEW_TABLE_POS` | `{ x: 120, y: 120 }` | fallback позиции новой таблицы |
| `NEW_TABLE_CASCADE_OFFSET` | 28 | сдвиг каждой следующей new table |

### Высота таблицы

```
tableHeight(columnCount) =
  TABLE_HEADER_HEIGHT + columnCount * COLUMN_ROW_HEIGHT + TABLE_PADDING_BOTTOM
```

### Y якоря колонки (центр строки)

```
columnCenterY(tableY, columnIndex) =
  tableY + TABLE_HEADER_HEIGHT + columnIndex * COLUMN_ROW_HEIGHT + COLUMN_ROW_HEIGHT / 2
```

---

## A.3 UI panels

| Константа | Значение |
|-----------|----------|
| `TOOLS_PANEL_WIDTH_PX` | 260 |
| `INSPECTOR_PANEL_WIDTH_PX` | 380 |
| `TOAST_DURATION_MS` | 2000 |
| `RESPONSIVE_BREAKPOINT_PX` | 1100 |
| `SQL_PREVIEW_MIN_HEIGHT_PX` | 180 |
| `PROPERTIES_MIN_HEIGHT_PX` | 160 |

CSS:

```scss
:root {
  --sf-tools-width: 260px;
  --sf-inspector-width: 380px;
}
```

---

## A.4 Column data types (канон UI order)

| Order | `ColumnDataType` | Label RU | Label EN |
|-------|------------------|----------|----------|
| 1 | `INT` | Целое | Integer |
| 2 | `VARCHAR` | Строка | Varchar |
| 3 | `UUID` | UUID | UUID |
| 4 | `BOOLEAN` | Булево | Boolean |
| 5 | `TIMESTAMP` | Время | Timestamp |

---

## A.5 Default columns для новой таблицы

При `addTable` создавай **ровно** две колонки:

1. `{ name: 'id', dataType: 'INT', primaryKey: true, foreignKey: false, notNull: true, unique: false }`
2. `{ name: 'name', dataType: 'VARCHAR', primaryKey: false, foreignKey: false, notNull: true, unique: false, length: 255 }`

Имя таблицы: `table_{n}` где `n` — 1-based счётчик существующих+1 с проверкой уникальности.

---

## A.6 SQL type maps

### PostgreSQL
| App type | SQL |
|----------|-----|
| INT | `INTEGER` |
| VARCHAR | `VARCHAR(n)` |
| UUID | `UUID` |
| BOOLEAN | `BOOLEAN` |
| TIMESTAMP | `TIMESTAMP` |

### MySQL
| App type | SQL |
|----------|-----|
| INT | `INT` |
| VARCHAR | `VARCHAR(n)` |
| UUID | `CHAR(36)` |
| BOOLEAN | `TINYINT(1)` |
| TIMESTAMP | `TIMESTAMP` |

`SQL_INDENT = '  '` (2 spaces).

---

## A.7 Schema presets (seed)

Полные объекты клади в `schema-presets.constants.ts`. Ниже — обязательное содержание (id допускается генерировать стабильно как показано).

### `blog` (DEFAULT)

Tables:
1. `users` at `(80, 100)`  
   - `id` UUID PK NN  
   - `email` VARCHAR(255) NN UQ  
   - `created_at` TIMESTAMP NN
2. `posts` at `(420, 140)`  
   - `id` UUID PK NN  
   - `user_id` UUID NN FK  
   - `title` VARCHAR(255) NN  
   - `body` VARCHAR(255)  
   - `published_at` TIMESTAMP

Relation:
- `posts.user_id` → `users.id`, kind `one-to-many`

### `ecommerce`

Tables: `customers`, `products`, `orders`, `order_items`  
Relations: `orders.customer_id` → `customers.id` (O2M); `order_items.order_id` → `orders.id` (O2M); `order_items.product_id` → `products.id` (O2M).  
Минимум полей: PK + осмысленные VARCHAR/INT/TIMESTAMP; координаты таблиц не пересекаются (разнести по сетке 320px).

### `auth`

Tables: `users`, `roles`, `user_roles`  
Relations: `user_roles.user_id` → `users.id`; `user_roles.role_id` → `roles.id`.  
`user_roles` — связь many-to-many через две O2M.

### `empty`

`{ tables: [], relations: [] }`.

---

## A.8 Цвета сущностей

Используй CSS variables из [01-product-vision.md](01-product-vision.md).

| Сущность | Variable |
|----------|----------|
| Accent / CTA | `--sf-accent` |
| Selection / FK | `--sf-accent-2` / `--sf-fk` |
| PK badge | `--sf-pk` |
| Relation stroke | `--sf-relation` |
| Active relation | `--sf-relation-active` |
| Danger / delete | `--sf-danger` |
| Grid | `--sf-grid` |
| SQL keyword tint | `--sf-sql-keyword` |

---

## A.9 Toast / validation keys (i18n)

| Key | Params | Когда |
|-----|--------|-------|
| `toast.copied` | — | SQL скопирован |
| `toast.copyFailed` | — | clipboard error |
| `toast.duplicateRelation` | — | повтор связи |
| `toast.cannotDeleteLastColumn` | — | попытка удалить последнюю колонку |
| `toast.invalidName` | `{entity}` | пустое имя |
| `toast.duplicateTableName` | `{name}` | коллизия имён таблиц |

---

## A.10 Hotkeys (канон)

| Key | Action |
|-----|--------|
| `N` | Create table (не в input) |
| `Delete` / `Backspace` | Delete selected table (не в input); если selected relation — удалить relation |
| `Ctrl/Cmd + Shift + C` | Copy SQL |
| `Ctrl/Cmd + 0` | Reset zoom/pan |
| `Ctrl/Cmd + =` / `-` | Zoom in / out |
| `G` | Toggle locale RU/EN (не в input) |
| `T` | Toggle theme (не в input) |
| `D` | Toggle dialect PG↔MySQL (не в input) |
| `?` | Help drawer |
| `Escape` | Clear selection / cancel link / close help |

---

## A.11 Селектор префикс и имена

| Поле | Значение |
|------|----------|
| App name | `sql-forge` |
| Title | `SQL-Forge` |
| Selector prefix | `sf` |
| Root component host | `sf-root` → `AppComponent` grid shell |
