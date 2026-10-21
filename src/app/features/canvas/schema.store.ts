import { Injectable, computed, signal } from '@angular/core';
import type {
  Column,
  CreateRelationInput,
  Point,
  Relation,
  RelationKind,
  SchemaPresetId,
  SchemaSnapshot,
  SelectionKind,
  Table,
} from '../../core/models/schema.types';
import {
  DEFAULT_NEW_TABLE_NAME_PREFIX,
  DEFAULT_PRESET_ID,
  DEFAULT_VARCHAR_LENGTH,
  MAX_COLUMNS_PER_TABLE,
  MAX_RELATIONS,
  MAX_TABLES,
} from '../../core/constants/schema.constants';
import {
  DEFAULT_NEW_TABLE_POS,
  NEW_TABLE_CASCADE_OFFSET,
} from '../../core/constants/canvas.constants';
import { clonePreset } from '../../core/constants/schema-presets.constants';
import { createId } from '../../domain/schema/id-factory';
import {
  isBlankName,
  isTableNameUnique,
  nextUniqueTableName,
  normalizeName,
} from '../../domain/schema/schema-validators';
import { buildAllRelationPaths } from '../../domain/schema/relation-geometry';

function cloneSnapshot(snapshot: SchemaSnapshot): SchemaSnapshot {
  return structuredClone(snapshot);
}

function recomputeForeignKeyFlags(
  tables: Table[],
  relations: Relation[],
): Table[] {
  return tables.map((table) => ({
    ...table,
    columns: table.columns.map((column) => ({
      ...column,
      foreignKey: relations.some(
        (r) =>
          r.fromTableId === table.id && r.fromColumnId === column.id,
      ),
    })),
  }));
}

@Injectable({ providedIn: 'root' })
export class SchemaStore {
  readonly tables = signal<Table[]>([]);
  readonly relations = signal<Relation[]>([]);
  readonly selectedTableId = signal<string | null>(null);
  readonly selectedColumnId = signal<string | null>(null);
  readonly selectedRelationId = signal<string | null>(null);

  readonly tableById = computed(() => {
    const map = new Map<string, Table>();
    for (const table of this.tables()) {
      map.set(table.id, table);
    }
    return map;
  });

  readonly columnLookup = computed(() => {
    const map = new Map<string, { tableId: string; column: Column }>();
    for (const table of this.tables()) {
      for (const column of table.columns) {
        map.set(column.id, { tableId: table.id, column });
      }
    }
    return map;
  });

  readonly selectionKind = computed<SelectionKind>(() => {
    if (this.selectedRelationId()) {
      return 'relation';
    }
    if (this.selectedColumnId()) {
      return 'column';
    }
    if (this.selectedTableId()) {
      return 'table';
    }
    return 'none';
  });

  readonly relationPaths = computed(() =>
    buildAllRelationPaths(this.tables(), this.relations()),
  );

  readonly snapshot = computed<SchemaSnapshot>(() => ({
    tables: this.tables(),
    relations: this.relations(),
  }));

  constructor() {
    this.loadPreset(DEFAULT_PRESET_ID);
  }

  replaceSchema(snapshot: SchemaSnapshot): void {
    const cloned = cloneSnapshot(snapshot);
    this.tables.set(cloned.tables);
    this.relations.set(cloned.relations);
    this.clearSelection();
  }

  loadPreset(id: SchemaPresetId): void {
    this.replaceSchema(clonePreset(id));
  }

  addTable(at?: Point): string {
    if (this.tables().length >= MAX_TABLES) {
      return '';
    }
    const existing = this.tables();
    const name = nextUniqueTableName(existing, DEFAULT_NEW_TABLE_NAME_PREFIX);
    const offset = existing.length * NEW_TABLE_CASCADE_OFFSET;
    const pos = at ?? {
      x: DEFAULT_NEW_TABLE_POS.x + offset,
      y: DEFAULT_NEW_TABLE_POS.y + offset,
    };
    const idCol: Column = {
      id: createId('col'),
      name: 'id',
      dataType: 'INT',
      primaryKey: true,
      foreignKey: false,
      notNull: true,
      unique: false,
    };
    const nameCol: Column = {
      id: createId('col'),
      name: 'name',
      dataType: 'VARCHAR',
      primaryKey: false,
      foreignKey: false,
      notNull: true,
      unique: false,
      length: DEFAULT_VARCHAR_LENGTH,
    };
    const table: Table = {
      id: createId('tbl'),
      name,
      x: pos.x,
      y: pos.y,
      columns: [idCol, nameCol],
    };
    this.tables.update((list) => [...list, table]);
    this.selectTable(table.id);
    return table.id;
  }

  removeTable(tableId: string): void {
    const nextRelations = this.relations().filter(
      (r) => r.fromTableId !== tableId && r.toTableId !== tableId,
    );
    const nextTables = this.tables().filter((t) => t.id !== tableId);
    this.tables.set(recomputeForeignKeyFlags(nextTables, nextRelations));
    this.relations.set(nextRelations);
    if (this.selectedTableId() === tableId) {
      this.clearSelection();
    }
  }

  updateTableName(tableId: string, name: string): boolean {
    const normalized = normalizeName(name);
    if (isBlankName(normalized)) {
      return false;
    }
    if (!isTableNameUnique(this.tables(), normalized, tableId)) {
      return false;
    }
    this.tables.update((list) =>
      list.map((t) => (t.id === tableId ? { ...t, name: normalized } : t)),
    );
    return true;
  }

