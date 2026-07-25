import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  COLUMN_ROW_HEIGHT,
  LINK_HANDLE_RADIUS,
  TABLE_CORNER_RADIUS,
  TABLE_HEADER_HEIGHT,
  TABLE_WIDTH,
} from '../../core/constants/canvas.constants';
import { tableHeight } from '../../domain/schema/table-metrics';
import type { Table } from '../../models/schema.types';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'g[sf-table-node]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table-node.component.html',
  styleUrl: './table-node.component.scss',
})
export class TableNodeComponent {
  readonly i18n = inject(I18nService);

  readonly table = input.required<Table>();
  readonly selected = input(false);
  readonly selectedColumnId = input<string | null>(null);

  readonly headerPointerDown = output<{
    tableId: string;
    event: PointerEvent;
  }>();
  readonly tableClick = output<string>();
  readonly columnClick = output<{ tableId: string; columnId: string }>();
  readonly linkHandlePointerDown = output<{
    tableId: string;
    columnId: string;
    event: PointerEvent;
  }>();
  readonly deleteClick = output<string>();

  readonly width = TABLE_WIDTH;
  readonly headerHeight = TABLE_HEADER_HEIGHT;
  readonly rowHeight = COLUMN_ROW_HEIGHT;
  readonly radius = TABLE_CORNER_RADIUS;
  readonly handleRadius = LINK_HANDLE_RADIUS;

  readonly height = computed(() => tableHeight(this.table().columns.length));

  rowY(index: number): number {
    return TABLE_HEADER_HEIGHT + index * COLUMN_ROW_HEIGHT;
  }

  onHeaderPointerDown(event: PointerEvent): void {
    const target = event.target as Element | null;
    if (target?.closest('.sf-table__delete')) {
      return;
    }
    this.headerPointerDown.emit({ tableId: this.table().id, event });
  }

  onTableClick(event: MouseEvent): void {
    event.stopPropagation();
    this.tableClick.emit(this.table().id);
  }

  onColumnClick(columnId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.columnClick.emit({ tableId: this.table().id, columnId });
  }

  onLinkPointerDown(columnId: string, event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.linkHandlePointerDown.emit({
      tableId: this.table().id,
      columnId,
      event,
    });
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteClick.emit(this.table().id);
  }
}
