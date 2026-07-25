import { Injectable, computed, inject } from '@angular/core';
import type {
  Column,
  CreateRelationInput,
  Point,
  Relation,
  RelationKind,
  SchemaPresetId,
  SchemaSnapshot,
} from '../models/schema.types';
import { SchemaStore } from '../state/schema.store';
import { UiStore } from '../state/ui.store';
import { SqlGeneratorService } from './sql-generator.service';

@Injectable({ providedIn: 'root' })
export class SchemaStateService {
  private readonly store = inject(SchemaStore);
  private readonly ui = inject(UiStore);
  private readonly sqlGenerator = inject(SqlGeneratorService);

  readonly tables = this.store.tables.asReadonly();
  readonly relations = this.store.relations.asReadonly();
  readonly selectedTableId = this.store.selectedTableId;
  readonly selectedColumnId = this.store.selectedColumnId;
  readonly selectedRelationId = this.store.selectedRelationId;
  readonly tableById = this.store.tableById;
  readonly columnLookup = this.store.columnLookup;
  readonly selectionKind = this.store.selectionKind;
  readonly relationPaths = this.store.relationPaths;
  readonly snapshot = this.store.snapshot;

  readonly sqlText = computed(() =>
    this.sqlGenerator.generate(
      this.snapshot(),
      this.ui.sqlDialect(),
    ),
  );

  readonly selectedTable = computed(() => {
    const id = this.selectedTableId();
    return id ? (this.tableById().get(id) ?? null) : null;
  });

  readonly selectedColumn = computed(() => {
    const colId = this.selectedColumnId();
    if (!colId) {
      return null;
    }
    return this.columnLookup().get(colId)?.column ?? null;
  });

  readonly selectedRelation = computed(() => {
    const id = this.selectedRelationId();
    if (!id) {
      return null;
    }
    return this.relations().find((r) => r.id === id) ?? null;
  });

  addTable(at?: Point): string {
    return this.store.addTable(at);
  }

  removeTable(tableId: string): void {
    this.store.removeTable(tableId);
  }

  updateTableName(tableId: string, name: string): boolean {
    return this.store.updateTableName(tableId, name);
  }

  updateTablePosition(tableId: string, x: number, y: number): void {
    this.store.updateTablePosition(tableId, x, y);
  }

  addColumn(tableId: string, partial?: Partial<Column>): string {
    return this.store.addColumn(tableId, partial);
  }

  removeColumn(tableId: string, columnId: string): boolean {
    return this.store.removeColumn(tableId, columnId);
  }

  updateColumn(
    tableId: string,
    columnId: string,
    patch: Partial<Column>,
  ): void {
    this.store.updateColumn(tableId, columnId, patch);
  }

  addRelation(input: CreateRelationInput | Omit<Relation, 'id'>): string {
    return this.store.addRelation(input);
  }

  removeRelation(relationId: string): void {
    this.store.removeRelation(relationId);
  }

  updateRelationKind(relationId: string, kind: RelationKind): void {
    this.store.updateRelationKind(relationId, kind);
  }

  selectTable(tableId: string | null): void {
    this.store.selectTable(tableId);
  }

  selectColumn(tableId: string, columnId: string): void {
    this.store.selectColumn(tableId, columnId);
  }

  selectRelation(relationId: string | null): void {
    this.store.selectRelation(relationId);
  }

  clearSelection(): void {
    this.store.clearSelection();
  }

  loadPreset(id: SchemaPresetId): void {
    this.store.loadPreset(id);
    this.ui.resetView();
  }

  replaceSchema(snapshot: SchemaSnapshot): void {
    this.store.replaceSchema(snapshot);
  }
}
