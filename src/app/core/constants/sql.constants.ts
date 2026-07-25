import type { ColumnDataType } from '../models/column-type.model';
import type { SqlDialect } from '../models/sql-dialect.model';
import { DEFAULT_VARCHAR_LENGTH } from './schema.constants';

export { DEFAULT_VARCHAR_LENGTH };

export const SQL_INDENT = '  ';

export const PG_TYPE_MAP: Record<ColumnDataType, string> = {
  INT: 'INTEGER',
  VARCHAR: 'VARCHAR',
  UUID: 'UUID',
  BOOLEAN: 'BOOLEAN',
  TIMESTAMP: 'TIMESTAMP',
};

export const MYSQL_TYPE_MAP: Record<ColumnDataType, string> = {
  INT: 'INT',
  VARCHAR: 'VARCHAR',
  UUID: 'CHAR(36)',
  BOOLEAN: 'TINYINT(1)',
  TIMESTAMP: 'TIMESTAMP',
};

export function typeMapFor(dialect: SqlDialect): Record<ColumnDataType, string> {
  return dialect === 'postgresql' ? PG_TYPE_MAP : MYSQL_TYPE_MAP;
}
