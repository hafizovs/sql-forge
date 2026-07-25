import { Injectable } from '@angular/core';
import type { SchemaSnapshot, SqlDialect } from '../models/schema.types';
import {
  generateSql,
  type GenerateSqlOptions,
} from '../domain/schema/sql-builder';

@Injectable({ providedIn: 'root' })
export class SqlGeneratorService {
  generate(
    snapshot: SchemaSnapshot,
    dialect: SqlDialect,
    options?: GenerateSqlOptions,
  ): string {
    return generateSql(snapshot, dialect, options);
  }
}
