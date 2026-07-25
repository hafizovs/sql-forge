import {
  BEZIER_CURVE_RATIO,
  BEZIER_MIN_CONTROL,
  MARKER_OFFSET_X,
  MARKER_OFFSET_Y,
  TABLE_WIDTH,
} from '../../core/constants/canvas.constants';
import type {
  AnchorSide,
  Point,
  Relation,
  RelationKind,
  RelationPath,
  Table,
} from '../../models/schema.types';
import { round2 } from '../math/point';
import { columnCenterY, columnIndexById } from './table-metrics';

function anchorX(table: Table, side: AnchorSide): number {
  return side === 'left' ? table.x : table.x + TABLE_WIDTH;
}

export function chooseSides(
  fromTable: Table,
  toTable: Table,
  sameTable: boolean,
): { startSide: AnchorSide; endSide: AnchorSide } {
  if (sameTable) {
    return { startSide: 'right', endSide: 'left' };
  }
  const cxFrom = fromTable.x + TABLE_WIDTH / 2;
  const cxTo = toTable.x + TABLE_WIDTH / 2;
  if (cxTo >= cxFrom) {
    return { startSide: 'right', endSide: 'left' };
  }
  return { startSide: 'left', endSide: 'right' };
}

export function cardinalityLabels(kind: RelationKind): {
  startLabel: '1' | '∞';
  endLabel: '1' | '∞';
} {
  if (kind === 'one-to-one') {
    return { startLabel: '1', endLabel: '1' };
  }
  return { startLabel: '∞', endLabel: '1' };
}

export function cubicBezierPath(
  start: Point,
  startSide: AnchorSide,
  end: Point,
  endSide: AnchorSide,
  minControl = BEZIER_MIN_CONTROL,
): string {
  const dx = end.x - start.x;
  const ctrl = Math.max(minControl, Math.abs(dx) * BEZIER_CURVE_RATIO);
  const c1x =
    startSide === 'right' ? start.x + ctrl : start.x - ctrl;
  const c2x = endSide === 'left' ? end.x - ctrl : end.x + ctrl;
  const sx = round2(start.x);
  const sy = round2(start.y);
  const eX = round2(end.x);
  const eY = round2(end.y);
  const c1xr = round2(c1x);
  const c2xr = round2(c2x);
  return `M ${sx} ${sy} C ${c1xr} ${sy}, ${c2xr} ${eY}, ${eX} ${eY}`;
}

export function labelPosition(
  anchor: Point,
  side: AnchorSide,
): Point {
  const ox = side === 'right' ? MARKER_OFFSET_X : -MARKER_OFFSET_X;
  return {
    x: anchor.x + ox,
    y: anchor.y + MARKER_OFFSET_Y,
  };
}

export function buildRelationPath(
  fromTable: Table,
  fromColumnIndex: number,
  toTable: Table,
  toColumnIndex: number,
  kind: RelationKind,
  relationId = '',
): RelationPath {
  const sameTable = fromTable.id === toTable.id;
  const { startSide, endSide } = chooseSides(fromTable, toTable, sameTable);
  const start: Point = {
    x: anchorX(fromTable, startSide),
    y: columnCenterY(fromTable.y, fromColumnIndex),
  };
  const end: Point = {
    x: anchorX(toTable, endSide),
    y: columnCenterY(toTable.y, toColumnIndex),
  };
  const minControl = sameTable ? BEZIER_MIN_CONTROL * 2 : BEZIER_MIN_CONTROL;
  const d = cubicBezierPath(start, startSide, end, endSide, minControl);
  const labels = cardinalityLabels(kind);
  return {
    relationId,
    d,
    start,
    end,
    startSide,
    endSide,
    startLabel: labels.startLabel,
    endLabel: labels.endLabel,
    kind,
  };
}

export function buildRelationPathFromModels(
  relation: Relation,
  tablesById: Map<string, Table>,
): RelationPath | null {
  const fromTable = tablesById.get(relation.fromTableId);
  const toTable = tablesById.get(relation.toTableId);
  if (!fromTable || !toTable) {
    return null;
  }
  const fromIndex = columnIndexById(fromTable, relation.fromColumnId);
  const toIndex = columnIndexById(toTable, relation.toColumnId);
  if (fromIndex < 0 || toIndex < 0) {
    return null;
  }
  return buildRelationPath(
    fromTable,
    fromIndex,
    toTable,
    toIndex,
    relation.kind,
    relation.id,
  );
}

export function buildAllRelationPaths(
  tables: Table[],
  relations: Relation[],
): RelationPath[] {
  const tablesById = new Map(tables.map((t) => [t.id, t]));
  const paths: RelationPath[] = [];
  for (const relation of relations) {
    const path = buildRelationPathFromModels(relation, tablesById);
    if (path) {
      paths.push(path);
    }
  }
  return paths;
}

export function chooseLinkPreviewSides(
  fromTable: Table,
  fromColumnIndex: number,
  cursor: Point,
): { startSide: AnchorSide; endSide: AnchorSide; start: Point } {
  const cy = columnCenterY(fromTable.y, fromColumnIndex);
  const cx = fromTable.x + TABLE_WIDTH / 2;
  const startSide: AnchorSide = cursor.x >= cx ? 'right' : 'left';
  const endSide: AnchorSide = startSide === 'right' ? 'left' : 'right';
  return {
    startSide,
    endSide,
    start: { x: anchorX(fromTable, startSide), y: cy },
  };
}

export function buildRubberBandPath(
  fromTable: Table,
  fromColumnIndex: number,
  cursor: Point,
): string {
  const { startSide, endSide, start } = chooseLinkPreviewSides(
    fromTable,
    fromColumnIndex,
    cursor,
  );
  return cubicBezierPath(start, startSide, cursor, endSide);
}

export function screenToWorld(
  sx: number,
  sy: number,
  panX: number,
  panY: number,
  zoom: number,
): Point {
  return {
    x: (sx - panX) / zoom,
    y: (sy - panY) / zoom,
  };
}

export function worldToScreen(
  wx: number,
  wy: number,
  panX: number,
  panY: number,
  zoom: number,
): Point {
  return {
    x: wx * zoom + panX,
    y: wy * zoom + panY,
  };
}
