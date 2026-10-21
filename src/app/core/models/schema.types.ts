import type { ColumnDataType } from './column-type.model';
import type { RelationKind } from './relation-kind.model';
import type { SqlDialect } from './sql-dialect.model';
import type { ThemeId } from './theme.model';
import type { LocaleId } from './locale.model';
import type {
  SelectionKind,
  SelectionState,
} from './selection.model';

export type {
  ColumnDataType,
  RelationKind,
  SqlDialect,
  ThemeId,
  LocaleId,
  SelectionKind,
  SelectionState,
};

export type AnchorSide = 'left' | 'right';

export type SchemaPresetId = 'blog' | 'ecommerce' | 'auth' | 'empty';

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

export interface Column {
  id: string;
  name: string;
  dataType: ColumnDataType;
  primaryKey: boolean;
  foreignKey: boolean;
  notNull: boolean;
  unique: boolean;
  length?: number;
}

export interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: Column[];
}

export interface Relation {
  id: string;
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  kind: RelationKind;
}

export interface SchemaSnapshot {
  tables: Table[];
  relations: Relation[];
}

export interface LinkModeState {
  fromTableId: string;
  fromColumnId: string;
  cursorWorld: Point;
}

export interface RelationPath {
  relationId: string;
  d: string;
  start: Point;
  end: Point;
  startSide: AnchorSide;
  endSide: AnchorSide;
  startLabel: '1' | '∞';
  endLabel: '1' | '∞';
  kind: RelationKind;
}

export interface CreateRelationInput {
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  kind?: RelationKind;
}