  updateTablePosition(tableId: string, x: number, y: number): void {
    this.tables.update((list) =>
      list.map((t) => (t.id === tableId ? { ...t, x, y } : t)),
    );
  }

  addColumn(tableId: string, partial?: Partial<Column>): string {
    const table = this.tables().find((t) => t.id === tableId);
    if (!table || table.columns.length >= MAX_COLUMNS_PER_TABLE) {
      return '';
    }
    const id = createId('col');
    const column: Column = {
      id,
      name: partial?.name ?? `column_${table.columns.length + 1}`,
      dataType: partial?.dataType ?? 'VARCHAR',
      primaryKey: false,
      foreignKey: false,
      notNull: partial?.notNull ?? false,
      unique: partial?.unique ?? false,
      length: partial?.length ?? DEFAULT_VARCHAR_LENGTH,
    };
    this.tables.update((list) =>
      list.map((t) =>
        t.id === tableId ? { ...t, columns: [...t.columns, column] } : t,
      ),
    );
    this.selectColumn(tableId, id);
    return id;
  }

  removeColumn(tableId: string, columnId: string): boolean {
    const table = this.tables().find((t) => t.id === tableId);
    if (!table || table.columns.length <= 1) {
      return false;
    }
    const nextRelations = this.relations().filter(
      (r) =>
        !(
          (r.fromTableId === tableId && r.fromColumnId === columnId) ||
          (r.toTableId === tableId && r.toColumnId === columnId)
        ),
    );
    const nextTables = this.tables().map((t) => {
      if (t.id !== tableId) {
        return t;
      }
      return {
        ...t,
        columns: t.columns.filter((c) => c.id !== columnId),
      };
    });
    this.tables.set(recomputeForeignKeyFlags(nextTables, nextRelations));
    this.relations.set(nextRelations);
    if (this.selectedColumnId() === columnId) {
      this.selectTable(tableId);
    }
    return true;
  }

  updateColumn(
    tableId: string,
    columnId: string,
    patch: Partial<Column>,
  ): void {
    this.tables.update((list) =>
      list.map((table) => {
        if (table.id !== tableId) {
          return table;
        }
        let columns = table.columns.map((col) => {
          if (col.id !== columnId) {
            return col;
          }
          return { ...col, ...patch, id: col.id };
        });
        if (patch.primaryKey === true) {
          columns = columns.map((col) => ({
            ...col,
            primaryKey: col.id === columnId,
            notNull: col.id === columnId ? true : col.notNull,
          }));
        }
        return { ...table, columns };
      }),
    );
  }

  addRelation(input: CreateRelationInput | Omit<Relation, 'id'>): string {
    if (this.relations().length >= MAX_RELATIONS) {
      return '';
    }
    if (
      input.fromTableId === input.toTableId &&
      input.fromColumnId === input.toColumnId
    ) {
      return '';
    }
    const duplicate = this.relations().some(
      (r) =>
        r.fromTableId === input.fromTableId &&
        r.fromColumnId === input.fromColumnId &&
        r.toTableId === input.toTableId &&
        r.toColumnId === input.toColumnId,
    );
    if (duplicate) {
      return '';
    }
    const kind: RelationKind = input.kind ?? 'one-to-many';
    const relation: Relation = {
      id: createId('rel'),
      fromTableId: input.fromTableId,
      fromColumnId: input.fromColumnId,
      toTableId: input.toTableId,
      toColumnId: input.toColumnId,
      kind,
    };
    const nextRelations = [...this.relations(), relation];
    let nextTables = this.tables().map((table) => {
      if (table.id !== input.fromTableId) {
        return table;
      }
      return {
        ...table,
        columns: table.columns.map((col) => {
          if (col.id !== input.fromColumnId) {
            return col;
          }
          return {
            ...col,
            foreignKey: true,
            unique: kind === 'one-to-one' ? true : col.unique,
          };
        }),
      };
    });
    nextTables = recomputeForeignKeyFlags(nextTables, nextRelations);
    this.tables.set(nextTables);
    this.relations.set(nextRelations);
    this.selectRelation(relation.id);
    return relation.id;
  }

  removeRelation(relationId: string): void {
    const nextRelations = this.relations().filter((r) => r.id !== relationId);
    const nextTables = recomputeForeignKeyFlags(this.tables(), nextRelations);
    this.tables.set(nextTables);
    this.relations.set(nextRelations);
    if (this.selectedRelationId() === relationId) {
      this.clearSelection();
    }
  }

  updateRelationKind(relationId: string, kind: RelationKind): void {
    const relation = this.relations().find((r) => r.id === relationId);
    if (!relation) {
      return;
    }
    this.relations.update((list) =>
      list.map((r) => (r.id === relationId ? { ...r, kind } : r)),
    );
    if (kind === 'one-to-one') {
      this.updateColumn(relation.fromTableId, relation.fromColumnId, {
        unique: true,
      });
    }
  }

  selectTable(tableId: string | null): void {
    this.selectedTableId.set(tableId);
    this.selectedColumnId.set(null);
    this.selectedRelationId.set(null);
  }

  selectColumn(tableId: string, columnId: string): void {
    this.selectedTableId.set(tableId);
    this.selectedColumnId.set(columnId);
    this.selectedRelationId.set(null);
  }

  selectRelation(relationId: string | null): void {
    this.selectedRelationId.set(relationId);
    this.selectedTableId.set(null);
    this.selectedColumnId.set(null);
  }

  clearSelection(): void {
    this.selectedTableId.set(null);
    this.selectedColumnId.set(null);
    this.selectedRelationId.set(null);
  }
}
