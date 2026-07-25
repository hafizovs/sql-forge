# 05 — SVG Canvas (Geometry, Drag, Pan, Zoom, Link Tool)

Реализуй бесконечный SVG Workspace, динамические связи и pointer-взаимодействия. **Только чистый SVG** (не Canvas, не D3). Константы — из [appendix-a-defaults.md](appendix-a-defaults.md). Алгоритмы — из [appendix-b-formulas.md](appendix-b-formulas.md) §B.6–B.12.

---

## 5.1 Файлы

| Файл | Назначение |
|------|------------|
| `domain/schema/relation-geometry.ts` | anchors, bezier `d`, labels |
| `domain/schema/relation-geometry.spec.ts` | side selection, path format, markers |
| `domain/schema/table-metrics.ts` | `tableHeight(columnCount)`, row Y |
| `components/svg-canvas/svg-canvas.component.*` | viewport, pan/zoom, drag orchestration, link mode |
| `components/table-node/table-node.component.*` | отрисовка одной таблицы |
| `components/relation-layer/relation-layer.component.*` | paths + markers (+ rubber-band) |

---

## 5.2 World transform

```ts
worldTransform = computed(() =>
  `translate(${panX()} ${panY()}) scale(${zoom()})`,
);
```

Применяется к `<g class="sf-world">`, внутри которого grid (опционально в screen-space — см. ниже), relations, tables.

### Zoom к курсору
На `wheel` (preventDefault):
1. `screen → world` до zoom.
2. `newZoom = clamp(zoom * exp(-deltaY * ZOOM_WHEEL_FACTOR), ZOOM_MIN, ZOOM_MAX)` или эквивалент линейный из Appendix A.
3. Скорректируй `pan`, чтобы world-точка под курсором осталась на месте (формула Appendix B §B.11).

### Pan
- Средняя кнопка (`button === 1`): mousedown → move → mouseup/pointerup/pointercancel.
- Обновляй `uiStore.panX/panY`.
- `cursor: grab/grabbing` на фоне.

### Grid background
Канон: SVG `<pattern>` в userSpaceOnUse **внутри** world group **или** фиксированный pattern в screen space с шагом `GRID_SIZE * zoom` — выбери **world-space pattern** с `GRID_SIZE` из Appendix A (проще визуально при pan).

---

## 5.3 Table metrics

```ts
export function tableHeight(columnCount: number): number
export function columnAnchorY(tableY: number, columnIndex: number): number
```

Формулы — Appendix B §B.6. Ширина всегда `TABLE_WIDTH`.

`TableNodeComponent` рисует:
- header rect + table name text;
- rows: PK/FK badges, name, type;
- кнопки/иконки: link handle у каждой колонки (правый край), delete table (header).

Hit areas достаточны (≥ `COLUMN_ROW_HEIGHT`).

---

## 5.4 Relation geometry API

```ts
export function buildRelationPath(
  fromTable: Table,
  fromColumnIndex: number,
  toTable: Table,
  toColumnIndex: number,
  kind: RelationKind,
): RelationPathView // или RelationPath из types
```

Требования:
1. Вычислить centers Y строк колонок.
2. Выбрать `startSide` / `endSide` nearest left/right (Appendix B §B.7).
3. Построить cubic Bezier `d` (§B.8).
4. Назначить `startLabel` / `endLabel` (§B.9):
   - one-to-many: to=`1`, from=`∞`
   - one-to-one: оба `1`
5. Не мутировать Table.

`computed` в canvas/relation-layer строит массив путей для всех relations.

---

## 5.5 RelationLayerComponent

```html
<svg:g class="sf-relations">
  @for (path of paths(); track path.relationId) {
    <path [attr.d]="path.d"
          class="sf-relation"
          [class.sf-relation--selected]="path.relationId === selectedId()"
          (click)="onRelationClick(path.relationId, $event)" />
    <!-- marker labels near ends -->
    <text …>{{ path.startLabel }}</text>
    <text …>{{ path.endLabel }}</text>
  }
  @if (rubberBand()) {
    <path [attr.d]="rubberBand()!.d" class="sf-relation sf-relation--preview" />
  }
</svg:g>
```

