# Appendix B — Formulas & Algorithms

Справочник алгоритмов геометрии связей и сборки SQL. Реализации — в `domain/schema/**` согласно [04-sql-generator.md](04-sql-generator.md) и [05-svg-canvas.md](05-svg-canvas.md).

---

## B.1 Обозначения

| Symbol | Meaning |
|--------|---------|
| \(T\) | таблица (`Table`) |
| \(C_i\) | колонка с индексом \(i\) (0-based) |
| \((x_T, y_T)\) | top-left таблицы в world-space |
| \(W\) | `TABLE_WIDTH` |
| \(H_h\) | `TABLE_HEADER_HEIGHT` |
| \(H_r\) | `COLUMN_ROW_HEIGHT` |
| \(A_s, A_e\) | точки якоря start/end |
| \(s_s, s_e\) | стороны `'left' \| 'right'` |
| \(R\) | `BEZIER_CURVE_RATIO` |
| \(M\) | `BEZIER_MIN_CONTROL` |

**Канон координат table-node:** `x,y` — **верхний левый угол**. SVG `transform` на world group применяет pan/zoom поверх.

---

## B.2 Quote identifiers

```
quoteIdent(name, dialect):
  if dialect == postgresql:
    return '"' + name.replaceAll('"', '""') + '"'
  if dialect == mysql:
    return '`' + name.replaceAll('`', '``') + '`'
```

---

## B.3 Map column type

```
mapType(col, dialect):
  n = col.length ?? DEFAULT_VARCHAR_LENGTH
  switch col.dataType:
    INT:
      return dialect == postgresql ? 'INTEGER' : 'INT'
    VARCHAR:
      return 'VARCHAR(' + n + ')'
    UUID:
      return dialect == postgresql ? 'UUID' : 'CHAR(36)'
    BOOLEAN:
      return dialect == postgresql ? 'BOOLEAN' : 'TINYINT(1)'
    TIMESTAMP:
      return 'TIMESTAMP'
```

---

## B.4 Emit CREATE TABLE

```
emitCreateTable(table, dialect):
  lines = []
  lines.push('CREATE TABLE ' + quoteIdent(table.name, dialect) + ' (')
  for i, col in enumerate(table.columns):
    parts = [quoteIdent(col.name, dialect), mapType(col, dialect)]
    if col.notNull or col.primaryKey: parts.push('NOT NULL')
    if col.unique and not col.primaryKey: parts.push('UNIQUE')
    if col.primaryKey: parts.push('PRIMARY KEY')
    comma = i < table.columns.length - 1 ? ',' : ''
    lines.push(SQL_INDENT + parts.join(' ') + comma)
  lines.push(');')
  return lines.join('\n')
```

---

## B.5 Emit FK + full generateSql

```
constraintName(rel, fromTable, fromCol):
  base = 'fk_' + sanitize(fromTable.name) + '_' + sanitize(fromCol.name)
  return lowercase(base)

emitFk(rel, tablesById, dialect):
  fromT = tablesById[rel.fromTableId]
  toT = tablesById[rel.toTableId]
  fromC = findColumn(fromT, rel.fromColumnId)
  toC = findColumn(toT, rel.toColumnId)
  if missing any: return '-- skipped broken relation ' + rel.id
  name = constraintName(rel, fromT, fromC)
  return [
    'ALTER TABLE ' + quoteIdent(fromT.name, dialect),
    SQL_INDENT + 'ADD CONSTRAINT ' + quoteIdent(name, dialect),
    SQL_INDENT + 'FOREIGN KEY (' + quoteIdent(fromC.name, dialect) + ')',
    SQL_INDENT + 'REFERENCES ' + quoteIdent(toT.name, dialect) +
      ' (' + quoteIdent(toC.name, dialect) + ');'
  ].join('\n')

generateSql(snapshot, dialect):
  if snapshot.tables.length == 0:
    return '-- Empty schema\n'
  tables = sortByNameThenId(snapshot.tables)
  parts = ['-- SQL-Forge DDL (' + dialect + ')']
  for t in tables:
    parts.push(emitCreateTable(t, dialect))
    parts.push('')
  rels = sortById(snapshot.relations)
  for r in rels:
    parts.push(emitFk(r, index(tables), dialect))
    parts.push('')
  return trimTrailingNewlines(parts.join('\n')) + '\n'
```

---

## B.6 Table metrics

```
tableHeight(columnCount):
  return TABLE_HEADER_HEIGHT
       + columnCount * COLUMN_ROW_HEIGHT
       + TABLE_PADDING_BOTTOM

columnCenterY(tableY, columnIndex):
  return tableY
       + TABLE_HEADER_HEIGHT
       + columnIndex * COLUMN_ROW_HEIGHT
       + COLUMN_ROW_HEIGHT / 2

columnIndexById(table, columnId):
  return index of column in table.columns (throw/skip if missing)
```

---

## B.7 Nearest side selection (anchors)

Для связи from → to:

```
cyFrom = columnCenterY(from.y, fromIndex)
cyTo   = columnCenterY(to.y, toIndex)

// Центры таблиц по X
cxFrom = from.x + TABLE_WIDTH / 2
cxTo   = to.x + TABLE_WIDTH / 2

