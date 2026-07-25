import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { SchemaStateService } from '../../services/schema-state.service';
import { UiStore } from '../../state/ui.store';
import type { SchemaPresetId } from '../../models/schema.types';
import {
  PAN_DEFAULT_X,
  PAN_DEFAULT_Y,
  TABLE_WIDTH,
  ZOOM_DEFAULT,
} from '../../core/constants/canvas.constants';

@Component({
  selector: 'sf-tools-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tools-panel.component.html',
  styleUrl: './tools-panel.component.scss',
})
export class ToolsPanelComponent {
  readonly i18n = inject(I18nService);
  readonly schema = inject(SchemaStateService);
  readonly ui = inject(UiStore);

  readonly presets: SchemaPresetId[] = ['blog', 'ecommerce', 'auth', 'empty'];

  createTable(): void {
    const zoom = this.ui.zoom();
    const panX = this.ui.panX();
    const panY = this.ui.panY();
    const x = (180 - panX) / zoom;
    const y = (120 - panY) / zoom;
    this.schema.addTable({ x, y });
  }

  selectTable(tableId: string): void {
    this.schema.selectTable(tableId);
    const table = this.schema.tableById().get(tableId);
    if (!table) {
      return;
    }
    const zoom = ZOOM_DEFAULT;
    const panX = PAN_DEFAULT_X - table.x * zoom + 40;
    const panY = PAN_DEFAULT_Y - table.y * zoom + 20;
    this.ui.setZoomPan(zoom, panX - TABLE_WIDTH * 0.1, panY);
  }

  deleteTable(tableId: string, event: Event): void {
    event.stopPropagation();
    this.schema.removeTable(tableId);
  }

  loadPreset(id: SchemaPresetId): void {
    this.schema.loadPreset(id);
  }

  presetLabel(id: SchemaPresetId): string {
    return this.i18n.t(`preset.${id}`);
  }

  onTableKeydown(event: KeyboardEvent, tableId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectTable(tableId);
    }
  }
}
