import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { SqlGeneratorService } from './sql-generator.service';
import type { SchemaSnapshot } from '../../core/models/schema.types';

describe('SqlGeneratorService', () => {
  let service: SqlGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SqlGeneratorService],
    });
    service = TestBed.inject(SqlGeneratorService);
  });

  it('delegates to builder and passes dialect', () => {
    const snapshot: SchemaSnapshot = {
      tables: [
        {
          id: 't1',
          name: 'users',
          x: 0,
          y: 0,
          columns: [
            {
              id: 'c1',
              name: 'id',
              dataType: 'UUID',
              primaryKey: true,
              foreignKey: false,
              notNull: true,
              unique: false,
            },
          ],
        },
      ],
      relations: [],
    };
    const pg = service.generate(snapshot, 'postgresql');
    const my = service.generate(snapshot, 'mysql');
    expect(pg).toContain('UUID');
    expect(my).toContain('CHAR(36)');
    expect(pg).toContain('"users"');
    expect(my).toContain('`users`');
  });
});
