import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  buildRubberBandPath,
  labelPosition,
} from '../../../domain/schema/relation-geometry';
import { columnIndexById } from '../../../domain/schema/table-metrics';
import type { LinkModeState, RelationPath } from '../../../core/models/schema.types';
import { SchemaStateService } from '../schema-state.service';

@Component({
  selector: 'g[sf-relation-layer]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './relation-layer.component.html',
  styleUrl: './relation-layer.component.scss',
})
export class RelationLayerComponent {
  private readonly schema = inject(SchemaStateService);

  readonly paths = input.required<RelationPath[]>();
  readonly selectedId = input<string | null>(null);
  readonly linkMode = input<LinkModeState | null>(null);

  readonly relationClick = output<string>();

  readonly rubberBand = computed(() => {
    const mode = this.linkMode();
    if (!mode) {
      return null;
    }
    const table = this.schema.tableById().get(mode.fromTableId);
    if (!table) {
      return null;
    }
    const index = columnIndexById(table, mode.fromColumnId);
    if (index < 0) {
      return null;
    }
    return {
      d: buildRubberBandPath(table, index, mode.cursorWorld),
    };
  });

  labelPos(path: RelationPath, end: 'start' | 'end') {
    if (end === 'start') {
      return labelPosition(path.start, path.startSide);
    }
    return labelPosition(path.end, path.endSide);
  }

  onRelationClick(relationId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.relationClick.emit(relationId);
  }
}