Маркеры — `<text>` рядом с концами (offset вдоль нормали/стороны, Appendix B §B.10). Допустимы SVG `<marker>` для стрелок **дополнительно**, но символы `1`/`∞` обязательны текстом.

Z-order: relations **под** tables (сначала relation-layer, потом table-nodes) — **канон**.

---

## 5.6 TableNodeComponent

### API
```ts
table = input.required<Table>();
selected = input(false);
selectedColumnId = input<string | null>(null);
// outputs
headerPointerDown = output<{ tableId: string; event: PointerEvent }>();
tableClick = output<string>();
columnClick = output<{ tableId: string; columnId: string }>();
linkHandlePointerDown = output<{ tableId: string; columnId: string; event: PointerEvent }>();
deleteClick = output<string>();
```

Либо inject store напрямую — допустимо, но **канон брифа: table-node как presentational** с inputs/outputs, оркестрация в `svg-canvas`.

### Отрисовка
Pure SVG:
```html
<svg:g class="sf-table" [attr.transform]="'translate(' + table().x + ' ' + table().y + ')'">
  <rect class="sf-table__body" … />
  <rect class="sf-table__header" … />
  <text class="sf-table__title">{{ table().name }}</text>
  @for (col of table().columns; track col.id; let i = $index) {
    <g class="sf-table__row" (click)="…">
      <text class="sf-badge">…</text>
      <text>{{ col.name }}</text>
      <text class="sf-type">{{ col.dataType }}</text>
      <circle class="sf-link-handle" (pointerdown)="…" />
    </g>
  }
</svg:g>
```

---

## 5.7 Drag-and-Drop таблиц (zoneless)

В `SvgCanvasComponent` через signals:

```ts
dragState = signal<null | {
  tableId: string;
  originWorld: Point;
  startTablePos: Point;
  pointerId: number;
}>(null);
```

Алгоритм:
1. `pointerdown` на header → capture pointer, запомнить world-координату и стартовый `x,y` таблицы; `selectTable`.
2. `pointermove` → `dx/dy` в world (`screenDelta / zoom`), `updateTablePosition`.
3. `pointerup` / `pointercancel` → clear dragState.
4. Не начинай drag, если target — link-handle или delete.

Используй Pointer Events (предпочтительно) с fallback на mouse — **канон: Pointer Events**.

---

## 5.8 Link tool («Связать»)

1. `pointerdown` на link-handle колонки A → `uiStore.beginLink({ fromTableId, fromColumnId, cursorWorld })`.
2. `pointermove` (window/document) → обновлять `cursorWorld`.
3. Preview path: от anchor колонки A к `cursorWorld` (простая cubic или line — **канон: cubic** с temporary end side по X курсора).
4. `pointerup` над link-handle / row колонки B другой таблицы → `addRelation({ from…, to…, kind: 'one-to-many' })`, set FK on A, `cancelLink`.
5. `pointerup` в пустоту / Escape → `cancelLink` без создания.
6. Нельзя связать колонку саму с собой; повтор той же пары — no-op + toast.

---

## 5.9 Selection

- Click table body/header → select table, clear column/relation.
- Click column row → select column (+ parent table).
- Click relation path → select relation.
- Click empty canvas → clear selection (не во время pan/drag/link).
- Selected table: accent stroke; selected column: row highlight; selected relation: `--sf-relation-active`.

---

## 5.10 SvgCanvasComponent обязанности

1. Слушать wheel / pointer events на корневом SVG.
2. Конвертировать client → world (`(clientX - rect.left - panX) / zoom`, аналогично Y).
3. Рендерить world group: grid, relation-layer, `@for` table-node.
4. Оркестрировать drag + link.
5. Читать/писать `SchemaStateService` + `UiStore`.

Размер SVG: 100% ширины/высоты центральной панели; `overflow: hidden` на host.
