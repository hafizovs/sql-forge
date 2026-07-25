export type ColumnDataType =
  | 'INT'
  | 'VARCHAR'
  | 'UUID'
  | 'BOOLEAN'
  | 'TIMESTAMP';

export const COLUMN_DATA_TYPES: readonly ColumnDataType[] = [
  'INT',
  'VARCHAR',
  'UUID',
  'BOOLEAN',
  'TIMESTAMP',
] as const;
