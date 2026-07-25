import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  GRID_SIZE,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_WHEEL_FACTOR,
} from '../../core/constants/canvas.constants';
import { clamp } from '../../domain/math/clamp';
import { screenToWorld } from '../../domain/schema/relation-geometry';
import type { Point } from '../../models/schema.types';
import { SchemaStateService } from '../../services/schema-state.service';
import { I18nService } from '../../services/i18n.service';
import { UiStore } from '../../state/ui.store';
import { RelationLayerComponent } from '../relation-layer/relation-layer.component';
import { TableNodeComponent } from '../table-node/table-node.component';

interface DragState {
  tableId: string;
  originWorld: Point;
  startTablePos: Point;
  pointerId: number;
}

interface PanState {
  originScreen: Point;
  startPan: Point;
  pointerId: number;
}

@Component({
  selector: 'sf-svg-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RelationLayerComponent, TableNodeComponent],
  templateUrl: './svg-canvas.component.html',
  styleUrl: './svg-canvas.component.scss',
})
export class SvgCanvasComponent {
  readonly schema = inject(SchemaStateService);
  readonly ui = inject(UiStore);
  readonly i18n = inject(I18nService);

  readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('svgRoot');

  readonly dragState = signal<DragState | null>(null);
  readonly panState = signal<PanState | null>(null);

  readonly gridSize = GRID_SIZE;

  readonly worldTransform = computed(
    () => `translate(${this.ui.panX()} ${this.ui.panY()}) scale(${this.ui.zoom()})`,
  );

  readonly cursorClass = computed(() => {
    if (this.panState()) {
      return 'is-panning';
    }
    if (this.ui.linkMode()) {
      return 'is-linking';
    }
    if (this.dragState()) {
      return 'is-dragging';
    }
    return '';
  });

