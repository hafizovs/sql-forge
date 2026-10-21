import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { COLUMN_DATA_TYPES } from '../../../core/models/column-type.model';
import type {
  ColumnDataType,
  RelationKind,
} from '../../../core/models/schema.types';
import { ClipboardService } from '../../../core/clipboard.service';
import { I18nService } from '../../../core/i18n.service';
import { SchemaStateService } from '../../canvas/schema-state.service';
import { UiStore } from '../../../core/ui/ui.store';
import { SqlPreviewComponent } from '../../sql/sql-preview/sql-preview.component';

@Component({
  selector: 'sf-inspector-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SqlPreviewComponent],
  templateUrl: './inspector-panel.component.html',
  styleUrl: './inspector-panel.component.scss',
})
export class InspectorPanelComponent {
  readonly i18n = inject(I18nService);
  readonly schema = inject(SchemaStateService);
  readonly ui = inject(UiStore);
  private readonly clipboard = inject(ClipboardService);

  readonly dataTypes = COLUMN_DATA_TYPES;

  readonly kind = this.schema.selectionKind;
  readonly table = this.schema.selectedTable;
  readonly column = this.schema.selectedColumn;
  readonly relation = this.schema.selectedRelation;

  readonly relationFromLabel = computed(() => {
    const rel = this.relation();
    if (!rel) {
      return '';
    }
    const fromTable = this.schema.tableById().get(rel.fromTableId);
    const fromCol = fromTable?.columns.find((c) => c.id === rel.fromColumnId);
    return `${fromTable?.name ?? '?'}.${fromCol?.name ?? '?'}`;
  });

  readonly relationToLabel = computed(() => {
    const rel = this.relation();
    if (!rel) {
      return '';
    }
    const toTable = this.schema.tableById().get(rel.toTableId);
    const toCol = toTable?.columns.find((c) => c.id === rel.toColumnId);
    return `${toTable?.name ?? '?'}.${toCol?.name ?? '?'}`;
  });

  onTableName(value: string): void {
    const table = this.table();
    if (!table) {
      return;
    }
    const ok = this.schema.updateTableName(table.id, value);
    if (!ok) {
      if (!value.trim()) {
        this.ui.showToast(
          this.i18n.t('toast.invalidName', { entity: 'table' }),
        );
      } else {
        this.ui.showToast(
          this.i18n.t('toast.duplicateTableName', { name: value.trim() }),
        );
      }
    }
  }

  addColumn(): void {
    const table = this.table();
    if (table) {
      this.schema.addColumn(table.id);
    }
  }

  deleteTable(): void {
    const table = this.table();
    if (table) {
      this.schema.removeTable(table.id);
    }
  }

  selectColumn(columnId: string): void {
    const table = this.table();
    if (table) {
      this.schema.selectColumn(table.id, columnId);
    }
  }

  onColumnName(value: string): void {
    const table = this.table();
    const column = this.column();
    if (!table || !column) {
      return;
    }
    if (!value.trim()) {
      this.ui.showToast(
        this.i18n.t('toast.invalidName', { entity: 'column' }),
      );
      return;
    }
    this.schema.updateColumn(table.id, column.id, { name: value.trim() });
  }

  onDataType(value: string): void {
    const table = this.table();
    const column = this.column();
    if (!table || !column) {
      return;
    }
    if ((COLUMN_DATA_TYPES as readonly string[]).includes(value)) {
      this.schema.updateColumn(table.id, column.id, {
        dataType: value as ColumnDataType,
      });
    }
  }

  onLength(value: string): void {
    const table = this.table();
    const column = this.column();
    if (!table || !column) {
      return;
    }
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n) && n > 0) {
      this.schema.updateColumn(table.id, column.id, { length: n });
    }
  }

  onFlag(
    flag: 'primaryKey' | 'notNull' | 'unique',
    checked: boolean,
  ): void {
    const table = this.table();
    const column = this.column();
    if (!table || !column) {
      return;
    }
    this.schema.updateColumn(table.id, column.id, { [flag]: checked });
  }

  deleteColumn(): void {
    const table = this.table();
    const column = this.column();
    if (!table || !column) {
      return;
    }
    const ok = this.schema.removeColumn(table.id, column.id);
    if (!ok) {
      this.ui.showToast(this.i18n.t('toast.cannotDeleteLastColumn'));
    }
  }

  onRelationKind(value: string): void {
    const rel = this.relation();
    if (!rel) {
      return;
    }
    if (value === 'one-to-one' || value === 'one-to-many') {
      this.schema.updateRelationKind(rel.id, value as RelationKind);
    }
  }

  deleteRelation(): void {
    const rel = this.relation();
    if (rel) {
      this.schema.removeRelation(rel.id);
    }
  }

  async copySql(): Promise<void> {
    await this.clipboard.copyText(this.schema.sqlText());
  }

  typeLabel(type: ColumnDataType): string {
    return this.i18n.t(`columnType.${type}`);
  }
}