if cxTo >= cxFrom:
  // цель справа → выходим из from вправо, входим в to слева
  startSide = 'right'
  endSide = 'left'
else:
  startSide = 'left'
  endSide = 'right'

anchorX(table, side):
  return side == 'left' ? table.x : table.x + TABLE_WIDTH

A_s = { x: anchorX(from, startSide), y: cyFrom }
A_e = { x: anchorX(to, endSide),     y: cyTo }
```

Инвариант тестов: если `to.x >= from.x + TABLE_WIDTH`, то `startSide==='right' && endSide==='left'`.

Self-relation (одна таблица): если fromIndex < toIndex — start right / end left (или наоборот по X-смещению якорей на ±8px) — **канон self-relation:** `startSide='right'`, `endSide='left'`, контрольные точки с увеличенным `|dx|` минимум `M * 2`.

---

## B.8 Cubic Bezier path

```
dx = A_e.x - A_s.x
ctrl = max(M, abs(dx) * R)

if startSide == 'right':
  C1 = { x: A_s.x + ctrl, y: A_s.y }
else:
  C1 = { x: A_s.x - ctrl, y: A_s.y }

if endSide == 'left':
  C2 = { x: A_e.x - ctrl, y: A_e.y }
else:
  C2 = { x: A_e.x + ctrl, y: A_e.y }

d = `M ${A_s.x} ${A_s.y} C ${C1.x} ${C1.y}, ${C2.x} ${C2.y}, ${A_e.x} ${A_e.y}`
```

Формат чисел: достаточно округления до 2 decimal places; тесты могут матчить regex `^M .+ C .+$`.

---

## B.9 Cardinality labels

```
labels(kind):
  if kind == 'one-to-many':
    // from = many, to = one
    return { startLabel: '∞', endLabel: '1' }
  if kind == 'one-to-one':
    return { startLabel: '1', endLabel: '1' }
```

`startLabel` рисуется у `A_s`, `endLabel` у `A_e`.

---

## B.10 Marker text placement

```
labelPosition(anchor, side):
  ox = side == 'right' ? MARKER_OFFSET_X : -MARKER_OFFSET_X
  return { x: anchor.x + ox, y: anchor.y + MARKER_OFFSET_Y }
```

`text-anchor`: `start` если side right offset positive near right edge leaving table; `end` если left. Канон: `text-anchor="middle"` + offset — допустимо, лишь бы не перекрывало линию грубо.

---

## B.11 Zoom-to-cursor

Pointer client coords → local SVG:

```
sx = clientX - svgRect.left
sy = clientY - svgRect.top

worldBefore = {
  x: (sx - panX) / zoom,
  y: (sy - panY) / zoom
}

newZoom = clamp(zoom * Math.exp(-deltaY * ZOOM_WHEEL_FACTOR), ZOOM_MIN, ZOOM_MAX)
// альтернатива линейная (тоже допустима, если документируешь):
// newZoom = clamp(zoom - deltaY * ZOOM_WHEEL_FACTOR, …)

panX' = sx - worldBefore.x * newZoom
panY' = sy - worldBefore.y * newZoom
```

Канон: **exponential** вариант выше.

---

## B.12 Screen ↔ world

```
screenToWorld(sx, sy, panX, panY, zoom):
  return { x: (sx - panX) / zoom, y: (sy - panY) / zoom }

worldToScreen(wx, wy, panX, panY, zoom):
  return { x: wx * zoom + panX, y: wy * zoom + panY }
```

Для drag table:

```
onPointerMove(sx, sy):
  world = screenToWorld(sx, sy, panX, panY, zoom)
  dx = world.x - drag.originWorld.x
  dy = world.y - drag.originWorld.y
  updateTablePosition(drag.tableId,
    drag.startTablePos.x + dx,
    drag.startTablePos.y + dy)
```

---

## B.13 Rubber-band preview path

Пока link mode активен:

```
fromAnchor = computeAnchor(fromTable, fromColumnIndex) // side toward cursor
end = linkMode.cursorWorld
// choose startSide by comparing fromAnchor centerX vs cursor.x
d = cubicBezier(fromAnchor.point, startSide, end, endSideTowardFrom)
```

Не создавай Relation до успешного drop.

---

## B.14 PK exclusivity

```
setPrimaryKey(tableId, columnId):
  table = find(tableId)
  for col in table.columns:
    col.primaryKey = (col.id == columnId)
    if col.primaryKey:
      col.notNull = true
```

---

## B.15 Cascade delete

```
removeTable(tableId):
  relations = relations.filter(r =>
    r.fromTableId != tableId && r.toTableId != tableId)
  tables = tables.filter(t => t.id != tableId)
  recomputeForeignKeyFlags(tables, relations)

removeColumn(tableId, columnId):
  if table.columns.length <= 1: abort
  relations = relations.filter(r =>
    !( (r.fromTableId==tableId && r.fromColumnId==columnId) ||
       (r.toTableId==tableId && r.toColumnId==columnId) ))
  remove column
  recomputeForeignKeyFlags(...)
```

```
recomputeForeignKeyFlags(tables, relations):
  for each column:
    column.foreignKey = relations.some(r =>
      r.fromTableId == table.id && r.fromColumnId == column.id)
```
