import {
  DEFAULT_VARCHAR_LENGTH,
  SQL_INDENT,
} from '../../core/constants/sql.constants';
import type {
  Column,
  Relation,
  SchemaSnapshot,
  SqlDialect,
  Table,
} from '../../models/schema.types';

export function quoteIdent(name: string, dialect: SqlDialect): string {
  if (dialect === 'postgresql') {
    return `"${name.replaceAll('"', '""')}"`;
  }
  return `\`${name.replaceAll('`', '``')}\``;
}

export function mapColumnType(col: Column, dialect: SqlDialect): string {
  const n = col.length ?? DEFAULT_VARCHAR_LENGTH;
  switch (col.dataType) {
    case 'INT':
      return dialect === 'postgresql' ? 'INTEGER' : 'INT';
    case 'VARCHAR':
      return `VARCHAR(${n})`;
    case 'UUID':
      return dialect === 'postgresql' ? 'UUID' : 'CHAR(36)';
    case 'BOOLEAN':
      return dialect === 'postgresql' ? 'BOOLEAN' : 'TINYINT(1)';
    case 'TIMESTAMP':
      return 'TIMESTAMP';
    default:
      return 'VARCHAR(255)';
  }
}

function sortTables(tables: Table[]): Table[] {
  return [...tables].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, undefined, {
      sensitivity: 'accent',
      caseFirst: 'false',
    });
    if (byName !== 0) {
      return byName;
    }
    return a.id.localeCompare(b.id);
  });
}

function sortRelations(relations: Relation[]): Relation[] {
  return [...relations].sort((a, b) => a.id.localeCompare(b.id));
}

function safeName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length === 0 ? fallback : trimmed;
}

export function emitCreateTable(table: Table, dialect: SqlDialect): string {
  const tableName = safeName(table.name, '_unnamed');
  const lines: string[] = [];
  lines.push(`CREATE TABLE ${quoteIdent(tableName, dialect)} (`);
  table.columns.forEach((col, i) => {
    const colName = safeName(col.name, '_col');
    const parts: string[] = [
      quoteIdent(colName, dialect),
      mapColumnType(col, dialect),
    ];
    if (col.notNull || col.primaryKey) {
      parts.push('NOT NULL');
    }
    if (col.unique && !col.primaryKey) {
      parts.push('UNIQUE');
    }
    if (col.primaryKey) {
      parts.push('PRIMARY KEY');
    }
    const comma = i < table.columns.length - 1 ? ',' : '';
    lines.push(`${SQL_INDENT}${parts.join(' ')}${comma}`);
  });
  lines.push(');');
  return lines.join('\n');
}

function sanitizeIdent(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

export function constraintName(
  relation: Relation,
  fromTable: Table,
  fromCol: Column,
  usedNames: Set<string>,
): string {
  const base = `fk_${sanitizeIdent(fromTable.name)}_${sanitizeIdent(fromCol.name)}`;
  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }
  const shortId = relation.id.replace(/^rel_/, '').slice(0, 8);
  const withSuffix = `${base}_${sanitizeIdent(shortId)}`;
  usedNames.add(withSuffix);
  return withSuffix;
}

function findColumn(table: Table, columnId: string): Column | undefined {
  return table.columns.find((c) => c.id === columnId);
}

export function emitFk(
  relation: Relation,
  tablesById: Map<string, Table>,
  dialect: SqlDialect,
  usedConstraintNames: Set<string>,
): string {
  const fromT = tablesById.get(relation.fromTableId);
  const toT = tablesById.get(relation.toTableId);
  if (!fromT || !toT) {
    return `-- skipped broken relation ${relation.id}`;
  }
  const fromC = findColumn(fromT, relation.fromColumnId);
  const toC = findColumn(toT, relation.toColumnId);
  if (!fromC || !toC) {
    return `-- skipped broken relation ${relation.id}`;
  }
  const name = constraintName(relation, fromT, fromC, usedConstraintNames);
  return [
    `ALTER TABLE ${quoteIdent(safeName(fromT.name, '_unnamed'), dialect)}`,
    `${SQL_INDENT}ADD CONSTRAINT ${quoteIdent(name, dialect)}`,
    `${SQL_INDENT}FOREIGN KEY (${quoteIdent(safeName(fromC.name, '_col'), dialect)})`,
    `${SQL_INDENT}REFERENCES ${quoteIdent(safeName(toT.name, '_unnamed'), dialect)} (${quoteIdent(safeName(toC.name, '_col'), dialect)});`,
  ].join('\n');
}

export interface GenerateSqlOptions {
  includeTimestamp?: boolean;
}

export function generateSql(
  snapshot: SchemaSnapshot,
  dialect: SqlDialect,
  options: GenerateSqlOptions = {},
): string {
  try {
    if (dialect !== 'postgresql' && dialect !== 'mysql') {
      return `-- Error: unsupported dialect\n`;
    }
    if (snapshot.tables.length === 0) {
      return '-- Empty schema\n';
    }
    const tables = sortTables(snapshot.tables);
    const parts: string[] = [`-- SQL-Forge DDL (${dialect})`];
    if (options.includeTimestamp) {
      parts[0] += ` @ ${new Date().toISOString()}`;
    }
    for (const table of tables) {
      parts.push(emitCreateTable(table, dialect));
      parts.push('');
    }
    const tablesById = new Map(tables.map((t) => [t.id, t]));
    const usedNames = new Set<string>();
    const relations = sortRelations(snapshot.relations);
    for (const relation of relations) {
      parts.push(emitFk(relation, tablesById, dialect, usedNames));
      parts.push('');
    }
    return `${parts.join('\n').replace(/\n+$/g, '')}\n`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `-- Error: ${message}\n`;
  }
}
