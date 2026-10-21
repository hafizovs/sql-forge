import type { Table } from '../../core/models/schema.types';

export function isBlankName(name: string): boolean {
  return name.trim().length === 0;
}

export function normalizeName(name: string): string {
  return name.trim();
}

export function isTableNameUnique(
  tables: Table[],
  name: string,
  exceptTableId?: string,
): boolean {
  const target = name.trim().toLowerCase();
  return !tables.some(
    (t) =>
      t.id !== exceptTableId && t.name.trim().toLowerCase() === target,
  );
}

export function nextUniqueTableName(
  tables: Table[],
  prefix: string,
): string {
  let n = tables.length + 1;
  let candidate = `${prefix}${n}`;
  while (!isTableNameUnique(tables, candidate)) {
    n += 1;
    candidate = `${prefix}${n}`;
  }
  return candidate;
}

export function isColumnNameUnique(
  table: Table,
  name: string,
  exceptColumnId?: string,
): boolean {
  const target = name.trim().toLowerCase();
  return !table.columns.some(
    (c) =>
      c.id !== exceptColumnId && c.name.trim().toLowerCase() === target,
  );
}