  private localPoint(event: PointerEvent | WheelEvent): Point {
    const svg = this.svgRef()?.nativeElement;
    if (!svg) {
      return { x: event.clientX, y: event.clientY };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private toWorld(event: PointerEvent | WheelEvent): Point {
    const local = this.localPoint(event);
    return screenToWorld(
      local.x,
      local.y,
      this.ui.panX(),
      this.ui.panY(),
      this.ui.zoom(),
    );
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const local = this.localPoint(event);
    const zoom = this.ui.zoom();
    const panX = this.ui.panX();
    const panY = this.ui.panY();
    const worldBefore = screenToWorld(local.x, local.y, panX, panY, zoom);
    const newZoom = clamp(
      zoom * Math.exp(-event.deltaY * ZOOM_WHEEL_FACTOR),
      ZOOM_MIN,
      ZOOM_MAX,
    );
    const nextPanX = local.x - worldBefore.x * newZoom;
    const nextPanY = local.y - worldBefore.y * newZoom;
    this.ui.setZoomPan(newZoom, nextPanX, nextPanY);
  }

  onPointerDown(event: PointerEvent): void {
    if (event.button === 1) {
      event.preventDefault();
      const local = this.localPoint(event);
      this.panState.set({
        originScreen: local,
        startPan: { x: this.ui.panX(), y: this.ui.panY() },
        pointerId: event.pointerId,
      });
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
    }
  }

  onPointerMove(event: PointerEvent): void {
    const pan = this.panState();
    if (pan && pan.pointerId === event.pointerId) {
      const local = this.localPoint(event);
      const dx = local.x - pan.originScreen.x;
      const dy = local.y - pan.originScreen.y;
      this.ui.setPan(pan.startPan.x + dx, pan.startPan.y + dy);
      return;
    }

    const drag = this.dragState();
    if (drag && drag.pointerId === event.pointerId) {
      const world = this.toWorld(event);
      const dx = world.x - drag.originWorld.x;
      const dy = world.y - drag.originWorld.y;
      this.schema.updateTablePosition(
        drag.tableId,
        drag.startTablePos.x + dx,
        drag.startTablePos.y + dy,
      );
      return;
    }

    if (this.ui.linkMode()) {
      this.ui.updateLinkCursor(this.toWorld(event));
    }
  }

  onPointerUp(event: PointerEvent): void {
    const pan = this.panState();
    if (pan && pan.pointerId === event.pointerId) {
      this.panState.set(null);
    }

    const drag = this.dragState();
    if (drag && drag.pointerId === event.pointerId) {
      this.dragState.set(null);
    }

    const link = this.ui.linkMode();
    if (link) {
      const target = event.target as Element | null;
      const handle = target?.closest('.sf-link-handle') as SVGElement | null;
      const row = target?.closest('.sf-table__row') as SVGGElement | null;
      let toTableId: string | null = null;
      let toColumnId: string | null = null;

      if (handle || row) {
        const tableGroup = (handle ?? row)?.closest('.sf-table') as SVGGElement | null;
        const tableLabel = tableGroup?.getAttribute('aria-label');
        const table = this.schema
          .tables()
          .find((t) => t.name === tableLabel || t.id === tableLabel);
        if (table) {
          toTableId = table.id;
          if (handle) {
            const parentRow = handle.closest('.sf-table__row');
            const index = parentRow
              ? Array.from(
                  parentRow.parentElement?.querySelectorAll('.sf-table__row') ??
                    [],
                ).indexOf(parentRow)
              : -1;
            if (index >= 0) {
              toColumnId = table.columns[index]?.id ?? null;
            }
          } else if (row) {
            const index = Array.from(
              row.parentElement?.querySelectorAll('.sf-table__row') ?? [],
            ).indexOf(row);
            toColumnId = table.columns[index]?.id ?? null;
          }
        }
      }

      if (
        toTableId &&
        toColumnId &&
        !(
          toTableId === link.fromTableId && toColumnId === link.fromColumnId
        )
      ) {
        const id = this.schema.addRelation({
          fromTableId: link.fromTableId,
          fromColumnId: link.fromColumnId,
          toTableId,
          toColumnId,
          kind: 'one-to-many',
        });
        if (!id) {
          this.ui.showToast(this.i18n.t('toast.duplicateRelation'));
        }
      }
      this.ui.cancelLink();
    }
  }

  onBackgroundClick(event: MouseEvent): void {
    if (this.dragState() || this.panState() || this.ui.linkMode()) {
      return;
    }
    const target = event.target as Element | null;
    if (
      target?.closest('.sf-table') ||
      target?.closest('.sf-relation')
    ) {
      return;
    }
    this.schema.clearSelection();
  }

  onHeaderPointerDown(payload: {
    tableId: string;
    event: PointerEvent;
  }): void {
    const { tableId, event } = payload;
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    const table = this.schema.tableById().get(tableId);
    if (!table) {
      return;
    }
    this.schema.selectTable(tableId);
    const world = this.toWorld(event);
    this.dragState.set({
      tableId,
      originWorld: world,
      startTablePos: { x: table.x, y: table.y },
      pointerId: event.pointerId,
    });
    const svg = this.svgRef()?.nativeElement;
    svg?.setPointerCapture(event.pointerId);
  }

  onTableClick(tableId: string): void {
    this.schema.selectTable(tableId);
  }

  onColumnClick(payload: { tableId: string; columnId: string }): void {
    this.schema.selectColumn(payload.tableId, payload.columnId);
  }

  onLinkHandlePointerDown(payload: {
    tableId: string;
    columnId: string;
    event: PointerEvent;
  }): void {
    const { tableId, columnId, event } = payload;
    if (event.button !== 0) {
      return;
    }
    const world = this.toWorld(event);
    this.ui.beginLink({
      fromTableId: tableId,
      fromColumnId: columnId,
      cursorWorld: world,
    });
    const svg = this.svgRef()?.nativeElement;
    svg?.setPointerCapture(event.pointerId);
  }

  onDeleteTable(tableId: string): void {
    this.schema.removeTable(tableId);
  }

  onRelationClick(relationId: string): void {
    this.schema.selectRelation(relationId);
  }
}
