import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { SchemaStateService } from './schema-state.service';
import { SqlGeneratorService } from './sql-generator.service';
import { SchemaStore } from '../state/schema.store';
import { UiStore } from '../state/ui.store';

describe('SchemaStateService', () => {
  let service: SchemaStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SchemaStateService, SchemaStore, UiStore, SqlGeneratorService],
    });
    service = TestBed.inject(SchemaStateService);
    service.loadPreset('empty');
  });

  it('addTable creates default columns', () => {
    const id = service.addTable({ x: 10, y: 20 });
    expect(id).toBeTruthy();
    const table = service.tables().find((t) => t.id === id);
    expect(table?.columns.length).toBe(2);
    expect(table?.columns[0]?.primaryKey).toBe(true);
    expect(table?.columns[0]?.name).toBe('id');
  });

  it('addColumn and addRelation work', () => {
    const a = service.addTable({ x: 0, y: 0 });
    const b = service.addTable({ x: 400, y: 0 });
    const fromCol = service.addColumn(a, { name: 'b_id', dataType: 'INT' });
    const toTable = service.tables().find((t) => t.id === b)!;
    const toCol = toTable.columns[0]!.id;
    const relId = service.addRelation({
      fromTableId: a,
      fromColumnId: fromCol,
      toTableId: b,
      toColumnId: toCol,
      kind: 'one-to-many',
    });
    expect(relId).toBeTruthy();
    expect(service.relations().length).toBe(1);
    const from = service.columnLookup().get(fromCol)?.column;
    expect(from?.foreignKey).toBe(true);
  });

  it('removeTable cascades relations', () => {
    service.loadPreset('blog');
    expect(service.relations().length).toBeGreaterThan(0);
    service.removeTable('tbl_users');
    expect(service.tables().some((t) => t.id === 'tbl_users')).toBe(false);
    expect(service.relations().length).toBe(0);
  });

  it('enforces PK exclusivity', () => {
    const id = service.addTable();
    const table = service.tables().find((t) => t.id === id)!;
    const second = table.columns[1]!.id;
    service.updateColumn(id, second, { primaryKey: true });
    const updated = service.tables().find((t) => t.id === id)!;
    const pks = updated.columns.filter((c) => c.primaryKey);
    expect(pks.length).toBe(1);
    expect(pks[0]?.id).toBe(second);
  });

  it('loadPreset replaces schema', () => {
    service.addTable();
    service.loadPreset('blog');
    expect(service.tables().map((t) => t.name).sort()).toEqual([
      'posts',
      'users',
    ]);
    expect(service.relations().length).toBe(1);
  });
});
