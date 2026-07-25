import {
  COLUMN_ROW_HEIGHT,
  TABLE_HEADER_HEIGHT,
  TABLE_PADDING_BOTTOM,
  TABLE_WIDTH,
} from '../../core/constants/canvas.constants';
import type { Table } from '../../models/schema.types';

export function tableHeight(columnCount: number): number {
  return (
    TABLE_HEADER_HEIGHT +
    columnCount * COLUMN_ROW_HEIGHT +
    TABLE_PADDING_BOTTOM
  );
}

export function columnCenterY(tableY: number, columnIndex: number): number {
  return (
    tableY +
    TABLE_HEADER_HEIGHT +
    columnIndex * COLUMN_ROW_HEIGHT +
    COLUMN_ROW_HEIGHT / 2
  );
}

export function columnAnchorY(tableY: number, columnIndex: number): number {
  return columnCenterY(tableY, columnIndex);
}

export function columnIndexById(table: Table, columnId: string): number {
  return table.columns.findIndex((c) => c.id === columnId);
}

export function tableWidth(): number {
  return TABLE_WIDTH;
}
